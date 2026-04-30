import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {
  HousePiloti,
  HouseSide,
  HouseState,
  HouseViewInstanceId,
  HouseViewType,
} from '@/shared/types/house.ts';
import {
  CanvasGroup,
  toCanvasGroup,
} from '@/components/rac-editor/@canvas/lib';
import {createViewInstanceId} from '@/components/rac-editor/lib/house-identity.ts';
import {
  createViewGroupControlsVisibilityPatch,
  createViewGroupMetadataPatch,
  extractViewGroupRemovalHints,
} from '@/components/rac-editor/lib/house-view.ts';
import {applyPilotiDataToGroup} from '@/components/rac-editor/@canvas/lib/piloti-visual.ts';
import {
  collectHouseGroupRebuildSources,
  toRebuildViewSource,
} from '@/components/rac-editor/@canvas/lib/canvas-rebuild.ts';

export function registerHouseView(params: {
  aggregate: HouseAggregate;
  house: HouseState;
  viewType: HouseViewType;
  group: CanvasGroup;
  side?: HouseSide;
  terrainType: number;
}): {
  registered: boolean;
  registeredTopView: boolean;
  instanceId: HouseViewInstanceId | null;
  group: CanvasGroup | null;
} {

  const canvasGroup = toCanvasGroup(params.group);
  if (!canvasGroup) {
    return {registered: false, registeredTopView: false, instanceId: null, group: null};
  }

  const instanceId = createViewInstanceId(params.viewType);
  Object.assign(
    canvasGroup,
    createViewGroupMetadataPatch<HouseViewType, HouseSide>({
      viewType: params.viewType,
      instanceId,
      side: params.side,
    }),
  );

  canvasGroup.groundTerrainType = params.terrainType;
  applyPilotiDataToGroup(canvasGroup, params.house.pilotis);

  params.aggregate.registerView({
    viewType: params.viewType,
    instanceId,
    side: params.side,
  });

  return {
    registered: true,
    registeredTopView: params.viewType === 'top',
    instanceId,
    group: canvasGroup,
  };
}

export function removeHouseView(params: {
  aggregate: HouseAggregate;
  group: CanvasGroup;
  instanceId?: HouseViewInstanceId | null;
}): { removedCount: number; removedInstanceIds: HouseViewInstanceId[] } {

  const hints = extractViewGroupRemovalHints<HouseViewType>({
    houseViewType: params.group.houseViewType,
    houseInstanceId: params.group.houseInstanceId,
  });

  const removedWithHint = hints.instanceId
    ? params.aggregate.removeView({
      viewType: hints.viewType,
      instanceId: hints.instanceId,
    })
    : {removedCount: 0};

  if (removedWithHint.removedCount > 0) {
    return {
      removedCount: removedWithHint.removedCount,
      removedInstanceIds: [
        hints.instanceId,
        params.instanceId,
      ].filter((value): value is string => Boolean(value)),
    };
  }

  if (!params.instanceId) {
    return {removedCount: 0, removedInstanceIds: []};
  }

  const removedFallback = params.aggregate.removeView({instanceId: params.instanceId});
  return {
    removedCount: removedFallback.removedCount,
    removedInstanceIds: removedFallback.removedCount > 0 ? [params.instanceId] : [],
  };
}

export function rebuildHouseViewsFromCanvas(params: {
  aggregate: HouseAggregate;
  house: HouseState;
  canvasGroups: CanvasGroup[];
  pilotisFromCanvas: Record<string, HousePiloti>;
  terrainTypeFromCanvas: number;
}): { groupsToSync: CanvasGroup[]; runtimeViewGroups: Array<{ instanceId: HouseViewInstanceId; group: CanvasGroup }> } {

  const rebuildSources =
    collectHouseGroupRebuildSources(params.canvasGroups).map((source) =>
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

  params.house.pilotis = params.pilotisFromCanvas;
  params.house.terrainType = params.terrainTypeFromCanvas;

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
