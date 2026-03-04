import {describe, expect, it, vi} from 'vitest';
import {refreshAutoStairsInViews} from '@/components/rac-editor/lib/house-auto-stairs.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';
import {HOUSE_2D_STYLE} from '@/shared/config.ts';

function createMockObject(props: Record<string, unknown> = {}) {
  return {
    ...props,
    set: vi.fn(function (patch: Record<string, unknown>) {
      Object.assign(this, patch);
    }),
    setCoords: vi.fn(),
  };
}

function createMockGroup(props: Record<string, unknown> = {}) {
  const objects: any[] = [];
  return {
    group: {
      _objects: objects,
      getObjects: () => objects,
      setCoords: vi.fn(),
      ...props,
    },
    objects,
  };
}

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

describe('house-auto-stairs.ts', () => {
  it('creates auto stairs on top view using door-side mapping', () => {
    const {group, objects} = createMockGroup();
    objects.push(createMockObject({
      isHouseBody: true,
      width: HOUSE_DIMENSIONS.footprint.width * HOUSE_DIMENSIONS.view.scale,
      height: HOUSE_DIMENSIONS.footprint.depth * HOUSE_DIMENSIONS.view.scale,
      scaleX: 1,
      scaleY: 1,
    }));

    const changed = refreshAutoStairsInViews({
      houseType: 'tipo6',
      sideMappings: {top: 'front', bottom: null, left: null, right: null},
      pilotis: {
        piloti_0_0: {height: 1, isMaster: false, nivel: 0.2},
        piloti_3_0: {height: 1, isMaster: false, nivel: 0.2},
      } as any,
      topView: [{instanceId: 'top_1', group} as any],
      elevationViews: [],
    });

    expect(changed).toBe(true);
    const stair = objects.find((object) => object?.isAutoStairs === true) as any;
    expect(stair).toBeTruthy();
    expect(stair?.stairsStepCount).toBe(3);

    const bodyHalf = (HOUSE_DIMENSIONS.footprint.depth * HOUSE_DIMENSIONS.view.scale) / 2;
    const markerHalf = (HOUSE_DIMENSIONS.elements.topDoorMarker.shortSize * HOUSE_DIMENSIONS.view.scale) / 2;
    const markerOutsideEdge = -bodyHalf - markerHalf - HOUSE_2D_STYLE.outlineStrokeWidth / 2;
    const stairInnerEdge = Number(stair?.top ?? 0) + Number(stair?.height ?? 0) / 2;
    expect(stairInnerEdge).toBeLessThanOrEqual(
      markerOutsideEdge + HOUSE_2D_STYLE.outlineStrokeWidth + 0.01,
    );
  });

  it('creates auto stairs on elevation view that contains a door', () => {
    const {group, objects} = createMockGroup({houseView: 'side'});
    objects.push(
      createMockObject({
        isHouseDoor: true,
        left: 120,
        top: 80,
        width: 40,
        height: 95,
      }),
      createMockObject({
        isPilotiRect: true,
        pilotiBaseHeight: 50,
      }),
    );

    const changed = refreshAutoStairsInViews({
      houseType: 'tipo3',
      sideMappings: {top: null, bottom: null, left: null, right: null},
      pilotis: {
        piloti_0_0: {height: 1, isMaster: false, nivel: 0.2},
        piloti_0_2: {height: 1, isMaster: false, nivel: 0.3},
      } as any,
      topView: [],
      elevationViews: [{instanceId: 'side_1', group} as any],
    });

    expect(changed).toBe(true);
    const stair = objects.find((object) => object?.isAutoStairs === true) as any;
    expect(stair).toBeTruthy();
    expect(stair?.myType).toBe('stairs');
    expect(stair?.stairsStepCount).toBe(3);
    expect(stair?.left).toBe(120);
    expect(stair?.originX).toBe('left');

    const stairTopEdge = Number(stair?.top ?? 0) - Number(stair?.height ?? 0) / 2;
    const expectedDoorBottomEdge = 80 + 95 + (HOUSE_2D_STYLE.outlineStrokeWidth / 2);
    expect(stairTopEdge).toBe(expectedDoorBottomEdge);

    const stairObjects = Array.isArray(stair?._objects) ? stair._objects : [];
    expect(stairObjects).toHaveLength(3);
  });

  it('uses the same stair depth in top and elevation views when both are present', () => {
    const {group: topGroup, objects: topObjects} = createMockGroup();
    topObjects.push(createMockObject({
      isHouseBody: true,
      width: HOUSE_DIMENSIONS.footprint.width * HOUSE_DIMENSIONS.view.scale,
      height: HOUSE_DIMENSIONS.footprint.depth * HOUSE_DIMENSIONS.view.scale,
      scaleX: 1,
      scaleY: 1,
    }));

    const {group: elevationGroup, objects: elevationObjects} = createMockGroup({houseView: 'front'});
    elevationObjects.push(
      createMockObject({
        isHouseDoor: true,
        left: 120,
        top: 80,
        width: 40,
        height: 95,
      }),
      createMockObject({isPilotiRect: true, pilotiId: 'piloti_0_2', left: 90, width: 20}),
      createMockObject({isPilotiRect: true, pilotiId: 'piloti_1_2', left: 150, width: 20}),
      createMockObject({isPilotiRect: true, pilotiId: 'piloti_2_2', left: 210, width: 20}),
      createMockObject({isPilotiRect: true, pilotiId: 'piloti_3_2', left: 270, width: 20}),
    );

    const changed = refreshAutoStairsInViews({
      houseType: 'tipo6',
      sideMappings: {top: 'front', bottom: null, left: null, right: null},
      pilotis: {
        piloti_0_0: {height: 1, isMaster: false, nivel: 0.2},
        piloti_1_0: {height: 1, isMaster: false, nivel: 0.2},
        piloti_2_0: {height: 1, isMaster: false, nivel: 0.2},
        piloti_3_0: {height: 1, isMaster: false, nivel: 0.2},
        piloti_0_2: {height: 1, isMaster: false, nivel: 0.2},
        piloti_1_2: {height: 1, isMaster: false, nivel: 0.2},
        piloti_2_2: {height: 1, isMaster: false, nivel: 0.2},
        piloti_3_2: {height: 1, isMaster: false, nivel: 0.2},
      } as any,
      topView: [{instanceId: 'top_1', group: topGroup} as any],
      elevationViews: [{instanceId: 'front_1', side: 'top', group: elevationGroup} as any],
    });

    expect(changed).toBe(true);
    const topStair = topObjects.find((object) => object?.isAutoStairs === true) as any;
    const elevationStair = elevationObjects.find((object) => object?.isAutoStairs === true) as any;

    expect(topStair).toBeTruthy();
    expect(elevationStair).toBeTruthy();
    expect(Number(topStair?.height ?? 0)).toBeCloseTo(Number(elevationStair?.height ?? 0), 6);
    expect(Number(topStair?.stairsHeight ?? 0)).toBeCloseTo(Number(elevationStair?.stairsHeight ?? 0), 6);
  });

  it('uses binomial terrain interpolation on stair edges to pick the closest side to terrain', () => {
    const {group, objects} = createMockGroup({houseView: 'front', isFlippedHorizontally: false});
    objects.push(
      createMockObject({
        isHouseDoor: true,
        left: 110,
        top: 80,
        width: 40,
        height: 95,
      }),
      createMockObject({
        isPilotiRect: true,
        pilotiId: 'piloti_0_2',
        left: 90,
        top: 120,
        width: 20,
        height: 100,
        pilotiBaseHeight: 50,
      }),
      createMockObject({
        isPilotiRect: true,
        pilotiId: 'piloti_1_2',
        left: 150,
        top: 120,
        width: 20,
        height: 100,
        pilotiBaseHeight: 50,
      }),
      createMockObject({
        isPilotiRect: true,
        pilotiId: 'piloti_2_2',
        left: 210,
        top: 120,
        width: 20,
        height: 100,
        pilotiBaseHeight: 50,
      }),
      createMockObject({
        isPilotiRect: true,
        pilotiId: 'piloti_3_2',
        left: 270,
        top: 120,
        width: 20,
        height: 100,
        pilotiBaseHeight: 50,
      }),
    );

    const changed = refreshAutoStairsInViews({
      houseType: 'tipo6',
      sideMappings: {top: null, bottom: null, left: null, right: null},
      pilotis: {
        piloti_0_2: {height: 1, isMaster: false, nivel: 0.6},
        piloti_1_2: {height: 1, isMaster: false, nivel: 0.2},
        piloti_2_2: {height: 1, isMaster: false, nivel: 0.2},
        piloti_3_2: {height: 1, isMaster: false, nivel: 0.2},
      } as any,
      topView: [],
      elevationViews: [{instanceId: 'front_1', group} as any],
    });

    expect(changed).toBe(true);
    const stair = objects.find((object) => object?.isAutoStairs === true) as any;
    expect(stair).toBeTruthy();
    expect(stair?.stairsNivelLeft).toBe(0.56);
    expect(stair?.stairsNivelRight).toBe(0.41);
    expect(stair?.stairsStepCount).toBe(3);
  });

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
