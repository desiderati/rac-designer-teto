import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import type {CanvasHouseRuntimePort} from '@/components/rac-editor/@canvas/ports/CanvasHouseRuntimePort.ts';
import type {
  HousePiloti,
  HouseRuntimeViews,
  HouseState,
  HouseViewInstanceId,
  HouseViewType,
  HouseViews,
} from '@/shared/types/house.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';

export interface HouseManagerCanvasRebuildInput {
  canvasGroups: CanvasGroup[];
  pilotisFromCanvas: Record<string, HousePiloti>;
  terrainTypeFromCanvas: number;
}

export class HouseManagerCanvasRuntime {
  private canvas: CanvasHouseRuntimePort | null = null;
  private readonly viewGroupsById = new Map<HouseViewInstanceId, CanvasGroup>();

  initialize(canvas: CanvasHouseRuntimePort): void {
    this.canvas = canvas;
  }

  includesGroup(group: CanvasGroup): boolean {
    return this.canvas?.includesGroup(group) ?? false;
  }

  includesViewInstance(instanceId: HouseViewInstanceId): boolean {
    const group = this.getViewGroup(instanceId);
    return group ? this.includesGroup(group) : false;
  }

  registerViewGroup(instanceId: HouseViewInstanceId, group: CanvasGroup): void {
    this.viewGroupsById.set(instanceId, group);
  }

  unregisterViewGroup(instanceId: HouseViewInstanceId): void {
    this.viewGroupsById.delete(instanceId);
  }

  replaceViewGroups(entries: Array<{ instanceId: HouseViewInstanceId; group: CanvasGroup }>): void {
    this.viewGroupsById.clear();
    entries.forEach((entry) => {
      this.viewGroupsById.set(entry.instanceId, entry.group);
    });
  }

  clearViewGroups(): void {
    this.viewGroupsById.clear();
  }

  getViewGroup(instanceId: HouseViewInstanceId): CanvasGroup | null {
    return this.viewGroupsById.get(instanceId) ?? null;
  }

  findViewInstanceId(group: CanvasGroup): HouseViewInstanceId | null {
    for (const [instanceId, registeredGroup] of this.viewGroupsById.entries()) {
      if (registeredGroup === group) return instanceId;
    }

    return typeof group.houseInstanceId === 'string' ? group.houseInstanceId : null;
  }

  getRegisteredGroups(): CanvasGroup[] {
    return [...this.viewGroupsById.values()];
  }

  createRuntimeHouseSnapshot(house: HouseState | null): HouseRuntimeSnapshot | null {
    if (!house) return null;

    return {
      ...house,
      pilotis: {...house.pilotis},
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
  }): HouseManagerCanvasRebuildInput | null {
    if (!this.canvas) return null;

    return {
      canvasGroups: this.canvas.getHouseGroups(),
      pilotisFromCanvas: this.canvas.readPilotis(params.currentPilotis),
      terrainTypeFromCanvas: this.canvas.resolveTerrainType(params.fallbackTerrainType),
    };
  }

  private createRuntimeViews(views: HouseViews): HouseRuntimeViews<CanvasGroup> {
    const runtimeViews = {} as HouseRuntimeViews<CanvasGroup>;

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
        .filter((instance): instance is HouseRuntimeViews<CanvasGroup>[HouseViewType][number] => instance !== null);
    });

    return runtimeViews;
  }
}
