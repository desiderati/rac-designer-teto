import {beforeEach, describe, expect, it} from 'vitest';
import {houseManagerReadPort} from './house-manager-read-adapter.ts';
import {houseManagerWritePort} from './house-manager-write-adapter.ts';

describe('house-manager-write-adapter.ts', () => {
  beforeEach(() => {
    houseManagerWritePort.resetHouse();
  });

  it('applies family setup through the write port', () => {
    houseManagerWritePort.applyFamilySetup({
      familyName: 'Familia teste',
      selectedPilotiHeights: [1, 1.5, 2],
    });

    expect(houseManagerReadPort.getFamilyName()).toBe('Familia teste');
    expect([...houseManagerReadPort.getSelectedPilotiHeights()]).toEqual([1, 1.5, 2]);
  });

  it('normalizes terrain updates through the write port', () => {
    const normalized = houseManagerWritePort.setTerrainType(99);

    expect(normalized).toBe(5);
    expect(houseManagerReadPort.getTerrainType()).toBe(5);
  });

  it('exposes house view flow decisions without leaking the manager to UI hooks', () => {
    houseManagerWritePort.setHouseType('tipo6');

    expect(houseManagerWritePort.getCurrentHouseType()).toBe('tipo6');
    expect(houseManagerWritePort.isViewAtLimit('front')).toBe(false);
    expect(houseManagerWritePort.getAvailableSides('front')).toEqual(['top', 'bottom']);
  });
});
