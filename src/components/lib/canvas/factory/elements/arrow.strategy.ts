import {Canvas as FabricCanvas, Group as FabricGroup, IText, Rect, Triangle} from 'fabric';
import {ElementStrategy} from './element.strategy.ts';
import {LINEAR_LABEL_TOP, setCanvasGroupMyType, setCanvasObjectMyType, withScalingGuard} from './shared.ts';
import {CanvasGroup} from '@/components/lib/canvas/canvas.ts';
import {CANVAS_ELEMENT_STYLE, CANVAS_STYLE} from '@/shared/config.ts';

export const arrowStrategy: ElementStrategy = {
  create(canvas: FabricCanvas): CanvasGroup {
    const arrowColor = CANVAS_ELEMENT_STYLE.strokeColor.linearElement;
    const objLabel = '';
    const width = 200;
    const headSize = 15;
    const initialShaftWidth = Math.max(width - headSize, 1);

    const line = new Rect({
      width: initialShaftWidth,
      height: CANVAS_ELEMENT_STYLE.strokeWidth,
      fill: arrowColor,
      originX: 'center',
      originY: 'center',
      left: -headSize / 2,
    });
    const lineObjet = setCanvasObjectMyType(line, 'arrowBody');

    const head = new Triangle({
      width: headSize,
      height: headSize,
      fill: arrowColor,
      angle: 90,
      left: width / 2 - headSize / 2,
      originX: 'center',
      originY: 'center',
    });
    const headObject = setCanvasObjectMyType(head, 'arrowHead');

    const textLabel = new IText(objLabel, {
      fontSize: CANVAS_STYLE.fontSize,
      fontFamily: CANVAS_STYLE.fontFamily,
      fill: arrowColor,
      originX: 'center',
      originY: 'center',
      textAlign: 'center',
      selectable: false,
      evented: false,
    });
    textLabel.set({left: 0, top: LINEAR_LABEL_TOP});
    const textLabelObject = setCanvasObjectMyType(textLabel, 'objLabel');

    const group = new FabricGroup([lineObjet, headObject, textLabelObject], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
      lockScalingY: true,
    });
    group.setControlsVisibility({mt: false, mb: false, tl: false, tr: false, bl: false, br: false});

    const canvasGroup = setCanvasGroupMyType(group, 'arrow');
    bindArrowCanvasGroupScaling(canvasGroup, LINEAR_LABEL_TOP);
    return canvasGroup
  },
};

function bindArrowCanvasGroupScaling(canvasGroup: CanvasGroup, labelTop: number = LINEAR_LABEL_TOP): void {
  withScalingGuard(canvasGroup, function (this: CanvasGroup) {
    normalizeArrowCanvasGroupToLength(this, (this.width || 1) * (this.scaleX || 1), labelTop);
  });
}

function normalizeArrowCanvasGroupToLength(
  canvasGroup: CanvasGroup,
  totalLength: number,
  labelTop: number = LINEAR_LABEL_TOP,
): void {

  const newWidth = Math.max(totalLength, 1);
  const children = canvasGroup.getCanvasObjects?.() ?? [];
  const arrowHead =
    children.find((child) => child.myType === 'arrowHead');

  let headWidth = 15;
  let headHeight = 15;
  if (arrowHead) {
    if (!arrowHead.baseWidth) arrowHead.baseWidth = arrowHead.width || headWidth;
    if (!arrowHead.baseHeight) arrowHead.baseHeight = arrowHead.height || headHeight;
    headWidth = arrowHead.baseWidth;
    headHeight = arrowHead.baseHeight;
  }

  const shaftWidth = Math.max(newWidth - headWidth, 1);
  const shaftCenterX = -headWidth / 2;
  const headCenterX = newWidth / 2 - headWidth / 2;

  children.forEach((child) => {
    if (child.myType === 'arrowBody') {
      child.set({
        width: shaftWidth,
        height: 2,
        left: shaftCenterX,
        top: 0,
        scaleX: 1,
        scaleY: 1,
      });
    } else if (child.myType === 'arrowHead') {
      child.set({
        left: headCenterX,
        top: 0,
        width: headWidth,
        height: headHeight,
        angle: 90,
        scaleX: 1,
        scaleY: 1,
      });
    } else if (child.myType === 'objLabel') {
      child.set({left: 0, top: labelTop, scaleX: 1, scaleY: 1});
    }
  });

  canvasGroup.set({width: newWidth, scaleX: 1, scaleY: 1});
}
