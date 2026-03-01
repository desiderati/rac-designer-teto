import {PILOTI_MASTER_STYLE, PILOTI_STYLE, PILOTI_VISUAL_FEEDBACK_COLORS} from '@/shared/config.ts';

export interface PilotiObjectLike {
  isPilotiCircle?: boolean;
  isPilotiRect?: boolean;
  pilotiId?: string;
  pilotiIsMaster?: boolean;
  set: (patch: Record<string, unknown>) => void;
}

interface HouseGroupLikeObject {
  type?: unknown;
  myType?: unknown;
  getObjects?: () => unknown[];
}

function isPilotiObjectLike(value: unknown): value is PilotiObjectLike {
  if (typeof value !== 'object' || value === null) return false;
  const maybePiloti = value as { set?: unknown };
  return typeof maybePiloti.set === 'function';
}

function isHouseGroupLikeObject(value: unknown): value is HouseGroupLikeObject {
  if (typeof value !== 'object' || value === null) return false;
  const maybeGroup = value as HouseGroupLikeObject;
  return maybeGroup.myType === 'house'
    && typeof maybeGroup.getObjects === 'function';
}

function forEachHousePiloti(
  canvasObjects: unknown[],
  callback: (piloti: PilotiObjectLike) => void,
) {
  canvasObjects.forEach((object) => {
    if (!isHouseGroupLikeObject(object)) return;

    object.getObjects?.().forEach((child) => {
      if (!isPilotiObjectLike(child)) return;
      if (child.isPilotiCircle || child.isPilotiRect) {
        callback(child);
      }
    });
  });
}

export function highlightAllHousePilotis(canvasObjects: unknown[]): void {
  forEachHousePiloti(canvasObjects, (piloti) => {
    piloti.set({
      stroke: PILOTI_VISUAL_FEEDBACK_COLORS.emphasizedStrokeColor,
      strokeWidth: piloti.isPilotiRect
        ? PILOTI_STYLE.selectedStrokeWidth
        : PILOTI_STYLE.selectedStrokeWidthTopView,
    });
  });
}

export function highlightPilotiAcrossViews(
  canvasObjects: unknown[],
  pilotiId: string,
): void {
  forEachHousePiloti(canvasObjects, (piloti) => {
    if (piloti.pilotiId !== pilotiId) return;
    piloti.set({
      stroke: PILOTI_VISUAL_FEEDBACK_COLORS.focusedStrokeColor,
      strokeWidth: piloti.isPilotiRect
        ? PILOTI_STYLE.selectedStrokeWidth
        : PILOTI_STYLE.selectedStrokeWidthTopView,
    });
  });
}

export function applyPilotiSelectionVisuals(
  canvasObjects: unknown[],
  pilotiId: string,
): void {
  highlightAllHousePilotis(canvasObjects);
  highlightPilotiAcrossViews(canvasObjects, pilotiId);
}

export function applyPilotiEditorCloseVisuals(params: {
  groupObjects: unknown[];
  houseStillSelected: boolean;
}): void {
  params.groupObjects.forEach((piloti) => {
    if (!isPilotiObjectLike(piloti)) return;
    if (!(piloti.isPilotiCircle || piloti.isPilotiRect)) return;

    if (params.houseStillSelected) {
      piloti.set({
        stroke: PILOTI_VISUAL_FEEDBACK_COLORS.emphasizedStrokeColor,
        strokeWidth: piloti.isPilotiRect
          ? PILOTI_STYLE.selectedStrokeWidth
          : PILOTI_STYLE.selectedStrokeWidthTopView,
      });
      return;
    }

    if (piloti.pilotiIsMaster) {
      piloti.set({
        stroke: PILOTI_MASTER_STYLE.strokeColor,
        strokeWidth: piloti.isPilotiRect
          ? PILOTI_MASTER_STYLE.strokeWidth
          : PILOTI_MASTER_STYLE.strokeWidthTopView,
      });
      return;
    }

    piloti.set({
      stroke: PILOTI_STYLE.strokeColor,
      strokeWidth: piloti.isPilotiRect
        ? PILOTI_STYLE.strokeWidth
        : PILOTI_STYLE.strokeWidthTopView,
    });
  });
}
