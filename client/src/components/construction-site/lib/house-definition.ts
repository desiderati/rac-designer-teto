import type {PersistedHouseRecord} from '@/shared/types/construction-site.ts';
import type {HousePiloti, HouseType} from '@/shared/types/house.ts';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';

export function hasDefinedPilotis(type: HouseType, pilotis: Record<string, HousePiloti>): boolean {
  return Boolean(type) && getAllPilotiIds().every((id) => {
    const point = pilotis[id];
    return point && Number.isFinite(point.height) && point.height >= 0 && Number.isFinite(point.nivel) && point.nivel >= .2;
  }) && Object.values(pilotis).some((point) => point.height > 0)
    && Object.values(pilotis).filter((point) => point.isMaster).length === 1;
}
export function isHouseDefinitionReady(house: PersistedHouseRecord): boolean {
  return house.status !== 'archived' && hasDefinedPilotis(house.houseType, house.drawingDocument.house?.pilotis ?? {});
}
