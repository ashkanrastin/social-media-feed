import React, { type JSX } from 'react';

export const feedTitle = 'Social feed';

export function App(): JSX.Element {
  return (
    <main>
      <h1>{feedTitle}</h1>
    </main>
  );
}
