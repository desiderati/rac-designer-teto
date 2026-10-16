import {hasDefinedPilotis} from '@/components/construction-site/lib/house-definition.ts';
import type {HouseReadPort} from '@/components/rac-editor/ports/HouseReadPort.ts';

type HouseExportAvailabilityReadPort = Partial<Pick<HouseReadPort, 'getCurrentHouseType' | 'getPilotis'>>;

/** A mesma definição de pilotis e níveis libera todos os pontos de exportação. */
export function canExportDefinedHouse(houseReadPort: HouseExportAvailabilityReadPort): boolean {
  return hasDefinedPilotis(houseReadPort.getCurrentHouseType?.() ?? null, houseReadPort.getPilotis?.() ?? {});
}
