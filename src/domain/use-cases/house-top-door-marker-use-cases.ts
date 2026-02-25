import {
  HouseElementFace,
  HouseSide,
  HouseTypeExcludeNull,
  HouseViewType,
} from '@/shared/types/house.ts';
import {TopDoorMarkerBodySize, TopDoorMarkerVisualPatch, TopDoorPlacement} from '@/shared/types/house-door.ts';

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
  markerSide: HouseSide | null;
  doorX: number;
  doorWidth: number;
  bodyWidth: number;
  bodyHeight: number;
}): TopDoorPlacement {
  if (!params.markerSide) {
    return {markerSide: null};
  }

  const axisLength =
    params.markerSide === 'top' || params.markerSide === 'bottom' ? params.bodyWidth : params.bodyHeight;
  const rawDoorCenter = params.doorX + params.doorWidth / 2;
  const doorCenter = Math.max(0, Math.min(axisLength, rawDoorCenter));

  if (params.markerSide === 'top') {
    return {
      markerSide: 'top',
      targetLeft: params.bodyWidth / 2 - doorCenter,
      targetTop: -params.bodyHeight / 2,
    };
  }
  if (params.markerSide === 'bottom') {
    return {
      markerSide: 'bottom',
      targetLeft: -params.bodyWidth / 2 + doorCenter,
      targetTop: params.bodyHeight / 2,
    };
  }
  if (params.markerSide === 'left') {
    return {
      markerSide: 'left',
      targetLeft: -params.bodyWidth / 2,
      targetTop: -params.bodyHeight / 2 + doorCenter,
    };
  }

  return {
    markerSide: 'right',
    targetLeft: params.bodyWidth / 2,
    targetTop: params.bodyHeight / 2 - doorCenter,
  };
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
  markerSide: HouseSide | null;
  markerCandidateSide: HouseSide;
  targetLeft?: number;
  targetTop?: number;
}): TopDoorMarkerVisualPatch {
  const isActive = params.markerSide !== null && params.markerCandidateSide === params.markerSide;
  return {
    visible: isActive,
    ...(isActive && params.targetLeft !== undefined ? {left: params.targetLeft} : {}),
    ...(isActive && params.targetTop !== undefined ? {top: params.targetTop} : {}),
  };
}
