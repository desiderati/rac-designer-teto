import {CANVAS_ELEMENT_STYLE} from '@/shared/config.ts';

export function createWaterPatternSource(): HTMLCanvasElement {
  const patternCanvas = document.createElement('canvas');
  const ctx = patternCanvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível criar a textura de água.');

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

export function createWaterPatternDataUrl(): string {
  return createWaterPatternSource().toDataURL('image/png');
}
