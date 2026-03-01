import {describe, expect, it} from 'vitest';
import {waterStrategy} from './water.strategy.ts';

describe('waterStrategy', () => {
  it('exposes a create function', () => {
    expect(typeof waterStrategy.create).toBe('function');
  });
});
