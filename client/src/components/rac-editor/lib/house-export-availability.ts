import type {HouseReadPort} from '@/components/rac-editor/ports/HouseReadPort.ts';
import {ALL_HOUSE_VIEW_TYPES} from '@/shared/types/house.ts';

type HouseExportAvailabilityReadPort = Pick<HouseReadPort, 'getViewCount'>;

/**
 * A exportacao do RAC so faz sentido quando alguma vista da casa ja foi
 * materializada no canvas. Casa cadastrada/configurada sem vista inserida ainda
 * nao deve liberar PDF.
 */
export function hasHouseViewInsertedInCanvas(houseReadPort: HouseExportAvailabilityReadPort): boolean {
  return ALL_HOUSE_VIEW_TYPES.some((viewType) => houseReadPort.getViewCount(viewType).current > 0);
}
