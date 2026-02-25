import type {HouseRepository} from "@/domain/repository/house-repository.ts";
import {
  applyPilotiUpdateWithSingleMasterRule,
  calculateRecommendedPilotiData,
  canAddViewForType,
  getMaxViewCountForType,
} from "../use-cases/house-use-cases.ts";
import {HousePiloti, HouseViewType} from "@/shared/types/house.ts";

export function getMaxViewCount(repository: HouseRepository, viewType: HouseViewType): number {
  return getMaxViewCountForType(repository.getHouseType(), viewType);
}

export function canAddView(repository: HouseRepository, viewType: HouseViewType): boolean {
  return canAddViewForType(repository.getHouseType(), viewType, repository.getViewCount(viewType));
}

export function applyPilotiUpdate(
  repository: HouseRepository,
  pilotiId: string,
  patch: Partial<HousePiloti>,
  defaultPiloti: HousePiloti,
): { clearedMasters: string[] } {
  const result = applyPilotiUpdateWithSingleMasterRule({
    pilotis: repository.getPilotis(),
    pilotiId,
    patch,
    defaultPiloti,
  });
  repository.setPilotis(result.pilotis);
  return {clearedMasters: result.clearedMasters};
}

export function recalculateRecommendedPilotiData(
  repository: HouseRepository,
  defaultPiloti: HousePiloti,
): void {
  const nextPilotis = calculateRecommendedPilotiData({
    pilotis: repository.getPilotis(),
    defaultPiloti,
  });
  repository.setPilotis(nextPilotis);
}
