import { type JSX } from 'react';

export const feedThemes = ['light', 'dark'] as const;

export type FeedTheme = (typeof feedThemes)[number];

export function initialTheme(systemPrefersDark: boolean): FeedTheme {
  if (systemPrefersDark) {
    return 'dark';
  }
  return 'light';
}

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

const floatingButtonClassName = 'fixed right-4 bottom-4 z-20 flex size-14 items-center justify-center rounded-full border border-stone-300 bg-white shadow-lg dark:border-stone-600 dark:bg-stone-900';

function themeLabel(theme: FeedTheme): string {
  if (theme === 'dark') {
    return lightModeLabel;
  }
  return darkModeLabel;
}

function lampClassName(theme: FeedTheme): string {
  if (theme === 'dark') {
    return 'text-stone-500 dark:text-stone-400';
  }
  return 'text-amber-500';
}

function LampOnIcon(): JSX.Element {
  return (
    <svg aria-hidden='true' className='size-7' fill='none' viewBox='0 0 24 24'>
      <path
        d='M12 2.25v1.5M5.1 5.1l1.06 1.06M18.9 5.1l-1.06 1.06M3 12h1.5M19.5 12H21'
        stroke='currentColor'
        strokeLinecap='round'
        strokeWidth='1.75'
      />
      <path
        d='M8.25 14.15a4.5 4.5 0 1 1 7.5 0c-.55.62-.9 1.22-.9 2V17.25h-5.7v-1.1c0-.78-.35-1.38-.9-2Z'
        fill='currentColor'
      />
      <path d='M9.5 19.1h5M10.25 21h3.5' stroke='currentColor' strokeLinecap='round' strokeWidth='1.75' />
    </svg>
  );
}

function LampOffIcon(): JSX.Element {
  return (
    <svg aria-hidden='true' className='size-7' fill='none' viewBox='0 0 24 24'>
      <path
        d='M8.25 14.15a4.5 4.5 0 1 1 7.5 0c-.55.62-.9 1.22-.9 2V17.25h-5.7v-1.1c0-.78-.35-1.38-.9-2Z'
        stroke='currentColor'
        strokeLinejoin='round'
        strokeWidth='1.75'
      />
      <path d='M9.5 19.1h5M10.25 21h3.5' stroke='currentColor' strokeLinecap='round' strokeWidth='1.75' />
    </svg>
  );
}

function ThemeLamp(props: { readonly theme: FeedTheme }): JSX.Element {
  if (props.theme === 'dark') {
    return <LampOffIcon />;
  }
  return <LampOnIcon />;
}

export function ThemeToggle(props: ThemeToggleProps): JSX.Element {
  function toggleTheme(): void {
    props.onTheme(nextTheme(props.theme));
  }
  return (
    <button
      aria-label={themeLabel(props.theme)}
      aria-pressed={props.theme === 'dark'}
      className={floatingButtonClassName}
      onClick={toggleTheme}
      type='button'
    >
      <span className={lampClassName(props.theme)}>
        <ThemeLamp theme={props.theme} />
      </span>
    </button>
  );
}
