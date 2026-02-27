import {Canvas as FabricCanvas, Pattern, Rect} from 'fabric';
import {ElementStrategy} from './element.strategy.ts';
import {getHouseScaleFactors} from '@/components/lib/canvas/factory/house/shared.ts';
import {CANVAS_ELEMENT_STYLE} from '@/shared/config.ts';

export const stairsStrategy: ElementStrategy<Rect> = {
  create(canvas: FabricCanvas): Rect {
    const factors = getHouseScaleFactors(canvas);
    const s = factors.widthFactor;

    const rect = new Rect({
      width: 80 * s,
      height: 75 * s,
      originX: 'center',
      originY: 'center',
      fill: new Pattern({
        source: createStairsPatternSource(s),
        repeat: 'repeat',
      }),
      stroke: CANVAS_ELEMENT_STYLE.strokeColor.stairsElement,
      strokeWidth: CANVAS_ELEMENT_STYLE.strokeWidth,
      transparentCorners: false,
      left: canvas.width! / 2,
      top: canvas.height! / 2,
    });
    (rect as any).myType = 'stairs';

    rect.on('scaling', function (this: Rect) {
      this.set({
        width: this.width! * this.scaleX!,
        height: this.height! * this.scaleY!,
        scaleX: 1,
        scaleY: 1,
      });
    });

    return rect;
  },
};

function createStairsPatternSource(s = 1): HTMLCanvasElement {
  const stepSpacing = Math.max(2, Math.round(18 * s));
  const patternCanvas = document.createElement('canvas');
  patternCanvas.width = stepSpacing;
  patternCanvas.height = stepSpacing;

  const ctx = patternCanvas.getContext('2d')!;
  ctx.fillStyle = CANVAS_ELEMENT_STYLE.fillColor.stairsBody;
  ctx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
  ctx.lineWidth = CANVAS_ELEMENT_STYLE.strokeWidth;
  ctx.strokeStyle = CANVAS_ELEMENT_STYLE.strokeColor.stairsElement;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(stepSpacing, 0);
  ctx.stroke();
  return patternCanvas;
}
