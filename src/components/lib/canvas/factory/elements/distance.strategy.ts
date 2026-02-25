import {Canvas as FabricCanvas, Group, IText, Line} from 'fabric';
import {ElementStrategy} from './element.strategy.ts';
import {LINEAR_LABEL_TOP, setCanvasObjectMyType} from './shared.ts';
import {CanvasObject} from "@/components/lib/canvas/canvas.ts";

export const distanceStrategy: ElementStrategy<Group> = {
  create(canvas: FabricCanvas): Group {
    const distanceColor = '#000000';
    const objLabel = '';
    const width = 200;
    const tickHeight = 10;

    const line = new Line([-width / 2, 0, width / 2, 0], {
      stroke: distanceColor,
      strokeWidth: 2,
      strokeDashArray: [6, 4],
      originX: 'center',
      originY: 'center',
    });
    setCanvasObjectMyType(line, 'distanceMainLine');

    const tick1 = new Line([0, -tickHeight / 2, 0, tickHeight / 2], {
      stroke: distanceColor,
      strokeWidth: 2,
      left: -width / 2,
      originX: 'center',
      originY: 'center',
    });
    setCanvasObjectMyType(tick1, 'distanceTickStart');

    const tick2 = new Line([0, -tickHeight / 2, 0, tickHeight / 2], {
      stroke: distanceColor,
      strokeWidth: 2,
      left: width / 2,
      originX: 'center',
      originY: 'center',
    });
    setCanvasObjectMyType(tick2, 'distanceTickEnd');

    const textLabel = new IText(objLabel, {
      fontSize: 14,
      fontFamily: 'Arial',
      fill: distanceColor,
      originX: 'center',
      originY: 'center',
      textAlign: 'center',
      selectable: false,
      evented: false,
    });
    setCanvasObjectMyType(textLabel, 'objLabel');
    textLabel.set({left: 0, top: LINEAR_LABEL_TOP});

    const group = new Group([line, tick1, tick2, textLabel], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
      subTargetCheck: true,
      lockScalingY: true,
    });
    setCanvasObjectMyType(group, 'distance');
    group.setControlsVisibility({mt: false, mb: false, tl: false, tr: false, bl: false, br: false});
    bindDistanceGroupScaling(group, LINEAR_LABEL_TOP);
    return group;
  },
};

function bindDistanceGroupScaling(group: Group, labelTop: number = LINEAR_LABEL_TOP): void {
  group.on('scaling', function (this: Group) {
    const runtimeGroup = this as Group & {__normalizingScale?: boolean};
    if (runtimeGroup.__normalizingScale) return;
    runtimeGroup.__normalizingScale = true;

    try {
      normalizeDistanceGroupToLength(this, (this.width || 1) * (this.scaleX || 1), labelTop);
    } finally {
      runtimeGroup.__normalizingScale = false;
    }
  });
}

function normalizeDistanceGroupToLength(
  group: Group,
  newWidth: number,
  labelTop: number = LINEAR_LABEL_TOP,
): void {
  const tickHeight = 10;

  group.getObjects().forEach((childObject) => {
    const child = childObject as CanvasObject;
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

  group.set({width: newWidth, scaleX: 1, scaleY: 1});
}
