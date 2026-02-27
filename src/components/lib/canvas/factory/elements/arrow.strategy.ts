import {Canvas as FabricCanvas, Group, IText, Rect, Triangle} from 'fabric';
import {ElementStrategy} from './element.strategy.ts';
import {LINEAR_LABEL_TOP, setCanvasObjectMyType, withScalingGuard} from './shared.ts';
import {CanvasObject, toCanvasObject} from '@/components/lib/canvas/canvas.ts';
import {CANVAS_ELEMENT_STYLE, CANVAS_STYLE} from '@/shared/config.ts';

export const arrowStrategy: ElementStrategy<Group> = {
  create(canvas: FabricCanvas): Group {
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
    setCanvasObjectMyType(line, 'arrowBody');

    const head = new Triangle({
      width: headSize,
      height: headSize,
      fill: arrowColor,
      angle: 90,
      left: width / 2 - headSize / 2,
      originX: 'center',
      originY: 'center',
    });
    setCanvasObjectMyType(head, 'arrowHead');

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
    setCanvasObjectMyType(textLabel, 'objLabel');
    textLabel.set({left: 0, top: LINEAR_LABEL_TOP});

    const group = new Group([line, head, textLabel], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
      lockScalingY: true,
    });
    setCanvasObjectMyType(group, 'arrow');
    group.setControlsVisibility({mt: false, mb: false, tl: false, tr: false, bl: false, br: false});
    bindArrowGroupScaling(group, LINEAR_LABEL_TOP);
    return group;
  },
};

function bindArrowGroupScaling(group: Group, labelTop: number = LINEAR_LABEL_TOP): void {
  withScalingGuard(group, function (this: Group) {
    normalizeArrowGroupToLength(this, (this.width || 1) * (this.scaleX || 1), labelTop);
  });
}

function normalizeArrowGroupToLength(
  group: Group,
  totalLength: number,
  labelTop: number = LINEAR_LABEL_TOP,
): void {
  const newWidth = Math.max(totalLength, 1);
  const children = group
    .getObjects()
    .map((childObject) => toCanvasObject(childObject))
    .filter((child): child is CanvasObject => child !== null);
  const arrowHead = children.find((child) => child.myType === 'arrowHead');

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

  group.set({width: newWidth, scaleX: 1, scaleY: 1});
}
