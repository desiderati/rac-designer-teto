import {FabricObject, Group, Rect} from 'fabric';
import type {HouseSide} from '@/lib/house-manager';

export type CanvasRuntimeObject = FabricObject & {
  [key: string]: unknown;
  houseViewType?: string;
  houseView?: string;
  myType?: string;
  houseInstanceId?: string;
  isHouseBorderEdge?: boolean;
  edgeSide?: HouseSide;
  dirty?: boolean;
  isPilotiCircle?: boolean;
  isPilotiRect?: boolean;
  isPilotiHitArea?: boolean;
  pilotiId?: string;
  pilotiHeight?: number;
  pilotiIsMaster?: boolean;
  pilotiNivel?: number;
  isContraventamento?: boolean;
  contraventamentoId?: string;
  labelFor?: Rect;
  stroke?: string;
  fill?: string;
  text?: string;
  radius?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  left?: number;
  top?: number;
  angle?: number;
  group?: Group;
  subTargets?: CanvasRuntimeObject[];
  target?: FabricObject | null;
  e?: Event;
  isContentEditable?: boolean;
};

export type CanvasMouseEvent = MouseEvent | PointerEvent | TouchEvent;

export interface CanvasPointerPayload {
  target?: FabricObject | null;
  subTargets?: FabricObject[];
  e?: CanvasMouseEvent;
}
