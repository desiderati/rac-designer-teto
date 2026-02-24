import {FabricObject, Group} from 'fabric';
import type {HouseSide} from '@/lib/house-manager';

export type CanvasRuntimeObject = FabricObject & {
  //[key: string]: unknown;

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

  getObjects?: () => CanvasRuntimeObject[];

  houseViewType?: string;
  houseView?: string;
  houseInstanceId?: string;
  isHouseBorderEdge?: boolean;
  edgeSide?: HouseSide;

  isPilotiCircle?: boolean;
  isPilotiRect?: boolean;
  isPilotiHitArea?: boolean;
  pilotiId?: string;
  pilotiHeight?: number;
  pilotiIsMaster?: boolean;
  pilotiNivel?: number;

  isContraventamento?: boolean;
  contraventamentoId?: string;

  group?: Group;
  target?: FabricObject | null;
  e?: Event;

  dirty?: boolean;
  isContentEditable?: boolean;
};

export type CanvasMouseEvent = MouseEvent | PointerEvent | TouchEvent;

export interface CanvasPointerPayload {
  target?: FabricObject | null;
  subTargets?: FabricObject[];
  e?: CanvasMouseEvent;
}
