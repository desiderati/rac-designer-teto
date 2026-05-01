import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {
  HousePiloti,
  HouseRuntimeViews,
  HouseSide,
  HouseState,
  HouseViewInstanceId,
  HouseViewType,
} from '@/shared/types/house.ts';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';
import {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import {
  createViewGroupControlsVisibilityPatch,
  createViewGroupMetadataPatch,
} from '@/components/rac-editor/lib/house-view.ts';
import {
  applyPilotiDataToGroup,
  syncPilotiUpdateAcrossViews,
} from '@/components/rac-editor/@canvas/lib/piloti-visual.ts';
import {
  collectHouseGroupRebuildSources,
  toRebuildViewSource,
} from '@/components/rac-editor/@canvas/lib/canvas-rebuild.ts';
import {resolvePilotiUpdateEffects} from '@/domain/house/use-cases/house-piloti.use-case.ts';
import {updateGroundTerrainType} from '@/components/rac-editor/@canvas/lib/terrain.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import {collectElevationViewInstances} from '@/components/rac-editor/lib/editor-house-terrain.ts';

export function rebuildHouseViewsFromCanvas(params: {
  aggregate: HouseAggregate;
  house: HouseState;
  visualGroups: CanvasGroup[];
  pilotisFromRuntime: Record<string, HousePiloti>;
  terrainTypeFromRuntime: number;
}): { groupsToSync: CanvasGroup[]; runtimeViewGroups: Array<{ instanceId: HouseViewInstanceId; group: CanvasGroup }> } {

  const rebuildSources =
    collectHouseGroupRebuildSources(params.visualGroups).map((source) =>
      toRebuildViewSource(source.group),
    );

  const rebuilt = params.aggregate.rebuildViewsFromCanvasSources(rebuildSources);
  const runtimeViewGroups =
    rebuilt.normalizedItems.map((item) => ({
      instanceId: item.instanceId,
      group: item.group,
    }));

  rebuilt.normalizedItems.forEach((item) => {
    const runtimeGroup =
      runtimeViewGroups.find((entry) => entry.instanceId === item.instanceId)?.group;
    if (!runtimeGroup) return;

    Object.assign(
      runtimeGroup,
      createViewGroupMetadataPatch<HouseViewType, HouseSide>({
        viewType: item.viewType as HouseViewType,
        instanceId: item.instanceId,
        side: item.side as HouseSide | undefined,
      }),
    );
    runtimeGroup.setControlsVisibility(createViewGroupControlsVisibilityPatch());
  });

  params.house.pilotis = params.pilotisFromRuntime;
  params.house.terrainType = params.terrainTypeFromRuntime;

  if (!params.aggregate.hasAnyViewInstances(rebuilt.views)) {
    params.house.houseType = null;
    params.house.preAssignedSides = {};
  }

  return {
    groupsToSync: runtimeViewGroups.map((entry) => entry.group),
    runtimeViewGroups,
  };
}

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
