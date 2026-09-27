import assert from 'node:assert';
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import { App, feedTitle } from './app';

describe('app', function () {
  it('shows the feed title', function () {
    const view = render(<App />);
    const heading = view.getByRole('heading', { name: feedTitle });

    assert.strictEqual(heading.tagName, 'H1');
  });
});
