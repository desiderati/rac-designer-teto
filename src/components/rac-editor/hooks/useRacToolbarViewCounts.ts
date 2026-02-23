import {houseManager, ViewType} from '@/lib/house-manager';

export function useRacToolbarViewCounts() {
  const currentHouseType = houseManager.getHouseType();

  const getToolbarViewCount = (viewType: ViewType) => ({
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
