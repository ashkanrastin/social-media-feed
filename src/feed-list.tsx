import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import React, { useCallback, useEffect, useRef, useState, type CSSProperties, type JSX, type RefCallback } from 'react';
import { isNothing, nothing, of, type Maybe } from 'true-myth/maybe';
import { fromPromise } from 'true-myth/task';
import {
  flattenFeedPosts,
  isLoaderRow,
  lastVirtualIndex,
  shouldLoadNextPage,
  virtualRowCount
} from './feed-list-state';
import type { FeedPost } from './feed-post';
import type { FeedPage } from './read-post-page';

type RowVirtualizer = ReturnType<typeof useVirtualizer<HTMLDivElement, HTMLDivElement>>;

const estimatedRowHeight = 120;
const rowOverscan = 5;
const loadingMoreLabel = 'Loading more';
const retryLabel = 'Try again';

export const feedListLabel = 'Posts';

type FetchNextPage = () => Promise<unknown>;

type FeedListProps = {
  readonly pages: readonly FeedPage[];
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly isFetchNextPageError: boolean;
  readonly fetchNextPage: FetchNextPage;
  readonly queryKey: string;
};

type VirtualRowsProps = FeedListProps & {
  readonly element: HTMLDivElement;
};

type RowContentProps = {
  readonly item: VirtualItem;
  readonly posts: readonly FeedPost[];
  readonly fetchNextPage: FetchNextPage;
  readonly isFetchNextPageError: boolean;
};

function listBoxStyle(height: number): CSSProperties {
  return {
    height: `${String(height)}px`,
    maxWidth: '100%',
    overflow: 'hidden',
    position: 'relative',
    width: '100%'
  };
}

function rowStyle(start: number): CSSProperties {
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    maxWidth: '100%',
    overflow: 'hidden',
    width: '100%',
    transform: `translateY(${String(start)}px)`
  };
}

function startNextPage(fetchNextPage: FetchNextPage): void {
  fromPromise(fetchNextPage());
}

function useLoadNextPage(props: VirtualRowsProps, virtualItems: readonly VirtualItem[], loadedCount: number): void {
  const requestedCount = useRef(0);
  useEffect(
    function resetRequestedCount() {
      requestedCount.current = 0;
    },
    [props.queryKey]
  );
  useEffect(
    function loadWhenEndVisible() {
      const reachedLoadedPosts = shouldLoadNextPage({
        lastVirtualIndex: lastVirtualIndex(virtualItems),
        loadedCount,
        hasNextPage: props.hasNextPage,
        isFetchingNextPage: props.isFetchingNextPage,
        isFetchNextPageError: props.isFetchNextPageError
      });
      if (!reachedLoadedPosts || requestedCount.current === loadedCount) {
        return;
      }
      requestedCount.current = loadedCount;
      startNextPage(props.fetchNextPage);
    },
    [
      virtualItems,
      loadedCount,
      props.hasNextPage,
      props.isFetchingNextPage,
      props.isFetchNextPageError,
      props.fetchNextPage,
      props.queryKey
    ]
  );
}

function useResetScroll(virtualizer: RowVirtualizer, queryKey: string): void {
  useEffect(
    function resetScroll() {
      virtualizer.scrollToOffset(0);
    },
    [virtualizer, queryKey]
  );
}

type LoaderRowProps = {
  readonly fetchNextPage: FetchNextPage;
  readonly isFetchNextPageError: boolean;
};

function LoaderRow(props: LoaderRowProps): JSX.Element {
  function retry(): void {
    startNextPage(props.fetchNextPage);
  }
  if (props.isFetchNextPageError) {
    return (
      <button type='button' className='px-6 py-4 text-left' onClick={retry}>
        {retryLabel}
      </button>
    );
  }
  return <p className='px-6 py-4'>{loadingMoreLabel}</p>;
}

type PostRowProps = {
  readonly post: FeedPost;
};

function PostRow(props: PostRowProps): JSX.Element {
  return (
    <article className='px-6 py-4'>
      <h2 className='text-lg font-semibold [overflow-wrap:anywhere]'>{props.post.title}</h2>
      <p className='mt-2 whitespace-pre-wrap [overflow-wrap:anywhere]'>{props.post.content}</p>
    </article>
  );
}

function RowContent(props: RowContentProps): JSX.Element {
  const post = of(props.posts[props.item.index]);
  if (isLoaderRow(props.item.index, props.posts.length) || isNothing(post)) {
    return <LoaderRow fetchNextPage={props.fetchNextPage} isFetchNextPageError={props.isFetchNextPageError} />;
  }
  return <PostRow post={post.value} />;
}

function VirtualRows(props: VirtualRowsProps): JSX.Element {
  const posts = flattenFeedPosts(props.pages);
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: virtualRowCount(posts.length, props.hasNextPage),
    estimateSize: function estimateRow() {
      return estimatedRowHeight;
    },
    getScrollElement: function scrollElement() {
      return props.element;
    },
    indexAttribute: 'data-index',
    overscan: rowOverscan
  });
  const virtualItems = virtualizer.getVirtualItems();
  useLoadNextPage(props, virtualItems, posts.length);
  useResetScroll(virtualizer, props.queryKey);
  return (
    <div style={listBoxStyle(virtualizer.getTotalSize())}>
      {virtualItems.map(function renderRow(item) {
        return (
          <div
            key={item.index}
            data-index={item.index}
            ref={virtualizer.measureElement}
            role='listitem'
            style={rowStyle(item.start)}
          >
            <RowContent
              fetchNextPage={props.fetchNextPage}
              isFetchNextPageError={props.isFetchNextPageError}
              item={item}
              posts={posts}
            />
          </div>
        );
      })}
    </div>
  );
}

function scrollBody(scrollElement: Maybe<HTMLDivElement>, props: FeedListProps): JSX.Element {
  if (isNothing(scrollElement)) {
    return <div />;
  }
  return (
    <VirtualRows
      element={scrollElement.value}
      fetchNextPage={props.fetchNextPage}
      hasNextPage={props.hasNextPage}
      isFetchNextPageError={props.isFetchNextPageError}
      isFetchingNextPage={props.isFetchingNextPage}
      pages={props.pages}
      queryKey={props.queryKey}
    />
  );
}

export function FeedList(props: FeedListProps): JSX.Element {
  const [scrollElement, setScrollElement] = useState<Maybe<HTMLDivElement>>(nothing());
  const rememberScrollElement = useCallback<RefCallback<HTMLDivElement>>(function rememberElement(element) {
    const next = of(element);
    if (isNothing(next)) {
      return;
    }
    setScrollElement(next);
  }, []);
  return (
    <div
      ref={rememberScrollElement}
      aria-label={feedListLabel}
      className='h-[calc(100dvh-7rem)] overflow-x-hidden overflow-y-auto'
      role='list'
    >
      {scrollBody(scrollElement, props)}
    </div>
  );
}
