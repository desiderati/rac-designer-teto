import {describe, expect, it} from 'vitest';
import {getHouseScaleFactors} from './shared.ts';
import {HOUSE_BASE_HEIGHT, HOUSE_BASE_WIDTH} from '@/shared/constants.ts';
import {Canvas as FabricCanvas} from 'fabric';
import {CanvasObject} from '@/components/rac-editor/lib/canvas/canvas.ts';

describe('house factory shared', () => {
  it('derives scale factors from top view group', () => {
    const houseBody = {
      isHouseBody: true,
      width: 200,
      height: 100,
      scaleX: 1,
      scaleY: 1,
    } as CanvasObject;
    const topGroup = {
      type: 'group',
      myType: 'house',
      houseView: 'top',
      scaleX: 2,
      scaleY: 2,
      getObjects: () => [houseBody],
    } as CanvasObject;
    const canvas = {getObjects: () => [topGroup]} as unknown as FabricCanvas;

    const result = getHouseScaleFactors(canvas);
    expect(result.actualWidth).toBe(400);
    expect(result.actualHeight).toBe(200);
    expect(result.widthFactor).toBeCloseTo(400 / HOUSE_BASE_WIDTH, 5);
    expect(result.depthFactor).toBeCloseTo(200 / HOUSE_BASE_HEIGHT, 5);
  });
});

