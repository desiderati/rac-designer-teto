import {describe, expect, it} from 'vitest';
import {textStrategy} from './text.strategy.ts';

describe('text.strategy.ts', () => {
  it('exposes a create function', () => {
    expect(typeof textStrategy.create).toBe('function');
  });
});

