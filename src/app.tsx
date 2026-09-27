import type { WallClock } from '@enormora/wall-clock/wall-clock';
import React, { type JSX } from 'react';
import type { LoadFeedPage } from './create-load-feed-page';
import { FeedFilters, FeedSearchField } from './feed-filters';
import { FeedList } from './feed-list';
import type { FeedSearch } from './feed-search';
import { feedQueryKey, useFeedPages } from './use-feed-pages';
import { useFeedSearch } from './use-feed-search';
import type { FeedPage } from './read-post-page';

export const feedTitle = 'Social feed';

const postsLoadingLabel = 'Loading posts';
const postsFailedLabel = 'Could not load posts';
const emptyFeedLabel = 'No posts match.';

type AppProps = {
  readonly loadFeedPage: LoadFeedPage;
  readonly wallClock: WallClock;
  readonly readSearchParams: () => URLSearchParams;
  readonly writeSearchParams: (params: URLSearchParams) => void;
};

type FeedLoadProps = {
  readonly query: ReturnType<typeof useFeedPages>;
  readonly search: FeedSearch;
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

function EmptyMatch(props: EmptyMatchProps): JSX.Element {
  if (!isEmptyFeed(props.pages)) {
    return <div />;
  }
  return <p className='px-6 pb-2'>{emptyFeedLabel}</p>;
}

function FeedLoad(props: FeedLoadProps): JSX.Element {
  if (props.query.status === 'pending') {
    return <p className='px-6 pb-8'>{postsLoadingLabel}</p>;
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
        queryKey={feedQueryKey(props.search).join(' ')}
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
  const query = useFeedPages(props.loadFeedPage, controls.search);
  return (
    <main className='flex h-dvh flex-col bg-stone-100 font-sans text-stone-900'>
      <header className='flex items-center gap-3 px-4 pt-6 pb-4 sm:px-6'>
        <h1 className='shrink-0 text-2xl font-semibold sm:text-3xl'>{feedTitle}</h1>
        <div className='ml-auto flex min-w-0 items-center gap-3'>
          <FeedSearchField onText={controls.setDraftText} value={controls.draftText} />
          <FeedFilters onSearch={controls.replaceSearch} search={controls.search} />
        </div>
      </header>
      <div className='flex min-h-0 flex-1 flex-col'>
        <FeedLoad query={query} search={controls.search} />
      </div>
    </main>
  );
}
