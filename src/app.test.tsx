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

const writtenQueries: string[] = [];

function writeSearchParams(params: URLSearchParams): void {
  writtenQueries.push(params.toString());
}

function isChecked(element: Element): boolean {
  if (!(element instanceof HTMLInputElement)) {
    return false;
  }
  return element.checked;
}

function succeedLike(): 200 {
  return 200;
}

type RenderAppOptions = {
  readonly waitForPosts?: boolean;
  readonly initialQuery?: string;
  readonly systemPrefersDark?: boolean;
};

function renderApp(options: RenderAppOptions = {}): ReturnType<typeof render> {
  const { waitForPosts = false, initialQuery = '', systemPrefersDark = false } = options;
  function readSearchParams(): URLSearchParams {
    return new URLSearchParams(initialQuery);
  }
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
      systemPrefersDark={systemPrefersDark}
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

  it('starts in dark mode when the system prefers dark', function () {
    cleanup();
    const view = renderApp({ systemPrefersDark: true });

    assert.strictEqual(view.container.querySelector('main.dark') instanceof HTMLElement, true);
    assert.strictEqual(view.getByRole('button', { name: 'Light mode' }).getAttribute('aria-pressed'), 'true');
  });

  it('starts in light mode when the system prefers light', function () {
    cleanup();
    const view = renderApp({ systemPrefersDark: false });

    assert.strictEqual(view.container.querySelector('main.dark'), null);
    assert.strictEqual(view.getByRole('button', { name: 'Dark mode' }).getAttribute('aria-pressed'), 'false');
  });

  it('shows skeleton cards while posts are loading', async function () {
    cleanup();
    const view = renderApp({ waitForPosts: true });
    const loading = await view.findByLabelText('Loading posts');

    assert.strictEqual(loading.querySelector('.animate-pulse') instanceof HTMLElement, true);
  });

  it('stores slow loading on the address', function () {
    cleanup();
    const view = renderApp();

    fireEvent.click(view.getByRole('checkbox', { hidden: true, name: 'Slow loading' }));
    fireEvent.click(view.getByRole('button', { hidden: true, name: 'Apply' }));

    assert.strictEqual(writtenQueries.at(-1), 'slow=1');
    assert.strictEqual(view.getByRole('button', { name: 'Filters (1)' }).tagName, 'BUTTON');
  });

  it('restores slow loading after a refresh', function () {
    cleanup();
    const view = renderApp({ initialQuery: 'slow=1' });

    assert.strictEqual(view.getByRole('button', { name: 'Filters (1)' }).tagName, 'BUTTON');
    assert.strictEqual(isChecked(view.getByRole('checkbox', { hidden: true, name: 'Slow loading' })), true);
  });
});
