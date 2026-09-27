export const feedStatuses = ['open', 'locked', 'featured', 'deleted', 'removed'] as const;

export type FeedStatus = (typeof feedStatuses)[number];

export type FeedPost = {
  readonly id: string;
  readonly authorName: string;
  readonly title: string;
  readonly content: string;
  readonly createdAt: string;
  readonly tags: readonly string[];
  readonly status: FeedStatus;
  readonly image: string;
};

export function isFeedStatus(value: string): value is FeedStatus {
  const statuses: readonly string[] = feedStatuses;
  return statuses.includes(value);
}
