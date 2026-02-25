import {FabricObject, Group} from 'fabric';
import type {HouseSide} from '@/shared/types/house.ts';
import {ContraventamentoSide} from "@/shared/types/contraventamento.ts";

export type CanvasObject = FabricObject & {
  //[key: string]: unknown;

  isMacroGroup?: boolean;
  myType?: string;
  type?: string;
  text?: string;

  width?: number;
  height?: number;
  left?: number;
  top?: number;
  angle?: number;

  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;

  scaleX?: number;
  scaleY?: number;
  visible?: boolean;
  baseWidth?: number;
  baseHeight?: number;

  radius?: number;
  fill?: string;
  stroke?: string;

  getObjects?: () => CanvasObject[];

  houseViewType?: string;
  houseView?: string;
  houseInstanceId?: string;
  houseSide?: HouseSide;
  isHouseBody?: boolean;
  isHouseBorderEdge?: boolean;
  edgeSide?: HouseSide;

  isPilotiCircle?: boolean;
  isPilotiRect?: boolean;
  isPilotiText?: boolean;
  isPilotiHitArea?: boolean;
  isPilotiNivelText?: boolean;
  isPilotiSizeLabel?: boolean;
  isPilotiStripe?: boolean;
  pilotiId?: string;
  pilotiHeight?: number;
  pilotiBaseHeight?: number;
  pilotiIsMaster?: boolean;
  pilotiNivel?: number;
  isTopDoorMarker?: boolean;
  markerSide?: HouseSide;

  isGroundElement?: boolean;
  isGroundLine?: boolean;
  isGroundSegment?: boolean;
  isGroundFill?: boolean;
  isNivelMarker?: boolean;
  isNivelLabel?: boolean;
  groundSeed?: number;

  isRightSide?: boolean;
  isFlippedHorizontally?: boolean;

  isContraventamento?: boolean;
  isContraventamentoElevation?: boolean;
  contraventamentoId?: string;
  contraventamentoCol?: number | string;
  contraventamentoStartRow?: number;
  contraventamentoEndRow?: number;
  contraventamentoAnchorPilotiId?: string;
  contraventamentoSourcePilotiId?: string;
  contraventamentoSide?: ContraventamentoSide;

  group?: Group;
  target?: FabricObject | null;
  e?: Event;

  dirty?: boolean;
  isContentEditable?: boolean;
};

export type CanvasObjectProps = Exclude<keyof CanvasObject, keyof FabricObject>;

export const canvasObjectProps = [
  "isMacroGroup",
  "myType",
  "houseViewType",
  "houseView",
  "houseInstanceId",
  "houseSide",
  "isHouseBody",
  "isHouseBorderEdge",
  "edgeSide",
  "isPilotiCircle",
  "isPilotiRect",
  "isPilotiText",
  "isPilotiHitArea",
  "isPilotiNivelText",
  "isPilotiSizeLabel",
  "isPilotiStripe",
  "pilotiId",
  "pilotiHeight",
  "pilotiBaseHeight",
  "pilotiIsMaster",
  "pilotiNivel",
  "isTopDoorMarker",
  "markerSide",
  "isGroundElement",
  "isGroundLine",
  "isGroundSegment",
  "isGroundFill",
  "isNivelMarker",
  "isNivelLabel",
  "groundSeed",
  "isRightSide",
  "isFlippedHorizontally",
  "isContraventamento",
  "isContraventamentoElevation",
  "contraventamentoId",
  "contraventamentoCol",
  "contraventamentoStartRow",
  "contraventamentoEndRow",
  "contraventamentoAnchorPilotiId",
  "contraventamentoSourcePilotiId",
  "contraventamentoSide",
] as const satisfies readonly CanvasObjectProps[];

export interface CanvasObjectSummary {
  type: string | null;
  myType: string | null;
}

export type CanvasMouseEvent = MouseEvent | PointerEvent | TouchEvent;

export interface CanvasPointerPayload {
  target?: FabricObject | null;
  subTargets?: FabricObject[];
  e?: CanvasMouseEvent;
}

export interface CanvasPosition {
  x: number;
  y: number;
  zoom: number;
}
