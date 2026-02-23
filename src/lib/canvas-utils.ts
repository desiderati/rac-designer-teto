import {Canvas as FabricCanvas, FabricObject, Rect, Pattern} from "fabric";
import {customProps} from "./canvas/constants";
import {createStairsPatternSource} from "./canvas/factory/elements-factory.ts";
import {getHouseScaleFactors} from "./canvas/factory/house-factory.ts";

export * from "./canvas/constants";
export * from "./canvas/contraventamento";
export * from "./canvas/factory/elements-factory.ts";
export * from "./canvas/hints";
export * from "./canvas/factory/house-factory.ts";
export * from "./canvas/piloti";
export * from "./canvas/piloti-ops";

// Extend FabricObject prototype to include custom properties in serialization
const originalToObject = FabricObject.prototype.toObject;
FabricObject.prototype.toObject = function (propertiesToInclude: string[] = []) {
  return originalToObject.call(this, [...customProps, ...propertiesToInclude]);
};

export function createStairs(canvas: FabricCanvas): Rect {
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
}
