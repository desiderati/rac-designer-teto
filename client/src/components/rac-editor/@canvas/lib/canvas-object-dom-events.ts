export const RAC_CANVAS_OBJECT_INSERTED_EVENT = 'rac:canvas-object-inserted';
export const RAC_CANVAS_OBJECT_SELECTED_EVENT = 'rac:canvas-object-selected';
export const RAC_HOUSE_INITIAL_VIEWS_INSERTED_EVENT = 'rac:house-top-view-inserted';
export const RAC_HOUSE_INITIAL_VIEWS_ELEVATION_INSERTED_EVENT = 'rac:house-elevation-view-inserted';

export type RacCanvasObjectEventKind =
  | 'wall'
  | 'line'
  | 'arrow'
  | 'distance'
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
