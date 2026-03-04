import {describe, expect, it} from 'vitest';
import {wallStrategy} from './wall.strategy.ts';

describe('wall.strategy.ts', () => {
  it('exposes a create function', () => {
    expect(typeof wallStrategy.create).toBe('function');
  });
});

