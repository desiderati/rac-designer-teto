import {describe, expect, it} from 'vitest';
import {lineStrategy} from './line.strategy.ts';

describe('line.strategy.ts', () => {
  it('exposes a create function', () => {
    expect(typeof lineStrategy.create).toBe('function');
  });
});

