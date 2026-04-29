import {describe, expect, it, vi} from 'vitest';
import {createHouseManagerCanvasPort} from './fabric-house-manager-canvas-port.ts';

describe('createHouseManagerCanvasPort', () => {
  it('resolves terrain type from the first elevation group on canvas', () => {
    const canvas = {
      getObjects: vi.fn(() => [
        {type: 'group', myType: 'house', houseView: 'top', groundTerrainType: 2},
        {type: 'group', myType: 'house', houseView: 'front', groundTerrainType: 99},
      ]),
    };

    expect(createHouseManagerCanvasPort(canvas as never).resolveTerrainType(3)).toBe(5);
  });

  it('falls back when the canvas has no elevation terrain metadata', () => {
    const canvas = {
      getObjects: vi.fn(() => [
        {type: 'group', myType: 'house', houseView: 'top', groundTerrainType: 2},
      ]),
    };

    expect(createHouseManagerCanvasPort(canvas as never).resolveTerrainType(3)).toBe(3);
  });
});
