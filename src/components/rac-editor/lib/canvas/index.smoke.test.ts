import {describe, expect, it} from 'vitest';
import {getAllPilotiIds, getHintForObject} from './index.ts';

describe('canvas index exports', () => {
  it('re-exports helpers', () => {
    expect(getAllPilotiIds()).toHaveLength(12);
    expect(getHintForObject(null)).toContain('Dica');
  });
});
