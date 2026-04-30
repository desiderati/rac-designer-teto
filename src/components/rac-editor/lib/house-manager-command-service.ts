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
  HouseManagerVisualRebuildInput,
} from '@/components/rac-editor/lib/house-manager-visual-runtime.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import type {HouseRuntimeGroupRef} from '@/components/rac-editor/lib/house-manager-runtime-port.ts';
import type {
  HouseViewRegistration,
  HouseViewRegistrationRequest,
} from '@/components/rac-editor/ports/HouseViewPort.ts';

export interface HouseManagerViewRuntime<TGroup extends HouseRuntimeGroupRef> {
  rebuildViewsFromRuntime(params: {
    aggregate: HouseAggregate;
    house: HouseState;
    visualGroups: TGroup[];
    pilotisFromRuntime: Record<string, HousePiloti>;
    terrainTypeFromRuntime: number;
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
  unregisterRuntimeViewGroup: (instanceId: HouseViewInstanceId) => void;
  replaceRuntimeViewGroups: (entries: Array<{ instanceId: HouseViewInstanceId; group: TGroup }>) => void;
  createVisualRebuildInput: (params: {
    currentPilotis: Record<string, HousePiloti>;
    fallbackTerrainType: number;
  }) => HouseManagerVisualRebuildInput<TGroup> | null;
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

  registerView(request: HouseViewRegistrationRequest): HouseViewRegistration | null {
    const aggregate = this.args.getAggregate();
    const house = this.args.getHouse();
    if (!aggregate || !house) return null;

    aggregate.registerView({
      viewType: request.viewType,
      instanceId: request.instanceId,
      side: request.side,
    });

    this.args.persistHouse();
    if (request.viewType === 'top') {
      this.args.refreshAutoContraventamento();
    }

    this.args.notify();
    return {
      viewType: request.viewType,
      instanceId: request.instanceId,
      side: request.side,
      registeredTopView: request.viewType === 'top',
    };
  }

  rebuildFromCanvas(): void {
    const aggregate = this.args.getAggregate();
    const house = this.args.getHouse();
    if (!house || !aggregate) return;

    const visualState = this.args.createVisualRebuildInput({
      currentPilotis: house.pilotis,
      fallbackTerrainType: this.args.getTerrainType(),
    });
    if (!visualState) return;

    const rebuild = this.args.viewRuntime.rebuildViewsFromRuntime({
      aggregate,
      house,
      visualGroups: visualState.visualGroups,
      pilotisFromRuntime: visualState.pilotisFromRuntime,
      terrainTypeFromRuntime: visualState.terrainTypeFromRuntime,
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

  removeView(instanceId: HouseViewInstanceId): void {
    const aggregate = this.args.getAggregate();
    if (!aggregate) return;

    const result = aggregate.removeView({instanceId});

    if (result.removedCount > 0) {
      this.args.unregisterRuntimeViewGroup(instanceId);
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
