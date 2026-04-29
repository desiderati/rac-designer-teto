import {describe, expect, it} from 'vitest';
import {doorStrategy} from './door.strategy.ts';

describe('door.strategy.ts', () => {
  it('exposes a create function', () => {
    expect(typeof doorStrategy.create).toBe('function');
  });
});

