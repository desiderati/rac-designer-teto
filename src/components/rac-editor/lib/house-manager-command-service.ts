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
import {HouseManagerPilotiCommandService} from '@/components/rac-editor/lib/house-manager-piloti-command-service.ts';

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
  private readonly pilotiCommands: HouseManagerPilotiCommandService<TGroup>;

  constructor(private readonly args: HouseManagerCommandServiceArgs<TGroup>) {
    this.pilotiCommands = new HouseManagerPilotiCommandService<TGroup>({
      getHouse: args.getHouse,
      getRuntimeHouse: args.getRuntimeHouse,
      getAggregate: args.getAggregate,
      getSelectedPilotiHeights: args.getSelectedPilotiHeights,
      getAllGroups: args.getAllGroups,
      updateRuntimePiloti: (params) => args.viewRuntime.updatePiloti(params),
      persistHouse: args.persistHouse,
      requestCanvasRender: args.requestCanvasRender,
      notify: args.notify,
      refreshAutoContraventamento: args.refreshAutoContraventamento,
    });
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
    this.pilotiCommands.updatePiloti(pilotiId, pilotiData);
  }

  calculateAndApplyRecommendedHeights(): void {
    this.pilotiCommands.calculateAndApplyRecommendedHeights();
  }

  autoAssignAllSides(initialSide: HouseSide): void {
    const aggregate = this.args.getAggregate();
    if (!aggregate) return;

    aggregate.autoAssignAllSides(initialSide);
    this.args.persistHouse();
    this.args.notify();
  }
}
