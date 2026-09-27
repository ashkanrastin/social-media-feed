import assert from 'node:assert';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import React, { type JSX, type ReactNode } from 'react';
import { nothing } from 'true-myth/maybe';
import { ok } from 'true-myth/result';
import { describe, it } from 'vitest';
import { App, feedTitle } from './app';
import { feedListLabel } from './feed-list';
import type { LoadFeedPage } from './create-load-feed-page';

const loadFeedPage: LoadFeedPage = async function loadFeedPage() {
  return ok({ posts: [], nextCursor: nothing() });
};

type WrapperProps = {
  readonly children: ReactNode;
};

function renderApp(): ReturnType<typeof render> {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  function Wrapper(props: WrapperProps): JSX.Element {
    return <QueryClientProvider client={client}>{props.children}</QueryClientProvider>;
  }
  return render(<App loadFeedPage={loadFeedPage} />, { wrapper: Wrapper });
}

describe('app', function () {
  it('shows the feed title', async function () {
    const view = renderApp();
    const heading = await view.findByRole('heading', { name: feedTitle });

    assert.strictEqual(heading.tagName, 'H1');
    await view.findByRole('list', { name: feedListLabel });
  });
});
