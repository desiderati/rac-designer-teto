import {FabricObject, Group} from 'fabric';
import {HouseSide, HouseViewType} from '@/shared/types/house.ts';
import {ContraventamentoSide} from '@/shared/types/contraventamento.ts';

export type CanvasGroup = Group & {
  houseInstanceId?: string;
  houseViewType?: HouseViewType;
  houseSide?: HouseSide;
};

export function toCanvasGroup(group: Group): CanvasGroup {
  return group as CanvasGroup;
}

export type CanvasObject = FabricObject & {
  // Internal Fabric properties and methods
  _objects?: FabricObject[];
  _clearCache?: () => void;
  _calcBounds?: () => void;

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
  objectCaching?: boolean;

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
  doorMarkerSide?: HouseSide;
  isHouseDoor?: boolean;

  isGroundElement?: boolean;
  isGroundLine?: boolean;
  isGroundSegment?: boolean;
  isGroundFill?: boolean;
  isNivelMarker?: boolean;
  isNivelLabel?: boolean;
  groundSeed?: number;
  groundTerrainType?: number;
  isTerrainRachao?: boolean;
  isTerrainSideGravel?: boolean;
  isTerrainEditTarget?: boolean;
  isAutoStairs?: boolean;
  stairsStepCount?: number;
  stairsHeight?: number;
  stairsNivelLeft?: number;
  stairsNivelRight?: number;

  isRightSide?: boolean;
  isFlippedHorizontally?: boolean;

  isContraventamento?: boolean;
  isAutoContraventamento?: boolean;
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

// Extend FabricObject prototype to include custom properties in serialization
const originalToObject = FabricObject.prototype.toObject;
FabricObject.prototype.toObject = function (propertiesToInclude: string[] = []) {
  return originalToObject.call(this, [...canvasObjectProps, ...propertiesToInclude]);
};

export function toCanvasObject(object: FabricObject | null | undefined): CanvasObject | null {
  if (!object) return null;
  return object as CanvasObject;
}

export function toCanvasChildrenObjects(object: FabricObject): CanvasObject[] {
  return (object as Group).getObjects()
    .map((child) => toCanvasObject(child))
    .filter((child): child is CanvasObject => child !== null);
}

export type CanvasObjectProps = Exclude<keyof CanvasObject, keyof FabricObject>;

export const canvasObjectProps = [
  'isMacroGroup',
  'myType',
  'houseViewType',
  'houseView',
  'houseInstanceId',
  'houseSide',
  'isHouseBody',
  'isHouseBorderEdge',
  'edgeSide',
  'isPilotiCircle',
  'isPilotiRect',
  'isPilotiText',
  'isPilotiHitArea',
  'isPilotiNivelText',
  'isPilotiSizeLabel',
  'isPilotiStripe',
  'pilotiId',
  'pilotiHeight',
  'pilotiBaseHeight',
  'pilotiIsMaster',
  'pilotiNivel',
  'isTopDoorMarker',
  'doorMarkerSide',
  'isHouseDoor',
  'isGroundElement',
  'isGroundLine',
  'isGroundSegment',
  'isGroundFill',
  'isNivelMarker',
  'isNivelLabel',
  'groundSeed',
  'groundTerrainType',
  'isTerrainRachao',
  'isTerrainSideGravel',
  'isTerrainEditTarget',
  'isAutoStairs',
  'stairsStepCount',
  'stairsHeight',
  'stairsNivelLeft',
  'stairsNivelRight',
  'isRightSide',
  'isFlippedHorizontally',
  'isContraventamento',
  'isAutoContraventamento',
  'isContraventamentoElevation',
  'contraventamentoId',
  'contraventamentoCol',
  'contraventamentoStartRow',
  'contraventamentoEndRow',
  'contraventamentoAnchorPilotiId',
  'contraventamentoSourcePilotiId',
  'contraventamentoSide',
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
