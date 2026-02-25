import {houseManager} from '@/components/lib/house-manager.ts';
import type {HouseViewType} from '@/shared/types/house.ts';

export function useToolbarViewCounts() {
  const currentHouseType = houseManager.getHouseType();

  const getToolbarViewCount =
    (viewType: HouseViewType) => ({
      current: houseManager.getViewCount(viewType),
      max: houseManager.getMaxViewCount(viewType),
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
