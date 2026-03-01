import {describe, expect, it} from 'vitest';
import {lineStrategy} from './line.strategy.ts';

describe('lineStrategy', () => {
  it('exposes a create function', () => {
    expect(typeof lineStrategy.create).toBe('function');
  });
});
