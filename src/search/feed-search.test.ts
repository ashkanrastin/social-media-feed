import assert from 'node:assert';
import { nothing } from 'true-myth/maybe';
import { describe, it } from 'vitest';
import {
  activeFilterCount,
  clearedFilters,
  readFeedSearch,
  toFeedSearchParams,
  withDraftFilters,
  withSearchFrom,
  withSearchStatus,
  withSearchText,
  withSearchTo,
  type FeedSearch
} from './feed-search';

const emptySearch: FeedSearch = {
  text: nothing(),
  tag: nothing(),
  status: nothing(),
  from: nothing(),
  to: nothing(),
  slow: false
};

type SearchFields = {
  readonly text: string;
  readonly tag: string;
  readonly status: string;
  readonly from: string;
  readonly to: string;
};

function fieldsOf(search: FeedSearch): SearchFields {
  return {
    text: search.text.unwrapOr(''),
    tag: search.tag.unwrapOr(''),
    status: search.status.unwrapOr(''),
    from: search.from.unwrapOr(''),
    to: search.to.unwrapOr('')
  };
}

describe('feed search', function () {
  it('reads and writes the shareable params', function () {
    const search = readFeedSearch(
      new URLSearchParams('q=hello&tag=technology&status=open&from=2026-09-01&to=2026-09-02')
    );

    assert.partialDeepStrictEqual(fieldsOf(search), {
      text: 'hello',
      tag: 'technology',
      status: 'open',
      from: '2026-09-01',
      to: '2026-09-02'
    });
    assert.strictEqual(
      toFeedSearchParams(search).toString(),
      'q=hello&tag=technology&status=open&from=2026-09-01&to=2026-09-02'
    );
  });

  it('omits blank, unknown, and undated values', function () {
    const search = readFeedSearch(new URLSearchParams('q=%20&tag=&status=nope&from=yesterday&to='));

    assert.deepStrictEqual(fieldsOf(search), fieldsOf(emptySearch));
    assert.strictEqual(toFeedSearchParams(search).toString(), '');
  });

  it('trims search text and drops an unknown status', function () {
    const withText = withSearchText(emptySearch, '  ada  ');
    const withStatus = withSearchStatus(withText, 'nope');

    assert.deepStrictEqual(fieldsOf(withStatus), {
      text: 'ada',
      tag: '',
      status: '',
      from: '',
      to: ''
    });
  });

  it('keeps a date and drops a value that is not a date', function () {
    const dated = withSearchTo(withSearchFrom(emptySearch, '2026-09-01'), 'yesterday');

    assert.deepStrictEqual(fieldsOf(dated), {
      text: '',
      tag: '',
      status: '',
      from: '2026-09-01',
      to: ''
    });
  });

  it('applies draft filters and keeps the search text', function () {
    const search = withSearchText(emptySearch, 'ada');
    const next = withDraftFilters(search, { tag: 'garden', status: 'open', from: '2026-09-01', to: '', slow: false });

    assert.strictEqual(activeFilterCount(next), 3);
    assert.strictEqual(next.slow, false);
    assert.deepStrictEqual(fieldsOf(clearedFilters(next)), {
      text: 'ada',
      tag: '',
      status: '',
      from: '',
      to: ''
    });
  });

  it('keeps slow loading on the address and clears it with the other filters', function () {
    const search = readFeedSearch(new URLSearchParams('slow=1&q=ada'));

    assert.strictEqual(search.slow, true);
    assert.strictEqual(toFeedSearchParams(search).toString(), 'q=ada&slow=1');
    assert.strictEqual(activeFilterCount(search), 1);
    assert.strictEqual(clearedFilters(search).slow, false);
    assert.strictEqual(readFeedSearch(new URLSearchParams('slow=no')).slow, false);
  });
});
