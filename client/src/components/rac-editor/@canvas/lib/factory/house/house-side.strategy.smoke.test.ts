import {describe, expect, it} from 'vitest';
import {createHouseSide} from './house-side.strategy.ts';

describe('house-side.strategy.ts', () => {
  it('exports createHouseSide function', () => {
    expect(typeof createHouseSide).toBe('function');
  });
});

