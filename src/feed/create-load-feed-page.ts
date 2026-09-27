import { isNothing, type Maybe } from 'true-myth/maybe';
import type { Result } from 'true-myth/result';
import { fromPromise, fromResult, reject, type Task } from 'true-myth/task';
import { slowSearchParam, toFeedSearchParams, type FeedSearch } from '../search/feed-search';
import { readPostPage, type FeedPage } from './read-post-page';

const pageLimit = 50;

export const slowFeedDelayInMilliseconds = 2000;

export function feedDelayInMilliseconds(slow: boolean): number {
  if (slow) {
    return slowFeedDelayInMilliseconds;
  }
  return 0;
}

export type FeedPageRequest = {
  readonly search: FeedSearch;
  readonly cursor: Maybe<string>;
  readonly delayInMilliseconds: number;
};

export type LoadFeedPageError = 'invalid' | 'network';

export type LoadFeedPage = (request: FeedPageRequest) => PromiseLike<Result<FeedPage, LoadFeedPageError>>;

type FetchPage = typeof fetch;

type LoadFeedPageDependencies = {
  readonly fetch: FetchPage;
};

function requestUrl(request: FeedPageRequest): string {
  const params = toFeedSearchParams(request.search);
  params.delete(slowSearchParam);
  params.set('limit', String(pageLimit));
  if (!isNothing(request.cursor)) {
    params.set('cursor', request.cursor.value);
  }
  if (request.delayInMilliseconds > 0) {
    params.set('delayMs', String(request.delayInMilliseconds));
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
