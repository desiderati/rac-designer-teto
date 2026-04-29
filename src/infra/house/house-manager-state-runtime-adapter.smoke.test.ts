import {beforeEach, describe, expect, it, vi} from 'vitest';
import {houseManagerRuntimePort} from './house-manager-runtime-adapter.ts';
import {houseManagerStatePort} from './house-manager-state-adapter.ts';
import {houseManagerWritePort} from './house-manager-write-adapter.ts';

function createCanvasPort() {
  return {
    requestRenderAll: vi.fn(),
    includesGroup: vi.fn(() => true),
    getHouseGroups: vi.fn(() => []),
    readPilotis: vi.fn((pilotis) => pilotis),
    resolveTerrainType: vi.fn((terrainType) => terrainType),
    insert3DSnapshot: vi.fn().mockResolvedValue(false),
  };
}

describe('house manager state/runtime adapters', () => {
  beforeEach(() => {
    houseManagerWritePort.resetHouse();
  });

  it('inicializa o runtime da casa por porta dedicada', () => {
    houseManagerRuntimePort.initializeCanvas(createCanvasPort());

    expect(houseManagerStatePort.getSnapshot()).not.toBeNull();
  });

  it('emite alterações de estado sem expor o singleton à UI', () => {
    const listener = vi.fn();
    const unsubscribe = houseManagerStatePort.subscribe(listener);

    houseManagerWritePort.setHouseType('tipo6');

    expect(listener).toHaveBeenCalled();
    expect(houseManagerStatePort.getSnapshot()?.houseType).toBe('tipo6');
    unsubscribe();
  });
});
