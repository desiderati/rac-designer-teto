import {Canvas as FabricCanvas, Group, IText, Rect} from 'fabric';
import {ElementStrategy} from './element.strategy.ts';
import {setCanvasObjectMyType} from './shared.ts';
import {toCanvasObject} from '@/components/lib/canvas/canvas.ts';
import {CANVAS_ELEMENT_STYLE, CANVAS_STYLE} from '@/shared/config.ts';

export const wallStrategy: ElementStrategy<Group> = {
  create(canvas: FabricCanvas): Group {
    const wallColor = CANVAS_ELEMENT_STYLE.fillColor.wallBody;
    const wallBorderColor = CANVAS_ELEMENT_STYLE.strokeColor.wallElement;
    const wallLabel = '';
    const width = 200;
    const height = 50;

    const wall = new Rect({
      width,
      height,
      fill: wallColor,
      stroke: wallBorderColor,
      strokeWidth: CANVAS_ELEMENT_STYLE.strokeWidth,
      strokeDashArray: [10, 5],
      originX: 'center',
      originY: 'center',
      lockScalingFlip: true,
    });
    setCanvasObjectMyType(wall, 'wallBody');

    const textLabel = new IText(wallLabel, {
      fontSize: CANVAS_STYLE.fontSize,
      fontFamily: CANVAS_STYLE.fontFamily,
      fill: wallBorderColor,
      originX: 'center',
      originY: 'center',
      textAlign: 'center',
      selectable: false,
      evented: false,
    });
    setCanvasObjectMyType(textLabel, 'wallLabel');
    textLabel.set({left: 0, top: 0});

    const group = new Group([wall, textLabel], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
    });
    setCanvasObjectMyType(group, 'wall');
    bindWallGroupScaling(group);
    return group;
  },
};

function normalizeWallGroupToLength(group: Group, newWidth: number, newHeight: number): void {
  const body = group.getObjects().find((object) =>
    toCanvasObject(object)?.myType === 'wallBody') as | Rect | undefined;

  const oldWidth = body?.width || newWidth;
  const oldHeight = body?.height || newHeight;
  const factor = Math.min(newWidth / oldWidth, newHeight / oldHeight);

  group.getObjects().forEach((childObject) => {
    const child = toCanvasObject(childObject);
    if (!child) return;
    if (child.myType === 'wallBody') {
      child.set({
        width: newWidth,
        height: newHeight,
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
      });
    } else if (child.myType === 'wallLabel') {
      const label = child as IText;
      label.set({
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
        fontSize: Math.max(
          CANVAS_STYLE.fontSize,
          (label.fontSize || CANVAS_STYLE.fontSize) * factor,
        ),
      });
    }
  });

  group.set({width: newWidth, height: newHeight, scaleX: 1, scaleY: 1});
}

function bindWallGroupScaling(group: Group): void {
  group.on('scaling', function (this: Group) {
    const canvasGroup = this as Group & { __normalizingScale?: boolean };
    if (canvasGroup.__normalizingScale) return;
    canvasGroup.__normalizingScale = true;

    try {
      normalizeWallGroupToLength(this, (this.width || 1) * (this.scaleX || 1), (this.height || 1) * (this.scaleY || 1));
    } finally {
      canvasGroup.__normalizingScale = false;
    }
  });
}


