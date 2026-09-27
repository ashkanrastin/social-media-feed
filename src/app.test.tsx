import assert from 'node:assert';
import { createDeterministicWallClock } from '@enormora/wall-clock/deterministic-wall-clock';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render } from '@testing-library/react';
import React, { type JSX, type ReactNode } from 'react';
import { nothing } from 'true-myth/maybe';
import { ok } from 'true-myth/result';
import { describe, it } from 'vitest';
import { App, feedTitle } from './app';
import { feedListLabel } from './feed/feed-list';

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

function succeedLike(): 200 {
  return 200;
}

function renderApp(waitForPosts = false): ReturnType<typeof render> {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  function Wrapper(props: WrapperProps): JSX.Element {
    return <QueryClientProvider client={client}>{props.children}</QueryClientProvider>;
  }
  return render(
    <App
      loadFeedPage={async function loadFeedPage() {
        if (waitForPosts) {
          const gate = { open: true };
          await new Promise(function keepPending() {
            if (gate.open) {
              gate.open = false;
            }
          });
        }
        return ok({ posts: [], nextCursor: nothing() });
      }}
      readSearchParams={readSearchParams}
      nextLikeStatus={succeedLike}
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

  it('switches the page to dark mode', function () {
    cleanup();
    const view = renderApp();
    const button = view.getByRole('button', { name: 'Dark mode' });

    fireEvent.click(button);

    assert.strictEqual(view.container.querySelector('main.dark') instanceof HTMLElement, true);
    assert.strictEqual(view.getByRole('button', { name: 'Light mode' }).getAttribute('aria-pressed'), 'true');
  });

  it('shows skeleton cards while posts are loading', async function () {
    cleanup();
    const view = renderApp(true);
    const loading = await view.findByLabelText('Loading posts');

    assert.strictEqual(loading.querySelector('.animate-pulse') instanceof HTMLElement, true);
  });

  it('marks slow loading as pressed', function () {
    cleanup();
    const view = renderApp();

    fireEvent.click(view.getByRole('button', { name: 'Slow loading' }));

    assert.strictEqual(view.getByRole('button', { name: 'Normal loading' }).getAttribute('aria-pressed'), 'true');
  });
});
