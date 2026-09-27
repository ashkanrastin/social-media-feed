import { isJust, isNothing, just, nothing, type Maybe } from 'true-myth/maybe';
import { isErr } from 'true-myth/result';
import type { FeedPost } from './feed-post';
import {
  decideMockResponse,
  failureBody,
  failureStatus,
  HttpStatus,
  jsonHeaders,
  type HttpRequest
} from './decide-mock-response';
import { contentTypeFor, imageFilename, type ImageBytes } from './image-file';
import { parsePostsQuery, type SimulatedFailure } from './posts-query';

export type Schedule = (delayInMilliseconds: number, handle: () => void) => void;

export type HttpResponseWriter = {
  writeHead: (statusCode: number, headers: Readonly<Record<string, string>>) => void;
  end: (body: Uint8Array | string) => void;
};

type CreateMockServerDependencies = {
  readonly posts: readonly FeedPost[];
  readonly images: ReadonlyMap<string, ImageBytes>;
  readonly schedule: Schedule;
};

type ImageOutcome = SimulatedFailure | 'none';

function lookupImage(images: ReadonlyMap<string, ImageBytes>, filename: string): Maybe<ImageBytes> {
  for (const [name, image] of images) {
    if (name === filename) {
      return just(image);
    }
  }
  return nothing();
}

function writeJson(response: HttpResponseWriter, statusCode: number, body: string): void {
  response.writeHead(statusCode, { ...jsonHeaders });
  response.end(body);
}

function deliverImage(
  dependencies: CreateMockServerDependencies,
  filename: string,
  response: HttpResponseWriter,
  outcome: ImageOutcome
): void {
  if (outcome !== 'none') {
    writeJson(response, failureStatus(outcome), failureBody(outcome));
    return;
  }
  const image = lookupImage(dependencies.images, filename);
  const contentType = contentTypeFor(filename);
  if (isNothing(image) || isNothing(contentType)) {
    writeJson(response, HttpStatus.notFound, JSON.stringify({ error: 'notFound' }));
    return;
  }
  response.writeHead(HttpStatus.ok, {
    'access-control-allow-origin': '*',
    'cache-control': 'public, max-age=86400',
    'content-length': String(image.value.bytes.byteLength),
    'content-type': contentType.value
  });
  response.end(image.value.bytes);
}

function sendImage(
  dependencies: CreateMockServerDependencies,
  filename: string,
  request: HttpRequest,
  response: HttpResponseWriter
): void {
  const requestUrl = new URL(request.url, 'http://127.0.0.1');
  const query = parsePostsQuery(requestUrl.searchParams);
  if (isErr(query)) {
    writeJson(response, HttpStatus.badRequest, JSON.stringify({ error: 'invalidQuery' }));
    return;
  }
  const { delayInMilliseconds, failure } = query.value;
  dependencies.schedule(delayInMilliseconds, function send() {
    const outcome = isNothing(failure) ? 'none' : failure.value;
    deliverImage(dependencies, filename, response, outcome);
  });
}

export function createMockServer(dependencies: CreateMockServerDependencies) {
  return function handleRequest(request: HttpRequest, response: HttpResponseWriter): void {
    const filename = imageFilename(request.url);
    if (request.method === 'GET' && isJust(filename)) {
      sendImage(dependencies, filename.value, request, response);
      return;
    }
    const decision = decideMockResponse({ posts: dependencies.posts, request });
    dependencies.schedule(decision.delayInMilliseconds, function send() {
      response.writeHead(decision.statusCode, { ...decision.headers });
      response.end(decision.body);
    });
  };
}
