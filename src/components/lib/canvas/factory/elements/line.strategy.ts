import {Canvas as FabricCanvas, Group, IText, Line} from 'fabric';
import {ElementStrategy} from './element.strategy.ts';
import {LINEAR_LABEL_TOP, setCanvasObjectMyType} from './shared.ts';
import {toCanvasObject} from '@/components/lib/canvas/canvas.ts';
import {CANVAS_ELEMENT_STYLE, CANVAS_STYLE} from '@/config.ts';

export const lineStrategy: ElementStrategy<Group> = {
  create(canvas: FabricCanvas): Group {
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
    setCanvasObjectMyType(line, 'lineBody');

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
    setCanvasObjectMyType(textLabel, 'objLabel');
    textLabel.set({left: 0, top: LINEAR_LABEL_TOP});

    const group = new Group([line, textLabel], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
      lockScalingY: true,
    });
    setCanvasObjectMyType(group, 'line');
    group.setControlsVisibility({mt: false, mb: false, tl: false, tr: false, bl: false, br: false});
    bindLineGroupScaling(group, LINEAR_LABEL_TOP);
    return group;
  },
};

function bindLineGroupScaling(group: Group, labelTop: number = LINEAR_LABEL_TOP): void {
  group.on('scaling', function (this: Group) {
    const canvasGroup = this as Group & { __normalizingScale?: boolean };
    if (canvasGroup.__normalizingScale) return;
    canvasGroup.__normalizingScale = true;

    try {
      normalizeLineGroupToLength(this, (this.width || 1) * (this.scaleX || 1), labelTop);
    } finally {
      canvasGroup.__normalizingScale = false;
    }
  });
}

function normalizeLineGroupToLength(
  group: Group,
  totalLength: number,
  labelTop: number = LINEAR_LABEL_TOP,
): void {
  const newWidth = Math.max(totalLength, 1);

  group.getObjects().forEach((childObject) => {
    const child = toCanvasObject(childObject);
    if (!child) return;
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

  group.set({width: newWidth, scaleX: 1, scaleY: 1});
}
