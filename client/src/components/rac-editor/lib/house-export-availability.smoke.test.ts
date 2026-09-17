import {describe, expect, it, vi} from 'vitest';
import type {HouseViewType} from '@/shared/types/house.ts';
import {hasHouseViewInsertedInCanvas} from '@/components/rac-editor/lib/house-export-availability.ts';

function createHouseReadPortWithViews(insertedViews: Partial<Record<HouseViewType, number>>) {
  return {
    getViewCount: vi.fn((viewType: HouseViewType) => ({
      current: insertedViews[viewType] ?? 0,
      max: 1,
    })),
  };
}

describe('house-export-availability.ts', () => {
  it('bloqueia exportação quando nenhuma vista de casa foi inserida no canvas', () => {
    expect(hasHouseViewInsertedInCanvas(createHouseReadPortWithViews({}))).toBe(false);
  });

  it('libera exportação quando existe ao menos uma vista de casa no canvas', () => {
    expect(hasHouseViewInsertedInCanvas(createHouseReadPortWithViews({top: 1}))).toBe(true);
    expect(hasHouseViewInsertedInCanvas(createHouseReadPortWithViews({front: 1}))).toBe(true);
  });
});
