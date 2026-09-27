import React, { type JSX } from 'react';
import type { LoadFeedPage } from './create-load-feed-page';
import { FeedList } from './feed-list';
import { emptyFeedSearch } from './feed-search';
import { feedQueryKey, useFeedPages } from './use-feed-pages';

export const feedTitle = 'Social feed';

const postsLoadingLabel = 'Loading posts';
const postsFailedLabel = 'Could not load posts';

type AppProps = {
  readonly loadFeedPage: LoadFeedPage;
};

type FeedLoadProps = {
  readonly query: ReturnType<typeof useFeedPages>;
};

function FeedLoad(props: FeedLoadProps): JSX.Element {
  if (props.query.status === 'pending') {
    return <p className='px-6 pb-8'>{postsLoadingLabel}</p>;
  }
  if (props.query.status === 'error') {
    return <p className='px-6 pb-8'>{postsFailedLabel}</p>;
  }
  return (
    <FeedList
      fetchNextPage={props.query.fetchNextPage}
      hasNextPage={props.query.hasNextPage}
      isFetchNextPageError={props.query.isFetchNextPageError}
      isFetchingNextPage={props.query.isFetchingNextPage}
      pages={props.query.data.pages}
      queryKey={feedQueryKey(emptyFeedSearch).join(' ')}
    />
  );
}

export function App(props: AppProps): JSX.Element {
  const query = useFeedPages(props.loadFeedPage, emptyFeedSearch);
  return (
    <main className='bg-stone-100 font-sans text-stone-900'>
      <h1 className='px-6 py-8 text-3xl font-semibold'>{feedTitle}</h1>
      <FeedLoad query={query} />
    </main>
  );
}
