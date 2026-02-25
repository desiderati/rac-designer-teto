import {HouseSide} from '@/shared/types/house.ts';

export interface TopDoorPlacement {
  markerSide: HouseSide | null;
  targetLeft?: number;
  targetTop?: number;
}

export interface TopDoorMarkerVisualPatch {
  visible: boolean;
  left?: number;
  top?: number;
}

export interface TopDoorMarkerBodySize {
  bodyWidth: number;
  bodyHeight: number;
}
