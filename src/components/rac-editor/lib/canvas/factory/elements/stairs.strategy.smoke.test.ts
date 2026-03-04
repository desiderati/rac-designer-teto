import {describe, expect, it} from 'vitest';
import {stairsStrategy} from './stairs.strategy.ts';

describe('stairs.strategy.ts', () => {
  it('exposes a create function', () => {
    expect(typeof stairsStrategy.create).toBe('function');
  });
});

