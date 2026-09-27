import assert from 'node:assert';
import { createDeterministicWallClock } from '@enormora/wall-clock/deterministic-wall-clock';
import { describe, it } from 'vitest';
import { createSimulateLike } from './create-simulate-like';
import type { LikeStatus } from './post-like';

describe('simulated like', function () {
  it('answers after five seconds', async function () {
    let calls = 0;
    function nextLikeStatus(): LikeStatus {
      calls += 1;
      return 400;
    }
    const wallClock = createDeterministicWallClock({
      initialCurrentTimestampInMilliseconds: 0
    });
    const simulateLike = createSimulateLike({ wallClock, nextLikeStatus });
    const pending = simulateLike('post-1');

    wallClock.advanceByMilliseconds(4999);
    assert.strictEqual(calls, 0);

    wallClock.advanceByMilliseconds(1);
    assert.strictEqual(await pending, 400);
    assert.strictEqual(calls, 1);
  });
});
