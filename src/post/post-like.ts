export const likeAcceptedStatus = 200;
export const likeRejectedStatus = 400;

export const likeStatuses = [likeAcceptedStatus, likeRejectedStatus] as const;

export type LikeStatus = (typeof likeStatuses)[number];

export type PostLike = {
  readonly liked: boolean;
  readonly count: number;
};

export const emptyPostLike: PostLike = {
  liked: false,
  count: 0
};

export type LikeRecord = Readonly<Record<string, PostLike>>;

export type LikeAttempt = {
  readonly generation: number;
  readonly previous: PostLike;
};

export type LikeSettlement = { readonly type: 'keep' } | { readonly type: 'revert'; readonly previous: PostLike };

export type AppliedLikeToggle = {
  readonly likes: LikeRecord;
  readonly previous: PostLike;
};

export function likeFor(likes: LikeRecord, postId: string): PostLike {
  const stored = likes[postId];
  if (typeof stored !== 'object') {
    return emptyPostLike;
  }
  return stored;
}

export function toggleLike(like: PostLike): PostLike {
  if (like.liked) {
    return { liked: false, count: like.count - 1 };
  }
  return { liked: true, count: like.count + 1 };
}

export function applyLikeToggle(likes: LikeRecord, postId: string): AppliedLikeToggle {
  const previous = likeFor(likes, postId);
  return {
    previous,
    likes: { ...likes, [postId]: toggleLike(previous) }
  };
}

export function restoreLike(likes: LikeRecord, postId: string, previous: PostLike): LikeRecord {
  return { ...likes, [postId]: previous };
}

export function nextGeneration(generations: Readonly<Record<string, number>>, postId: string): number {
  const current = generations[postId];
  if (typeof current !== 'number') {
    return 1;
  }
  return current + 1;
}

export function generationOf(generations: Readonly<Record<string, number>>, postId: string): number {
  const current = generations[postId];
  if (typeof current !== 'number') {
    return 0;
  }
  return current;
}

type SettleLikeOptions = {
  readonly status: LikeStatus;
  readonly attempt: LikeAttempt;
  readonly currentGeneration: number;
};

export function settleLike(options: SettleLikeOptions): LikeSettlement {
  const stillCurrent = options.attempt.generation === options.currentGeneration;
  if (!stillCurrent || options.status === likeAcceptedStatus) {
    return { type: 'keep' };
  }
  return { type: 'revert', previous: options.attempt.previous };
}
