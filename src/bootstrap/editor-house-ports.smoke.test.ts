import {beforeEach, describe, expect, it, vi} from 'vitest';
import {
  editorHouseReadPort,
  editorHouseRuntimePort,
  editorHouseRuntimeSnapshotPort,
  editorHouseStatePort,
  editorHouseWritePort,
} from '@/bootstrap/editor-house-ports.ts';

function createCanvasPort() {
  return {
    requestRenderAll: vi.fn(),
    includesGroup: vi.fn(() => true),
    getHouseGroups: vi.fn(() => []),
    readPilotis: vi.fn((pilotis) => pilotis),
    resolveTerrainType: vi.fn((terrainType) => terrainType),
  };
}

describe('editor house ports', () => {
  beforeEach(() => {
    editorHouseWritePort.resetHouse();
  });

  it('aplica dados de setup pela porta composta', () => {
    editorHouseWritePort.applyHouseSetup({
      familyName: 'Familia teste',
      selectedPilotiHeights: [1, 1.5, 2],
    });

    expect(editorHouseReadPort.getFamilyName()).toBe('Familia teste');
    expect([...editorHouseReadPort.getSelectedPilotiHeights()]).toEqual([1, 1.5, 2]);
  });

  it('normaliza terreno pela porta de escrita', () => {
    const normalized = editorHouseWritePort.setTerrainType(99);

    expect(normalized).toBe(5);
    expect(editorHouseReadPort.getTerrainType()).toBe(5);
  });

  it('expoe leituras de vistas pela porta de leitura', () => {
    editorHouseWritePort.setHouseType('tipo6');

    expect(editorHouseReadPort.getCurrentHouseType()).toBe('tipo6');
    expect(editorHouseReadPort.isViewAtLimit('front')).toBe(false);
    expect(editorHouseReadPort.getAvailableSides('front')).toEqual(['top', 'bottom']);
  });

  it('inicializa o runtime da casa por porta dedicada', () => {
    editorHouseRuntimePort.initializeCanvas(createCanvasPort());

    expect(editorHouseRuntimeSnapshotPort.getRuntimeSnapshot()).not.toBeNull();
  });

  it('emite alterações de estado sem expor o singleton à UI', () => {
    const listener = vi.fn();
    const unsubscribe = editorHouseStatePort.subscribe(listener);

    editorHouseWritePort.setHouseType('tipo6');

    expect(listener).toHaveBeenCalled();
    expect(editorHouseStatePort.getStateSnapshot()?.houseType).toBe('tipo6');
    expect(editorHouseRuntimeSnapshotPort.getRuntimeSnapshot()?.houseType).toBe('tipo6');
    unsubscribe();
  });
});
