import {describe, expect, it} from 'vitest';
import {treeStrategy} from './tree.strategy.ts';

describe('tree.strategy.ts', () => {
  it('exposes a create function', () => {
    expect(typeof treeStrategy.create).toBe('function');
  });
});

