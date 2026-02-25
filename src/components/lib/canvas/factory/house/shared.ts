import {Canvas as FabricCanvas, Rect} from "fabric";
import {BASE_TOP_HEIGHT, BASE_TOP_WIDTH} from "../../constants.ts";

import {createDiagonalStripePattern} from "../../piloti.ts";

export function getHouseScaleFactors(canvas: FabricCanvas) {
  const objs = canvas.getObjects();

  // Find the top view (plant view) group
  const topViewGroup = objs.find((o: any) => o.myType === "house" && o.houseView === "top") as any;

  if (topViewGroup) {
    // Get the house body rect inside the group
    const houseBody = topViewGroup.getObjects?.().find((o: any) => o.isHouseBody === true) as any;
    if (houseBody) {
      // Calculate actual dimensions considering group scale and object scale
      const groupScaleX = topViewGroup.scaleX || 1;
      const groupScaleY = topViewGroup.scaleY || 1;
      const currentW = houseBody.width * (houseBody.scaleX || 1) * groupScaleX;
      const currentH = houseBody.height * (houseBody.scaleY || 1) * groupScaleY;
      return {
        widthFactor: currentW / BASE_TOP_WIDTH,
        depthFactor: currentH / BASE_TOP_HEIGHT,
        actualWidth: currentW,
        actualHeight: currentH,
      };
    }
  }

  // Fallback: look for standalone house body (legacy support)
  const houseBody = objs.find((o: any) => o.isHouseBody === true) as any;
  if (houseBody) {
    const currentW = houseBody.width * (houseBody.scaleX || 1);
    const currentH = houseBody.height * (houseBody.scaleY || 1);
    return {
      widthFactor: currentW / BASE_TOP_WIDTH,
      depthFactor: currentH / BASE_TOP_HEIGHT,
      actualWidth: currentW,
      actualHeight: currentH,
    };
  }

  const defaultS = 0.6;
  return {
    widthFactor: defaultS,
    depthFactor: defaultS,
    actualWidth: BASE_TOP_WIDTH * defaultS,
    actualHeight: BASE_TOP_HEIGHT * defaultS,
  };
}

// Create a stripe overlay rect for the bottom 2/3 of a piloti rect
export function createPilotiStripeOverlay(
  pilotiId: string,
  left: number,
  top: number,
  width: number,
  fullHeight: number,
): Rect {
  const stripeHeight = (fullHeight * 2) / 3;
  const stripeTop = top + fullHeight / 3;

  const stripe = new Rect({
    width,
    height: stripeHeight,
    fill: createDiagonalStripePattern(),
    left,
    top: stripeTop,
    originY: "top",
    strokeWidth: 0,
    selectable: false,
    evented: false,
    objectCaching: false,
    opacity: 0.5,
  });
  (stripe as any).isPilotiStripe = true;
  (stripe as any).pilotiId = pilotiId;
  return stripe;
}
