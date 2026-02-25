import {CanvasObject} from '@/components/lib/canvas/canvas.ts';

export interface LinearObjectState {
  currentColor: string;
  currentLabel: string;
}

export function readLinearObjectState(
  object: CanvasObject
): LinearObjectState {

  let currentColor = '#000000';
  let currentLabel = '';

  const groupChildren = object.getObjects?.() ?? [];
  const labelChild =
    groupChildren.find(
      (child) => child?.myType === 'objLabel'
    );

  if (labelChild?.fill) {
    currentColor = labelChild.fill;
  }

  if (labelChild?.text) {
    currentLabel = labelChild.text.trim();
  }

  return {currentColor, currentLabel};
}
