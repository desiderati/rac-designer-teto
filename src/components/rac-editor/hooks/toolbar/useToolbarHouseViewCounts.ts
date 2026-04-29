import type {HouseReadPort} from '@/components/rac-editor/store/HouseReadPort.ts';
import type {HouseViewType} from '@/shared/types/house.ts';

export function useToolbarHouseViewCounts(houseReadPort: HouseReadPort) {
  const currentHouseType = houseReadPort.getCurrentHouseType();

  const getToolbarViewCount =
    (viewType: HouseViewType) => houseReadPort.getViewCount(viewType);

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
