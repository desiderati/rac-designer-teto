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
} from '@/components/rac-editor/@canvas/lib';
import {
  createViewGroupControlsVisibilityPatch,
  createViewGroupMetadataPatch,
} from '@/components/rac-editor/lib/house-view.ts';
import {applyPilotiDataToGroup} from '@/components/rac-editor/@canvas/lib/piloti-visual.ts';
import {
  collectHouseGroupRebuildSources,
  toRebuildViewSource,
} from '@/components/rac-editor/@canvas/lib/canvas-rebuild.ts';

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
