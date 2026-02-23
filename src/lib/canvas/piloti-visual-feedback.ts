export interface PilotiLikeObject {
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

function isPilotiLikeObject(value: unknown): value is PilotiLikeObject {
  if (typeof value !== "object" || value === null) return false;
  const maybePiloti = value as { set?: unknown };
  return typeof maybePiloti.set === "function";
}

function isHouseGroupLikeObject(value: unknown): value is HouseGroupLikeObject {
  if (typeof value !== "object" || value === null) return false;
  const maybeGroup = value as HouseGroupLikeObject;
  return maybeGroup.type === "group" && maybeGroup.myType === "house" && typeof maybeGroup.getObjects === "function";
}

function forEachHousePiloti(
  canvasObjects: unknown[],
  callback: (piloti: PilotiLikeObject) => void,
) {
  canvasObjects.forEach((object) => {
    if (!isHouseGroupLikeObject(object)) return;

    object.getObjects?.().forEach((child) => {
      if (!isPilotiLikeObject(child)) return;
      if (child.isPilotiCircle || child.isPilotiRect) {
        callback(child);
      }
    });
  });
}

export function highlightAllHousePilotis(canvasObjects: unknown[]): void {
  forEachHousePiloti(canvasObjects, (piloti) => {
    piloti.set({
      stroke: "#facc15",
      strokeWidth: piloti.isPilotiRect ? 4 : 3,
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
      stroke: "#3b82f6",
      strokeWidth: piloti.isPilotiRect ? 5 : 4,
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
    if (!isPilotiLikeObject(piloti)) return;
    if (!(piloti.isPilotiCircle || piloti.isPilotiRect)) return;

    if (params.houseStillSelected) {
      piloti.set({
        stroke: "#facc15",
        strokeWidth: piloti.isPilotiRect ? 4 : 3,
      });
      return;
    }

    if (piloti.pilotiIsMaster) {
      piloti.set({
        stroke: "#8B4513",
        strokeWidth: piloti.isPilotiRect ? 3 : 2,
      });
      return;
    }

    piloti.set({
      stroke: piloti.isPilotiRect ? "#333" : "black",
      strokeWidth: piloti.isPilotiRect ? 2 : 1.5 * 0.6,
    });
  });
}
