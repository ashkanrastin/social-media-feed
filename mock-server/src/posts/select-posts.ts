import { isNothing, nothing, just, type Maybe } from 'true-myth/maybe';
import type { FeedPost } from './feed-post';
import type { PostsQuery } from './posts-query';

export type PostPage = {
  readonly posts: readonly FeedPost[];
  readonly nextCursor: Maybe<string>;
};

function includesText(post: FeedPost, query: PostsQuery): boolean {
  if (isNothing(query.text)) {
    return true;
  }
  const haystack = `${post.authorName}\n${post.title}\n${post.content}`.toLowerCase();
  return haystack.includes(query.text.value.toLowerCase());
}

function includesTag(post: FeedPost, query: PostsQuery): boolean {
  if (isNothing(query.tag)) {
    return true;
  }
  const expected = query.tag.value.toLowerCase();
  return post.tags.some(function sameTag(candidate) {
    return candidate.toLowerCase() === expected;
  });
}

function includesStatus(post: FeedPost, query: PostsQuery): boolean {
  if (isNothing(query.status)) {
    return true;
  }
  return post.status === query.status.value;
}

function createdAtTimestamp(post: FeedPost): number {
  const createdAt = new Date(post.createdAt);
  return createdAt.getTime();
}

function withinRange(post: FeedPost, query: PostsQuery): boolean {
  const created = createdAtTimestamp(post);
  if (Number.isNaN(created)) {
    return false;
  }
  if (!isNothing(query.fromTimestamp) && created < query.fromTimestamp.value) {
    return false;
  }
  if (!isNothing(query.toTimestamp) && created > query.toTimestamp.value) {
    return false;
  }
  return true;
}

function matches(post: FeedPost, query: PostsQuery): boolean {
  return (
    includesText(post, query) && includesTag(post, query) && includesStatus(post, query) && withinRange(post, query)
  );
}

export function selectPosts(posts: readonly FeedPost[], query: PostsQuery): PostPage {
  const matched = posts.filter(function keep(post) {
    return matches(post, query);
  });
  const page = matched.slice(query.offset, query.offset + query.limit);
  const nextOffset = query.offset + query.limit;
  const nextCursor = nextOffset < matched.length ? just(String(nextOffset)) : nothing<string>();
  return { posts: page, nextCursor };
}
