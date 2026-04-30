import {beforeEach, describe, expect, it} from 'vitest';
import {
  editorHouseReadPort,
  editorHouseWritePort,
} from '@/bootstrap/editor-house-ports.ts';

describe('house-manager-write-adapter.ts', () => {
  beforeEach(() => {
    editorHouseWritePort.resetHouse();
  });

  it('applies family setup through the write port', () => {
    editorHouseWritePort.applyHouseSetup({
      familyName: 'Familia teste',
      selectedPilotiHeights: [1, 1.5, 2],
    });

    expect(editorHouseReadPort.getFamilyName()).toBe('Familia teste');
    expect([...editorHouseReadPort.getSelectedPilotiHeights()]).toEqual([1, 1.5, 2]);
  });

  it('normalizes terrain updates through the write port', () => {
    const normalized = editorHouseWritePort.setTerrainType(99);

    expect(normalized).toBe(5);
    expect(editorHouseReadPort.getTerrainType()).toBe(5);
  });

  it('exposes house view flow decisions without leaking the manager to UI hooks', () => {
    editorHouseWritePort.setHouseType('tipo6');

    expect(editorHouseReadPort.getCurrentHouseType()).toBe('tipo6');
    expect(editorHouseReadPort.isViewAtLimit('front')).toBe(false);
    expect(editorHouseReadPort.getAvailableSides('front')).toEqual(['top', 'bottom']);
  });
});
