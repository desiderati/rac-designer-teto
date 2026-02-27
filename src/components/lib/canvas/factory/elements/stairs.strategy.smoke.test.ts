import {describe, expect, it} from 'vitest';
import {stairsStrategy} from './stairs.strategy.ts';

describe('stairsStrategy', () => {
  it('exposes a create function', () => {
    expect(typeof stairsStrategy.create).toBe('function');
  });
});
