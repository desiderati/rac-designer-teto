import {beforeEach, describe, expect, it, vi} from 'vitest';
import {
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

describe('house manager state/runtime adapters', () => {
  beforeEach(() => {
    editorHouseWritePort.resetHouse();
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
