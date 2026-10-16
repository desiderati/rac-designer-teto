import {isSiteLabelEditorType} from '@shared/types/site-element.ts';
import {CANVAS_ELEMENT_STYLE} from '@/shared/config.ts';
import type {CanvasObject} from '@/components/rac-editor/@canvas/lib/canvas.ts';

export interface WallObjectState {
  currentColor: string;
  currentLabel: string;
}

export interface LinearObjectState {
  currentColor: string;
  currentLabel: string;
}

export function readWallObjectState(object: CanvasObject): WallObjectState {
  const groupChildren = object.getObjects?.() ?? [];
  const labelChild =
    groupChildren.find(
      (child) => child?.myType === (isSiteLabelEditorType(object.myType) ? 'siteLabel' : 'wallLabel')
    );
  const wallBody = groupChildren.find(
    (child) => child?.myType === 'wallBody' || child?.myType === 'siteBody' || child?.myType === 'fenceWire'
  );

  const currentLabel = labelChild?.text?.trim() ?? '';
  const currentColor =
    typeof wallBody?.stroke === 'string'
      ? wallBody.stroke
      : isSiteLabelEditorType(object.myType) && typeof labelChild?.fill === 'string'
        ? labelChild.fill
        : CANVAS_ELEMENT_STYLE.strokeColor.wallElement;

  return {currentColor, currentLabel};
}

export function readLinearObjectState(object: CanvasObject): LinearObjectState {
  const groupChildren = object.getObjects?.() ?? [];
  const labelChild =
    groupChildren.find(
      (child) => child?.myType === 'objLabel'
    );

  const currentColor =
    typeof labelChild?.fill === 'string'
      ? labelChild.fill
      : CANVAS_ELEMENT_STYLE.strokeColor.linearElement;
  const currentLabel = labelChild?.text?.trim() ?? '';

  return {currentColor, currentLabel};
}
