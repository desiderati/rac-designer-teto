import {describe, expect, it, vi} from 'vitest';
import {createCanvasHouseRuntimePort} from './fabric-canvas-house-runtime-port.ts';

describe('createCanvasHouseRuntimePort', () => {
  it('resolves terrain type from the first elevation group on canvas', () => {
    const canvas = {
      getObjects: vi.fn(() => [
        {type: 'group', myType: 'house', houseView: 'top', groundTerrainType: 2},
        {type: 'group', myType: 'house', houseView: 'front', groundTerrainType: 99},
      ]),
    };

    expect(createCanvasHouseRuntimePort(canvas as never).resolveTerrainType(3)).toBe(5);
  });

  it('falls back when the canvas has no elevation terrain metadata', () => {
    const canvas = {
      getObjects: vi.fn(() => [
        {type: 'group', myType: 'house', houseView: 'top', groundTerrainType: 2},
      ]),
    };

    expect(createCanvasHouseRuntimePort(canvas as never).resolveTerrainType(3)).toBe(3);
  });
});
