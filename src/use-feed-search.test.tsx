import assert from 'node:assert';
import { createDeterministicWallClock } from '@enormora/wall-clock/deterministic-wall-clock';
import { act, renderHook } from '@testing-library/react';
import { describe, it } from 'vitest';
import { useFeedSearch } from './use-feed-search';

const wallClock = createDeterministicWallClock({
  initialCurrentTimestampInMilliseconds: 0
});

describe('feed search typing', function () {
  it('writes the search text after the delay', function () {
    const written: string[] = [];
    function readSearchParams(): URLSearchParams {
      return new URLSearchParams();
    }
    function writeSearchParams(params: URLSearchParams): void {
      written.push(params.toString());
    }
    const view = renderHook(function FeedSearchProbe() {
      return useFeedSearch({ readSearchParams, writeSearchParams, wallClock });
    });

    act(function type() {
      view.result.current.setDraftText('ada');
    });
    assert.deepStrictEqual(written, []);

    act(function wait() {
      wallClock.advanceByMilliseconds(300);
    });
    assert.deepStrictEqual(written, ['q=ada']);
  });
});
