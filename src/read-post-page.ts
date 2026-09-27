import { of, type Maybe } from 'true-myth/maybe';
import { err, ok, type Result } from 'true-myth/result';
import { z } from 'zod';
import { feedStatuses, type FeedPost } from './feed-post';

const feedPostSchema = z
  .object({
    id: z.string().min(1),
    authorName: z.string(),
    title: z.string(),
    content: z.string(),
    createdAt: z.string().min(1),
    tags: z.array(z.string()),
    status: z.enum(feedStatuses),
    image: z.string().startsWith('/images/')
  })
  .readonly();

const postPageSchema = z.object({
  posts: z.array(feedPostSchema),
  nextCursor: z.string().min(1).optional()
});

export type FeedPage = {
  readonly posts: readonly FeedPost[];
  readonly nextCursor: Maybe<string>;
};

function toFeedPost(value: z.infer<typeof feedPostSchema>): FeedPost {
  return {
    id: value.id,
    authorName: value.authorName,
    title: value.title,
    content: value.content,
    createdAt: value.createdAt,
    tags: value.tags,
    status: value.status,
    image: value.image
  };
}

export function readPostPage(value: unknown): Result<FeedPage, 'invalid'> {
  const parsed = postPageSchema.safeParse(value);
  if (!parsed.success) {
    return err('invalid');
  }
  return ok({
    posts: parsed.data.posts.map(toFeedPost),
    nextCursor: of(parsed.data.nextCursor)
  });
}
