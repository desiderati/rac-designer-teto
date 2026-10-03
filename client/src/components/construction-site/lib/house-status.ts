import type {HousePresentationStatus, PersistedHouseRecord} from '@/shared/types/construction-site.ts';

/** A apresentação reflete a configuração atual e conserva os bloqueios do registro. */
export function getHousePresentationStatus(house: PersistedHouseRecord): HousePresentationStatus {
  if (house.status === 'archived' || house.status === 'built') return house.status;
  if (!house.houseType) {
    if (house.hasHouseBeenDefined || house.fieldAnalysis || house.hasRacBeenPrinted || house.lastRacExportedAt) return 'undefined';
    return house.status === 'rac_printed' ? 'rac_printed' : 'initial';
  }
  return house.status === 'rac_printed' ? 'rac_printed' : 'defined';
}
