import {describe, expect, it} from 'vitest';
import {cn} from './utils.ts';

describe('utils cn', () => {
  it('merges class names', () => {
    const isHidden = false;
    expect(cn('base', isHidden && 'hidden', 'active')).toBe('base active');
  });
});
