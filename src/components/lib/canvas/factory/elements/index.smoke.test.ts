import {describe, expect, it} from 'vitest';
import {getElementStrategy} from './index.ts';

describe('element strategy registry', () => {
  it('returns a strategy for a known key', () => {
    const strategy = getElementStrategy('line');
    expect(strategy).toBeDefined();
    expect(typeof strategy.create).toBe('function');
  });
});
