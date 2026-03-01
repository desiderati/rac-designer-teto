import {describe, expect, it} from 'vitest';
import {distanceStrategy} from './distance.strategy.ts';

describe('distanceStrategy', () => {
  it('exposes a create function', () => {
    expect(typeof distanceStrategy.create).toBe('function');
  });
});
