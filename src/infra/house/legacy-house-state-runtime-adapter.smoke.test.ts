import {beforeEach, describe, expect, it, vi} from 'vitest';
import {legacyHouseRuntimePort} from './legacy-house-runtime-adapter.ts';
import {legacyHouseStatePort} from './legacy-house-state-adapter.ts';
import {legacyHouseWritePort} from './legacy-house-write-adapter.ts';

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

describe('legacy house state/runtime adapters', () => {
  beforeEach(() => {
    legacyHouseWritePort.resetHouse();
  });

  it('inicializa o runtime da casa por porta dedicada', () => {
    legacyHouseRuntimePort.initializeCanvas(createCanvasPort());

    expect(legacyHouseStatePort.getSnapshot()).not.toBeNull();
  });

  it('publica alterações de estado sem expor o singleton à UI', () => {
    const listener = vi.fn();
    const unsubscribe = legacyHouseStatePort.subscribe(listener);

    legacyHouseWritePort.setHouseType('tipo6');

    expect(listener).toHaveBeenCalled();
    expect(legacyHouseStatePort.getSnapshot()?.houseType).toBe('tipo6');
    unsubscribe();
  });
});
