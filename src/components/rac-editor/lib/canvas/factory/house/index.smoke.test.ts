import {describe, expect, it} from 'vitest';
import {getHouseViewStrategy} from './index.ts';

describe('index.ts', () => {
  it('returns strategy with create function for view types', () => {
    const strategy = getHouseViewStrategy('top');
    expect(strategy).toBeDefined();
    expect(typeof strategy.create).toBe('function');
  });
});

