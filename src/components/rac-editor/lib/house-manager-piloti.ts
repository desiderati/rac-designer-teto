import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {HousePiloti, HouseRuntimeViews, HouseState} from '@/shared/types/house.ts';
import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';
import {
  applyPilotiDataToGroup,
  syncPilotiUpdateAcrossViews,
} from '@/components/rac-editor/@canvas/lib/piloti-visual.ts';
import {resolvePilotiUpdateEffects} from '@/domain/house/use-cases/house-piloti.use-case.ts';

export function updateHousePiloti(params: {
  aggregate: HouseAggregate;
  house: HouseState;
  runtimeViews: HouseRuntimeViews<CanvasGroup>;
  pilotiId: string;
  pilotiData: Partial<HousePiloti>;
  selectedPilotiHeights: readonly number[];
  groups: CanvasGroup[];
}): { updated: boolean; shouldRefreshAutoContraventamento: boolean } {

  const previousPiloti = params.house.pilotis?.[params.pilotiId] ?? null;

  const {
    shouldRefreshAutoContraventamento,
    shouldRecalculateInterpolatedNiveis,
  } = resolvePilotiUpdateEffects({
    pilotiId: params.pilotiId,
    pilotiData: params.pilotiData,
    previousPiloti,
    hasTopView: (params.house.views?.top?.length ?? 0) > 0,
  });

  const {clearedMasters} = params.aggregate.applyPilotiPatch(params.pilotiId, params.pilotiData);

  if (shouldRecalculateInterpolatedNiveis) {
    params.aggregate.recalculateRecommendedPilotiData(
      DEFAULT_HOUSE_PILOTI,
      true,
      params.selectedPilotiHeights,
    );

    if (params.pilotiData.height !== undefined) {
      params.aggregate.applyPilotiPatch(params.pilotiId, {height: params.pilotiData.height});
    }

    params.groups.forEach((group) => {
      applyPilotiDataToGroup(group, params.house.pilotis);
    });

    return {
      updated: true,
      shouldRefreshAutoContraventamento,
    };
  }

  syncPilotiUpdateAcrossViews(
    params.pilotiId,
    params.house.pilotis,
    params.pilotiData,
    params.runtimeViews,
    clearedMasters,
  );

  return {
    updated: true,
    shouldRefreshAutoContraventamento,
  };
}

export function calculateRecommendedHousePilotiHeights(params: {
  aggregate: HouseAggregate;
  selectedPilotiHeights: readonly number[];
}): void {

  params.aggregate.recalculateRecommendedPilotiData(
    DEFAULT_HOUSE_PILOTI,
    true,
    params.selectedPilotiHeights,
  );
}
