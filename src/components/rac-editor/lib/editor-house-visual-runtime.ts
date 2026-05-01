import type {
  HousePiloti,
  HouseRuntimeViews,
  HouseState,
  HouseViewInstanceId,
  HouseViewType,
  HouseViews,
} from '@/shared/types/house.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import type {
  HouseRuntimeGroupRef,
  HouseVisualRuntimePort,
} from '@/components/rac-editor/lib/editor-house-runtime-port.ts';
import {cloneHousePilotis} from '@/components/rac-editor/lib/house-state-snapshot.ts';

export interface EditorHouseVisualRebuildInput<TGroup extends HouseRuntimeGroupRef> {
  visualGroups: TGroup[];
  pilotisFromRuntime: Record<string, HousePiloti>;
  terrainTypeFromRuntime: number;
}

export class EditorHouseVisualRuntime<TGroup extends HouseRuntimeGroupRef> {
  private visualRuntime: HouseVisualRuntimePort<TGroup> | null = null;
  private readonly viewGroupsById = new Map<HouseViewInstanceId, TGroup>();

  initialize(visualRuntime: HouseVisualRuntimePort<TGroup>): void {
    this.visualRuntime = visualRuntime;
  }

  includesGroup(group: TGroup): boolean {
    return this.visualRuntime?.includesGroup(group) ?? false;
  }

  includesViewInstance(instanceId: HouseViewInstanceId): boolean {
    const group = this.getViewGroup(instanceId);
    return group ? this.includesGroup(group) : false;
  }

  unregisterViewGroup(instanceId: HouseViewInstanceId): void {
    this.viewGroupsById.delete(instanceId);
  }

  replaceViewGroups(entries: Array<{ instanceId: HouseViewInstanceId; group: TGroup }>): void {
    this.viewGroupsById.clear();
    entries.forEach((entry) => {
      this.viewGroupsById.set(entry.instanceId, entry.group);
    });
  }

  clearViewGroups(): void {
    this.viewGroupsById.clear();
  }

  getViewGroup(instanceId: HouseViewInstanceId): TGroup | null {
    return this.viewGroupsById.get(instanceId) ?? this.findVisualGroupByInstanceId(instanceId);
  }

  getRegisteredGroups(): TGroup[] {
    return this.visualRuntime?.getHouseGroups() ?? [...this.viewGroupsById.values()];
  }

  createRuntimeHouseSnapshot(house: HouseState | null): HouseRuntimeSnapshot<TGroup> | null {
    if (!house) return null;

    return {
      ...house,
      pilotis: cloneHousePilotis(house.pilotis),
      sideMappings: {...house.sideMappings},
      preAssignedSides: {...house.preAssignedSides},
      views: this.createRuntimeViews(house.views),
    };
  }

  requestRender(): void {
    this.visualRuntime?.requestRenderAll();
  }

  createRebuildInput(params: {
    currentPilotis: Record<string, HousePiloti>;
    fallbackTerrainType: number;
  }): EditorHouseVisualRebuildInput<TGroup> | null {
    if (!this.visualRuntime) return null;

    return {
      visualGroups: this.visualRuntime.getHouseGroups(),
      pilotisFromRuntime: this.visualRuntime.readPilotis(params.currentPilotis),
      terrainTypeFromRuntime: this.visualRuntime.resolveTerrainType(params.fallbackTerrainType),
    };
  }

  private createRuntimeViews(views: HouseViews): HouseRuntimeViews<TGroup> {
    const runtimeViews = {} as HouseRuntimeViews<TGroup>;

    (Object.keys(views) as HouseViewType[]).forEach((viewType) => {
      runtimeViews[viewType] = views[viewType]
        .map((instance) => {
          const group = this.getViewGroup(instance.instanceId);
          if (!group) return null;
          return {
            ...instance,
            group,
          };
        })
        .filter((instance): instance is HouseRuntimeViews<TGroup>[HouseViewType][number] => instance !== null);
    });

    return runtimeViews;
  }

  private findVisualGroupByInstanceId(instanceId: HouseViewInstanceId): TGroup | null {
    const groups = this.visualRuntime?.getHouseGroups() ?? [];
    return groups.find((group) => group.houseInstanceId === instanceId) ?? null;
  }
}
