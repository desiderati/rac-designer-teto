import {describe, expect, it} from 'vitest';
import {createHouseFrontBack} from './house-front-back.strategy.ts';

describe('house-front-back strategy', () => {
  it('exports createHouseFrontBack function', () => {
    expect(typeof createHouseFrontBack).toBe('function');
  });
});
