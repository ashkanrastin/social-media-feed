import { createWallClock } from '@enormora/wall-clock/wall-clock';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { isNothing, of } from 'true-myth/maybe';
import { App } from './app';
import { createLoadFeedPage } from './feed/create-load-feed-page';
import { likeAcceptedStatus, likeRejectedStatus, type LikeStatus } from './post/post-like';

const queryClient = new QueryClient();
const loadFeedPage = createLoadFeedPage({ fetch: fetch.bind(globalThis) });
const wallClock = createWallClock();

function readSearchParams(): URLSearchParams {
  return new URLSearchParams(location.search);
}

function writeSearchParams(params: URLSearchParams): void {
  const query = params.toString();
  const path = query.length === 0 ? location.pathname : `${location.pathname}?${query}`;
  history.replaceState({}, '', path);
}

const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

const likeFailureCutoff = 128;

function nextLikeStatus(): LikeStatus {
  const sample = new Uint8Array(1);
  crypto.getRandomValues(sample);
  const roll = sample.at(0);
  if (typeof roll === 'number' && roll < likeFailureCutoff) {
    return likeRejectedStatus;
  }
  return likeAcceptedStatus;
}

function renderApp(element: Element): void {
  createRoot(element).render(
    <QueryClientProvider client={queryClient}>
      <App
        loadFeedPage={loadFeedPage}
        nextLikeStatus={nextLikeStatus}
        readSearchParams={readSearchParams}
        systemPrefersDark={systemPrefersDark}
        wallClock={wallClock}
        writeSearchParams={writeSearchParams}
      />
    </QueryClientProvider>
  );
}

export function mountApp(): void {
  const rootElement = of(document.querySelector('#root'));

  if (isNothing(rootElement)) {
    return;
  }

  renderApp(rootElement.value);
}

mountApp();
