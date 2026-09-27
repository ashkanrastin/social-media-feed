import assert from 'node:assert';
import { nothing } from 'true-myth/maybe';
import { describe, it } from 'vitest';
import { readFeedSearch, toFeedSearchParams, type FeedSearch } from './feed-search';

const emptySearch: FeedSearch = {
  text: nothing(),
  tag: nothing(),
  status: nothing(),
  from: nothing(),
  to: nothing()
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
});
