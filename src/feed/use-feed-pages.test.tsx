import assert from 'node:assert';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, type RenderHookResult } from '@testing-library/react';
import React, { type JSX, type ReactNode } from 'react';
import { just, nothing } from 'true-myth/maybe';
import { ok } from 'true-myth/result';
import { describe, it } from 'vitest';
import { emptyFeedSearch } from '../search/feed-search';
import type { LoadFeedPage } from './create-load-feed-page';
import { feedQueryKey, nextPageParam, useFeedPages } from './use-feed-pages';

const firstPost = {
  id: '1',
  authorName: 'Ada',
  title: 'Hello',
  content: 'A short post',
  createdAt: '2026-09-01T00:00:00.000Z',
  tags: ['technology'],
  status: 'open' as const,
  image: '/images/01.jpg',
  avatar: '/avatars/01.svg',
  commentCount: 3
};

const secondPost = {
  ...firstPost,
  id: '2',
  title: 'Next'
};

const loadTwoPages: LoadFeedPage = async function loadTwoPages(request) {
  if (request.cursor.unwrapOr('') === '50') {
    return ok({ posts: [secondPost], nextCursor: nothing() });
  }
  return ok({ posts: [firstPost], nextCursor: just('50') });
};

type WrapperProps = {
  readonly children: ReactNode;
};

function renderPages(): RenderHookResult<ReturnType<typeof useFeedPages>, WrapperProps> {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return renderHook(
    function usePages() {
      return useFeedPages(loadTwoPages, emptyFeedSearch);
    },
    {
      wrapper: function Wrapper(props: WrapperProps): JSX.Element {
        return <QueryClientProvider client={client}>{props.children}</QueryClientProvider>;
      }
    }
  );
}

describe('feed pages', function () {
  it('puts the search in the query key', function () {
    assert.deepStrictEqual(feedQueryKey({ ...emptyFeedSearch, text: just('ada') }), ['posts', 'q=ada']);
  });

  it('stops when the page has no cursor', function () {
    assert.notStrictEqual(typeof nextPageParam({ posts: [], nextCursor: nothing() }, [], '', []), 'string');
    assert.strictEqual(nextPageParam({ posts: [], nextCursor: just('50') }, [], '', []), '50');
  });

  it('loads the next page from the cursor', async function () {
    const view = renderPages();

    await waitFor(function firstPage() {
      assert.strictEqual(view.result.current.isSuccess, true);
    });
    const next = await view.result.current.fetchNextPage();

    assert.strictEqual(next.data?.pages.length, 2);
  });
});
