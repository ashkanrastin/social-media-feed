import type { WallClock } from '@enormora/wall-clock/wall-clock';
import React, { useEffect, useRef, useState, type JSX } from 'react';
import { isJust, just, nothing, type Maybe } from 'true-myth/maybe';
import { fromPromise, type Task } from 'true-myth/task';
import { createSimulateLike } from './create-simulate-like';
import {
  applyLikeToggle,
  generationOf,
  likeFor,
  nextGeneration,
  restoreLike,
  settleLike,
  type LikeAttempt,
  type LikeRecord,
  type LikeSettlement,
  type LikeStatus,
  type PostLike
} from './post-like';

export const likeToastMessage = 'Could not update the like.';
export const likeToastDurationInMilliseconds = 3000;

type TimeoutId = ReturnType<WallClock['setTimeout']>;

export type NextLikeStatus = () => LikeStatus;

export type UsePostLikesDependencies = {
  readonly wallClock: WallClock;
  readonly nextLikeStatus: NextLikeStatus;
};

export type PostLikes = {
  readonly likeForPost: (postId: string) => PostLike;
  readonly togglePostLike: (postId: string) => void;
  readonly toastVisible: boolean;
};

type LikeToastProps = {
  readonly visible: boolean;
};

type LikeToastState = {
  readonly visible: boolean;
  readonly generation: number;
};

type SetLikeToast = (update: (current: LikeToastState) => LikeToastState) => void;

type FinishLikeAttemptOptions = {
  readonly outcome: LikeStatus;
  readonly attempt: LikeAttempt;
  readonly postId: string;
  readonly currentLikes: LikeRecord;
  readonly currentGeneration: number;
  readonly revert: (likes: LikeRecord) => void;
};

const hiddenToast: LikeToastState = { visible: false, generation: 0 };

function scheduleLikeToast(toast: LikeToastState, wallClock: WallClock, setToast: SetLikeToast): Maybe<TimeoutId> {
  if (!toast.visible) {
    return nothing();
  }
  return just(
    wallClock.setTimeout(function hideToast() {
      setToast(function hide(current) {
        return { visible: false, generation: current.generation };
      });
    }, likeToastDurationInMilliseconds)
  );
}

function finishLikeAttempt(options: FinishLikeAttemptOptions): LikeSettlement {
  const result = settleLike({
    status: options.outcome,
    attempt: options.attempt,
    currentGeneration: options.currentGeneration
  });
  if (result.type === 'revert') {
    options.revert(restoreLike(options.currentLikes, options.postId, result.previous));
  }
  return result;
}

export function usePostLikes(dependencies: UsePostLikesDependencies): PostLikes {
  const [likes, setLikes] = useState<LikeRecord>({});
  const [toast, setToast] = useState<LikeToastState>(hiddenToast);
  const likesRef = useRef<LikeRecord>({});
  const generations = useRef<Readonly<Record<string, number>>>({});
  const inFlight = useRef<Maybe<Task<LikeSettlement, unknown>>>(nothing());
  const simulateLike = useRef(createSimulateLike(dependencies));

  useEffect(
    function hideToastAfterDelay() {
      const timeout = scheduleLikeToast(toast, dependencies.wallClock, setToast);
      return function stopToast() {
        if (isJust(timeout)) {
          dependencies.wallClock.clearTimeout(timeout.value);
        }
      };
    },
    [dependencies.wallClock, toast]
  );

  function revealLikeFailure(): void {
    setToast(function nextToast(current) {
      return { visible: true, generation: current.generation + 1 };
    });
  }

  function togglePostLike(postId: string): void {
    const generation = nextGeneration(generations.current, postId);
    generations.current = { ...generations.current, [postId]: generation };
    const applied = applyLikeToggle(likesRef.current, postId);
    likesRef.current = applied.likes;
    setLikes(applied.likes);
    const attempt = { generation, previous: applied.previous };
    function revert(restored: LikeRecord): void {
      likesRef.current = restored;
      setLikes(restored);
      revealLikeFailure();
    }
    const pending = fromPromise(simulateLike.current(postId)).map(function settled(outcome) {
      return finishLikeAttempt({
        outcome,
        attempt,
        postId,
        currentLikes: likesRef.current,
        currentGeneration: generationOf(generations.current, postId),
        revert
      });
    });
    inFlight.current = just(pending);
  }

  return {
    likeForPost: function likeForPost(postId: string) {
      return likeFor(likes, postId);
    },
    togglePostLike,
    toastVisible: toast.visible
  };
}

export function LikeToast(props: LikeToastProps): JSX.Element {
  if (!props.visible) {
    return <div />;
  }
  return (
    <p
      className='fixed bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-stone-900 px-4 py-3 text-sm text-white dark:bg-stone-100 dark:text-stone-900'
      role='status'
    >
      {likeToastMessage}
    </p>
  );
}
