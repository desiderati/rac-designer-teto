export const RAC_CANVAS_OBJECT_INSERTED_EVENT = 'rac:canvas-object-inserted';
export const RAC_CANVAS_OBJECT_SELECTED_EVENT = 'rac:canvas-object-selected';
export const RAC_HOUSE_INITIAL_VIEWS_INSERTED_EVENT = 'rac:house-top-view-inserted';
export const RAC_HOUSE_INITIAL_VIEWS_ELEVATION_INSERTED_EVENT = 'rac:house-elevation-view-inserted';

export type RacCanvasObjectEventKind =
  | 'wall'
  | 'line'
  | 'arrow'
  | 'distance'
  | 'text'
  | 'freehand'
  | 'piloti'
  | 'piloti-master'
  | 'house-top-view-inserted'
  | 'house-elevation-view-inserted';

interface RacCanvasObjectEventRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface RacCanvasObjectEventDetail {
  kind: RacCanvasObjectEventKind;
  rect?: RacCanvasObjectEventRect;
  targets?: Record<string, RacCanvasObjectEventRect>;
}

export function dispatchRacCanvasObjectEvent(eventName: string, detail: RacCanvasObjectEventDetail): void {
  document.dispatchEvent(new CustomEvent<RacCanvasObjectEventDetail>(eventName, {detail}));
}

/** Agenda a dica apenas depois de Fabric concluir e entregar o novo traço. */
export function queueCompletedFreehandTip(
  bounds: {left: number; top: number; width: number; height: number},
  getScreenPoint: (point: {x: number; y: number}) => {x: number; y: number} | null,
): void {
  const topLeft = getScreenPoint({x: bounds.left, y: bounds.top});
  const bottomRight = getScreenPoint({x: bounds.left + bounds.width, y: bounds.top + bounds.height});
  if (!topLeft || !bottomRight) return;
  window.setTimeout(() => dispatchRacCanvasObjectEvent(RAC_CANVAS_OBJECT_INSERTED_EVENT, {
    kind: 'freehand',
    rect: {
      left: Math.min(topLeft.x, bottomRight.x),
      top: Math.min(topLeft.y, bottomRight.y),
      width: Math.max(1, Math.abs(bottomRight.x - topLeft.x)),
      height: Math.max(1, Math.abs(bottomRight.y - topLeft.y)),
    },
  }), 0);
}
