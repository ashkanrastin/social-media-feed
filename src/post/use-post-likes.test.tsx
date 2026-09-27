import assert from 'node:assert';
import { createDeterministicWallClock } from '@enormora/wall-clock/deterministic-wall-clock';
import { act, renderHook, type RenderHookResult } from '@testing-library/react';
import { describe, it } from 'vitest';
import type { LikeStatus } from './post-like';
import { usePostLikes, type PostLikes } from './use-post-likes';

type LikeProbe = {
  readonly view: RenderHookResult<PostLikes, unknown>;
  readonly wallClock: ReturnType<typeof createDeterministicWallClock>;
};

function renderLikes(nextLikeStatus: () => LikeStatus): LikeProbe {
  const wallClock = createDeterministicWallClock({
    initialCurrentTimestampInMilliseconds: 0
  });
  const view = renderHook(function PostLikesProbe() {
    return usePostLikes({ wallClock, nextLikeStatus });
  });
  return { view, wallClock };
}

describe('post likes', function () {
  it('reverts the heart when the simulated call fails', async function () {
    function nextLikeStatus(): LikeStatus {
      return 400;
    }
    const probe = renderLikes(nextLikeStatus);

    act(function likePost() {
      probe.view.result.current.togglePostLike('post-1');
    });
    assert.deepStrictEqual(probe.view.result.current.likeForPost('post-1'), { liked: true, count: 1 });

    await act(async function failLike() {
      probe.wallClock.advanceByMilliseconds(5000);
    });

    assert.deepStrictEqual(probe.view.result.current.likeForPost('post-1'), { liked: false, count: 0 });
    assert.strictEqual(probe.view.result.current.toastVisible, true);

    await act(async function hideToast() {
      probe.wallClock.advanceByMilliseconds(3000);
    });
    assert.strictEqual(probe.view.result.current.toastVisible, false);
  });

  it('keeps the heart when the simulated call succeeds', async function () {
    function nextLikeStatus(): LikeStatus {
      return 200;
    }
    const probe = renderLikes(nextLikeStatus);

    act(function likePost() {
      probe.view.result.current.togglePostLike('post-2');
    });
    await act(async function succeedLike() {
      probe.wallClock.advanceByMilliseconds(5000);
    });

    assert.deepStrictEqual(probe.view.result.current.likeForPost('post-2'), { liked: true, count: 1 });
    assert.strictEqual(probe.view.result.current.toastVisible, false);
  });
});
