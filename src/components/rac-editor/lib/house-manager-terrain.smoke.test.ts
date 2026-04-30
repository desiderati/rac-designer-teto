import {describe, expect, it} from 'vitest';
import type {HouseRuntimeViews} from '@/shared/types/house.ts';
import {collectElevationViewInstances} from './house-manager-terrain.ts';

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
    } as { views: HouseRuntimeViews<string> };

    expect(collectElevationViewInstances(house).map((instance) => instance.group))
      .toEqual(['front', 'back', 'side1', 'side2']);
  });

});
