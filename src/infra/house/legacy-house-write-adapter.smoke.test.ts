import {beforeEach, describe, expect, it} from 'vitest';
import {legacyHouseReadPort} from './legacy-house-read-adapter.ts';
import {legacyHouseWritePort} from './legacy-house-write-adapter.ts';

describe('legacy-house-write-adapter.ts', () => {
  beforeEach(() => {
    legacyHouseWritePort.resetHouse();
  });

  it('applies family setup through the write port', () => {
    legacyHouseWritePort.applyFamilySetup({
      familyName: 'Familia teste',
      selectedPilotiHeights: [1, 1.5, 2],
    });

    expect(legacyHouseReadPort.getFamilyName()).toBe('Familia teste');
    expect([...legacyHouseReadPort.getSelectedPilotiHeights()]).toEqual([1, 1.5, 2]);
  });

  it('normalizes terrain updates through the write port', () => {
    const normalized = legacyHouseWritePort.setTerrainType(99);

    expect(normalized).toBe(5);
    expect(legacyHouseReadPort.getTerrainType()).toBe(5);
  });

  it('exposes house view flow decisions without leaking the manager to UI hooks', () => {
    legacyHouseWritePort.setHouseType('tipo6');

    expect(legacyHouseWritePort.getCurrentHouseType()).toBe('tipo6');
    expect(legacyHouseWritePort.isViewAtLimit('front')).toBe(false);
    expect(legacyHouseWritePort.getAvailableSides('front')).toEqual(['top', 'bottom']);
  });
});
