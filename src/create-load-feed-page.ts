import { isNothing, type Maybe } from 'true-myth/maybe';
import type { Result } from 'true-myth/result';
import { fromPromise, fromResult, reject, type Task } from 'true-myth/task';
import { toFeedSearchParams, type FeedSearch } from './feed-search';
import { readPostPage, type FeedPage } from './read-post-page';

const pageLimit = 50;

export type FeedPageRequest = {
  readonly search: FeedSearch;
  readonly cursor: Maybe<string>;
};

export type LoadFeedPageError = 'invalid' | 'network';

export type LoadFeedPage = (request: FeedPageRequest) => PromiseLike<Result<FeedPage, LoadFeedPageError>>;

type FetchPage = typeof fetch;

type LoadFeedPageDependencies = {
  readonly fetch: FetchPage;
};

function requestUrl(request: FeedPageRequest): string {
  const params = toFeedSearchParams(request.search);
  params.set('limit', String(pageLimit));
  if (!isNothing(request.cursor)) {
    params.set('cursor', request.cursor.value);
  }
  return `/posts?${params.toString()}`;
}

function readResponse(response: Response): Task<FeedPage, 'invalid'> {
  if (!response.ok) {
    return reject('invalid');
  }
  const body: Promise<unknown> = response.json();
  return fromPromise(body, function invalid() {
    return 'invalid' as const;
  }).andThen(function parse(value) {
    return fromResult(readPostPage(value));
  });
}

export function createLoadFeedPage(dependencies: LoadFeedPageDependencies): LoadFeedPage {
  return function loadFeedPage(request: FeedPageRequest): Task<FeedPage, LoadFeedPageError> {
    return fromPromise(dependencies.fetch(requestUrl(request)), function network() {
      return 'network' as const;
    }).andThen(readResponse);
  };
}
