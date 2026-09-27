import { just, nothing, type Maybe } from 'true-myth/maybe';

export const focusMoves = ['previous', 'next', 'first', 'last'] as const;

export type FocusMove = (typeof focusMoves)[number];

type NextPostIndexOptions = {
  readonly currentIndex: number;
  readonly postCount: number;
  readonly move: FocusMove;
};

export function focusMoveForKey(key: string): Maybe<FocusMove> {
  if (key === 'ArrowDown') {
    return just('next');
  }
  if (key === 'ArrowUp') {
    return just('previous');
  }
  if (key === 'Home') {
    return just('first');
  }
  if (key === 'End') {
    return just('last');
  }
  return nothing();
}

export function nextPostIndex(options: NextPostIndexOptions): number {
  if (options.postCount < 1) {
    return options.currentIndex;
  }
  if (options.move === 'first') {
    return 0;
  }
  if (options.move === 'last') {
    return options.postCount - 1;
  }
  if (options.move === 'next') {
    return Math.min(options.postCount - 1, options.currentIndex + 1);
  }
  return Math.max(0, options.currentIndex - 1);
}
