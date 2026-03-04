import {describe, expect, it} from 'vitest';
import {getHintForObject} from './index.ts';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';

describe('index.ts', () => {
  it('re-exports helpers', () => {
    expect(getAllPilotiIds()).toHaveLength(12);
    expect(getHintForObject(null)).toContain('Dica');
  });
});

