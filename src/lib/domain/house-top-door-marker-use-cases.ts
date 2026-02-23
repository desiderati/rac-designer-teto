import type {DomainHouseType, DomainViewType} from "./house-use-cases";
import type {DomainElementFace} from "./house-elements-use-cases";
import type {DomainHouseSide} from "./house-view-layout-use-cases";

export interface TopDoorPlacement {
  markerSide: DomainHouseSide | null;
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

export function resolveTopDoorSourceViewType(params: {
  houseType: DomainHouseType | null;
  doorFace: DomainElementFace;
}): DomainViewType {
  if (params.doorFace === "front") return "front";
  if (params.doorFace === "back") return "back";
  return params.houseType === "tipo3" ? "side2" : "side1";
}

export function resolveTopDoorMarkerSide(params: {
  houseType: DomainHouseType | null;
  doorFace: DomainElementFace | null;
  sideAssignments: Record<DomainHouseSide, DomainViewType | null>;
}): DomainHouseSide | null {
  if (!params.doorFace) return null;

  const sourceViewType = resolveTopDoorSourceViewType({
    houseType: params.houseType,
    doorFace: params.doorFace,
  });

  return (
    (Object.keys(params.sideAssignments) as DomainHouseSide[]).find(
      (side) => params.sideAssignments[side] === sourceViewType,
    ) ?? null
  );
}

export function calculateTopDoorPlacement(params: {
  markerSide: DomainHouseSide | null;
  doorX: number;
  doorWidth: number;
  bodyWidth: number;
  bodyHeight: number;
}): TopDoorPlacement {
  if (!params.markerSide) {
    return {markerSide: null};
  }

  const axisLength =
    params.markerSide === "top" || params.markerSide === "bottom" ? params.bodyWidth : params.bodyHeight;
  const rawDoorCenter = params.doorX + params.doorWidth / 2;
  const doorCenter = Math.max(0, Math.min(axisLength, rawDoorCenter));

  if (params.markerSide === "top") {
    return {
      markerSide: "top",
      targetLeft: params.bodyWidth / 2 - doorCenter,
      targetTop: -params.bodyHeight / 2,
    };
  }
  if (params.markerSide === "bottom") {
    return {
      markerSide: "bottom",
      targetLeft: -params.bodyWidth / 2 + doorCenter,
      targetTop: params.bodyHeight / 2,
    };
  }
  if (params.markerSide === "left") {
    return {
      markerSide: "left",
      targetLeft: -params.bodyWidth / 2,
      targetTop: -params.bodyHeight / 2 + doorCenter,
    };
  }

  return {
    markerSide: "right",
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
  markerSide: DomainHouseSide | null;
  markerCandidateSide: DomainHouseSide;
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
