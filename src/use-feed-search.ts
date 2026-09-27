import type { WallClock } from '@enormora/wall-clock/wall-clock';
import { useCallback, useEffect, useState } from 'react';
import { readFeedSearch, toFeedSearchParams, withSearchText, type FeedSearch } from './feed-search';

const searchDelayInMilliseconds = 300;

export type FeedSearchControls = {
  readonly search: FeedSearch;
  readonly draftText: string;
  readonly setDraftText: (text: string) => void;
  readonly replaceSearch: (search: FeedSearch) => void;
};

type UseFeedSearchOptions = {
  readonly readSearchParams: () => URLSearchParams;
  readonly writeSearchParams: (params: URLSearchParams) => void;
  readonly wallClock: WallClock;
};

function useDebouncedText(value: string, wallClock: WallClock, commit: (text: string) => void): void {
  useEffect(
    function publishText() {
      const timeoutIdentifier = wallClock.setTimeout(function publish() {
        commit(value);
      }, searchDelayInMilliseconds);
      return function cancelPendingText() {
        wallClock.clearTimeout(timeoutIdentifier);
      };
    },
    [value, wallClock, commit]
  );
}

export function useFeedSearch(options: UseFeedSearchOptions): FeedSearchControls {
  const { readSearchParams, writeSearchParams, wallClock } = options;
  const [search, setSearch] = useState(function initialSearch() {
    return readFeedSearch(readSearchParams());
  });
  const replaceSearch = useCallback(
    function replace(next: FeedSearch) {
      writeSearchParams(toFeedSearchParams(next));
      setSearch(next);
    },
    [writeSearchParams]
  );
  const [draftText, setDraftText] = useState(function initialDraft() {
    return search.text.unwrapOr('');
  });
  const commitText = useCallback(
    function commit(text: string) {
      const next = withSearchText(search, text);
      if (toFeedSearchParams(next).toString() === toFeedSearchParams(search).toString()) {
        return;
      }
      replaceSearch(next);
    },
    [search, replaceSearch]
  );
  useDebouncedText(draftText, wallClock, commitText);
  return { search, draftText, setDraftText, replaceSearch };
}
