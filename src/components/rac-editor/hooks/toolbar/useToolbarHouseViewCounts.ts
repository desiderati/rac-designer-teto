import {houseManager} from '@/components/rac-editor/lib/house-manager.ts';
import type {HouseViewType} from '@/shared/types/house.ts';

export function useToolbarHouseViewCounts() {
  const currentHouseType = houseManager.getHouseType();

  const getToolbarViewCount =
    (viewType: HouseViewType) => ({
      current: houseManager.getHouseViewCount(viewType),
      max: houseManager.getMaxHouseViewCount(viewType),
    });

  const frontViewCount = getToolbarViewCount('front');
  const backViewCount = getToolbarViewCount('back');
  const side1ViewCount = getToolbarViewCount('side1');
  const side2ViewCount = getToolbarViewCount('side2');

  return {
    currentHouseType,
    frontViewCount,
    backViewCount,
    side1ViewCount,
    side2ViewCount,
  };
}
