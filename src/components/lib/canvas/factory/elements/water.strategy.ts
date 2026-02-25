import {Canvas as FabricCanvas, Group, Pattern, Rect, Text} from 'fabric';
import {ElementStrategy} from './element.strategy.ts';
import {setCanvasObjectMyType} from './shared.ts';

export const waterStrategy: ElementStrategy<Group> = {
  create(canvas: FabricCanvas): Group {
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

    const text = new Text('Água', {
      fontSize: 12,
      fontFamily: 'Arial',
      fill: '#0092DD',
      originX: 'center',
      originY: 'center',
      fontWeight: 'bold',
      stroke: 'white',
      strokeWidth: 3,
      paintFirst: 'stroke',
    });

    const group = new Group([rect, text], {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
    });
    setCanvasObjectMyType(group, 'water');
    group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});
    return group;
  },
};

function createWaterPatternSource(): HTMLCanvasElement {
  const patternCanvas = document.createElement('canvas');
  const ctx = patternCanvas.getContext('2d')!;
  patternCanvas.width = 40;
  patternCanvas.height = 50;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#0092DD';
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
