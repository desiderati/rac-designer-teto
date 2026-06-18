import {Group as FabricGroup, Rect, Text, Triangle} from 'fabric';

import {CANVAS_STYLE, HOUSE_2D_STYLE, HOUSE_DEFAULTS} from '@/shared/config.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';
import {
  HouseRuntimeViewInstance,
  HouseSide,
  HouseType,
  HouseViewInstanceId,
  HouseViewType,
} from '@/shared/types/house.ts';
import {
  CanvasGroup,
  CanvasObject,
  appendCanvasGroupObjects,
  getCanvasGroupObjects,
  refreshCanvasGroup,
  removeCanvasGroupObjectsWhere,
  toCanvasObject
} from '@/components/rac-editor/@canvas/lib/canvas.ts';
import {getElevationViewLabelForHouseType} from '@/components/rac-editor/lib/house-view.ts';

interface HouseViewReferenceMarkerArgs {
  label: string;
  left: number;
  sequence: number;
  top: number;
  scale: number;
}

interface HouseViewPlanReferenceMarkerArgs extends HouseViewReferenceMarkerArgs {
  side: HouseSide;
}

export interface HouseViewReferenceEntry {
  group: CanvasGroup;
  instanceId: HouseViewInstanceId;
  label: string;
  sequence: number;
  side?: HouseSide;
  viewType: Exclude<HouseViewType, 'top'>;
}

const PLAN_MARKER_WIDTH = 42;
const PLAN_MARKER_HEIGHT = 18;
const PLAN_MARKER_EDGE_GAP = 12;
const PLAN_MARKER_LABEL_GAP = 9;
const ELEVATION_LABEL_OFFSET = 20;
const PLAN_MARKER_LABEL_FONT_SIZE = 10.5;
const ELEVATION_LABEL_FONT_SIZE = 16;
const ELEVATION_LABEL_SCALE = HOUSE_DEFAULTS.viewScale;
const ACCENT_COLOR = '#d97706';
const MUTED_COLOR = '#9ca3af';
const ELEVATION_VIEW_TYPES: Exclude<HouseViewType, 'top'>[] = ['front', 'back', 'side1', 'side2'];

export function collectHouseViewReferenceEntries(params: {
  elevationViews: Record<Exclude<HouseViewType, 'top'>, HouseRuntimeViewInstance<CanvasGroup>[]>;
  houseType: HouseType;
}): HouseViewReferenceEntry[] {
  const entries = ELEVATION_VIEW_TYPES.flatMap((viewType) =>
    params.elevationViews[viewType].map((instance) => ({
      group: instance.group,
      instanceId: instance.instanceId,
      label: getElevationViewLabelForHouseType({
        houseType: params.houseType,
        side: instance.side,
        viewType,
      }),
      side: instance.side,
      viewType,
    })),
  );

  return entries
    .sort((a, b) => getViewInstanceOrderValue(a.instanceId) - getViewInstanceOrderValue(b.instanceId))
    .map((entry, index) => ({
      ...entry,
      sequence: index + 1,
    }));
}

export function createHouseElevationReferenceLabel({
  label,
  left,
  sequence,
  top,
  scale,
}: HouseViewReferenceMarkerArgs): CanvasObject {
  const text = new Text(label, {
    fontSize: ELEVATION_LABEL_FONT_SIZE * scale,
    fontFamily: CANVAS_STYLE.fontFamily,
    fontWeight: 'bold',
    fill: HOUSE_2D_STYLE.outlineStrokeColor,
    originX: 'center',
    originY: 'center',
    left,
    top,
    selectable: false,
    evented: false,
  });

  return applyReferenceMarkerMetadata(toCanvasObject(text), {
    label,
    sequence,
  });
}

export function createHousePlanReferenceMarker({
  label,
  left,
  sequence,
  side,
  top,
  scale,
}: HouseViewPlanReferenceMarkerArgs): CanvasObject {
  const markerWidth = PLAN_MARKER_WIDTH * scale;
  const markerHeight = PLAN_MARKER_HEIGHT * scale;
  const markerLayout = getPlanMarkerTextLayout({
    side,
    markerHeight,
    scale,
  });
  const bounds = new Rect({
    width: getPlanMarkerBoundsWidth(side, markerHeight, scale),
    height: getPlanMarkerBoundsHeight(side, markerHeight, markerWidth, label, scale),
    fill: 'transparent',
    stroke: 'transparent',
    strokeWidth: 0,
    originX: 'center',
    originY: 'center',
    left: 0,
    top: 0,
    selectable: false,
    evented: false,
  });

  const triangle = new Triangle({
    width: markerWidth,
    height: markerHeight,
    fill: 'rgba(217, 119, 6, 0.12)',
    stroke: ACCENT_COLOR,
    strokeWidth: Math.max(1, 1.2 * scale),
    strokeUniform: true,
    angle: getTriangleAngleForSide(side),
    originX: 'center',
    originY: 'center',
    left: 0,
    top: 0,
    selectable: false,
    evented: false,
  });

  const labelText = new Text(label, {
    fontSize: PLAN_MARKER_LABEL_FONT_SIZE * scale,
    fontFamily: CANVAS_STYLE.fontFamily,
    fontWeight: 'bold',
    fill: MUTED_COLOR,
    originX: 'center',
    originY: 'center',
    angle: markerLayout.textAngle,
    left: markerLayout.labelLeft,
    top: markerLayout.labelTop,
    selectable: false,
    evented: false,
  });

  const marker = new FabricGroup([bounds, triangle, labelText], {
    left,
    top,
    originX: 'center',
    originY: 'center',
    selectable: false,
    evented: false,
    objectCaching: false,
  });

  return applyReferenceMarkerMetadata(toCanvasObject(marker), {
    label,
    sequence,
    side,
  });
}

export function refreshHouseViewReferenceMarkersInViews(params: {
  elevationViews: Record<Exclude<HouseViewType, 'top'>, HouseRuntimeViewInstance<CanvasGroup>[]>;
  houseType: HouseType;
  topViews: HouseRuntimeViewInstance<CanvasGroup>[];
}): boolean {
  const references = collectHouseViewReferenceEntries({
    elevationViews: params.elevationViews,
    houseType: params.houseType,
  });

  let hasChanges = false;
  for (const topView of params.topViews) {
    const group = topView.group;
    hasChanges = removeHouseViewReferenceMarkersFromGroup(group) || hasChanges;

    const bodySize = calculateTopReferenceBodySize(group);
    const scale = calculateReferenceScale(bodySize.bodyWidth, bodySize.bodyHeight);
    for (const reference of references) {
      if (!reference.side) continue;

      addObjectToGroup(
        group,
        createHousePlanReferenceMarker({
          label: reference.label,
          left: getPlanMarkerLeft(reference.side, bodySize.bodyWidth, scale),
          sequence: reference.sequence,
          side: reference.side,
          top: getPlanMarkerTop(reference.side, bodySize.bodyHeight, scale),
          scale,
        }),
      );
      hasChanges = true;
    }

    refreshGroupBounds(group);
  }

  for (const reference of references) {
    const group = reference.group;
    hasChanges = removeHouseViewReferenceMarkersFromGroup(group) || hasChanges;

    const bounds = calculateObjectBounds(getCanvasGroupObjects(group));
    const scale = calculateElevationReferenceScale(reference.viewType, bounds.width);
    addObjectToGroup(
      group,
      createHouseElevationReferenceLabel({
        label: reference.label,
        left: bounds.left + bounds.width / 2,
        sequence: reference.sequence,
        top: bounds.top - ELEVATION_LABEL_OFFSET * scale,
        scale,
      }),
    );
    refreshGroupBounds(group);
    hasChanges = true;
  }

  return hasChanges;
}

function applyReferenceMarkerMetadata(
  marker: CanvasObject,
  params: {
    label: string;
    sequence: number;
    side?: HouseSide;
  },
): CanvasObject {
  marker.myType = 'houseViewReferenceMarker';
  marker.isHouseViewReferenceMarker = true;
  marker.houseViewReferenceMarkerCode = String(params.sequence);
  marker.houseViewReferenceMarkerLabel = params.label;
  marker.houseViewReferenceMarkerSide = params.side;
  return marker;
}

function calculateTopReferenceBodySize(group: CanvasGroup): { bodyHeight: number; bodyWidth: number } {
  const houseBody = getCanvasGroupObjects(group).find((object) => object.isHouseBody);
  return {
    bodyWidth: Math.max(Number(houseBody?.width ?? 0) * Number(houseBody?.scaleX ?? 1), 1),
    bodyHeight: Math.max(Number(houseBody?.height ?? 0) * Number(houseBody?.scaleY ?? 1), 1),
  };
}

function calculateReferenceScale(width: number, height: number): number {
  const widthScale = width / HOUSE_DIMENSIONS.footprint.width;
  const heightScale = height / HOUSE_DIMENSIONS.footprint.depth;
  const scale = Math.min(widthScale, heightScale);
  return Number.isFinite(scale) && scale > 0 ? scale : HOUSE_DEFAULTS.viewScale;
}

function calculateElevationReferenceScale(
  viewType: Exclude<HouseViewType, 'top'>,
  width: number,
): number {
  const baseWidth =
    viewType === 'front' || viewType === 'back'
      ? HOUSE_DIMENSIONS.footprint.width
      : HOUSE_DIMENSIONS.footprint.depth;
  const scale = width / baseWidth;
  return Number.isFinite(scale) && scale > 0 ? scale : ELEVATION_LABEL_SCALE;
}

function calculateObjectBounds(objects: CanvasObject[]): {
  height: number;
  left: number;
  top: number;
  width: number;
} {
  const drawableObjects = objects.filter((object) => !object.isHouseViewReferenceMarker);
  if (!drawableObjects.length) {
    return {left: 0, top: 0, width: 1, height: 1};
  }

  return drawableObjects.reduce((bounds, object) => {
    const objectBounds = getObjectBounds(object);
    const left = Math.min(bounds.left, objectBounds.left);
    const top = Math.min(bounds.top, objectBounds.top);
    const right = Math.max(bounds.left + bounds.width, objectBounds.left + objectBounds.width);
    const bottom = Math.max(bounds.top + bounds.height, objectBounds.top + objectBounds.height);

    return {
      left,
      top,
      width: right - left,
      height: bottom - top,
    };
  }, getObjectBounds(drawableObjects[0]));
}

function getObjectBounds(object: CanvasObject): {
  height: number;
  left: number;
  top: number;
  width: number;
} {
  const width = Math.max(Number(object.width ?? 0) * Number(object.scaleX ?? 1), 0);
  const height = Math.max(Number(object.height ?? 0) * Number(object.scaleY ?? 1), 0);
  const originX = (object as { originX?: string }).originX;
  const originY = (object as { originY?: string }).originY;
  const left = Number(object.left ?? 0) - (originX === 'center' ? width / 2 : 0);
  const top = Number(object.top ?? 0) - (originY === 'center' ? height / 2 : 0);

  return {left, top, width, height};
}

function getPlanMarkerLeft(side: HouseSide, bodyWidth: number, scale: number): number {
  const markerCenterOffset = getPlanMarkerCenterOffset(scale);
  if (side === 'left') return -bodyWidth / 2 - markerCenterOffset;
  if (side === 'right') return bodyWidth / 2 + markerCenterOffset;
  return 0;
}

function getPlanMarkerTop(side: HouseSide, bodyHeight: number, scale: number): number {
  const markerCenterOffset = getPlanMarkerCenterOffset(scale);
  if (side === 'top') return -bodyHeight / 2 - markerCenterOffset;
  if (side === 'bottom') return bodyHeight / 2 + markerCenterOffset;
  return 0;
}

function getTriangleAngleForSide(side: HouseSide): number {
  if (side === 'top') return 180;
  if (side === 'left') return 90;
  if (side === 'right') return -90;
  return 0;
}

function getPlanMarkerCenterOffset(scale: number): number {
  return (PLAN_MARKER_EDGE_GAP + PLAN_MARKER_HEIGHT / 2) * scale;
}

function getPlanMarkerTextLayout(params: {
  markerHeight: number;
  scale: number;
  side: HouseSide;
}): {
  labelLeft: number;
  labelTop: number;
  textAngle: number;
} {
  const labelGap = PLAN_MARKER_LABEL_GAP * params.scale;
  const labelOffset = params.markerHeight / 2 + labelGap;

  if (params.side === 'top') {
    return {
      labelLeft: 0,
      labelTop: -labelOffset,
      textAngle: 0,
    };
  }

  if (params.side === 'bottom') {
    return {
      labelLeft: 0,
      labelTop: labelOffset,
      textAngle: 0,
    };
  }

  if (params.side === 'left') {
    return {
      labelLeft: -labelOffset,
      labelTop: 0,
      textAngle: 90,
    };
  }

  return {
    labelLeft: labelOffset,
    labelTop: 0,
    textAngle: 90,
  };
}

function getPlanMarkerBoundsWidth(side: HouseSide, markerHeight: number, scale: number): number {
  if (side === 'top' || side === 'bottom') {
    return PLAN_MARKER_WIDTH * scale;
  }

  return markerHeight + 2 * (PLAN_MARKER_LABEL_GAP + PLAN_MARKER_LABEL_FONT_SIZE) * scale;
}

function getPlanMarkerBoundsHeight(side: HouseSide, markerHeight: number, markerWidth: number, label: string, scale: number): number {
  if (side === 'top' || side === 'bottom') {
    return markerHeight + 2 * (PLAN_MARKER_LABEL_GAP + PLAN_MARKER_LABEL_FONT_SIZE) * scale;
  }

  return Math.max(markerWidth, label.length * PLAN_MARKER_LABEL_FONT_SIZE * scale * 0.62);
}

function getViewInstanceOrderValue(instanceId: HouseViewInstanceId): number {
  const rawValue = instanceId.split('_').at(-1);
  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : Number.MAX_SAFE_INTEGER;
}

function removeHouseViewReferenceMarkersFromGroup(group: CanvasGroup): boolean {
  return removeCanvasGroupObjectsWhere(
    group,
    (object) => object.isHouseViewReferenceMarker === true,
    {refresh: false},
  ) > 0;
}

function addObjectToGroup(group: CanvasGroup, object: CanvasObject): void {
  appendCanvasGroupObjects(group, [object], {refresh: false});
}

function refreshGroupBounds(group: CanvasGroup): void {
  refreshCanvasGroup(group, {recalculateBounds: true});
}
