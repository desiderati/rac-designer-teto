import {Canvas as FabricCanvas, Group as FabricGroup, IText, Rect} from 'fabric';
import {ElementStrategy} from './element.strategy.ts';
import {setCanvasGroupMyType, setCanvasObjectMyType, withScalingGuard} from './shared.ts';
import {CanvasGroup, CanvasObject} from '@/components/rac-editor/@canvas/lib/canvas.ts';
import {CANVAS_ELEMENT_STYLE, CANVAS_STYLE} from '@/shared/config.ts';

export const WALL_STROKE_DASH_ARRAY = [10, 5] as const;

export const wallStrategy: ElementStrategy = {
  create(canvas: FabricCanvas): CanvasGroup {
    const wallBorderColor = '#a85f43';
    const wallColor = '#f2d6bf';
    const wallLabel = '';
    const width = 200;
    const height = 50;

    const wall = new Rect({
      width,
      height,
      fill: wallColor,
      stroke: wallBorderColor,
      strokeWidth: CANVAS_ELEMENT_STYLE.strokeWidth,
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
    textLabel.set({left: 0, top: 0, visible: false});
    const textLabelObject = setCanvasObjectMyType(textLabel, 'wallLabel');

    const bricks = createWallBricks(width, height);
    const group = new FabricGroup([wallObject, ...bricks, textLabelObject], {
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
    const body = this.getCanvasObjects().find((child) => child.myType === 'wallBody');
    if (!body) return;
    normalizeWallCanvasGroupToSize(
      this,
      (body.width || 1) * (this.scaleX || 1),
      (body.height || 1) * (this.scaleY || 1)
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
  const body = children.find((child) => child.myType === 'wallBody');
  if (!body) return;
  const bodyCenter = body.getCenterPoint?.();
  const brickLayout = createWallBrickLayout(normalizedWidth, normalizedHeight);
  let brickIndex = 0;

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
    } else if (child.myType === 'wallBrick') {
      child.set({
        ...brickLayout[brickIndex++],
        scaleX: 1,
        scaleY: 1,
      });
    } else if (child.myType === 'wallLabel') {
      const label = child as IText;
      label.set({
        left: 0,
        top: label.text?.trim() ? normalizedHeight / 2 + 18 : 0,
        visible: Boolean(label.text?.trim()),
        scaleX: 1,
        scaleY: 1,
        fontSize: CANVAS_STYLE.fontSize,
      });
    }
  });

  canvasGroup.set({width: normalizedWidth, height: normalizedHeight, scaleX: 1, scaleY: 1});
  canvasGroup.triggerLayout?.();
  if (bodyCenter) {
    const nextCenter = body.getCenterPoint();
    canvasGroup.set({
      left: canvasGroup.left + bodyCenter.x - nextCenter.x,
      top: canvasGroup.top + bodyCenter.y - nextCenter.y,
    });
  }
  canvasGroup.setCoords?.();
}

function createWallBrickLayout(width: number, height: number) {
  const rows = 3;
  const rowHeight = height / rows;
  const brickWidth = width / 4;
  const bricks: Array<{left: number; top: number; width: number; height: number}> = [];
  for (let row = 0; row < rows; row += 1) {
    const offset = row % 2 === 0 ? 0 : brickWidth / 2;
    const columns = row % 2 === 0 ? 4 : 5;
    for (let column = 0; column < columns; column += 1) {
      const left = -width / 2 - offset + column * brickWidth;
      const start = Math.max(left, -width / 2);
      const end = Math.min(left + brickWidth, width / 2);
      bricks.push({
        left: (start + end) / 2,
        top: -height / 2 + rowHeight * (row + 0.5),
        width: Math.max(end - start - 2, 0.1),
        height: Math.max(rowHeight - 2, 0.1),
      });
    }
  }
  return bricks;
}

function createWallBricks(width: number, height: number): CanvasObject[] {
  return createWallBrickLayout(width, height).map((layout, index) =>
    setCanvasObjectMyType(new Rect({
      ...layout,
      fill: index >= 4 && index < 9 ? '#d58a62' : '#cb7956',
      stroke: '#f4dfc8',
      strokeWidth: 1,
      originX: 'center', originY: 'center',
      selectable: false, evented: false,
    }), 'wallBrick'),
  );
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

