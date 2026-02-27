import {describe, expect, it} from 'vitest';
import {doorStrategy} from './door.strategy.ts';

describe('doorStrategy', () => {
  it('exposes a create function', () => {
    expect(typeof doorStrategy.create).toBe('function');
  });
});
