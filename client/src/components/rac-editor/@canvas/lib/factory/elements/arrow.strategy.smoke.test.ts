import {describe, expect, it} from 'vitest';
import {arrowStrategy} from './arrow.strategy.ts';

describe('arrow.strategy.ts', () => {
  it('exposes a create function', () => {
    expect(typeof arrowStrategy.create).toBe('function');
  });
});

