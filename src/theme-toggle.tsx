import React, { type JSX } from 'react';

export const feedThemes = ['light', 'dark'] as const;

export type FeedTheme = (typeof feedThemes)[number];

const darkModeLabel = 'Dark mode';
const lightModeLabel = 'Light mode';

type ThemeToggleProps = {
  readonly theme: FeedTheme;
  readonly onTheme: (theme: FeedTheme) => void;
};

function nextTheme(theme: FeedTheme): FeedTheme {
  if (theme === 'dark') {
    return 'light';
  }
  return 'dark';
}

function themeLabel(theme: FeedTheme): string {
  if (theme === 'dark') {
    return lightModeLabel;
  }
  return darkModeLabel;
}

export function ThemeToggle(props: ThemeToggleProps): JSX.Element {
  function toggleTheme(): void {
    props.onTheme(nextTheme(props.theme));
  }
  return (
    <button
      aria-pressed={props.theme === 'dark'}
      className='shrink-0 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100'
      onClick={toggleTheme}
      type='button'
    >
      {themeLabel(props.theme)}
    </button>
  );
}
