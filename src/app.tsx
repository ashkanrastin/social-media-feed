import React, { type JSX } from 'react';
import type { LoadFeedPage } from './create-load-feed-page';
import { emptyFeedSearch } from './feed-search';
import type { FeedPage } from './read-post-page';
import { useFeedPages } from './use-feed-pages';

export const feedTitle = 'Social feed';

const postsLoadingLabel = 'Loading posts';
const postsFailedLabel = 'Could not load posts';

type AppProps = {
  readonly loadFeedPage: LoadFeedPage;
};

type FeedLoadProps = {
  readonly query: ReturnType<typeof useFeedPages>;
};

function countPosts(pages: readonly FeedPage[]): number {
  return pages.reduce(function add(total, page) {
    return total + page.posts.length;
  }, 0);
}

function readyLabel(count: number): string {
  return `${String(count)} posts loaded`;
}

function FeedLoad(props: FeedLoadProps): JSX.Element {
  if (props.query.status === 'pending') {
    return <p className='px-6 pb-8'>{postsLoadingLabel}</p>;
  }
  if (props.query.status === 'error') {
    return <p className='px-6 pb-8'>{postsFailedLabel}</p>;
  }
  return <p className='px-6 pb-8'>{readyLabel(countPosts(props.query.data.pages))}</p>;
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
