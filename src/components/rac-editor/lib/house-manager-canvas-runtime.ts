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
} from '@/components/rac-editor/lib/house-manager-runtime-port.ts';
import {cloneHousePilotis} from '@/components/rac-editor/lib/house-state-snapshot.ts';

export interface HouseManagerCanvasRebuildInput<TGroup extends HouseRuntimeGroupRef> {
  canvasGroups: TGroup[];
  pilotisFromCanvas: Record<string, HousePiloti>;
  terrainTypeFromCanvas: number;
}

export class HouseManagerCanvasRuntime<TGroup extends HouseRuntimeGroupRef> {
  private canvas: HouseVisualRuntimePort<TGroup> | null = null;
  private readonly viewGroupsById = new Map<HouseViewInstanceId, TGroup>();

  initialize(canvas: HouseVisualRuntimePort<TGroup>): void {
    this.canvas = canvas;
  }

  includesGroup(group: TGroup): boolean {
    return this.canvas?.includesGroup(group) ?? false;
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
    return this.viewGroupsById.get(instanceId) ?? this.findCanvasGroupByInstanceId(instanceId);
  }

  getRegisteredGroups(): TGroup[] {
    return this.canvas?.getHouseGroups() ?? [...this.viewGroupsById.values()];
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
    this.canvas?.requestRenderAll();
  }

  createRebuildInput(params: {
    currentPilotis: Record<string, HousePiloti>;
    fallbackTerrainType: number;
  }): HouseManagerCanvasRebuildInput<TGroup> | null {
    if (!this.canvas) return null;

    return {
      canvasGroups: this.canvas.getHouseGroups(),
      pilotisFromCanvas: this.canvas.readPilotis(params.currentPilotis),
      terrainTypeFromCanvas: this.canvas.resolveTerrainType(params.fallbackTerrainType),
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

  private findCanvasGroupByInstanceId(instanceId: HouseViewInstanceId): TGroup | null {
    const groups = this.canvas?.getHouseGroups() ?? [];
    return groups.find((group) => group.houseInstanceId === instanceId) ?? null;
  }
}
