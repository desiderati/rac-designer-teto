import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {
  HousePiloti,
  HouseRuntimeViews,
  HouseViewInstanceId,
  HouseSide,
  HouseState,
  HouseType,
  HouseViewType,
} from '@/shared/types/house.ts';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';
import {normalizeTerrainSolidityLevel} from '@/shared/config.ts';
import type {
  HouseManagerCanvasRebuildInput,
} from '@/components/rac-editor/lib/house-manager-canvas-runtime.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import type {HouseRuntimeGroupRef} from '@/components/rac-editor/lib/house-manager-runtime-port.ts';

export interface HouseManagerViewRuntime<TGroup extends HouseRuntimeGroupRef> {
  registerView(params: {
    aggregate: HouseAggregate;
    house: HouseState;
    viewType: HouseViewType;
    group: TGroup;
    side?: HouseSide;
    terrainType: number;
  }): {
    registered: boolean;
    registeredTopView: boolean;
    instanceId: HouseViewInstanceId | null;
    group: TGroup | null;
  };

  removeView(params: {
    aggregate: HouseAggregate;
    group: TGroup;
    instanceId?: HouseViewInstanceId | null;
  }): { removedCount: number; removedInstanceIds: HouseViewInstanceId[] };

  rebuildViewsFromRuntime(params: {
    aggregate: HouseAggregate;
    house: HouseState;
    canvasGroups: TGroup[];
    pilotisFromCanvas: Record<string, HousePiloti>;
    terrainTypeFromCanvas: number;
  }): { groupsToSync: TGroup[]; runtimeViewGroups: Array<{ instanceId: HouseViewInstanceId; group: TGroup }> };

  applyCurrentHouseDataToGroups(params: {
    groups: TGroup[];
    pilotis: Record<string, HousePiloti>;
    terrainType: number;
  }): void;

  applyTerrainTypeToElevationViews(house: HouseRuntimeSnapshot<TGroup> | null, terrainType: number): void;

  updatePiloti(params: {
    aggregate: HouseAggregate;
    house: HouseState;
    runtimeViews: HouseRuntimeViews<TGroup>;
    pilotiId: string;
    pilotiData: Partial<HousePiloti>;
    selectedPilotiHeights: readonly number[];
    groups: TGroup[];
  }): { updated: boolean; shouldRefreshAutoContraventamento: boolean };
}

interface HouseManagerCommandServiceArgs<TGroup extends HouseRuntimeGroupRef> {
  getHouse: () => HouseState | null;
  getRuntimeHouse: () => HouseRuntimeSnapshot<TGroup> | null;
  getAggregate: () => HouseAggregate | null;
  getDefaultTerrainType: () => number;
  getTerrainType: () => number;
  getSelectedPilotiHeights: () => readonly number[];
  getAllGroups: () => TGroup[];
  registerRuntimeViewGroup: (instanceId: HouseViewInstanceId, group: TGroup) => void;
  unregisterRuntimeViewGroup: (instanceId: HouseViewInstanceId) => void;
  replaceRuntimeViewGroups: (entries: Array<{ instanceId: HouseViewInstanceId; group: TGroup }>) => void;
  findRuntimeViewInstanceId: (group: TGroup) => HouseViewInstanceId | null;
  createCanvasRebuildInput: (params: {
    currentPilotis: Record<string, HousePiloti>;
    fallbackTerrainType: number;
  }) => HouseManagerCanvasRebuildInput<TGroup> | null;
  viewRuntime: HouseManagerViewRuntime<TGroup>;
  persistHouse: () => void;
  syncProjectSession: () => void;
  requestCanvasRender: () => void;
  notify: () => void;
  refreshAutoContraventamento: () => void;
}

/**
 * Centraliza comandos de mutação da casa mantendo a fachada pública fina.
 */
export class HouseManagerCommandService<TGroup extends HouseRuntimeGroupRef> {
  constructor(private readonly args: HouseManagerCommandServiceArgs<TGroup>) {
  }

  setHouseType(type: HouseType): void {
    const aggregate = this.args.getAggregate();
    if (!aggregate) return;

    aggregate.setHouseType(type);
    this.args.persistHouse();
    this.args.syncProjectSession();
    this.args.notify();
  }

  setTerrainType(terrainType: number): number {
    const aggregate = this.args.getAggregate();
    if (!aggregate) return this.args.getDefaultTerrainType();

    const normalized = normalizeTerrainSolidityLevel(terrainType);
    aggregate.setTerrainType(normalized);

    this.args.persistHouse();
    this.args.syncProjectSession();
    this.args.viewRuntime.applyTerrainTypeToElevationViews(this.args.getRuntimeHouse(), normalized);

    this.args.requestCanvasRender();
    this.args.notify();
    return normalized;
  }

  registerView(viewType: HouseViewType, group: TGroup, side?: HouseSide): void {
    const aggregate = this.args.getAggregate();
    const house = this.args.getHouse();
    if (!aggregate || !house) return;

    const result = this.args.viewRuntime.registerView({
      aggregate,
      house,
      viewType,
      group,
      side,
      terrainType: this.args.getTerrainType(),
    });
    if (!result.registered) return;

    if (result.instanceId && result.group) {
      this.args.registerRuntimeViewGroup(result.instanceId, result.group);
    }

    this.args.persistHouse();
    if (result.registeredTopView) {
      this.args.refreshAutoContraventamento();
    }

    this.args.notify();
  }

  rebuildFromCanvas(): void {
    const aggregate = this.args.getAggregate();
    const house = this.args.getHouse();
    if (!house || !aggregate) return;

    const canvasState = this.args.createCanvasRebuildInput({
      currentPilotis: house.pilotis,
      fallbackTerrainType: this.args.getTerrainType(),
    });
    if (!canvasState) return;

    const rebuild = this.args.viewRuntime.rebuildViewsFromRuntime({
      aggregate,
      house,
      canvasGroups: canvasState.canvasGroups,
      pilotisFromCanvas: canvasState.pilotisFromCanvas,
      terrainTypeFromCanvas: canvasState.terrainTypeFromCanvas,
    });
    this.args.replaceRuntimeViewGroups(rebuild.runtimeViewGroups);
    this.args.persistHouse();

    this.args.viewRuntime.applyCurrentHouseDataToGroups({
      groups: rebuild.groupsToSync,
      terrainType: this.args.getTerrainType(),
      pilotis: house.pilotis,
    });

    this.args.notify();
  }

  removeView(group: TGroup): void {
    const aggregate = this.args.getAggregate();
    if (!aggregate) return;

    const result = this.args.viewRuntime.removeView({
      aggregate,
      group,
      instanceId: this.args.findRuntimeViewInstanceId(group),
    });

    if (result.removedCount > 0) {
      result.removedInstanceIds.forEach((instanceId) => {
        this.args.unregisterRuntimeViewGroup(instanceId);
      });
      this.args.persistHouse();
      this.args.notify();
    }
  }

  updatePiloti(pilotiId: string, pilotiData: Partial<HousePiloti>): void {
    const aggregate = this.args.getAggregate();
    const house = this.args.getHouse();
    if (!aggregate || !house) return;

    const result = this.args.viewRuntime.updatePiloti({
      aggregate,
      house,
      pilotiId,
      pilotiData,
      selectedPilotiHeights: this.args.getSelectedPilotiHeights(),
      runtimeViews: this.args.getRuntimeHouse()?.views ?? {
        top: [],
        front: [],
        back: [],
        side1: [],
        side2: [],
      },
      groups: this.args.getAllGroups(),
    });
    if (!result.updated) return;

    this.args.persistHouse();
    if (result.shouldRefreshAutoContraventamento) {
      this.args.refreshAutoContraventamento();
    }
    this.args.requestCanvasRender();
    this.args.notify();
  }

  calculateAndApplyRecommendedHeights(): void {
    const aggregate = this.args.getAggregate();
    const house = this.args.getHouse();
    if (!house || !aggregate) return;

    aggregate.recalculateRecommendedPilotiData(
      DEFAULT_HOUSE_PILOTI,
      true,
      this.args.getSelectedPilotiHeights(),
    );
    this.args.persistHouse();
  }

  autoAssignAllSides(initialSide: HouseSide): void {
    const aggregate = this.args.getAggregate();
    if (!aggregate) return;

    aggregate.autoAssignAllSides(initialSide);
    this.args.persistHouse();
    this.args.notify();
  }
}
