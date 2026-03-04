import {describe, expect, it} from 'vitest';
import {act, renderHook} from '@testing-library/react';
import {emitHouseStoreChange, useHouseStoreVersion} from './house-store.ts';

describe('house-store.ts', () => {
  it('increments version on emit', () => {
    const {result} = renderHook(() => useHouseStoreVersion());
    const initial = result.current;

    act(() => {
      emitHouseStoreChange();
    });

    expect(result.current).toBe(initial + 1);
  });
});

