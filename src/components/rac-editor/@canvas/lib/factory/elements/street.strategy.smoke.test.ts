import {describe, expect, it} from 'vitest';
import {
  streetCornerStrategy,
  streetStraightStrategy,
} from './street.strategy.ts';

describe('street.strategy.ts', () => {
  it('exposes create functions for street variants', () => {
    expect(typeof streetStraightStrategy.create).toBe('function');
    expect(typeof streetCornerStrategy.create).toBe('function');
  });
});
