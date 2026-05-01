import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {
  HousePiloti,
  HouseRuntimeViews,
  HouseState,
} from '@/shared/types/house.ts';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';
import {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import {
  applyPilotiDataToGroup,
  syncPilotiUpdateAcrossViews,
} from '@/components/rac-editor/@canvas/lib/piloti-visual.ts';
import {resolvePilotiUpdateEffects} from '@/domain/house/use-cases/house-piloti.use-case.ts';
import {updateGroundTerrainType} from '@/components/rac-editor/@canvas/lib/terrain.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import {collectElevationViewInstances} from '@/components/rac-editor/lib/editor-house-terrain.ts';

export function applyCurrentHouseDataToGroups(params: {
  groups: CanvasGroup[];
  pilotis: Record<string, HousePiloti>;
  terrainType: number;
}): void {
  params.groups.forEach((group) => {
    group.groundTerrainType = params.terrainType;
    applyPilotiDataToGroup(group, params.pilotis);
  });
}

export function applyTerrainTypeToElevationViews(
  house: Pick<HouseRuntimeSnapshot<CanvasGroup>, 'views'> | null | undefined,
  terrainType: number,
): void {
  collectElevationViewInstances(house).forEach((instance) => {
    updateGroundTerrainType(instance.group, terrainType);
  });
}

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
