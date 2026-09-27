import assert from 'node:assert';
import { describe, it } from 'vitest';
import { commentCountLabel, publishedOnLabel } from './post-card-text';

describe('post card text', function () {
  it('formats the published day in UTC', function () {
    assert.strictEqual(publishedOnLabel('2026-09-27T18:00:00.000Z'), '27 Sep 2026');
  });

  it('labels a single comment differently from several', function () {
    assert.strictEqual(commentCountLabel(1), '1 comment');
    assert.strictEqual(commentCountLabel(0), '0 comments');
    assert.strictEqual(commentCountLabel(12), '12 comments');
  });
});
