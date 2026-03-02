import {CanvasObject} from '@/components/rac-editor/lib/canvas/canvas.ts';
import {CANVAS_ELEMENT_STYLE} from '@/shared/config.ts';

export interface LinearObjectState {
  currentColor: string;
  currentLabel: string;
}

export function readLinearObjectState(
  object: CanvasObject
): LinearObjectState {

  let currentColor: string = CANVAS_ELEMENT_STYLE.strokeColor.linearElement;
  let currentLabel = '';

  const groupChildren = object.getObjects?.() ?? [];
  const labelChild =
    groupChildren.find(
      (child) => child?.myType === 'objLabel'
    );

  if (typeof labelChild?.fill === 'string') {
    currentColor = labelChild.fill;
  }

  if (labelChild?.text) {
    currentLabel = labelChild.text.trim();
  }

  return {currentColor, currentLabel};
}



