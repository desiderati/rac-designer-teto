import {Canvas as FabricCanvas, Group as FabricGroup, IText, Line} from 'fabric';
import {ElementStrategy} from './element.strategy.ts';
import {LINEAR_LABEL_TOP, setCanvasGroupMyType, setCanvasObjectMyType, withScalingGuard} from './shared.ts';
import {CanvasGroup} from '@/components/lib/canvas/canvas.ts';
import {CANVAS_ELEMENT_STYLE, CANVAS_STYLE} from '@/shared/config.ts';

export const distanceStrategy: ElementStrategy = {
  create(canvas: FabricCanvas): CanvasGroup {
    const distanceColor = CANVAS_ELEMENT_STYLE.strokeColor.linearElement;
    const objLabel = '';
    const width = 200;
    const tickHeight = 10;

    const line = new Line([-width / 2, 0, width / 2, 0], {
      stroke: distanceColor,
      strokeWidth: CANVAS_ELEMENT_STYLE.strokeWidth,
      strokeDashArray: [6, 4],
      originX: 'center',
      originY: 'center',
    });
    const lineObject = setCanvasObjectMyType(line, 'distanceMainLine');

    const tick1 = new Line([0, -tickHeight / 2, 0, tickHeight / 2], {
      stroke: distanceColor,
      strokeWidth: CANVAS_ELEMENT_STYLE.strokeWidth,
      left: -width / 2,
      originX: 'center',
      originY: 'center',
    });
    const tick1Object = setCanvasObjectMyType(tick1, 'distanceTickStart');

    const tick2 = new Line([0, -tickHeight / 2, 0, tickHeight / 2], {
      stroke: distanceColor,
      strokeWidth: CANVAS_ELEMENT_STYLE.strokeWidth,
      left: width / 2,
      originX: 'center',
      originY: 'center',
    });
    const tick2Object = setCanvasObjectMyType(tick2, 'distanceTickEnd');

    const textLabel = new IText(objLabel, {
      fontSize: CANVAS_STYLE.fontSize,
      fontFamily: CANVAS_STYLE.fontFamily,
      fill: distanceColor,
      originX: 'center',
      originY: 'center',
      textAlign: 'center',
      selectable: false,
      evented: false,
    });
    textLabel.set({left: 0, top: LINEAR_LABEL_TOP});
    const textLabelObject = setCanvasObjectMyType(textLabel, 'objLabel');

    const group = new FabricGroup([lineObject, tick1Object, tick2Object, textLabelObject], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
      subTargetCheck: true,
      lockScalingY: true,
    });
    group.setControlsVisibility({mt: false, mb: false, tl: false, tr: false, bl: false, br: false});

    const canvasGroup = setCanvasGroupMyType(group, 'distance');
    bindDistanceCanvasGroupScaling(canvasGroup, LINEAR_LABEL_TOP);
    return canvasGroup;
  },
};

function bindDistanceCanvasGroupScaling(canvasGroup: CanvasGroup, labelTop: number = LINEAR_LABEL_TOP): void {
  withScalingGuard(canvasGroup, function (this: CanvasGroup) {
    normalizeDistanceCanvasGroupToLength(this, (this.width || 1) * (this.scaleX || 1), labelTop);
  });
}

function normalizeDistanceCanvasGroupToLength(
  canvasGroup: CanvasGroup,
  newWidth: number,
  labelTop: number = LINEAR_LABEL_TOP,
): void {
  const tickHeight = 10;
  const children = canvasGroup.getCanvasObjects?.() ?? [];

  children.forEach((child) => {
    if (child.myType === 'distanceMainLine') {
      child.set({x1: -newWidth / 2, y1: 0, x2: newWidth / 2, y2: 0, scaleX: 1, scaleY: 1});
    } else if (child.myType === 'distanceTickStart') {
      child.set({
        x1: 0,
        y1: -tickHeight / 2,
        x2: 0,
        y2: tickHeight / 2,
        left: -newWidth / 2,
        top: 0,
        scaleX: 1,
        scaleY: 1,
      });
    } else if (child.myType === 'distanceTickEnd') {
      child.set({
        x1: 0,
        y1: -tickHeight / 2,
        x2: 0,
        y2: tickHeight / 2,
        left: newWidth / 2,
        top: 0,
        scaleX: 1,
        scaleY: 1,
      });
    } else if (child.myType === 'objLabel') {
      child.set({left: 0, top: labelTop, scaleX: 1, scaleY: 1});
    }
  });

  canvasGroup.set({width: newWidth, scaleX: 1, scaleY: 1});
}
