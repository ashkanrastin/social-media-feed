import type { WallClock } from '@enormora/wall-clock/wall-clock';
import React, { useState, type JSX } from 'react';
import { feedDelayInMilliseconds, type LoadFeedPage } from './feed/create-load-feed-page';
import { FeedList, FeedSkeleton, type NextLikeStatus } from './feed/feed-list';
import { feedQueryKey, useFeedPages } from './feed/use-feed-pages';
import type { FeedPage } from './feed/read-post-page';
import { FeedFilters, FeedSearchField } from './search/feed-filters';
import type { FeedSearch } from './search/feed-search';
import { useFeedSearch } from './search/use-feed-search';
import { ThemeToggle, type FeedTheme, initialTheme } from './theme/theme-toggle';

export const feedTitle = 'Social feed';

const postsFailedLabel = 'Could not load posts';
const emptyFeedLabel = 'No posts match.';

type AppProps = {
  readonly loadFeedPage: LoadFeedPage;
  readonly wallClock: WallClock;
  readonly readSearchParams: () => URLSearchParams;
  readonly writeSearchParams: (params: URLSearchParams) => void;
  readonly nextLikeStatus: NextLikeStatus;
  readonly systemPrefersDark: boolean;
};

type FeedLoadProps = {
  readonly query: ReturnType<typeof useFeedPages>;
  readonly search: FeedSearch;
  readonly delayInMilliseconds: number;
  readonly wallClock: WallClock;
  readonly nextLikeStatus: NextLikeStatus;
};

type EmptyMatchProps = {
  readonly pages: readonly FeedPage[];
};

function isEmptyFeed(pages: readonly FeedPage[]): boolean {
  const page = pages.at(0);
  if (typeof page !== 'object') {
    return false;
  }
  return page.posts.length === 0;
}

function mainClassName(theme: FeedTheme): string {
  const colors =
    'flex h-dvh flex-col bg-stone-100 font-sans text-stone-900 dark:bg-stone-950 dark:text-stone-100 dark:[color-scheme:dark]';
  if (theme === 'dark') {
    return `${colors} dark`;
  }
  return colors;
}

function EmptyMatch(props: EmptyMatchProps): JSX.Element {
  if (!isEmptyFeed(props.pages)) {
    return <div />;
  }
  return <p className='px-6 pb-2'>{emptyFeedLabel}</p>;
}

function FeedLoad(props: FeedLoadProps): JSX.Element {
  if (props.query.status === 'pending') {
    return <FeedSkeleton />;
  }
  if (props.query.status === 'error') {
    return <p className='px-6 pb-8'>{postsFailedLabel}</p>;
  }
  return (
    <React.Fragment>
      <EmptyMatch pages={props.query.data.pages} />
      <FeedList
        fetchNextPage={props.query.fetchNextPage}
        hasNextPage={props.query.hasNextPage}
        isFetchNextPageError={props.query.isFetchNextPageError}
        isFetchingNextPage={props.query.isFetchingNextPage}
        pages={props.query.data.pages}
        nextLikeStatus={props.nextLikeStatus}
        queryKey={feedQueryKey(props.search, props.delayInMilliseconds).join(' ')}
        wallClock={props.wallClock}
      />
    </React.Fragment>
  );
}

export function App(props: AppProps): JSX.Element {
  const controls = useFeedSearch({
    readSearchParams: props.readSearchParams,
    writeSearchParams: props.writeSearchParams,
    wallClock: props.wallClock
  });
  const [theme, setTheme] = useState<FeedTheme>(function resolveInitialTheme() {
    return initialTheme(props.systemPrefersDark);
  });
  const query = useFeedPages(props.loadFeedPage, controls.search, feedDelayInMilliseconds(controls.search.slow));
  return (
    <main className={mainClassName(theme)}>
      <header className='flex items-center gap-3 px-4 pt-6 pb-4 sm:px-6'>
        <h1 className='shrink-0 text-2xl font-semibold sm:text-3xl'>{feedTitle}</h1>
        <div className='ml-auto flex min-w-0 flex-1 items-center justify-end gap-3'>
          <FeedSearchField onText={controls.setDraftText} value={controls.draftText} />
          <FeedFilters onSearch={controls.replaceSearch} search={controls.search} />
        </div>
      </header>
      <div className='flex min-h-0 flex-1 flex-col'>
        <FeedLoad
          delayInMilliseconds={feedDelayInMilliseconds(controls.search.slow)}
          nextLikeStatus={props.nextLikeStatus}
          query={query}
          search={controls.search}
          wallClock={props.wallClock}
        />
      </div>
      <ThemeToggle onTheme={setTheme} theme={theme} />
    </main>
  );
}
