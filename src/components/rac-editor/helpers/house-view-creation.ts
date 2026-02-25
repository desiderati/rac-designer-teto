import type {Canvas as FabricCanvas, Group} from "fabric";
import {HouseSide, HouseViewType} from "@/shared/types/house.ts";
import {getHouseViewStrategy} from "@/components/lib/canvas";

export function createHouseGroupForView(params: {
  canvas: FabricCanvas;
  viewType: HouseViewType;
  side?: HouseSide;
}): Group {
  return getHouseViewStrategy(params.viewType).create(params.canvas, {side: params.side});
}
