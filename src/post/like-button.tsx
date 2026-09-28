import { type JSX } from 'react';

const heartPath =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

const likeLabel = 'Like';
const unlikeLabel = 'Unlike';

type LikeButtonProps = {
  readonly liked: boolean;
  readonly count: number;
  readonly onLike: () => void;
};

function likeButtonLabel(liked: boolean): string {
  if (liked) {
    return unlikeLabel;
  }
  return likeLabel;
}

function heartClassName(liked: boolean): string {
  if (liked) {
    return 'h-5 w-5 fill-red-600';
  }
  return 'h-5 w-5 fill-none stroke-current stroke-2 text-stone-500 dark:text-stone-400';
}

type LikeHeartProps = {
  readonly liked: boolean;
};

function LikeHeart(props: LikeHeartProps): JSX.Element {
  return (
    <svg aria-hidden='true' className={heartClassName(props.liked)} viewBox='0 0 24 24'>
      <path d={heartPath} />
    </svg>
  );
}

export function LikeButton(props: LikeButtonProps): JSX.Element {
  return (
    <button
      aria-label={likeButtonLabel(props.liked)}
      aria-pressed={props.liked}
      className='flex items-center gap-1 text-sm text-stone-500 dark:text-stone-400'
      onClick={props.onLike}
      type='button'
    >
      <LikeHeart liked={props.liked} />
      <span className={props.liked ? 'text-red-600' : ''}>{props.count}</span>
    </button>
  );
}
