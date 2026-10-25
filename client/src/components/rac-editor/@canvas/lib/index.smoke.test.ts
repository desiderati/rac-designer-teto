import {describe, expect, it} from 'vitest';
import {DEFAULT_CANVAS_HINT, getHintForObject} from './index.ts';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';

describe('index.ts', () => {
  it('re-exports helpers', () => {
    expect(getAllPilotiIds()).toHaveLength(12);
    expect(getHintForObject(null)).toBe(DEFAULT_CANVAS_HINT);
  });
});

