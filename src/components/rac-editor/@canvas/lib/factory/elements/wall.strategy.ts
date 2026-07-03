import {Canvas as FabricCanvas, Group as FabricGroup, IText, Rect} from 'fabric';
import {ElementStrategy} from './element.strategy.ts';
import {setCanvasGroupMyType, setCanvasObjectMyType, withScalingGuard} from './shared.ts';
import {CanvasGroup} from '@/components/rac-editor/@canvas/lib/canvas.ts';
import {CANVAS_ELEMENT_STYLE, CANVAS_STYLE} from '@/shared/config.ts';

export const WALL_STROKE_DASH_ARRAY = [10, 5] as const;

export const wallStrategy: ElementStrategy = {
  create(canvas: FabricCanvas): CanvasGroup {
    const wallBorderColor = CANVAS_ELEMENT_STYLE.strokeColor.wallElement;
    const wallColor = toPastelWallFill(wallBorderColor);
    const wallLabel = '';
    const width = 200;
    const height = 50;

    const wall = new Rect({
      width,
      height,
      fill: wallColor,
      stroke: wallBorderColor,
      strokeWidth: CANVAS_ELEMENT_STYLE.strokeWidth,
      strokeDashArray: [...WALL_STROKE_DASH_ARRAY],
      originX: 'center',
      originY: 'center',
      lockScalingFlip: true,
      strokeUniform: true,
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
      lockScalingFlip: true,
    });

    const canvasGroup = setCanvasGroupMyType(group, 'wall');
    bindWallCanvasGroupScaling(canvasGroup);
    return canvasGroup;
  },
};

export function bindWallCanvasGroupScaling(canvasGroup: CanvasGroup): void {
  if (typeof canvasGroup.on !== 'function') return;

  withScalingGuard(canvasGroup, function (this: CanvasGroup) {
    normalizeWallCanvasGroupToSize(
      this,
      (this.width || 1) * (this.scaleX || 1),
      (this.height || 1) * (this.scaleY || 1)
    );
  });
}

export function normalizeWallCanvasGroupToSize(
  canvasGroup: CanvasGroup,
  newWidth: number,
  newHeight: number
): void {
  const normalizedWidth = Math.max(newWidth, 1);
  const normalizedHeight = Math.max(newHeight, 1);
  const children = canvasGroup.getCanvasObjects?.() ?? [];

  children.forEach((child) => {
    if (child.myType === 'wallBody') {
      child.set({
        width: normalizedWidth,
        height: normalizedHeight,
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
        strokeDashArray: [...WALL_STROKE_DASH_ARRAY],
        strokeUniform: true,
      });
    } else if (child.myType === 'wallLabel') {
      const label = child as IText;
      label.set({
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
        fontSize: CANVAS_STYLE.fontSize,
      });
    }
  });

  canvasGroup.set({width: normalizedWidth, height: normalizedHeight, scaleX: 1, scaleY: 1});
}

export function toPastelWallFill(color: string): string {
  const normalizedHex = normalizeHexColor(color);
  if (!normalizedHex) return CANVAS_ELEMENT_STYLE.fillColor.wallBody;

  const [r, g, b] = normalizedHex;
  const pastel = [r, g, b].map((channel) =>
    Math.round(channel + (255 - channel) * 0.74)
  );

  return `rgb(${pastel[0]}, ${pastel[1]}, ${pastel[2]})`;
}

function normalizeHexColor(color: string): [number, number, number] | null {
  const trimmed = color.trim();
  const shortHex = /^#([0-9a-f]{3})$/i.exec(trimmed);
  if (shortHex) {
    return shortHex[1].split('').map((value) => parseInt(`${value}${value}`, 16)) as [number, number, number];
  }

  const longHex = /^#([0-9a-f]{6})$/i.exec(trimmed);
  if (!longHex) return null;

  return [
    parseInt(longHex[1].slice(0, 2), 16),
    parseInt(longHex[1].slice(2, 4), 16),
    parseInt(longHex[1].slice(4, 6), 16),
  ];
}

