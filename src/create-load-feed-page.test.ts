import assert from 'node:assert';
import { just, nothing } from 'true-myth/maybe';
import { isOk, type Result } from 'true-myth/result';
import { describe, it } from 'vitest';
import { createLoadFeedPage, type LoadFeedPageError } from './create-load-feed-page';
import { emptyFeedSearch, type FeedSearch } from './feed-search';
import type { FeedPost } from './feed-post';
import type { FeedPage } from './read-post-page';

function failureOf(page: Result<FeedPage, LoadFeedPageError>): string {
  if (isOk(page)) {
    return '';
  }
  return page.error;
}

function requestTarget(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

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

const namedSearch: FeedSearch = {
  ...emptyFeedSearch,
  text: just('ada')
};

describe('load feed page', function () {
  it('requests the first page for the current search', async function () {
    const urls: string[] = [];
    const loadFeedPage = createLoadFeedPage({
      fetch: async function fetchPage(input) {
        urls.push(requestTarget(input));
        return Response.json({ posts: [post], nextCursor: '50' });
      }
    });
    const page = await loadFeedPage({ search: namedSearch, cursor: nothing() });

    assert.deepStrictEqual(urls, ['/posts?q=ada&limit=50']);
    assert.deepStrictEqual(
      page.unwrapOr({ posts: [], nextCursor: nothing() }).posts.map(function idOf(item) {
        return item.id;
      }),
      ['1']
    );
  });

  it('sends the cursor for the next page', async function () {
    const urls: string[] = [];
    const loadFeedPage = createLoadFeedPage({
      fetch: async function fetchPage(input) {
        urls.push(requestTarget(input));
        return Response.json({ posts: [] });
      }
    });
    await loadFeedPage({ search: emptyFeedSearch, cursor: just('50') });

    assert.deepStrictEqual(urls, ['/posts?limit=50&cursor=50']);
  });

  it('returns invalid when the server rejects the request', async function () {
    const loadFeedPage = createLoadFeedPage({
      fetch: async function fetchPage() {
        return new Response('nope', { status: 500 });
      }
    });
    const page = await loadFeedPage({ search: emptyFeedSearch, cursor: nothing() });

    assert.strictEqual(failureOf(page), 'invalid');
  });

  it('returns network when the request fails', async function () {
    const loadFeedPage = createLoadFeedPage({
      fetch: async function fetchPage() {
        throw new Error('offline');
      }
    });
    const page = await loadFeedPage({ search: emptyFeedSearch, cursor: nothing() });

    assert.strictEqual(failureOf(page), 'network');
  });
});
