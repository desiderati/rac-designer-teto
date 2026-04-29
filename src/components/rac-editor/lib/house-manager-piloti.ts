import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {HousePiloti, HouseState} from '@/shared/types/house.ts';
import type {CanvasGroup} from '@/components/rac-editor/canvas/lib';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';
import {PILOTI_CORNER_IDS} from '@/shared/config.ts';
import {
  applyPilotiDataToGroup,
  syncPilotiUpdateAcrossViews,
} from '@/components/rac-editor/canvas/lib/piloti-visual.ts';

export function updateHousePiloti(params: {
  aggregate: HouseAggregate<CanvasGroup>;
  house: HouseState<CanvasGroup>;
  pilotiId: string;
  pilotiData: Partial<HousePiloti>;
  selectedPilotiHeights: readonly number[];
  groups: CanvasGroup[];
}): { updated: boolean; shouldRefreshAutoContraventamento: boolean } {
  const previousPiloti = params.house.pilotis?.[params.pilotiId] ?? null;
  const hasNivelChange =
    params.pilotiData.nivel !== undefined
    && previousPiloti?.nivel !== Number(params.pilotiData.nivel);
  const shouldRefreshAutoContraventamento =
    hasNivelChange && (params.house.views?.top?.length ?? 0) > 0;

  const shouldRecalculateInterpolatedNiveis = PILOTI_CORNER_IDS.includes(params.pilotiId)
    && params.pilotiData.nivel !== undefined
    && previousPiloti?.nivel !== Number(params.pilotiData.nivel);

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
    params.house.views,
    clearedMasters,
  );

  return {
    updated: true,
    shouldRefreshAutoContraventamento,
  };
}

export function calculateRecommendedHousePilotiHeights(params: {
  aggregate: HouseAggregate<CanvasGroup>;
  selectedPilotiHeights: readonly number[];
}): void {
  params.aggregate.recalculateRecommendedPilotiData(
    DEFAULT_HOUSE_PILOTI,
    true,
    params.selectedPilotiHeights,
  );
}
