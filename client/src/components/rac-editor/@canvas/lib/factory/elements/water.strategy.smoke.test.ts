import {describe, expect, it} from 'vitest';
import {waterStrategy} from './water.strategy.ts';

describe('water.strategy.ts', () => {
  it('exposes a create function', () => {
    expect(typeof waterStrategy.create).toBe('function');
  });
});

