import {describe, expect, it, vi} from 'vitest';
import type {HouseViewType} from '@/shared/types/house.ts';
import {hasHouseTopViewInsertedInCanvas} from '@/components/rac-editor/lib/house-export-availability.ts';

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
    expect(hasHouseTopViewInsertedInCanvas(createHouseReadPortWithViews({}))).toBe(false);
  });

  it('exige a planta mesmo quando existem elevações no Canvas', () => {
    expect(hasHouseTopViewInsertedInCanvas(createHouseReadPortWithViews({top: 1}))).toBe(true);
    expect(hasHouseTopViewInsertedInCanvas(createHouseReadPortWithViews({front: 1, back: 1, side1: 1, side2: 1}))).toBe(false);
  });
});
