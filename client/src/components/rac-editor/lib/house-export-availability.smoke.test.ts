import {definedPilotis} from '@/test/defined-pilotis.ts';
import {describe, expect, it, vi} from 'vitest';
import type {HouseViewType} from '@/shared/types/house.ts';
import {canExportDefinedHouse} from '@/components/rac-editor/lib/house-export-availability.ts';

function createHouseReadPortWithViews(insertedViews: Partial<Record<HouseViewType, number>>) {
  return {
    getCurrentHouseType: () => 'tipo6' as const,
    getPilotis: definedPilotis,
    getViewCount: vi.fn((viewType: HouseViewType) => ({
      current: insertedViews[viewType] ?? 0,
      max: 1,
    })),
  };
}

describe('house-export-availability.ts', () => {
  it('libera casa definida mesmo sem vista materializada no Canvas', () => {
    expect(canExportDefinedHouse(createHouseReadPortWithViews({}))).toBe(true);
  });

  it('independe das vistas e bloqueia ausência de níveis/pilotis', () => {
    expect(canExportDefinedHouse(createHouseReadPortWithViews({top: 1}))).toBe(true);
    expect(canExportDefinedHouse({getCurrentHouseType: () => 'tipo6', getPilotis: () => ({})})).toBe(false);
    expect(canExportDefinedHouse(createHouseReadPortWithViews({front: 1, back: 1, side1: 1, side2: 1}))).toBe(true);
  });
});
