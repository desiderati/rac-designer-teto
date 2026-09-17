import {describe, expect, it} from 'vitest';
import type {Canvas as FabricCanvas} from 'fabric';
import {createHouse3DProjectionFromCanvasHouse} from '@/components/rac-editor/@canvas/lib/house-3d-projection.ts';
import {refreshAutoStairsInViews} from '@/components/rac-editor/@canvas/lib/house-auto-stairs.ts';
import {createHouseFrontBack} from '@/components/rac-editor/@canvas/lib/factory/house/house-front-back.strategy.ts';
import {createHouseTop} from '@/components/rac-editor/@canvas/lib/factory/house/house-top.strategy.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';
import {parseStairsFromElevationViews} from '@/components/rac-editor/@viewer-3d/lib/parsers/stairs-parser.ts';

function createMockGroup(objects: unknown[] = [], props: Record<string, unknown> = {}) {
  return {
    type: 'group',
    width: 300,
    scaleX: 1,
    getCanvasObjects: () => objects,
    ...props,
  } as any;
}

describe('house-3d-projection.ts', () => {
  it('projeta a posição esquerda real do corpo para estabilizar a escada 3D', () => {
    const frontGroup = createMockGroup([
      {isHouseBody: true, left: -120, width: 300, scaleX: 1},
      {isHouseDoor: true, left: -40, width: 40, scaleX: 1},
      {
        isAutoStairs: true,
        left: -40,
        width: 40,
        scaleX: 1,
        stairsHeight: 1.2,
        stairsStepCount: 4,
      },
    ], {houseView: 'front'});

    const projection = createHouse3DProjectionFromCanvasHouse({
      id: 'house_test',
      houseType: 'tipo6',
      pilotis: {},
      terrainType: 1,
      sideMappings: {top: 'front', bottom: 'back', left: 'side1', right: 'side1'},
      preAssignedSides: {},
      views: {
        top: [],
        front: [{instanceId: 'front_1', group: frontGroup}],
        back: [],
        side1: [],
        side2: [],
      },
    });

    expect(projection?.elevationViews).toHaveLength(1);
    expect(projection?.elevationViews[0]).toMatchObject({
      bodyLeft: -120,
      bodyWidth: 300,
      stairs: {
        left: -40,
        width: 40,
        heightMts: 1.2,
        stepCount: 4,
      },
    });
  });

  it('mantém escada 3D em escala canônica quando a fachada vem de planta redimensionada', () => {
    const topGroup = createHouseTop({width: 1000, height: 800} as FabricCanvas);
    topGroup.set({scaleX: 2, scaleY: 2});
    const canvas = {
      width: 1000,
      height: 800,
      getObjects: () => [topGroup],
    } as unknown as FabricCanvas;
    const frontGroup = createHouseFrontBack(canvas, true);

    refreshAutoStairsInViews({
      houseType: 'tipo6',
      sideMappings: {top: 'front', bottom: 'back', left: 'side1', right: 'side1'},
      pilotis: {
        piloti_0_0: DEFAULT_HOUSE_PILOTI,
        piloti_1_0: DEFAULT_HOUSE_PILOTI,
        piloti_2_0: DEFAULT_HOUSE_PILOTI,
        piloti_3_0: DEFAULT_HOUSE_PILOTI,
      },
      topView: [],
      elevationViews: [{instanceId: 'front_1', group: frontGroup}],
    });

    const projection = createHouse3DProjectionFromCanvasHouse({
      id: 'house_test',
      houseType: 'tipo6',
      pilotis: {},
      terrainType: 1,
      sideMappings: {top: 'front', bottom: 'back', left: 'side1', right: 'side1'},
      preAssignedSides: {},
      views: {
        top: [],
        front: [{instanceId: 'front_1', group: frontGroup}],
        back: [],
        side1: [],
        side2: [],
      },
    });
    const [frontProjection] = projection?.elevationViews ?? [];
    const parsed = parseStairsFromElevationViews({
      houseType: 'tipo6',
      sideMappings: {top: 'front', bottom: 'back', left: 'side1', right: 'side1'},
      elevationViews: projection?.elevationViews ?? [],
    });

    const expectedDoorWidth = HOUSE_DIMENSIONS.elements.common.doorWidth * HOUSE_DIMENSIONS.view.scale;
    const expectedBodyWidth = HOUSE_DIMENSIONS.footprint.width * HOUSE_DIMENSIONS.view.scale;
    const rawCenterFromLeft =
      Number(frontProjection?.stairs?.left ?? 0)
      - Number(frontProjection?.bodyLeft ?? 0)
      + Number(frontProjection?.stairs?.width ?? 0) / 2;
    const normalizationFactor = expectedBodyWidth / Number(frontProjection?.bodyWidth ?? 1);

    expect(frontProjection?.doorWidth).toBeCloseTo(expectedDoorWidth * 2, 6);
    expect(frontProjection?.stairs?.width ?? 0).toBeGreaterThan(expectedDoorWidth * 2);
    expect(parsed?.stairWidth).toBeCloseTo(Number(frontProjection?.stairs?.width ?? 0) * normalizationFactor, 6);
    expect(parsed?.centerFromLeft).toBeCloseTo(rawCenterFromLeft * normalizationFactor, 6);
    expect(parsed?.stairWidth ?? 0).toBeLessThan(Number(frontProjection?.stairs?.width ?? 0));
    expect(parsed?.centerFromLeft ?? 0).toBeLessThan(rawCenterFromLeft);
  }, 30_000);
});
