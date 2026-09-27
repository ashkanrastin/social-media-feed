import React, { type JSX } from 'react';

export const feedTitle = 'Social feed';

export function App(): JSX.Element {
  return (
    <main className='bg-stone-100 font-sans text-stone-900'>
      <h1 className='px-6 py-8 text-3xl font-semibold'>{feedTitle}</h1>
    </main>
  );
}
