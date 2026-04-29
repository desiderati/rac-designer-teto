import type {HouseReadPort} from '@/components/rac-editor/store/HouseReadPort.ts';
import type {HouseViewType} from '@/shared/types/house.ts';

export function useMenuHouseViewCounts(houseReadPort: HouseReadPort) {
  const currentHouseType = houseReadPort.getCurrentHouseType();

  const getMenuViewCount =
    (viewType: HouseViewType) => houseReadPort.getViewCount(viewType);

  const frontViewCount = getMenuViewCount('front');
  const backViewCount = getMenuViewCount('back');
  const side1ViewCount = getMenuViewCount('side1');
  const side2ViewCount = getMenuViewCount('side2');

  return {
    currentHouseType,
    frontViewCount,
    backViewCount,
    side1ViewCount,
    side2ViewCount,
  };
}
