import type {HouseReadPort} from '@/components/rac-editor/ports/HouseReadPort.ts';

type HouseExportAvailabilityReadPort = Pick<HouseReadPort, 'getViewCount'>;

/**
 * A RAC exige a planta materializada no Canvas. Elevações isoladas ou uma casa
 * apenas cadastrada não liberam a exportação.
 */
export function hasHouseTopViewInsertedInCanvas(houseReadPort: HouseExportAvailabilityReadPort): boolean {
  return houseReadPort.getViewCount('top').current > 0;
}
