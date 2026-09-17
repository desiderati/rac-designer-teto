import {describe, expect, it, vi} from 'vitest';
import {createCanvasHouseRuntimePort} from './fabric-canvas-house-runtime-port.ts';

describe('createCanvasHouseRuntimePort', () => {
  it('expõe somente comandos mínimos do runtime visual da casa', () => {
    const objects = [
      {type: 'group', myType: 'house', houseView: 'top', groundTerrainType: 2},
      {type: 'rect', myType: 'wall'},
      {type: 'group', myType: 'house', houseView: 'front', groundTerrainType: 99},
    ];
    const canvas = {
      getObjects: vi.fn(() => objects),
      requestRenderAll: vi.fn(),
    };

    const port = createCanvasHouseRuntimePort(canvas as never);

    port.requestRenderAll();
    expect(canvas.requestRenderAll).toHaveBeenCalled();
    expect(port.getHouseGroups()).toHaveLength(2);
    expect(port.includesGroup(objects[0] as never)).toBe(true);
    expect('readPilotis' in port).toBe(false);
    expect('resolveTerrainType' in port).toBe(false);
  });
});
