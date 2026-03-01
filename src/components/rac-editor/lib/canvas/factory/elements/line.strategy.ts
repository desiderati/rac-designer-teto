import {Canvas as FabricCanvas, Group as FabricGroup, IText, Line} from 'fabric';
import {ElementStrategy} from './element.strategy.ts';
import {LINEAR_LABEL_TOP, setCanvasGroupMyType, setCanvasObjectMyType, withScalingGuard} from './shared.ts';
import {CanvasGroup} from '@/components/rac-editor/lib/canvas/canvas.ts';
import {CANVAS_ELEMENT_STYLE, CANVAS_STYLE} from '@/shared/config.ts';

export const lineStrategy: ElementStrategy = {
  create(canvas: FabricCanvas): CanvasGroup {
    const lineColor = CANVAS_ELEMENT_STYLE.strokeColor.linearElement;
    const objLabel = '';
    const width = 200;

    const line = new Line([-width / 2, 0, width / 2, 0], {
      stroke: lineColor,
      strokeWidth: CANVAS_ELEMENT_STYLE.strokeWidth,
      strokeLineCap: 'round',
      originX: 'center',
      originY: 'center',
    });
    const lineObject = setCanvasObjectMyType(line, 'lineBody');

    const textLabel = new IText(objLabel, {
      fontSize: CANVAS_STYLE.fontSize,
      fontFamily: CANVAS_STYLE.fontFamily,
      fill: lineColor,
      originX: 'center',
      originY: 'center',
      textAlign: 'center',
      selectable: false,
      evented: false,
    });
    textLabel.set({left: 0, top: LINEAR_LABEL_TOP});
    const textLabelObject = setCanvasObjectMyType(textLabel, 'objLabel');

    const group = new FabricGroup([lineObject, textLabelObject], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
      lockScalingY: true,
    });
    group.setControlsVisibility({mt: false, mb: false, tl: false, tr: false, bl: false, br: false});

    const canvasGroup = setCanvasGroupMyType(group, 'line');
    bindLineCanvasGroupScaling(canvasGroup, LINEAR_LABEL_TOP);
    return canvasGroup;
  },
};

function bindLineCanvasGroupScaling(canvasGroup: CanvasGroup, labelTop: number = LINEAR_LABEL_TOP): void {
  withScalingGuard(canvasGroup, function (this: CanvasGroup) {
    normalizeLineCanvasGroupToLength(this, (this.width || 1) * (this.scaleX || 1), labelTop);
  });
}

function normalizeLineCanvasGroupToLength(
  canvasGroup: CanvasGroup,
  totalLength: number,
  labelTop: number = LINEAR_LABEL_TOP,
): void {
  const newWidth = Math.max(totalLength, 1);
  const children = canvasGroup.getCanvasObjects?.() ?? [];

  children.forEach((child) => {
    if (child.myType === 'lineBody') {
      child.set({
        x1: -newWidth / 2,
        y1: 0,
        x2: newWidth / 2,
        y2: 0,
        scaleX: 1,
        scaleY: 1,
      });
    } else if (child.myType === 'objLabel') {
      child.set({left: 0, top: labelTop, scaleX: 1, scaleY: 1});
    }
  });

  canvasGroup.set({width: newWidth, scaleX: 1, scaleY: 1});
}
