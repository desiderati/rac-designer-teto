import {Canvas as FabricCanvas, Group as FabricGroup, Line, Rect} from 'fabric';
import {ElementStrategy} from './element.strategy.ts';
import {setCanvasGroupMyType, setCanvasObjectMyType} from './shared.ts';
import type {CanvasGroup, CanvasObject} from '@/components/rac-editor/@canvas/lib/canvas.ts';

export type StreetVariant = 'straight' | 'corner';

const STREET_BODY_COLOR = '#9ca3af';
const STREET_BORDER_COLOR = '#6b7280';
const STREET_MARKING_COLOR = '#f8fafc';
const STREET_BORDER_WIDTH = 1.5;
const STREET_MARKING_WIDTH = 4;
const STREET_MARKING_DASH = [18, 12] as const;
const STRAIGHT_STREET_WIDTH = 280;
const STREET_DEPTH = 72;
const CORNER_STREET_ARM = 220;
const CORNER_HORIZONTAL_MARKING_START_INSET = 54;
const CORNER_VERTICAL_MARKING_BOTTOM_INSET = 46;

export const streetStraightStrategy = createStreetStrategy('straight');
export const streetCornerStrategy = createStreetStrategy('corner');

function createStreetStrategy(variant: StreetVariant): ElementStrategy {
  return {
    create(canvas: FabricCanvas): CanvasGroup {
      const group = variant === 'straight'
        ? createStraightStreetGroup()
        : createCornerStreetGroup();

      group.set({
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: 'center',
        originY: 'center',
        lockScalingFlip: true,
      });

      const canvasGroup = setCanvasGroupMyType(group, 'street');
      canvasGroup.streetVariant = variant;
      return canvasGroup;
    },
  };
}

function createStreetBody(params: {
  height: number;
  left: number;
  top: number;
  width: number;
}): CanvasObject {
  const body = new Rect({
    width: params.width,
    height: params.height,
    fill: STREET_BODY_COLOR,
    originX: 'center',
    originY: 'center',
    left: params.left,
    top: params.top,
    selectable: false,
    evented: false,
  });

  return setCanvasObjectMyType(body, 'streetBody');
}

function createStreetBorder(points: [number, number, number, number]): CanvasObject {
  const border = new Line(points, {
    stroke: STREET_BORDER_COLOR,
    strokeWidth: STREET_BORDER_WIDTH,
    strokeUniform: true,
    strokeLineCap: 'square',
    originX: 'center',
    originY: 'center',
    selectable: false,
    evented: false,
  });

  return setCanvasObjectMyType(border, 'streetBorder');
}

function createStreetMarking(points: [number, number, number, number]): CanvasObject {
  const marking = new Line(points, {
    stroke: STREET_MARKING_COLOR,
    strokeWidth: STREET_MARKING_WIDTH,
    strokeDashArray: [...STREET_MARKING_DASH],
    strokeUniform: true,
    strokeLineCap: 'square',
    originX: 'center',
    originY: 'center',
    selectable: false,
    evented: false,
  });

  return setCanvasObjectMyType(marking, 'streetMarking');
}

function createStraightStreetGroup(): FabricGroup {
  return new FabricGroup([
    createStreetBody({
      width: STRAIGHT_STREET_WIDTH,
      height: STREET_DEPTH,
      left: 0,
      top: 0,
    }),
    createStreetBorder([
      -STRAIGHT_STREET_WIDTH / 2,
      -STREET_DEPTH / 2,
      STRAIGHT_STREET_WIDTH / 2,
      -STREET_DEPTH / 2,
    ]),
    createStreetBorder([
      -STRAIGHT_STREET_WIDTH / 2,
      STREET_DEPTH / 2,
      STRAIGHT_STREET_WIDTH / 2,
      STREET_DEPTH / 2,
    ]),
    createStreetMarking([
      -STRAIGHT_STREET_WIDTH / 2 + 24,
      0,
      STRAIGHT_STREET_WIDTH / 2 - 24,
      0,
    ]),
  ], {
    originX: 'center',
    originY: 'center',
    objectCaching: false,
  });
}

function createCornerStreetGroup(): FabricGroup {
  const verticalCenter = CORNER_STREET_ARM / 2 - STREET_DEPTH / 2;
  const verticalLeft = -CORNER_STREET_ARM / 2 + STREET_DEPTH / 2;

  return new FabricGroup([
    createStreetBody({
      width: CORNER_STREET_ARM,
      height: STREET_DEPTH,
      left: 0,
      top: 0,
    }),
    createStreetBody({
      width: STREET_DEPTH,
      height: CORNER_STREET_ARM,
      left: verticalLeft,
      top: verticalCenter,
    }),
    createStreetBorder([
      -CORNER_STREET_ARM / 2,
      -STREET_DEPTH / 2,
      CORNER_STREET_ARM / 2,
      -STREET_DEPTH / 2,
    ]),
    createStreetBorder([
      verticalLeft + STREET_DEPTH / 2,
      STREET_DEPTH / 2,
      CORNER_STREET_ARM / 2,
      STREET_DEPTH / 2,
    ]),
    createStreetBorder([
      verticalLeft - STREET_DEPTH / 2,
      -STREET_DEPTH / 2,
      verticalLeft - STREET_DEPTH / 2,
      verticalCenter + CORNER_STREET_ARM / 2,
    ]),
    createStreetBorder([
      verticalLeft + STREET_DEPTH / 2,
      STREET_DEPTH / 2,
      verticalLeft + STREET_DEPTH / 2,
      verticalCenter + CORNER_STREET_ARM / 2,
    ]),
    createStreetMarking([
      -CORNER_STREET_ARM / 2 + CORNER_HORIZONTAL_MARKING_START_INSET,
      0,
      CORNER_STREET_ARM / 2 - 24,
      0,
    ]),
    createStreetMarking([
      verticalLeft,
      24,
      verticalLeft,
      CORNER_STREET_ARM - CORNER_VERTICAL_MARKING_BOTTOM_INSET,
    ]),
  ], {
    originX: 'center',
    originY: 'center',
    objectCaching: false,
  });
}
