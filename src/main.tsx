import React from 'react';
import { createRoot } from 'react-dom/client';
import { isNothing, of } from 'true-myth/maybe';
import { App } from './app';

function renderApp(element: Element): void {
  createRoot(element).render(<App />);
}

export function mountApp(): void {
  const rootElement = of(document.querySelector('#root'));

  if (isNothing(rootElement)) {
    return;
  }

  renderApp(rootElement.value);
}

mountApp();
