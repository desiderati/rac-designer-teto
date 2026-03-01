import {describe, expect, it} from 'vitest';
import {createHouseTop} from './house-top.strategy.ts';

describe('house-top strategy', () => {
  it('exports createHouseTop function', () => {
    expect(typeof createHouseTop).toBe('function');
  });
});
