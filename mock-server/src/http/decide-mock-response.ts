import { isJust, isNothing, just, nothing, type Maybe } from 'true-myth/maybe';
import { isErr } from 'true-myth/result';
import type { FeedPost } from '../posts/feed-post';
import { parsePostsQuery, type PostsQuery, type SimulatedFailure } from '../posts/posts-query';
import { selectPosts } from '../posts/select-posts';

export type HttpRequest = {
  readonly method: string;
  readonly url: string;
};

export type MockResponse = {
  readonly statusCode: number;
  readonly body: string;
  readonly delayInMilliseconds: number;
  readonly headers: Readonly<Record<string, string>>;
};

type DecideMockResponseOptions = {
  readonly posts: readonly FeedPost[];
  readonly request: HttpRequest;
};

export const jsonHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'content-type': 'application/json; charset=utf-8'
} as const;

export const HttpStatus = {
  ok: 200,
  noContent: 204,
  badRequest: 400,
  notFound: 404,
  methodNotAllowed: 405,
  tooManyRequests: 429,
  serverError: 500,
  unavailable: 503,
  gatewayTimeout: 504
} as const;

const statusByFailure = {
  badRequest: HttpStatus.badRequest,
  tooManyRequests: HttpStatus.tooManyRequests,
  server: HttpStatus.serverError,
  unavailable: HttpStatus.unavailable,
  timeout: HttpStatus.gatewayTimeout
} as const;

export function failureStatus(failure: SimulatedFailure): number {
  return statusByFailure[failure];
}

export function failureBody(failure: SimulatedFailure): string {
  if (failure === 'timeout') {
    return JSON.stringify({ error: 'timeout' });
  }
  return JSON.stringify({ error: failure });
}

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function postsBody(posts: readonly FeedPost[], nextCursor: string): string {
  return JSON.stringify({ posts, nextCursor });
}

function methodResponse(method: string): Maybe<MockResponse> {
  if (method === 'OPTIONS') {
    return just({ statusCode: HttpStatus.noContent, body: '', delayInMilliseconds: 0, headers: jsonHeaders });
  }
  if (method !== 'GET') {
    return just({
      statusCode: HttpStatus.methodNotAllowed,
      body: JSON.stringify({ error: 'methodNotAllowed' }),
      delayInMilliseconds: 0,
      headers: jsonHeaders
    });
  }
  return nothing();
}

function invalidQueryResponse(): MockResponse {
  return {
    statusCode: HttpStatus.badRequest,
    body: JSON.stringify({ error: 'invalidQuery' }),
    delayInMilliseconds: 0,
    headers: jsonHeaders
  };
}

function failureResponse(query: PostsQuery): Maybe<MockResponse> {
  if (isNothing(query.failure)) {
    return nothing();
  }
  const failure = query.failure.value;
  return just({
    statusCode: failureStatus(failure),
    body: failureBody(failure),
    delayInMilliseconds: query.delayInMilliseconds,
    headers: jsonHeaders
  });
}

function postsPage(posts: readonly FeedPost[], query: PostsQuery): MockResponse {
  const page = selectPosts(posts, query);
  const body = page.nextCursor.mapOrElse(
    function withoutCursor() {
      return JSON.stringify({ posts: page.posts });
    },
    function withCursor(nextCursor) {
      return postsBody(page.posts, nextCursor);
    }
  );
  return {
    statusCode: HttpStatus.ok,
    body,
    delayInMilliseconds: query.delayInMilliseconds,
    headers: jsonHeaders
  };
}

function routeResponse(path: string, posts: readonly FeedPost[], query: PostsQuery): MockResponse {
  if (path === '/health') {
    return {
      statusCode: HttpStatus.ok,
      body: JSON.stringify({ ok: true, postCount: posts.length }),
      delayInMilliseconds: query.delayInMilliseconds,
      headers: jsonHeaders
    };
  }
  if (path !== '/posts') {
    return {
      statusCode: HttpStatus.notFound,
      body: JSON.stringify({ error: 'notFound' }),
      delayInMilliseconds: query.delayInMilliseconds,
      headers: jsonHeaders
    };
  }
  return postsPage(posts, query);
}

function respondToGet(options: DecideMockResponseOptions, url: URL): MockResponse {
  const path = normalizePath(url.pathname);
  const query = parsePostsQuery(url.searchParams);
  if (isErr(query)) {
    return invalidQueryResponse();
  }
  const simulated = failureResponse(query.value);
  if (isJust(simulated)) {
    return simulated.value;
  }
  return routeResponse(path, options.posts, query.value);
}

export function decideMockResponse(options: DecideMockResponseOptions): MockResponse {
  const blocked = methodResponse(options.request.method);
  if (isJust(blocked)) {
    return blocked.value;
  }
  const url = new URL(options.request.url, 'http://127.0.0.1');
  return respondToGet(options, url);
}
