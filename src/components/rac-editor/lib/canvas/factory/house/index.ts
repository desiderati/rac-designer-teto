import {Canvas as FabricCanvas} from 'fabric';
import {
  HouseViewStrategy,
  HouseViewStrategyKey,
  HouseViewStrategyOptions
} from '@/components/rac-editor/lib/canvas/factory/house/house.strategy.ts';
import {createHouseTop} from '@/components/rac-editor/lib/canvas/factory/house/house-top.strategy.ts';
import {createHouseFrontBack} from '@/components/rac-editor/lib/canvas/factory/house/house-front-back.strategy.ts';
import {createHouseSide} from '@/components/rac-editor/lib/canvas/factory/house/house-side.strategy.ts';
import {CanvasGroup} from '@/components/rac-editor/lib/canvas';

export function getHouseViewStrategy(
  strategyKey: HouseViewStrategyKey,
): HouseViewStrategy {
  return {
    top: {
      create(canvas: FabricCanvas): CanvasGroup {
        return createHouseTop(canvas);
      },
    },
    front: {
      create(canvas: FabricCanvas, options?: HouseViewStrategyOptions): CanvasGroup {
        return createHouseFrontBack(canvas, true, options?.side === 'top');
      },
    },
    back: {
      create(canvas: FabricCanvas, options?: HouseViewStrategyOptions): CanvasGroup {
        return createHouseFrontBack(canvas, false, options?.side === 'top');
      },
    },
    side1: {
      create(canvas: FabricCanvas, options?: HouseViewStrategyOptions): CanvasGroup {
        return createHouseSide(canvas, false, options?.side === 'right');
      },
    },
    side2: {
      create(canvas: FabricCanvas, options?: HouseViewStrategyOptions): CanvasGroup {
        return createHouseSide(canvas, true, options?.side === 'right');
      },
    },
  }[strategyKey];
}
