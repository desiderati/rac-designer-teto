import {Canvas as FabricCanvas, Group, Pattern, Rect, Text} from 'fabric';
import {CANVAS_ELEMENT_STYLE, CANVAS_STYLE} from '@/shared/config.ts';
import {ElementStrategy} from './element.strategy.ts';
import {setCanvasGroupMyType, setCanvasObjectMyType} from './shared.ts';
import {CanvasGroup} from '@/components/lib/canvas/canvas.ts';

export const waterStrategy: ElementStrategy = {
  create(canvas: FabricCanvas): CanvasGroup {
    const rect = new Rect({
      width: 200,
      height: 50,
      originX: 'center',
      originY: 'center',
      fill: new Pattern({
        source: createWaterPatternSource(),
        repeat: 'repeat-x',
      }),
      transparentCorners: false,
    });
    const rectObject = setCanvasObjectMyType(rect, 'waterBody');

    const text = new Text('Água', {
      fontSize: CANVAS_STYLE.fontSize,
      fontFamily: CANVAS_STYLE.fontFamily,
      fill: CANVAS_ELEMENT_STYLE.strokeColor.waterElement,
      originX: 'center',
      originY: 'center',
      fontWeight: 'bold',
      stroke: 'white',
      strokeWidth: CANVAS_ELEMENT_STYLE.strokeWidth,
      paintFirst: 'stroke',
    });
    const textObject = setCanvasObjectMyType(text, 'waterLabel');

    const group = new Group([rectObject, textObject], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
    });
    group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});
    return setCanvasGroupMyType(group, 'water');
  },
};

function createWaterPatternSource(): HTMLCanvasElement {
  const patternCanvas = document.createElement('canvas');
  const ctx = patternCanvas.getContext('2d')!;
  patternCanvas.width = 40;
  patternCanvas.height = 50;
  ctx.lineWidth = CANVAS_ELEMENT_STYLE.strokeWidth;
  ctx.strokeStyle = CANVAS_ELEMENT_STYLE.strokeColor.waterElement;
  ctx.lineCap = 'round';

  const drawWave = (y: number) => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(10, y - 5, 30, y + 5, 40, y);
    ctx.stroke();
  };

  drawWave(15);
  drawWave(25);
  drawWave(35);
  return patternCanvas;
}
