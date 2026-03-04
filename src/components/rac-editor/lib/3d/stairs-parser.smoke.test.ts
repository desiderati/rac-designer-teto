import {describe, expect, it} from 'vitest';
import {parseStairsFromElevationViews} from '@/components/rac-editor/lib/3d/stairs-parser.ts';

function createGroupWithStairs(params: {
  bodyWidth: number;
  includeBody?: boolean;
  doorWidth?: number;
  stairWidth: number;
  stairLeft: number;
  stairHeightMts: number;
  stepCount: number;
  houseInstanceId: string;
}) {
  const objects: any[] = [];

  if (params.includeBody ?? true) {
    objects.push({
      isHouseBody: true,
      width: params.bodyWidth,
      scaleX: 1,
    });
  }

  if (Number.isFinite(Number(params.doorWidth))) {
    objects.push({
      isHouseDoor: true,
      width: Number(params.doorWidth),
      scaleX: 1,
    });
  }

  objects.push({
    isAutoStairs: true,
    width: params.stairWidth,
    scaleX: 1,
    left: params.stairLeft,
    stairsHeight: params.stairHeightMts,
    stairsStepCount: params.stepCount,
  });

  return {
    type: 'group',
    houseInstanceId: params.houseInstanceId,
    getCanvasObjects: () => objects,
    getObjects: () => objects,
    _objects: objects,
  } as any;
}

describe('stairs-parser.ts', () => {
  it('mapeia escada de tipo6 para a face frontal correta', () => {
    const parsed = parseStairsFromElevationViews({
      houseType: 'tipo6',
      sideMappings: {
        top: 'front',
        bottom: 'back',
        left: 'side1',
        right: 'side1',
      },
      elevationViews: [{
        viewType: 'front',
        group: createGroupWithStairs({
          bodyWidth: 300,
          stairWidth: 40,
          stairLeft: 80,
          stairHeightMts: 1.2,
          stepCount: 4,
          houseInstanceId: 'front_1',
        }),
      }],
    });

    expect(parsed).toBeTruthy();
    expect(parsed).toMatchObject({
      face: 'front',
      stairWidth: 40,
      stairHeightMts: 1.2,
      stepCount: 4,
      centerFromLeft: 250,
    });
  });

  it('mapeia escada de tipo3 (side2 a esquerda no 2D) para face direita no 3D', () => {
    const parsed = parseStairsFromElevationViews({
      houseType: 'tipo3',
      sideMappings: {
        top: 'back',
        bottom: 'back',
        left: 'side2',
        right: 'side1',
      },
      elevationViews: [{
        viewType: 'side2',
        group: createGroupWithStairs({
          bodyWidth: 150,
          stairWidth: 40,
          stairLeft: 20,
          stairHeightMts: 0.9,
          stepCount: 3,
          houseInstanceId: 'side2_1',
        }),
      }],
    });

    expect(parsed).toBeTruthy();
    expect(parsed?.face).toBe('right');
  });

  it('usa fallback da largura da fachada via porta quando nao existe isHouseBody na elevacao', () => {
    const parsed = parseStairsFromElevationViews({
      houseType: 'tipo6',
      sideMappings: {
        top: 'front',
        bottom: 'back',
        left: 'side1',
        right: 'side1',
      },
      elevationViews: [{
        viewType: 'front',
        group: createGroupWithStairs({
          bodyWidth: 0,
          includeBody: false,
          doorWidth: 40,
          stairWidth: 40,
          stairLeft: 80,
          stairHeightMts: 1.2,
          stepCount: 4,
          houseInstanceId: 'front_2',
        }),
      }],
    });

    expect(parsed).toBeTruthy();
    expect(parsed?.centerFromLeft).toBe(252.5);
  });
});
