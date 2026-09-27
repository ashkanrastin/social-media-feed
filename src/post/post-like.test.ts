import assert from 'node:assert';
import { describe, it } from 'vitest';
import { applyLikeToggle, emptyPostLike, settleLike, toggleLike, type LikeAttempt } from './post-like';

const likedOnce = { liked: true, count: 1 };

describe('post like', function () {
  it('fills the heart and adds one like', function () {
    assert.deepStrictEqual(toggleLike(emptyPostLike), likedOnce);
  });

  it('clears the heart and removes one like', function () {
    assert.deepStrictEqual(toggleLike(likedOnce), emptyPostLike);
  });

  it('keeps a successful like', function () {
    const attempt: LikeAttempt = { generation: 1, previous: emptyPostLike };
    assert.deepStrictEqual(settleLike({ status: 200, attempt, currentGeneration: 1 }), { type: 'keep' });
  });

  it('reverts a failed like that is still current', function () {
    const attempt: LikeAttempt = { generation: 1, previous: emptyPostLike };
    assert.deepStrictEqual(settleLike({ status: 400, attempt, currentGeneration: 1 }), {
      type: 'revert',
      previous: emptyPostLike
    });
  });

  it('ignores a failed like after a newer click', function () {
    const attempt: LikeAttempt = { generation: 1, previous: emptyPostLike };
    const applied = applyLikeToggle({}, 'post-1');
    assert.deepStrictEqual(applied.likes['post-1'], likedOnce);
    assert.deepStrictEqual(settleLike({ status: 400, attempt, currentGeneration: 2 }), { type: 'keep' });
  });
});
