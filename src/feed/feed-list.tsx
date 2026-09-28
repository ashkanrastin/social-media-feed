import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
  type KeyboardEvent as KeyPress,
  type RefCallback
} from 'react';
import { isNothing, just, nothing, of, type Maybe } from 'true-myth/maybe';
import { fromPromise } from 'true-myth/task';
import type { FeedPost } from '../post/feed-post';
import { PostCard } from '../post/post-card';
import { LikeToast, usePostLikes, type PostLikes, type UsePostLikesDependencies } from '../post/use-post-likes';
import {
  flattenFeedPosts,
  isLoaderRow,
  lastVirtualIndex,
  shouldLoadNextPage,
  virtualRowCount
} from './feed-list-state';
import { focusMoveForKey, nextPostIndex } from './post-focus';
import type { FeedPage } from './read-post-page';

type RowVirtualizer = ReturnType<typeof useVirtualizer<HTMLDivElement, HTMLDivElement>>;

const estimatedRowWithImage = 560;
const estimatedRowWithoutImage = 240;
const rowOverscan = 5;
const loadingMoreLabel = 'Loading more';
const loadingPostsLabel = 'Loading posts';
const retryLabel = 'Try again';
const skeletonKeys = ['first', 'second', 'third'] as const;

export const feedListLabel = 'Posts';

type FetchNextPage = () => Promise<unknown>;

export type NextLikeStatus = UsePostLikesDependencies['nextLikeStatus'];

type FeedListProps = UsePostLikesDependencies & {
  readonly pages: readonly FeedPage[];
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly isFetchNextPageError: boolean;
  readonly fetchNextPage: FetchNextPage;
  readonly queryKey: string;
};

type VirtualRowsProps = FeedListProps & {
  readonly element: HTMLDivElement;
  readonly likes: PostLikes;
};

type RowContentProps = {
  readonly item: VirtualItem;
  readonly posts: readonly FeedPost[];
  readonly fetchNextPage: FetchNextPage;
  readonly isFetchNextPageError: boolean;
  readonly onPostKey: PostKeyHandler;
  readonly likes: PostLikes;
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

function SkeletonCard(): JSX.Element {
  return (
    <div className='mx-auto max-w-xl animate-pulse overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900'>
      <div className='flex items-center gap-3 px-4 pt-4'>
        <div className='h-10 w-10 rounded-full bg-stone-200 dark:bg-stone-800' />
        <div className='grid gap-2'>
          <div className='h-4 w-32 rounded bg-stone-200 dark:bg-stone-800' />
          <div className='h-3 w-20 rounded bg-stone-200 dark:bg-stone-800' />
        </div>
      </div>
      <div className='mx-4 mt-4 h-4 w-2/3 rounded bg-stone-200 dark:bg-stone-800' />
      <div className='mt-4 aspect-[3/2] bg-stone-200 dark:bg-stone-800' />
      <div className='mx-4 my-3 h-3 w-24 rounded bg-stone-200 dark:bg-stone-800' />
    </div>
  );
}

export function FeedSkeleton(): JSX.Element {
  return (
    <div aria-busy='true' aria-label={loadingPostsLabel} className='min-h-0 flex-1 overflow-y-auto'>
      {skeletonKeys.map(function renderSkeleton(key) {
        return (
          <div className='px-4 py-2' key={key}>
            <SkeletonCard />
          </div>
        );
      })}
    </div>
  );
}

function LoaderRow(props: LoaderRowProps): JSX.Element {
  function retry(): void {
    startNextPage(props.fetchNextPage);
  }
  if (props.isFetchNextPageError) {
    return (
      <button type='button' className='focus-ring px-6 py-4 text-left' onClick={retry}>
        {retryLabel}
      </button>
    );
  }
  return (
    <div aria-label={loadingMoreLabel} className='px-4 py-2'>
      <SkeletonCard />
    </div>
  );
}

type PostKeyHandler = (index: number, key: string) => void;

type MovePostFocusOptions = {
  readonly key: string;
  readonly index: number;
  readonly postCount: number;
  readonly scrollToIndex: (index: number) => void;
  readonly setPendingFocus: (focus: Maybe<number>) => void;
};

function movePostFocus(options: MovePostFocusOptions): void {
  const move = focusMoveForKey(options.key);
  if (isNothing(move)) {
    return;
  }
  const nextIndex = nextPostIndex({
    currentIndex: options.index,
    postCount: options.postCount,
    move: move.value
  });
  options.scrollToIndex(nextIndex);
  options.setPendingFocus(just(nextIndex));
}

function matchesPost(row: Element, index: number): boolean {
  const item = row.parentElement;
  if (!(item instanceof HTMLElement)) {
    return false;
  }
  return item.dataset.index === String(index);
}

function focusedPost(list: HTMLElement, index: number): Maybe<HTMLElement> {
  for (const row of list.querySelectorAll('[data-post-focus="true"]')) {
    if (row instanceof HTMLElement && matchesPost(row, index)) {
      return just(row);
    }
  }
  return nothing();
}

function usePendingPostFocus(
  list: HTMLDivElement,
  pendingFocus: Maybe<number>,
  setPendingFocus: (focus: Maybe<number>) => void,
  virtualItems: readonly VirtualItem[]
): void {
  useEffect(
    function focusPendingPost() {
      if (isNothing(pendingFocus)) {
        return;
      }
      const row = focusedPost(list, pendingFocus.value);
      if (isNothing(row)) {
        return;
      }
      row.value.focus({ focusVisible: true });
      setPendingFocus(nothing());
    },
    [list, pendingFocus, setPendingFocus, virtualItems]
  );
}

type PostRowProps = {
  readonly post: FeedPost;
  readonly index: number;
  readonly onPostKey: PostKeyHandler;
  readonly like: ReturnType<PostLikes['likeForPost']>;
  readonly onLike: () => void;
};

function PostRow(props: PostRowProps): JSX.Element {
  function onKeyDown(keyEvent: KeyPress<HTMLDivElement>): void {
    if (isNothing(focusMoveForKey(keyEvent.key))) {
      return;
    }
    keyEvent.preventDefault();
    props.onPostKey(props.index, keyEvent.key);
  }
  return (
    <div className='rounded-2xl px-4 py-2' data-post-focus='true' onKeyDown={onKeyDown} tabIndex={0}>
      <PostCard like={props.like} onLike={props.onLike} post={props.post} />
    </div>
  );
}

function RowContent(props: RowContentProps): JSX.Element {
  const post = of(props.posts[props.item.index]);
  if (isLoaderRow(props.item.index, props.posts.length) || isNothing(post)) {
    return <LoaderRow fetchNextPage={props.fetchNextPage} isFetchNextPageError={props.isFetchNextPageError} />;
  }
  return (
    <PostRow
      index={props.item.index}
      like={props.likes.likeForPost(post.value.id)}
      onLike={function toggleThisPost() {
        props.likes.togglePostLike(post.value.id);
      }}
      onPostKey={props.onPostKey}
      post={post.value}
    />
  );
}

function estimateRowHeight(posts: readonly FeedPost[], index: number): number {
  const post = posts[index];
  if (typeof post !== 'object' || post.image.length > 0) {
    return estimatedRowWithImage;
  }
  return estimatedRowWithoutImage;
}

function VirtualRows(props: VirtualRowsProps): JSX.Element {
  const posts = useMemo(function memoizedPosts() {
    return flattenFeedPosts(props.pages);
  }, [props.pages]);
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: virtualRowCount(posts.length, props.hasNextPage),
    estimateSize: function estimateRow(index) {
      return estimateRowHeight(posts, index);
    },
    getScrollElement: function scrollElement() {
      return props.element;
    },
    indexAttribute: 'data-index',
    overscan: rowOverscan
  });
  const virtualItems = virtualizer.getVirtualItems();
  const [pendingFocus, setPendingFocus] = useState<Maybe<number>>(nothing());
  useLoadNextPage(props, virtualItems, posts.length);
  useResetScroll(virtualizer, props.queryKey);
  usePendingPostFocus(props.element, pendingFocus, setPendingFocus, virtualItems);
  function onPostKey(index: number, key: string): void {
    movePostFocus({
      index,
      key,
      postCount: posts.length,
      scrollToIndex: function scrollToIndex(nextIndex) {
        virtualizer.scrollToIndex(nextIndex);
      },
      setPendingFocus
    });
  }
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
              likes={props.likes}
              onPostKey={onPostKey}
              posts={posts}
            />
          </div>
        );
      })}
    </div>
  );
}

function scrollBody(scrollElement: Maybe<HTMLDivElement>, props: FeedListProps, likes: PostLikes): JSX.Element {
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
      likes={likes}
      nextLikeStatus={props.nextLikeStatus}
      pages={props.pages}
      queryKey={props.queryKey}
      wallClock={props.wallClock}
    />
  );
}

export function FeedList(props: FeedListProps): JSX.Element {
  const likes = usePostLikes({
    nextLikeStatus: props.nextLikeStatus,
    wallClock: props.wallClock
  });
  const [scrollElement, setScrollElement] = useState<Maybe<HTMLDivElement>>(nothing());
  const rememberScrollElement = useCallback<RefCallback<HTMLDivElement>>(function rememberElement(element) {
    const next = of(element);
    if (isNothing(next)) {
      return;
    }
    setScrollElement(next);
  }, []);
  return (
    <React.Fragment>
      <div
        ref={rememberScrollElement}
        aria-label={feedListLabel}
        className='min-h-0 flex-1 overflow-x-hidden overflow-y-auto'
        role='list'
      >
        {scrollBody(scrollElement, props, likes)}
      </div>
      <LikeToast visible={likes.toastVisible} />
    </React.Fragment>
  );
}
