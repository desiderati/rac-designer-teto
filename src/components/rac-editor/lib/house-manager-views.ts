import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {
  HousePiloti,
  HouseSide,
  HouseState,
  HouseViewType,
} from '@/shared/types/house.ts';
import {
  CanvasGroup,
  toCanvasGroup,
} from '@/components/rac-editor/canvas/lib';
import {createViewInstanceId} from '@/components/rac-editor/lib/house-identity.ts';
import {
  createViewGroupControlsVisibilityPatch,
  createViewGroupMetadataPatch,
  extractViewGroupRemovalHints,
} from '@/components/rac-editor/lib/house-view.ts';
import {applyPilotiDataToGroup} from '@/components/rac-editor/canvas/lib/piloti-visual.ts';
import {
  collectHouseGroupRebuildSources,
  toRebuildViewSource,
} from '@/components/rac-editor/canvas/lib/canvas-rebuild.ts';

export function registerHouseView(params: {
  aggregate: HouseAggregate<CanvasGroup>;
  house: HouseState<CanvasGroup>;
  viewType: HouseViewType;
  group: CanvasGroup;
  side?: HouseSide;
  terrainType: number;
}): { registered: boolean; registeredTopView: boolean } {

  const canvasGroup = toCanvasGroup(params.group);
  if (!canvasGroup) {
    return {registered: false, registeredTopView: false};
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
    group: canvasGroup,
    instanceId,
    side: params.side,
  });

  return {
    registered: true,
    registeredTopView: params.viewType === 'top',
  };
}

export function removeHouseView(params: {
  aggregate: HouseAggregate<CanvasGroup>;
  group: CanvasGroup;
}): { removedCount: number } {

  const hints = extractViewGroupRemovalHints<HouseViewType>({
    houseViewType: params.group.houseViewType,
    houseInstanceId: params.group.houseInstanceId,
  });

  const removedWithHint = params.aggregate.removeView({
    viewType: hints.viewType,
    instanceId: hints.instanceId,
    group: params.group,
  });

  if (removedWithHint.removedCount > 0) {
    return {removedCount: removedWithHint.removedCount};
  }

  const removedFallback = params.aggregate.removeView({group: params.group});
  return {removedCount: removedFallback.removedCount};
}

export function rebuildHouseViewsFromCanvas(params: {
  aggregate: HouseAggregate<CanvasGroup>;
  house: HouseState<CanvasGroup>;
  canvasGroups: CanvasGroup[];
  pilotisFromCanvas: Record<string, HousePiloti>;
  terrainTypeFromCanvas: number;
}): { groupsToSync: CanvasGroup[] } {

  const rebuildSources =
    collectHouseGroupRebuildSources(params.canvasGroups).map((source) =>
      toRebuildViewSource(source.group),
    );

  const rebuilt = params.aggregate.rebuildViewsFromCanvasSources(rebuildSources);

  rebuilt.normalizedItems.forEach((item) => {
    Object.assign(
      item.group,
      createViewGroupMetadataPatch<HouseViewType, HouseSide>({
        viewType: item.viewType as HouseViewType,
        instanceId: item.instanceId,
        side: item.side as HouseSide | undefined,
      }),
    );
    item.group.setControlsVisibility(createViewGroupControlsVisibilityPatch());
  });

  params.house.pilotis = params.pilotisFromCanvas;
  params.house.terrainType = params.terrainTypeFromCanvas;

  if (!params.aggregate.hasAnyViewInstances(rebuilt.views)) {
    params.house.houseType = null;
    params.house.preAssignedSides = {};
  }

  return {
    groupsToSync: params.aggregate.collectAllViewGroups(params.house.views),
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
