import { just, nothing, of, type Maybe } from 'true-myth/maybe';
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

export function toFeedSearchParams(search: FeedSearch): URLSearchParams {
  const params = new URLSearchParams();
  setWhenPresent(params, 'q', search.text.unwrapOr(''));
  setWhenPresent(params, 'tag', search.tag.unwrapOr(''));
  setWhenPresent(params, 'status', search.status.unwrapOr(''));
  setWhenPresent(params, 'from', search.from.unwrapOr(''));
  setWhenPresent(params, 'to', search.to.unwrapOr(''));
  return params;
}
