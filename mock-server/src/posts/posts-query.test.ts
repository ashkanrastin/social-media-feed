import assert from 'node:assert';
import { nothing } from 'true-myth/maybe';
import { isErr } from 'true-myth/result';
import { describe, it } from 'vitest';
import type { FeedStatus } from './feed-post';
import { parsePostsQuery, type PostsQuery, type SimulatedFailure } from './posts-query';

const emptyQuery: PostsQuery = {
  limit: 0,
  offset: 0,
  text: nothing<string>(),
  tag: nothing<string>(),
  status: nothing<FeedStatus>(),
  fromTimestamp: nothing<number>(),
  toTimestamp: nothing<number>(),
  delayInMilliseconds: 0,
  failure: nothing<SimulatedFailure>()
};

describe('posts query', function () {
  it('reads delay and a simulated error', function () {
    const query = parsePostsQuery(new URLSearchParams('delayMs=250&error=503'));
    const value = query.unwrapOr(emptyQuery);

    assert.partialDeepStrictEqual(
      {
        delayInMilliseconds: value.delayInMilliseconds,
        failure: value.failure.unwrapOr('timeout')
      },
      { delayInMilliseconds: 250, failure: 'unavailable' }
    );
  });

  it('rejects an unknown error', function () {
    const query = parsePostsQuery(new URLSearchParams('error=418'));

    assert.strictEqual(isErr(query), true);
  });

  it('parses a date-only range', function () {
    const query = parsePostsQuery(new URLSearchParams('from=2026-09-01&to=2026-09-02'));
    const value = query.unwrapOr(emptyQuery);

    assert.partialDeepStrictEqual(
      {
        fromIsPresent: value.fromTimestamp.isJust,
        ordered: value.fromTimestamp.unwrapOr(0) < value.toTimestamp.unwrapOr(0),
        toIsPresent: value.toTimestamp.isJust
      },
      { fromIsPresent: true, ordered: true, toIsPresent: true }
    );
  });
});
