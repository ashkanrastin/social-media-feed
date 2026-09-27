import assert from 'node:assert';
import { createDeterministicWallClock } from '@enormora/wall-clock/deterministic-wall-clock';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import React, { type JSX, type ReactNode } from 'react';
import { nothing } from 'true-myth/maybe';
import { ok } from 'true-myth/result';
import { describe, it } from 'vitest';
import { App, feedTitle } from './app';
import { feedListLabel } from './feed-list';

const wallClock = createDeterministicWallClock({
  initialCurrentTimestampInMilliseconds: 0
});

type WrapperProps = {
  readonly children: ReactNode;
};

function readSearchParams(): URLSearchParams {
  return new URLSearchParams();
}

const writtenQueries: string[] = [];

function writeSearchParams(params: URLSearchParams): void {
  writtenQueries.push(params.toString());
}

function renderApp(): ReturnType<typeof render> {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  function Wrapper(props: WrapperProps): JSX.Element {
    return <QueryClientProvider client={client}>{props.children}</QueryClientProvider>;
  }
  return render(
    <App
      loadFeedPage={async function loadFeedPage() {
        return ok({ posts: [], nextCursor: nothing() });
      }}
      readSearchParams={readSearchParams}
      wallClock={wallClock}
      writeSearchParams={writeSearchParams}
    />,
    { wrapper: Wrapper }
  );
}

describe('app', function () {
  it('shows the feed title', async function () {
    const view = renderApp();
    const heading = await view.findByRole('heading', { name: feedTitle });

    assert.strictEqual(heading.tagName, 'H1');
    await view.findByRole('list', { name: feedListLabel });
    assert.deepStrictEqual(writtenQueries, []);
  });
});
