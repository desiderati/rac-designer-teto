import {CanvasObject} from '@/components/rac-editor/lib/canvas/canvas.ts';

export interface WallObjectState {
  currentLabel: string;
}

export function readWallObjectState(
  object: CanvasObject
): WallObjectState {

  let currentLabel = '';

  const groupChildren = object.getObjects?.() ?? [];
  const labelChild =
    groupChildren.find(
      (child) => child?.myType === 'wallLabel'
    );

  if (labelChild?.text) {
    currentLabel = labelChild.text.trim();
  }

  return {currentLabel};
}
