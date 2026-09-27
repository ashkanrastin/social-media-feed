import assert from 'node:assert';
import { just, nothing } from 'true-myth/maybe';
import { describe, it } from 'vitest';
import {
  flattenFeedPosts,
  isLoaderRow,
  lastVirtualIndex,
  shouldLoadNextPage,
  virtualRowCount
} from './feed-list-state';

const endOfFirstPage = {
  lastVirtualIndex: just(49),
  loadedCount: 50,
  hasNextPage: true,
  isFetchingNextPage: false,
  isFetchNextPageError: false
};

describe('next page', function () {
  it('loads when the last visible row reaches the loaded posts', function () {
    assert.strictEqual(shouldLoadNextPage(endOfFirstPage), true);
    assert.strictEqual(shouldLoadNextPage({ ...endOfFirstPage, lastVirtualIndex: just(50) }), true);
  });

  it('waits while the next page is already loading or the list is not at the end', function () {
    assert.strictEqual(shouldLoadNextPage({ ...endOfFirstPage, isFetchingNextPage: true }), false);
    assert.strictEqual(shouldLoadNextPage({ ...endOfFirstPage, lastVirtualIndex: just(48) }), false);
    assert.strictEqual(shouldLoadNextPage({ ...endOfFirstPage, lastVirtualIndex: nothing() }), false);
  });

  it('stops after the last page and after a failed page', function () {
    assert.strictEqual(shouldLoadNextPage({ ...endOfFirstPage, hasNextPage: false }), false);
    assert.strictEqual(shouldLoadNextPage({ ...endOfFirstPage, isFetchNextPageError: true }), false);
  });
});

describe('virtual rows', function () {
  it('adds one loader row while another page exists', function () {
    assert.strictEqual(virtualRowCount(50, true), 51);
    assert.strictEqual(virtualRowCount(50, false), 50);
    assert.strictEqual(isLoaderRow(50, 50), true);
    assert.strictEqual(isLoaderRow(49, 50), false);
  });

  it('reads the last virtual index and flattens pages', function () {
    assert.strictEqual(lastVirtualIndex([{ index: 3 }, { index: 4 }]).unwrapOr(-1), 4);
    assert.strictEqual(lastVirtualIndex([]).isNothing, true);
    assert.deepStrictEqual(
      flattenFeedPosts([{ posts: [{ id: '1' }] }, { posts: [{ id: '2' }] }]).map(function idOf(post) {
        return post.id;
      }),
      ['1', '2']
    );
  });
});
