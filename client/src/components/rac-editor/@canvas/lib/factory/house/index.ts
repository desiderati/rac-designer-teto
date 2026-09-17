import {Canvas as FabricCanvas} from 'fabric';
import {
  HouseViewStrategy,
  HouseViewStrategyKey,
  HouseViewStrategyOptions
} from '@/components/rac-editor/@canvas/lib/factory/house/house.strategy.ts';
import {createHouseTop} from '@/components/rac-editor/@canvas/lib/factory/house/house-top.strategy.ts';
import {createHouseFrontBack} from '@/components/rac-editor/@canvas/lib/factory/house/house-front-back.strategy.ts';
import {createHouseSide} from '@/components/rac-editor/@canvas/lib/factory/house/house-side.strategy.ts';
import {CanvasGroup} from '@/components/rac-editor/@canvas/lib';

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
        return createHouseFrontBack(canvas, true, options?.side === 'top', options?.side);
      },
    },
    back: {
      create(canvas: FabricCanvas, options?: HouseViewStrategyOptions): CanvasGroup {
        return createHouseFrontBack(canvas, false, options?.side === 'top', options?.side);
      },
    },
    side1: {
      create(canvas: FabricCanvas, options?: HouseViewStrategyOptions): CanvasGroup {
        return createHouseSide(canvas, false, options?.side === 'right', options?.side);
      },
    },
    side2: {
      create(canvas: FabricCanvas, options?: HouseViewStrategyOptions): CanvasGroup {
        return createHouseSide(canvas, true, options?.side === 'right', options?.side);
      },
    },
  }[strategyKey];
}
