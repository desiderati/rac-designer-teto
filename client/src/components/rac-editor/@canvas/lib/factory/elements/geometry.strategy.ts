import {Canvas as FabricCanvas, Circle, Group as FabricGroup, IText, Rect, Triangle} from 'fabric';
import {CANVAS_ELEMENT_STYLE, CANVAS_STYLE} from '@/shared/config.ts';
import type {ElementStrategy} from './element.strategy.ts';
import {setCanvasGroupMyType, setCanvasObjectMyType} from './shared.ts';
import {toPastelWallFill} from './wall.strategy.ts';
import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib/canvas.ts';

export type GeometryKind = 'square' | 'triangle' | 'circle';

function createGeometryStrategy(kind: GeometryKind): ElementStrategy {
  return {
    create(canvas: FabricCanvas): CanvasGroup {
      const color = CANVAS_ELEMENT_STYLE.strokeColor.wallElement;
      const options = {
        fill: toPastelWallFill(color), stroke: color,
        strokeWidth: CANVAS_ELEMENT_STYLE.strokeWidth,
        originX: 'center' as const, originY: 'center' as const,
        strokeUniform: true,
      };
      const shape = kind === 'circle'
        ? new Circle({radius: 44, ...options})
        : kind === 'triangle'
          ? new Triangle({width: 90, height: 86, ...options})
          : new Rect({width: 88, height: 88, ...options});
      const label = new IText('', {
        fontSize: CANVAS_STYLE.fontSize, fontFamily: CANVAS_STYLE.fontFamily,
        fill: color, originX: 'center', originY: 'center', textAlign: 'center',
        left: 0, top: kind === 'triangle' ? 86 * 0.22 : 0,
        visible: false,
        selectable: false, evented: false,
      });
      const group = new FabricGroup([
        setCanvasObjectMyType(shape, 'wallBody'),
        setCanvasObjectMyType(label, 'wallLabel'),
      ], {
        left: canvas.width! / 2, top: canvas.height! / 2,
        originX: 'center', originY: 'center', lockScalingFlip: true,
      });
      return setCanvasGroupMyType(group, kind);
    },
  };
}

export const squareStrategy = createGeometryStrategy('square');
export const triangleStrategy = createGeometryStrategy('triangle');
export const circleStrategy = createGeometryStrategy('circle');
