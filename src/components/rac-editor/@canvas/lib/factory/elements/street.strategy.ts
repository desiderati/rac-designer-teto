import {Canvas as FabricCanvas, Group as FabricGroup, Line, Rect} from 'fabric';
import {ElementStrategy} from './element.strategy.ts';
import {setCanvasGroupMyType, setCanvasObjectMyType} from './shared.ts';
import type {CanvasGroup, CanvasObject} from '@/components/rac-editor/@canvas/lib/canvas.ts';

export type StreetVariant = 'straight' | 'corner';

const STREET_BODY_COLOR = '#9ca3af';
const STREET_BORDER_COLOR = '#6b7280';
const STREET_MARKING_COLOR = '#f8fafc';
const STREET_STROKE_WIDTH = 2;
const STREET_MARKING_DASH = [18, 12] as const;
const STRAIGHT_STREET_WIDTH = 280;
const STREET_DEPTH = 72;
const CORNER_STREET_ARM = 220;

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
    stroke: STREET_BORDER_COLOR,
    strokeWidth: STREET_STROKE_WIDTH,
    strokeUniform: true,
    originX: 'center',
    originY: 'center',
    left: params.left,
    top: params.top,
    selectable: false,
    evented: false,
  });

  return setCanvasObjectMyType(body, 'streetBody');
}

function createStreetMarking(points: [number, number, number, number]): CanvasObject {
  const marking = new Line(points, {
    stroke: STREET_MARKING_COLOR,
    strokeWidth: 3,
    strokeDashArray: [...STREET_MARKING_DASH],
    strokeUniform: true,
    strokeLineCap: 'round',
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
    createStreetMarking([
      -CORNER_STREET_ARM / 2 + 24,
      0,
      CORNER_STREET_ARM / 2 - 24,
      0,
    ]),
    createStreetMarking([
      verticalLeft,
      24,
      verticalLeft,
      CORNER_STREET_ARM - 24,
    ]),
  ], {
    originX: 'center',
    originY: 'center',
    objectCaching: false,
  });
}
