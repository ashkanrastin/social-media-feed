import assert from 'node:assert';
import { isJust, isNothing } from 'true-myth/maybe';
import { describe, it } from 'vitest';
import { focusMoveForKey, nextPostIndex } from './post-focus';

describe('post keyboard focus', function () {
  it('maps arrow and home keys to a move', function () {
    const down = focusMoveForKey('ArrowDown');
    const up = focusMoveForKey('ArrowUp');
    const home = focusMoveForKey('Home');
    const end = focusMoveForKey('End');
    const other = focusMoveForKey('a');

    assert.strictEqual(isJust(down) && down.value === 'next', true);
    assert.strictEqual(isJust(up) && up.value === 'previous', true);
    assert.strictEqual(isJust(home) && home.value === 'first', true);
    assert.strictEqual(isJust(end) && end.value === 'last', true);
    assert.strictEqual(isNothing(other), true);
  });

  it('stays inside the loaded posts', function () {
    assert.strictEqual(nextPostIndex({ currentIndex: 0, postCount: 3, move: 'previous' }), 0);
    assert.strictEqual(nextPostIndex({ currentIndex: 2, postCount: 3, move: 'next' }), 2);
    assert.strictEqual(nextPostIndex({ currentIndex: 1, postCount: 3, move: 'first' }), 0);
    assert.strictEqual(nextPostIndex({ currentIndex: 1, postCount: 3, move: 'last' }), 2);
    assert.strictEqual(nextPostIndex({ currentIndex: 4, postCount: 0, move: 'next' }), 4);
  });
});
