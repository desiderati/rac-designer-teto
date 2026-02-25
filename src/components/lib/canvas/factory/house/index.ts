import {Canvas as FabricCanvas, Group} from 'fabric';
import {
  HouseViewStrategy,
  HouseViewStrategyKey,
  HouseViewStrategyOptions
} from '@/components/lib/canvas/factory/house/house.straregy.ts';
import {createHouseTop} from '@/components/lib/canvas/factory/house/house-top.straregy.ts';
import {createHouseFrontBack} from '@/components/lib/canvas/factory/house/house-front-back.strategy.ts';
import {createHouseSide} from '@/components/lib/canvas/factory/house/house-side.strategy.ts';

export function getHouseViewStrategy(
  strategyKey: HouseViewStrategyKey,
): HouseViewStrategy {
  return {
    top: {
      create(canvas: FabricCanvas): Group {
        return createHouseTop(canvas);
      },
    },
    front: {
      create(canvas: FabricCanvas, options?: HouseViewStrategyOptions): Group {
        return createHouseFrontBack(canvas, true, options?.side === 'top');
      },
    },
    back: {
      create(canvas: FabricCanvas, options?: HouseViewStrategyOptions): Group {
        return createHouseFrontBack(canvas, false, options?.side === 'top');
      },
    },
    side1: {
      create(canvas: FabricCanvas, options?: HouseViewStrategyOptions): Group {
        return createHouseSide(canvas, false, options?.side === 'right');
      },
    },
    side2: {
      create(canvas: FabricCanvas, options?: HouseViewStrategyOptions): Group {
        return createHouseSide(canvas, true, options?.side === 'right');
      },
    },
  }[strategyKey];
}
