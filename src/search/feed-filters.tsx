import React, {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type JSX,
  type MouseEvent as DialogClick,
  type RefCallback,
  type SubmitEvent as FormSubmit
} from 'react';
import { isNothing, nothing, of, type Maybe } from 'true-myth/maybe';
import { feedStatuses } from '../post/feed-post';
import {
  activeFilterCount,
  clearedFilters,
  draftFilters,
  withDraftFilters,
  type FeedSearch,
  type FilterDraft
} from './feed-search';

const searchLabel = 'Search';
const filtersButtonLabel = 'Filters';
const filtersTitle = 'Filters';
const filtersTitleId = 'feed-filters-title';
const tagLabel = 'Tag';
const statusLabel = 'Status';
const fromLabel = 'From';
const toLabel = 'To';
const anyLabel = 'Any';
const applyLabel = 'Apply';
const resetLabel = 'Reset';
const fieldClassName =
  'rounded-lg border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100';
const labelClassName = 'grid gap-1 text-sm text-stone-600 dark:text-stone-400';
const quietButtonClassName =
  'shrink-0 rounded-lg border border-stone-300 bg-white text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100';

const feedFilterTags = ['books', 'cooking', 'craft', 'games', 'garden', 'music', 'photos', 'travel'] as const;

type FeedSearchFieldProps = {
  readonly value: string;
  readonly onText: (text: string) => void;
};

type FeedFiltersProps = {
  readonly search: FeedSearch;
  readonly onSearch: (search: FeedSearch) => void;
};

type FilterDialogProps = {
  readonly isOpen: boolean;
  readonly draft: FilterDraft;
  readonly onDraft: (draft: FilterDraft) => void;
  readonly onApply: () => void;
  readonly onReset: () => void;
  readonly onClose: () => void;
};

function choiceLabel(value: string): string {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

function filtersLabel(search: FeedSearch): string {
  const count = activeFilterCount(search);
  if (count === 0) {
    return filtersButtonLabel;
  }
  return `${filtersButtonLabel} (${String(count)})`;
}

function syncDialogElement(element: HTMLDialogElement, isOpen: boolean): void {
  if (isOpen && !element.open) {
    element.showModal();
    return;
  }
  if (!isOpen && element.open) {
    element.close();
  }
}

function useDialogElement(isOpen: boolean): RefCallback<HTMLDialogElement> {
  const [dialog, setDialog] = useState<Maybe<HTMLDialogElement>>(nothing());
  const rememberDialog = useCallback<RefCallback<HTMLDialogElement>>(function remember(element) {
    const next = of(element);
    if (isNothing(next)) {
      return;
    }
    setDialog(next);
  }, []);
  useEffect(
    function syncDialog() {
      if (isNothing(dialog)) {
        return;
      }
      syncDialogElement(dialog.value, isOpen);
    },
    [dialog, isOpen]
  );
  return rememberDialog;
}

function FilterDialog(props: FilterDialogProps): JSX.Element {
  const rememberDialog = useDialogElement(props.isOpen);
  function changeTag(change: ChangeEvent<HTMLSelectElement>): void {
    props.onDraft({ ...props.draft, tag: change.currentTarget.value });
  }
  function changeStatus(change: ChangeEvent<HTMLSelectElement>): void {
    props.onDraft({ ...props.draft, status: change.currentTarget.value });
  }
  function changeFrom(change: ChangeEvent<HTMLInputElement>): void {
    props.onDraft({ ...props.draft, from: change.currentTarget.value });
  }
  function changeTo(change: ChangeEvent<HTMLInputElement>): void {
    props.onDraft({ ...props.draft, to: change.currentTarget.value });
  }
  function applyFilters(submission: FormSubmit<HTMLFormElement>): void {
    submission.preventDefault();
    props.onApply();
  }
  function closeFromBackdrop(click: DialogClick<HTMLDialogElement>): void {
    if (click.target !== click.currentTarget) {
      return;
    }
    props.onClose();
  }
  return (
    <dialog
      ref={rememberDialog}
      aria-labelledby={filtersTitleId}
      className='m-auto w-[min(32rem,calc(100%-2rem))] rounded-2xl border border-stone-200 bg-white p-6 backdrop:bg-stone-950/60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100'
      onClick={closeFromBackdrop}
      onClose={props.onClose}
    >
      <form className='grid gap-3' onSubmit={applyFilters}>
        <h2 className='text-xl font-semibold' id={filtersTitleId}>
          {filtersTitle}
        </h2>
        <label className={labelClassName}>
          {tagLabel}
          <select className={fieldClassName} onChange={changeTag} value={props.draft.tag}>
            <option value=''>{anyLabel}</option>
            {feedFilterTags.map(function renderTag(tag) {
              return (
                <option key={tag} value={tag}>
                  {choiceLabel(tag)}
                </option>
              );
            })}
          </select>
        </label>
        <label className={labelClassName}>
          {statusLabel}
          <select className={fieldClassName} onChange={changeStatus} value={props.draft.status}>
            <option value=''>{anyLabel}</option>
            {feedStatuses.map(function renderStatus(feedStatus) {
              return (
                <option key={feedStatus} value={feedStatus}>
                  {choiceLabel(feedStatus)}
                </option>
              );
            })}
          </select>
        </label>
        <label className={labelClassName}>
          {fromLabel}
          <input className={fieldClassName} onChange={changeFrom} type='date' value={props.draft.from} />
        </label>
        <label className={labelClassName}>
          {toLabel}
          <input className={fieldClassName} onChange={changeTo} type='date' value={props.draft.to} />
        </label>
        <div className='mt-3 flex justify-end gap-3'>
          <button className={`${quietButtonClassName} px-4 py-2`} onClick={props.onReset} type='button'>
            {resetLabel}
          </button>
          <button
            className='rounded-lg bg-stone-900 px-4 py-2 text-white dark:bg-stone-100 dark:text-stone-900'
            type='submit'
          >
            {applyLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function FeedSearchField(props: FeedSearchFieldProps): JSX.Element {
  function changeText(change: ChangeEvent<HTMLInputElement>): void {
    props.onText(change.currentTarget.value);
  }
  return (
    <input
      aria-label={searchLabel}
      className={`${fieldClassName} w-full min-w-0 max-w-xs`}
      onChange={changeText}
      placeholder={searchLabel}
      type='search'
      value={props.value}
    />
  );
}

export function FeedFilters(props: FeedFiltersProps): JSX.Element {
  const [isOpen, setOpen] = useState(false);
  const [draft, setDraft] = useState(function initialDraft() {
    return draftFilters(props.search);
  });
  function openDialog(): void {
    setDraft(draftFilters(props.search));
    setOpen(true);
  }
  function applyDialog(): void {
    props.onSearch(withDraftFilters(props.search, draft));
    setOpen(false);
  }
  function resetDialog(): void {
    props.onSearch(clearedFilters(props.search));
    setOpen(false);
  }
  function closeDialog(): void {
    setOpen(false);
  }
  return (
    <React.Fragment>
      <button className={`${quietButtonClassName} px-3 py-2`} onClick={openDialog} type='button'>
        {filtersLabel(props.search)}
      </button>
      <FilterDialog
        draft={draft}
        onApply={applyDialog}
        onClose={closeDialog}
        onDraft={setDraft}
        onReset={resetDialog}
        isOpen={isOpen}
      />
    </React.Fragment>
  );
}
