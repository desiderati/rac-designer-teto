import {Canvas as FabricCanvas} from 'fabric';
import {HOUSE_BASE_HEIGHT, HOUSE_BASE_WIDTH} from '../../constants.ts';
import {HOUSE_DEFAULTS} from '@/config.ts';

export function getHouseScaleFactors(canvas: FabricCanvas) {
  const objs = canvas.getObjects();

  // Find the top view (plant view) group
  const topViewGroup = objs.find((o: any) => o.myType === 'house' && o.houseView === 'top') as any;

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
        widthFactor: currentW / HOUSE_BASE_WIDTH,
        depthFactor: currentH / HOUSE_BASE_HEIGHT,
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
      widthFactor: currentW / HOUSE_BASE_WIDTH,
      depthFactor: currentH / HOUSE_BASE_HEIGHT,
      actualWidth: currentW,
      actualHeight: currentH,
    };
  }

  const defaultS = HOUSE_DEFAULTS.viewScale;
  return {
    widthFactor: defaultS,
    depthFactor: defaultS,
    actualWidth: HOUSE_BASE_WIDTH * defaultS,
    actualHeight: HOUSE_BASE_HEIGHT * defaultS,
  };
}
