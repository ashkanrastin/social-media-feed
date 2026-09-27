import type { WallClock } from '@enormora/wall-clock/wall-clock';
import type { LikeStatus } from './post-like';

export const likeDelayInMilliseconds = 5000;

type SimulateLikeDependencies = {
  readonly wallClock: WallClock;
  readonly nextLikeStatus: () => LikeStatus;
};

export type SimulateLike = (postId: string) => Promise<LikeStatus>;

export function createSimulateLike(dependencies: SimulateLikeDependencies): SimulateLike {
  return async function simulateLike(_postId: string): Promise<LikeStatus> {
    return new Promise(function settle(resolve) {
      dependencies.wallClock.setTimeout(function finish() {
        resolve(dependencies.nextLikeStatus());
      }, likeDelayInMilliseconds);
    });
  };
}
