import type {Canvas as FabricCanvas} from 'fabric';
import type {HouseSide, HouseViewType} from '@/shared/types/house.ts';
import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import {getHouseViewStrategy} from '@/components/rac-editor/@canvas/lib';

export function createHouseGroupForView(params: {
  canvas: FabricCanvas;
  viewType: HouseViewType;
  side?: HouseSide;
}): CanvasGroup {
  return getHouseViewStrategy(params.viewType).create(params.canvas, {side: params.side});
}
