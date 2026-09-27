import assert from 'node:assert';
import { nothing } from 'true-myth/maybe';
import { isErr } from 'true-myth/result';
import { describe, it } from 'vitest';
import type { FeedPost } from './feed-post';
import { readPostPage, type FeedPage } from './read-post-page';

const post: FeedPost = {
  id: '1',
  authorName: 'Ada',
  title: 'Hello',
  content: 'A short post',
  createdAt: '2026-09-01T00:00:00.000Z',
  tags: ['technology'],
  status: 'open',
  image: '/images/01.jpg',
  avatar: '/avatars/01.svg',
  commentCount: 3
};

const emptyPage: FeedPage = {
  posts: [],
  nextCursor: nothing()
};

describe('read post page', function () {
  it('reads posts and the next cursor', function () {
    const page = readPostPage({ posts: [post], nextCursor: '50' });
    const value = page.unwrapOr(emptyPage);

    assert.partialDeepStrictEqual(
      {
        cursor: value.nextCursor.unwrapOr(''),
        ok: page.isOk,
        titles: value.posts.map(function titleOf(item) {
          return item.title;
        })
      },
      { cursor: '50', ok: true, titles: ['Hello'] }
    );
  });

  it('treats a missing cursor as the last page', function () {
    const page = readPostPage({ posts: [post] });
    const value = page.unwrapOr(emptyPage);

    assert.partialDeepStrictEqual(
      {
        cursor: value.nextCursor.unwrapOr(''),
        count: value.posts.length,
        ok: page.isOk
      },
      { cursor: '', count: 1, ok: true }
    );
  });

  it('rejects a page that does not match the snapshot', function () {
    assert.strictEqual(isErr(readPostPage({ posts: [{ id: '1' }] })), true);
  });
});
