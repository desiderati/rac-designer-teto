import {describe, expect, it} from 'vitest';
import {cn} from './utils.ts';

describe('utils cn', () => {
  it('merges class names', () => {
    expect(cn('base', false && 'hidden', 'active')).toBe('base active');
  });
});
