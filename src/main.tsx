import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { isNothing, of } from 'true-myth/maybe';
import { App } from './app';
import { createLoadFeedPage } from './create-load-feed-page';

const queryClient = new QueryClient();
const loadFeedPage = createLoadFeedPage({ fetch: fetch.bind(globalThis) });

function renderApp(element: Element): void {
  createRoot(element).render(
    <QueryClientProvider client={queryClient}>
      <App loadFeedPage={loadFeedPage} />
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
