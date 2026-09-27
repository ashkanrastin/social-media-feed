import {
  useInfiniteQuery,
  type GetNextPageParamFunction,
  type InfiniteData,
  type UseInfiniteQueryResult
} from '@tanstack/react-query';
import { isNothing, just, nothing, type Maybe } from 'true-myth/maybe';
import { isErr } from 'true-myth/result';
import { z } from 'zod';
import { toFeedSearchParams, type FeedSearch } from '../search/feed-search';
import type { LoadFeedPage } from './create-load-feed-page';
import type { FeedPage } from './read-post-page';

export function feedQueryKey(search: FeedSearch, delayInMilliseconds: number): readonly [string, string, number] {
  return ['posts', toFeedSearchParams(search).toString(), delayInMilliseconds];
}

function stopPaging(): ReturnType<GetNextPageParamFunction<string, FeedPage>> {
  const parsed = z.null().safeParse(JSON.parse('null'));
  if (!parsed.success) {
    return '';
  }
  return parsed.data;
}

export const nextPageParam: GetNextPageParamFunction<string, FeedPage> = function nextPage(page) {
  if (isNothing(page.nextCursor)) {
    return stopPaging();
  }
  return page.nextCursor.value;
};

function cursorFrom(pageParam: string): Maybe<string> {
  if (pageParam.length === 0) {
    return nothing();
  }
  return just(pageParam);
}

export function useFeedPages(
  loadFeedPage: LoadFeedPage,
  search: FeedSearch,
  delayInMilliseconds: number
): UseInfiniteQueryResult<InfiniteData<FeedPage, string>> {
  return useInfiniteQuery({
    queryKey: feedQueryKey(search, delayInMilliseconds),
    initialPageParam: '',
    queryFn: async function loadPage(context): Promise<FeedPage> {
      const page = await loadFeedPage({
        search,
        cursor: cursorFrom(context.pageParam),
        delayInMilliseconds
      });
      if (isErr(page)) {
        throw new Error(page.error);
      }
      return page.value;
    },
    getNextPageParam: nextPageParam
  });
}
