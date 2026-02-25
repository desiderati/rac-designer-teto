import {Canvas as FabricCanvas, Pattern, Rect} from 'fabric';
import {ElementStrategy} from './element.strategy.ts';
import {getHouseScaleFactors} from "@/components/lib/canvas/factory/house/shared.ts";

export const stairsStrategy: ElementStrategy<Rect> = {
  create(canvas: FabricCanvas): Rect {
    const factors = getHouseScaleFactors(canvas);
    const s = factors.widthFactor;

    const rect = new Rect({
      width: 80 * s,
      height: 75 * s,
      originX: "center",
      originY: "center",
      fill: new Pattern({
        source: createStairsPatternSource(s),
        repeat: "repeat",
      }),
      stroke: "#8B4513",
      strokeWidth: 3,
      transparentCorners: false,
      left: canvas.width! / 2,
      top: canvas.height! / 2,
    });
    (rect as any).myType = "stairs";

    rect.on("scaling", function (this: Rect) {
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
  const patternCanvas = document.createElement("canvas");
  patternCanvas.width = stepSpacing;
  patternCanvas.height = stepSpacing;

  const ctx = patternCanvas.getContext("2d")!;
  ctx.fillStyle = "#C89B6D";
  ctx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#8B4513";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(stepSpacing, 0);
  ctx.stroke();
  return patternCanvas;
}


