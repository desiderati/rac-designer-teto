import {describe, expect, it, vi} from 'vitest';
import type {HouseState} from '@/shared/types/house.ts';
import {
  collectElevationViewInstances,
  resolveTerrainTypeFromCanvasFallback,
} from './house-manager-terrain.ts';

describe('house-manager-terrain.ts', () => {
  it('collects only elevation view instances', () => {
    const house = {
      views: {
        top: [{instanceId: 'top_1', group: 'top'}],
        front: [{instanceId: 'front_1', group: 'front'}],
        back: [{instanceId: 'back_1', group: 'back'}],
        side1: [{instanceId: 'side1_1', group: 'side1'}],
        side2: [{instanceId: 'side2_1', group: 'side2'}],
      },
    } as Pick<HouseState<string>, 'views'>;

    expect(collectElevationViewInstances(house).map((instance) => instance.group))
      .toEqual(['front', 'back', 'side1', 'side2']);
  });

  it('resolves terrain type from the first elevation group on canvas', () => {
    const canvas = {
      getObjects: vi.fn(() => [
        {type: 'group', myType: 'house', houseView: 'top', groundTerrainType: 2},
        {type: 'group', myType: 'house', houseView: 'front', groundTerrainType: 99},
      ]),
    };

    expect(resolveTerrainTypeFromCanvasFallback({
      canvas: canvas as never,
      fallbackTerrainType: 3,
    })).toBe(5);
  });

  it('falls back when the canvas has no elevation terrain metadata', () => {
    const canvas = {
      getObjects: vi.fn(() => [
        {type: 'group', myType: 'house', houseView: 'top', groundTerrainType: 2},
      ]),
    };

    expect(resolveTerrainTypeFromCanvasFallback({
      canvas: canvas as never,
      fallbackTerrainType: 3,
    })).toBe(3);
  });
});
