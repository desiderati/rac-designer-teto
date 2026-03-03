import {PILOTI_MASTER_STYLE, PILOTI_STYLE, PILOTI_VISUAL_FEEDBACK_COLORS} from '@/shared/config.ts';
import {CanvasObject} from "@/components/rac-editor/lib/canvas/canvas.ts";

export interface PilotiObjectIndexEntry<TObject> {
  circle?: TObject;
  rect?: TObject;
}

export type PilotiObjectIndex<TObject> = Record<string, PilotiObjectIndexEntry<TObject>>;

export function buildPilotiObjectIndex<TObject extends CanvasObject>(
  objects: TObject[],
): PilotiObjectIndex<TObject> {
  return objects.reduce((acc, object) => {
    const pilotiId = typeof object.pilotiId === 'string' ? object.pilotiId : '';
    if (!pilotiId) return acc;

    const entry = acc[pilotiId] ?? {};
    if (object.isPilotiCircle && !entry.circle) {
      entry.circle = object;
    }
    if (object.isPilotiRect && !entry.rect) {
      entry.rect = object;
    }
    acc[pilotiId] = entry;
    return acc;
  }, {} as PilotiObjectIndex<TObject>);
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
    if (!isCanvasObject(piloti)) return;
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

function forEachHousePiloti(
  canvasObjects: unknown[],
  callback: (piloti: CanvasObject) => void,
) {
  canvasObjects.forEach((object) => {
    if (!isHouseCanvasObject(object)) return;

    object.getObjects?.().forEach((child) => {
      if (!isCanvasObject(child)) return;
      if (child.isPilotiCircle || child.isPilotiRect) {
        callback(child);
      }
    });
  });
}

function isCanvasObject(value: unknown): value is CanvasObject {
  if (typeof value !== 'object' || value === null) return false;
  const maybePiloti = value as { set?: unknown };
  return typeof maybePiloti.set === 'function';
}

function isHouseCanvasObject(value: unknown): value is CanvasObject {
  if (typeof value !== 'object' || value === null) return false;
  const maybeGroup = value as CanvasObject;
  return maybeGroup.myType === 'house'
    && typeof maybeGroup.getObjects === 'function';
}
