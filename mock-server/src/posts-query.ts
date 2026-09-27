import { isNothing, just, nothing, of, type Maybe } from 'true-myth/maybe';
import { err, isErr, ok, type Result } from 'true-myth/result';
import { isFeedStatus, type FeedStatus } from './feed-post';

const defaultLimit = 50;
const maxLimit = 100;
const maxDelayInMilliseconds = 30_000;

export const simulatedFailures = ['badRequest', 'tooManyRequests', 'server', 'unavailable', 'timeout'] as const;

export type SimulatedFailure = (typeof simulatedFailures)[number];

export type PostsQuery = {
  readonly limit: number;
  readonly offset: number;
  readonly text: Maybe<string>;
  readonly tag: Maybe<string>;
  readonly status: Maybe<FeedStatus>;
  readonly fromTimestamp: Maybe<number>;
  readonly toTimestamp: Maybe<number>;
  readonly delayInMilliseconds: number;
  readonly failure: Maybe<SimulatedFailure>;
};

function readOptionalText(params: URLSearchParams, name: string): Maybe<string> {
  return of(params.get(name)).andThen(function ignoreEmpty(value) {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return nothing();
    }
    return just(trimmed);
  });
}

function readInteger(value: string): Maybe<number> {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || String(parsed) !== value) {
    return nothing();
  }
  return just(parsed);
}

function readBoundary(value: string, endOfDay: boolean): Maybe<number> {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}${endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z'}`
    : value;
  const parsed = new Date(normalized);
  const timestamp = parsed.getTime();
  if (Number.isNaN(timestamp)) {
    return nothing();
  }
  return just(timestamp);
}

const failureByCode: readonly (readonly [string, SimulatedFailure])[] = [
  ['400', 'badRequest'],
  ['429', 'tooManyRequests'],
  ['500', 'server'],
  ['503', 'unavailable'],
  ['timeout', 'timeout']
];

function readFailure(value: string): Maybe<SimulatedFailure> {
  for (const [code, failure] of failureByCode) {
    if (code === value) {
      return just(failure);
    }
  }
  return nothing();
}

type BoundedIntegerOptions = {
  readonly params: URLSearchParams;
  readonly name: string;
  readonly fallback: number;
  readonly min: number;
  readonly max: number;
};

function parseBoundedInteger(options: BoundedIntegerOptions): Result<number, 'invalidQuery'> {
  const text = readOptionalText(options.params, options.name);
  if (isNothing(text)) {
    return ok(options.fallback);
  }
  const parsed = readInteger(text.value);
  if (isNothing(parsed) || parsed.value < options.min || parsed.value > options.max) {
    return err('invalidQuery');
  }
  return ok(parsed.value);
}

function parseFailure(params: URLSearchParams): Result<Maybe<SimulatedFailure>, 'invalidQuery'> {
  const text = readOptionalText(params, 'error');
  if (isNothing(text)) {
    return ok(nothing());
  }
  const failure = readFailure(text.value);
  if (isNothing(failure)) {
    return err('invalidQuery');
  }
  return ok(failure);
}

function parseStatus(params: URLSearchParams): Result<Maybe<FeedStatus>, 'invalidQuery'> {
  const text = readOptionalText(params, 'status');
  if (isNothing(text)) {
    return ok(nothing());
  }
  if (!isFeedStatus(text.value)) {
    return err('invalidQuery');
  }
  return ok(just(text.value));
}

function parseBoundary(
  params: URLSearchParams,
  name: string,
  endOfDay: boolean
): Result<Maybe<number>, 'invalidQuery'> {
  const text = readOptionalText(params, name);
  if (isNothing(text)) {
    return ok(nothing());
  }
  const timestamp = readBoundary(text.value, endOfDay);
  if (isNothing(timestamp)) {
    return err('invalidQuery');
  }
  return ok(timestamp);
}

const maxCursor = 1_000_000;

type PageBounds = {
  readonly limit: number;
  readonly offset: number;
  readonly delayInMilliseconds: number;
};

function parsePageBounds(params: URLSearchParams): Result<PageBounds, 'invalidQuery'> {
  const limit = parseBoundedInteger({
    params,
    name: 'limit',
    fallback: defaultLimit,
    min: 1,
    max: maxLimit
  });
  if (isErr(limit)) {
    return err('invalidQuery');
  }
  const offset = parseBoundedInteger({
    params,
    name: 'cursor',
    fallback: 0,
    min: 0,
    max: maxCursor
  });
  if (isErr(offset)) {
    return err('invalidQuery');
  }
  const delayInMilliseconds = parseBoundedInteger({
    params,
    name: 'delayMs',
    fallback: 0,
    min: 0,
    max: maxDelayInMilliseconds
  });
  if (isErr(delayInMilliseconds)) {
    return err('invalidQuery');
  }
  return ok({
    limit: limit.value,
    offset: offset.value,
    delayInMilliseconds: delayInMilliseconds.value
  });
}

function parseFailureAndStatus(
  params: URLSearchParams
): Result<{ readonly failure: Maybe<SimulatedFailure>; readonly status: Maybe<FeedStatus> }, 'invalidQuery'> {
  const failure = parseFailure(params);
  if (isErr(failure)) {
    return err('invalidQuery');
  }
  const status = parseStatus(params);
  if (isErr(status)) {
    return err('invalidQuery');
  }
  return ok({ failure: failure.value, status: status.value });
}

function parseRange(
  params: URLSearchParams
): Result<{ readonly fromTimestamp: Maybe<number>; readonly toTimestamp: Maybe<number> }, 'invalidQuery'> {
  const fromTimestamp = parseBoundary(params, 'from', false);
  if (isErr(fromTimestamp)) {
    return err('invalidQuery');
  }
  const toTimestamp = parseBoundary(params, 'to', true);
  if (isErr(toTimestamp)) {
    return err('invalidQuery');
  }
  return ok({ fromTimestamp: fromTimestamp.value, toTimestamp: toTimestamp.value });
}

export function parsePostsQuery(params: URLSearchParams): Result<PostsQuery, 'invalidQuery'> {
  const bounds = parsePageBounds(params);
  if (isErr(bounds)) {
    return err('invalidQuery');
  }
  const selection = parseFailureAndStatus(params);
  if (isErr(selection)) {
    return err('invalidQuery');
  }
  const range = parseRange(params);
  if (isErr(range)) {
    return err('invalidQuery');
  }
  return ok({
    limit: bounds.value.limit,
    offset: bounds.value.offset,
    text: readOptionalText(params, 'q'),
    tag: readOptionalText(params, 'tag'),
    status: selection.value.status,
    fromTimestamp: range.value.fromTimestamp,
    toTimestamp: range.value.toTimestamp,
    delayInMilliseconds: bounds.value.delayInMilliseconds,
    failure: selection.value.failure
  });
}
