import type {HousePilotiRepository} from "./house-repository";
import type {DomainPilotiData, DomainViewType} from "./house-use-cases";
import {
  applyPilotiUpdateWithSingleMasterRule,
  calculateRecommendedPilotiData,
  canAddViewForType,
  getMaxViewCountForType,
} from "./house-use-cases";

export function getMaxViewCount(repository: HousePilotiRepository, viewType: DomainViewType): number {
  return getMaxViewCountForType(repository.getHouseType(), viewType);
}

export function canAddView(repository: HousePilotiRepository, viewType: DomainViewType): boolean {
  return canAddViewForType(repository.getHouseType(), viewType, repository.getViewCount(viewType));
}

export function applyPilotiUpdate(
  repository: HousePilotiRepository,
  pilotiId: string,
  patch: Partial<DomainPilotiData>,
  defaultPiloti: DomainPilotiData,
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
  repository: HousePilotiRepository,
  defaultPiloti: DomainPilotiData,
): void {
  const nextPilotis = calculateRecommendedPilotiData({
    pilotis: repository.getPilotis(),
    defaultPiloti,
  });
  repository.setPilotis(nextPilotis);
}
