import { isNothing, just, nothing, of, type Maybe } from 'true-myth/maybe';
import { isFeedStatus, type FeedStatus } from './feed-post';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export type FeedSearch = {
  readonly text: Maybe<string>;
  readonly tag: Maybe<string>;
  readonly status: Maybe<FeedStatus>;
  readonly from: Maybe<string>;
  readonly to: Maybe<string>;
};

export const emptyFeedSearch: FeedSearch = {
  text: nothing<string>(),
  tag: nothing<string>(),
  status: nothing<FeedStatus>(),
  from: nothing<string>(),
  to: nothing<string>()
};

function readText(params: URLSearchParams, key: string): Maybe<string> {
  return of(params.get(key)).andThen(function ignoreEmpty(value) {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return nothing();
    }
    return just(trimmed);
  });
}

function readDate(params: URLSearchParams, key: string): Maybe<string> {
  return readText(params, key).andThen(function onlyDate(value) {
    if (!datePattern.test(value)) {
      return nothing();
    }
    return just(value);
  });
}

function readStatus(params: URLSearchParams): Maybe<FeedStatus> {
  return readText(params, 'status').andThen(function knownStatus(value) {
    if (!isFeedStatus(value)) {
      return nothing();
    }
    return just(value);
  });
}

export function readFeedSearch(params: URLSearchParams): FeedSearch {
  return {
    text: readText(params, 'q'),
    tag: readText(params, 'tag'),
    status: readStatus(params),
    from: readDate(params, 'from'),
    to: readDate(params, 'to')
  };
}

function setWhenPresent(params: URLSearchParams, key: string, value: string): void {
  if (value.length === 0) {
    return;
  }
  params.set(key, value);
}

function optionalText(value: string): Maybe<string> {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return nothing();
  }
  return just(trimmed);
}

function optionalDate(value: string): Maybe<string> {
  if (!datePattern.test(value)) {
    return nothing();
  }
  return just(value);
}

export function withSearchText(search: FeedSearch, text: string): FeedSearch {
  return { ...search, text: optionalText(text) };
}

export function withSearchTag(search: FeedSearch, tag: string): FeedSearch {
  return { ...search, tag: optionalText(tag) };
}

export function withSearchStatus(search: FeedSearch, nextStatus: string): FeedSearch {
  if (!isFeedStatus(nextStatus)) {
    return { ...search, status: nothing<FeedStatus>() };
  }
  return { ...search, status: just(nextStatus) };
}

export function withSearchFrom(search: FeedSearch, from: string): FeedSearch {
  return { ...search, from: optionalDate(from) };
}

export function withSearchTo(search: FeedSearch, to: string): FeedSearch {
  return { ...search, to: optionalDate(to) };
}

export type FilterDraft = {
  readonly tag: string;
  readonly status: string;
  readonly from: string;
  readonly to: string;
};

export function draftFilters(search: FeedSearch): FilterDraft {
  return {
    tag: search.tag.unwrapOr(''),
    status: search.status.unwrapOr(''),
    from: search.from.unwrapOr(''),
    to: search.to.unwrapOr('')
  };
}

export function withDraftFilters(search: FeedSearch, draft: FilterDraft): FeedSearch {
  const tagged = withSearchTag(search, draft.tag);
  const withStatus = withSearchStatus(tagged, draft.status);
  const withFrom = withSearchFrom(withStatus, draft.from);
  return withSearchTo(withFrom, draft.to);
}

export function clearedFilters(search: FeedSearch): FeedSearch {
  return {
    text: search.text,
    tag: nothing<string>(),
    status: nothing<FeedStatus>(),
    from: nothing<string>(),
    to: nothing<string>()
  };
}

export function activeFilterCount(search: FeedSearch): number {
  const fields = [search.tag, search.status, search.from, search.to];
  return fields.filter(function selected(field) {
    return !isNothing(field);
  }).length;
}

export function toFeedSearchParams(search: FeedSearch): URLSearchParams {
  const params = new URLSearchParams();
  setWhenPresent(params, 'q', search.text.unwrapOr(''));
  setWhenPresent(params, 'tag', search.tag.unwrapOr(''));
  setWhenPresent(params, 'status', search.status.unwrapOr(''));
  setWhenPresent(params, 'from', search.from.unwrapOr(''));
  setWhenPresent(params, 'to', search.to.unwrapOr(''));
  return params;
}
