import {Canvas as FabricCanvas, Group as FabricGroup, IText, Rect} from 'fabric';
import {ElementStrategy} from './element.strategy.ts';
import {setCanvasGroupMyType, setCanvasObjectMyType, withScalingGuard} from './shared.ts';
import {CanvasGroup} from '@/components/lib/canvas/canvas.ts';
import {CANVAS_ELEMENT_STYLE, CANVAS_STYLE} from '@/shared/config.ts';

export const wallStrategy: ElementStrategy = {
  create(canvas: FabricCanvas): CanvasGroup {
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
    const wallObject = setCanvasObjectMyType(wall, 'wallBody');

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
    textLabel.set({left: 0, top: 0});
    const textLabelObject = setCanvasObjectMyType(textLabel, 'wallLabel');

    const group = new FabricGroup([wallObject, textLabelObject], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
    });

    const canvasGroup = setCanvasGroupMyType(group, 'wall');
    bindWallCanvasGroupScaling(canvasGroup);
    return canvasGroup;
  },
};

function bindWallCanvasGroupScaling(canvasGroup: CanvasGroup): void {
  withScalingGuard(canvasGroup, function (this: CanvasGroup) {
    normalizeWallCanvasGroupToLength(
      this,
      (this.width || 1) * (this.scaleX || 1),
      (this.height || 1) * (this.scaleY || 1)
    );
  });
}

function normalizeWallCanvasGroupToLength(
  canvasGroup: CanvasGroup,
  newWidth: number,
  newHeight: number
): void {
  const children = canvasGroup.getCanvasObjects?.() ?? [];
  const body = children.find(
    (child) => child.myType === 'wallBody'
  ) as Rect | undefined;

  const oldWidth = body?.width || newWidth;
  const oldHeight = body?.height || newHeight;
  const factor = Math.min(newWidth / oldWidth, newHeight / oldHeight);

  children.forEach((child) => {
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

  canvasGroup.set({width: newWidth, height: newHeight, scaleX: 1, scaleY: 1});
}

