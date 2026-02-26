import {HouseElementFace, HouseSide, HouseTypeExcludeNull, HouseViewType,} from '@/shared/types/house.ts';
import {TopDoorMarkerBodySize, TopDoorMarkerVisualPatch, TopDoorPlacement} from '@/shared/types/house-door.ts';
import {HOUSE_DIMENSIONS} from "@/components/lib/house-dimensions.ts";

export function resolveTopDoorSourceViewType(params: {
  houseType: HouseTypeExcludeNull | null;
  doorFace: HouseElementFace;
}): HouseViewType {
  if (params.doorFace === 'front') return 'front';
  if (params.doorFace === 'back') return 'back';
  return params.houseType === 'tipo3' ? 'side2' : 'side1';
}

export function resolveTopDoorMarkerSide(params: {
  houseType: HouseTypeExcludeNull | null;
  doorFace: HouseElementFace | null;
  sideAssignments: Record<HouseSide, HouseViewType | null>;
}): HouseSide | null {
  if (!params.doorFace) return null;

  const sourceViewType = resolveTopDoorSourceViewType({
    houseType: params.houseType,
    doorFace: params.doorFace,
  });

  return (
    (Object.keys(params.sideAssignments) as HouseSide[]).find(
      (side) => params.sideAssignments[side] === sourceViewType,
    ) ?? null
  );
}

export function calculateTopDoorPlacement(params: {
  doorMarkerSide: HouseSide | null;
  doorX: number;
  doorWidth: number;
  bodyWidth: number;
  bodyHeight: number;
}): TopDoorPlacement {
  if (!params.doorMarkerSide) {
    return {doorMarkerSide: null};
  }

  const axisLength =
    params.doorMarkerSide === 'top' || params.doorMarkerSide === 'bottom' ? params.bodyWidth : params.bodyHeight;
  const rawDoorCenter = params.doorX + params.doorWidth / 2;
  const doorCenter = Math.max(0, Math.min(axisLength, rawDoorCenter));

  if (params.doorMarkerSide === 'top') {
    return {
      doorMarkerSide: 'top',
      targetLeft: params.bodyWidth / 2 - doorCenter,
      targetTop: -params.bodyHeight / 2,
    };
  }
  if (params.doorMarkerSide === 'bottom') {
    return {
      doorMarkerSide: 'bottom',
      targetLeft: -params.bodyWidth / 2 + doorCenter,
      targetTop: params.bodyHeight / 2,
    };
  }
  if (params.doorMarkerSide === 'left') {
    return {
      doorMarkerSide: 'left',
      targetLeft: -params.bodyWidth / 2,
      targetTop: -params.bodyHeight / 2 + doorCenter,
    };
  }

  return {
    doorMarkerSide: 'right',
    targetLeft: params.bodyWidth / 2,
    targetTop: params.bodyHeight / 2 - doorCenter,
  };
}

export function calculateRenderedDoorGeometryForTopMarker(params: {
  doorMarkerSide: HouseSide | null;
  bodyWidth: number;
  bodyHeight: number;
}): { doorX: number; doorWidth: number } {
  if (!params.doorMarkerSide) {
    return {doorX: 0, doorWidth: 0};
  }

  const axisLength = params.bodyWidth;
  const scale = axisLength / HOUSE_DIMENSIONS.footprint.width;
  const doorWidth = HOUSE_DIMENSIONS.openings.common.doorWidth * scale;
  const windowWidth = HOUSE_DIMENSIONS.openings.common.windowWidth * scale;
  const windowShiftX = HOUSE_DIMENSIONS.openings.frontBack.windowShiftX * scale;
  const doorShiftX = HOUSE_DIMENSIONS.openings.frontBack.doorShiftX * scale;

  const isFrontBack = params.doorMarkerSide === 'top' || params.doorMarkerSide === 'bottom';
  if (isFrontBack) {
    const doorX = axisLength - windowWidth - windowShiftX - doorWidth - doorShiftX;
    return {doorX, doorWidth};
  } else {
    const doorX = axisLength - doorWidth - doorShiftX;
    return {doorX, doorWidth};
  }
}

export function calculateTopDoorMarkerBodySize(params: {
  width: number;
  height: number;
  scaleX?: number;
  scaleY?: number;
}): TopDoorMarkerBodySize {
  return {
    bodyWidth: Math.max(params.width * (params.scaleX ?? 1), 1),
    bodyHeight: Math.max(params.height * (params.scaleY ?? 1), 1),
  };
}

export function createTopDoorMarkerVisualPatch(params: {
  doorMarkerSide: HouseSide | null;
  markerCandidateSide: HouseSide;
  targetLeft?: number;
  targetTop?: number;
}): TopDoorMarkerVisualPatch {
  const isActive = params.doorMarkerSide !== null && params.markerCandidateSide === params.doorMarkerSide;
  return {
    visible: isActive,
    ...(isActive && params.targetLeft !== undefined ? {left: params.targetLeft} : {}),
    ...(isActive && params.targetTop !== undefined ? {top: params.targetTop} : {}),
  };
}
