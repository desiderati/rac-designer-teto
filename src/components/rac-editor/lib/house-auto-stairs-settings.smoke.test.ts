import {describe, expect, it, vi} from 'vitest';
import {refreshAutoStairsInViews} from '@/components/rac-editor/lib/house-auto-stairs.ts';

function createTopViewGroupWithAutoStair() {
  const group: any = {
    _objects: [{isAutoStairs: true}],
    getCanvasObjects() {
      return this._objects;
    },
    _clearCache: vi.fn(),
    _calcBounds: vi.fn(),
    setCoords: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    dirty: false,
  };
  return group;
}

describe('house auto stairs settings', () => {
  it('removes top-view auto stairs when showStairsOnTopView is disabled', () => {
    const topGroup = createTopViewGroupWithAutoStair();

    const changed = refreshAutoStairsInViews({
      houseType: null,
      sideMappings: {top: null, bottom: null, left: null, right: null},
      pilotis: {},
      topView: [{instanceId: 'top_1', group: topGroup}] as any,
      elevationViews: [],
      showStairsOnTopView: false,
    });

    expect(changed).toBe(true);
    expect(topGroup.getCanvasObjects()).toEqual([]);
  });
});
