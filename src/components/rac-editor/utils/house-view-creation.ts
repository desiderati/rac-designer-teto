import type {Canvas as FabricCanvas, Group} from "fabric";
import type {HouseSide, ViewType} from "@/lib/house-manager";

export interface HouseViewFactories {
  createHouseTop: (canvas: FabricCanvas) => Group;
  createHouseFrontBack: (canvas: FabricCanvas, isFront: boolean, flipHorizontal?: boolean) => Group;
  createHouseSide: (canvas: FabricCanvas, isSide2: boolean, flipHorizontal?: boolean) => Group;
}

export function createHouseGroupForView(params: {
  canvas: FabricCanvas;
  viewType: ViewType;
  side?: HouseSide;
  factories: HouseViewFactories;
}): Group {
  switch (params.viewType) {
    case "top":
      return params.factories.createHouseTop(params.canvas);

    case "front":
      return params.factories.createHouseFrontBack(params.canvas, true, params.side === "top");

    case "back":
      return params.factories.createHouseFrontBack(params.canvas, false, params.side === "top");

    case "side1":
      return params.factories.createHouseSide(params.canvas, false, params.side === "right");

    case "side2":
      return params.factories.createHouseSide(params.canvas, true, params.side === "right");
  }
}
