import {Group} from 'fabric';
import {toCanvasObject} from '@/components/lib/canvas';
import {HouseSide, HouseTypeExcludeNull, HouseViewInstance, HouseViewType,} from '@/shared/types/house.ts';
import {TopDoorMarkerBodySize, TopDoorMarkerVisualPatch, TopDoorPlacement} from '@/shared/types/house-door.ts';
import {HOUSE_DIMENSIONS} from '@/components/lib/house-dimensions.ts';

export function resolveTopDoorSourceViewType(params: {
  houseType: HouseTypeExcludeNull | null;
}): HouseViewType | null {
  if (params.houseType === 'tipo6') return 'front';
  if (params.houseType === 'tipo3') return 'side2';
  return null;
}

export function resolveTopDoorMarkerSide(params: {
  houseType: HouseTypeExcludeNull | null;
  sideMappings: Record<HouseSide, HouseViewType | null>;
}): HouseSide | null {
  const sourceViewType = resolveTopDoorSourceViewType({
    houseType: params.houseType,
  });
  if (!sourceViewType) return null;

  return (
    (Object.keys(params.sideMappings) as HouseSide[]).find(
      (side) => params.sideMappings[side] === sourceViewType,
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
    params.doorMarkerSide === 'top' || params.doorMarkerSide === 'bottom'
      ? params.bodyWidth
      : params.bodyHeight;

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

  const isFrontBack = params.doorMarkerSide === 'top' || params.doorMarkerSide === 'bottom';
  if (isFrontBack) {
    const axisLength = params.bodyWidth;
    const scale = axisLength / HOUSE_DIMENSIONS.footprint.width;
    const doorWidth = HOUSE_DIMENSIONS.openings.common.doorWidth * scale;
    const windowWidth = HOUSE_DIMENSIONS.openings.common.windowWidth * scale;
    const windowShiftX = HOUSE_DIMENSIONS.openings.frontBack.windowShiftX * scale;
    const doorShiftX = HOUSE_DIMENSIONS.openings.frontBack.doorShiftX * scale;
    const doorX = axisLength - windowWidth - windowShiftX - doorWidth - doorShiftX;
    return {doorX, doorWidth};
  }

  const axisLength = params.bodyHeight;
  const scale = axisLength / HOUSE_DIMENSIONS.footprint.depth;
  const doorWidth = HOUSE_DIMENSIONS.openings.common.doorWidth * scale;
  const doorShiftX = HOUSE_DIMENSIONS.openings.side.doorShiftX * scale;
  const doorX = axisLength - doorWidth - doorShiftX;
  return {doorX, doorWidth};
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

export function refreshTopDoorMarkersInViews(params: {
  houseType: HouseTypeExcludeNull | null;
  sideMappings: Record<HouseSide, HouseViewType | null>;
  topViews: HouseViewInstance<Group>[];
}): boolean {
  const doorMarkerSide = resolveTopDoorMarkerSide({
    houseType: params.houseType,
    sideMappings: params.sideMappings,
  });

  let hasChanges = false;
  for (const topInstance of params.topViews) {
    const group = topInstance.group;
    const groupObjects = group.getObjects();

    const topDoorMarker =
      groupObjects.filter(
        (object) => toCanvasObject(object).isTopDoorMarker
      );
    if (topDoorMarker.length === 0) continue;

    const houseBody =
      groupObjects.find(
        (object) => toCanvasObject(object).isHouseBody
      );
    const canvasObjectHouseBody = houseBody ? toCanvasObject(houseBody) : null;

    const {bodyWidth, bodyHeight} = calculateTopDoorMarkerBodySize({
      width: canvasObjectHouseBody?.width ?? 0,
      height: canvasObjectHouseBody?.height ?? 0,
      scaleX: canvasObjectHouseBody?.scaleX ?? 1,
      scaleY: canvasObjectHouseBody?.scaleY ?? 1,
    });

    const renderedDoorGeometry =
      calculateRenderedDoorGeometryForTopMarker({
        doorMarkerSide,
        bodyWidth,
        bodyHeight,
      });

    const placement = calculateTopDoorPlacement({
      doorMarkerSide,
      doorX: renderedDoorGeometry.doorX,
      doorWidth: renderedDoorGeometry.doorWidth,
      bodyWidth,
      bodyHeight,
    });

    for (const marker of topDoorMarker) {
      const canvasObjectMarker = toCanvasObject(marker);
      const side =
        (canvasObjectMarker as { markerSide?: HouseSide; doorMarkerSide?: HouseSide }).doorMarkerSide;
      if (!side) continue;

      canvasObjectMarker.set(
        createTopDoorMarkerVisualPatch({
          doorMarkerSide: placement.doorMarkerSide,
          markerCandidateSide: side,
          targetLeft: placement.targetLeft,
          targetTop: placement.targetTop,
        }),
      );
      canvasObjectMarker.setCoords?.();
      canvasObjectMarker.dirty = true;
      hasChanges = true;
    }

    group.setCoords();
    group.dirty = true;
  }

  return hasChanges;
}
