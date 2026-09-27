import { isNothing, of, type Maybe } from 'true-myth/maybe';

export type NextPageProbe = {
  readonly lastVirtualIndex: Maybe<number>;
  readonly loadedCount: number;
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly isFetchNextPageError: boolean;
};

export function shouldLoadNextPage(probe: NextPageProbe): boolean {
  if (isNothing(probe.lastVirtualIndex)) {
    return false;
  }
  if (!probe.hasNextPage || probe.isFetchingNextPage || probe.isFetchNextPageError) {
    return false;
  }
  return probe.lastVirtualIndex.value >= probe.loadedCount - 1;
}

export function virtualRowCount(loadedCount: number, hasNextPage: boolean): number {
  if (hasNextPage) {
    return loadedCount + 1;
  }
  return loadedCount;
}

export function isLoaderRow(index: number, loadedCount: number): boolean {
  return index > loadedCount - 1;
}

export function lastVirtualIndex(items: readonly { readonly index: number }[]): Maybe<number> {
  return of(items.at(-1)).map(function indexOf(item) {
    return item.index;
  });
}

export function flattenFeedPosts<Post>(pages: readonly { readonly posts: readonly Post[] }[]): readonly Post[] {
  return pages.flatMap(function postsOf(page) {
    return page.posts;
  });
}
