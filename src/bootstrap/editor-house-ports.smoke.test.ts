import {beforeEach, describe, expect, it, vi} from 'vitest';
import {createDefaultEditorHousePorts, type EditorHousePorts} from '@/bootstrap/editor-house-ports.ts';
import {HOUSE_DRAWING_CANVAS_SCHEMA_VERSION} from '@/shared/types/house-drawing-document.ts';

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
  let ports: EditorHousePorts;

  beforeEach(() => {
    ports = createDefaultEditorHousePorts();
    ports.houseWritePort.resetHouse();
  });

  it('aplica dados de setup pela porta composta', () => {
    ports.houseWritePort.applyHouseSetup({
      familyName: 'Familia teste',
      selectedPilotiHeights: [1, 1.5, 2],
    });

    expect(ports.houseReadPort.getFamilyName()).toBe('Familia teste');
    expect([...ports.houseReadPort.getSelectedPilotiHeights()]).toEqual([1, 1.5, 2]);
  });

  it('normaliza terreno pela porta de escrita', () => {
    const normalized = ports.houseWritePort.setTerrainType(99);

    expect(normalized).toBe(5);
    expect(ports.houseReadPort.getTerrainType()).toBe(5);
  });

  it('expoe leituras de vistas pela porta de leitura', () => {
    ports.houseWritePort.setHouseType('tipo6');

    expect(ports.houseReadPort.getCurrentHouseType()).toBe('tipo6');
    expect(ports.houseReadPort.isViewAtLimit('front')).toBe(false);
    expect(ports.houseReadPort.getAvailableSides('front')).toEqual(['top', 'bottom']);
  });

  it('inicializa o runtime da casa por porta dedicada', () => {
    ports.houseRuntimePort.initializeCanvas(createCanvasPort());

    expect(ports.houseRuntimeSnapshotPort.getRuntimeSnapshot()).not.toBeNull();
  });

  it('emite alterações de estado sem expor o singleton à UI', () => {
    const listener = vi.fn();
    const unsubscribe = ports.houseStatePort.subscribe(listener);

    ports.houseWritePort.setHouseType('tipo6');

    expect(listener).toHaveBeenCalled();
    expect(ports.houseStatePort.getStateSnapshot()?.houseType).toBe('tipo6');
    expect(ports.houseRuntimeSnapshotPort.getRuntimeSnapshot()?.houseType).toBe('tipo6');
    unsubscribe();
  });

  it('cria instâncias isoladas para providers diferentes', () => {
    const firstPorts = createDefaultEditorHousePorts();
    const secondPorts = createDefaultEditorHousePorts();

    firstPorts.houseWritePort.setHouseType('tipo6');

    expect(firstPorts.houseReadPort.getCurrentHouseType()).toBe('tipo6');
    expect(secondPorts.houseReadPort.getCurrentHouseType()).toBeNull();
  });

  it('exporta e importa documento canônico da casa ativa', () => {
    ports.houseWritePort.setHouseType('tipo6');
    const document = ports.houseDrawingDocumentPort.exportHouseDrawingDocument({
      schemaVersion: HOUSE_DRAWING_CANVAS_SCHEMA_VERSION,
      objects: [],
    });

    expect(document?.house?.houseType).toBe('tipo6');

    ports.houseWritePort.setHouseType('tipo3');
    ports.houseDrawingDocumentPort.importHouseDrawingDocument(document!);

    expect(ports.houseReadPort.getCurrentHouseType()).toBe('tipo6');
  });
});
