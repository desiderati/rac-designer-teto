import type {HouseReadPort} from '@/components/rac-editor/ports/HouseReadPort.ts';
import type {HouseViewType} from '@/shared/types/house.ts';
import {hasHouseViewInsertedInCanvas} from '@/components/rac-editor/lib/house-export-availability.ts';

export function useRacEditorMenuHouseViewCounts(houseReadPort: HouseReadPort) {
  const currentHouseType = houseReadPort.getCurrentHouseType();

  const getMenuViewCount =
    (viewType: HouseViewType) => houseReadPort.getViewCount(viewType);

  const frontViewCount = getMenuViewCount('front');
  const backViewCount = getMenuViewCount('back');
  const side1ViewCount = getMenuViewCount('side1');
  const side2ViewCount = getMenuViewCount('side2');
  const canExportPDF = hasHouseViewInsertedInCanvas(houseReadPort);

  return {
    currentHouseType,
    frontViewCount,
    backViewCount,
    side1ViewCount,
    side2ViewCount,
    canExportPDF,
  };
}
