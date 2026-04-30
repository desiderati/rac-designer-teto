import type {
  CanvasGroup,
} from '@/components/rac-editor/@canvas/lib';
import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {
  HousePiloti,
  HouseViewInstanceId,
  HouseSide,
  HouseState,
  HouseType,
  HouseViewType,
} from '@/shared/types/house.ts';
import {normalizeTerrainSolidityLevel} from '@/shared/config.ts';
import {
  applyTerrainTypeToElevationViews,
} from '@/components/rac-editor/lib/house-manager-terrain.ts';
import {
  applyCurrentHouseDataToGroups,
  rebuildHouseViewsFromCanvas,
  registerHouseView,
  removeHouseView,
} from '@/components/rac-editor/lib/house-manager-views.ts';
import {
  calculateRecommendedHousePilotiHeights,
  updateHousePiloti,
} from '@/components/rac-editor/lib/house-manager-piloti.ts';
import type {
  HouseManagerCanvasRebuildInput,
} from '@/components/rac-editor/lib/house-manager-canvas-runtime.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';

interface HouseManagerCommandServiceArgs {
  getHouse: () => HouseState | null;
  getRuntimeHouse: () => HouseRuntimeSnapshot | null;
  getAggregate: () => HouseAggregate | null;
  getDefaultTerrainType: () => number;
  getTerrainType: () => number;
  getSelectedPilotiHeights: () => readonly number[];
  getAllGroups: () => CanvasGroup[];
  registerRuntimeViewGroup: (instanceId: HouseViewInstanceId, group: CanvasGroup) => void;
  unregisterRuntimeViewGroup: (instanceId: HouseViewInstanceId) => void;
  replaceRuntimeViewGroups: (entries: Array<{ instanceId: HouseViewInstanceId; group: CanvasGroup }>) => void;
  findRuntimeViewInstanceId: (group: CanvasGroup) => HouseViewInstanceId | null;
  createCanvasRebuildInput: (params: {
    currentPilotis: Record<string, HousePiloti>;
    fallbackTerrainType: number;
  }) => HouseManagerCanvasRebuildInput | null;
  persistHouse: () => void;
  syncProjectSession: () => void;
  requestCanvasRender: () => void;
  notify: () => void;
  refreshAutoContraventamento: () => void;
}

/**
 * Centraliza comandos de mutação da casa mantendo a fachada pública fina.
 */
export class HouseManagerCommandService {
  constructor(private readonly args: HouseManagerCommandServiceArgs) {
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
    applyTerrainTypeToElevationViews(this.args.getRuntimeHouse(), normalized);

    this.args.requestCanvasRender();
    this.args.notify();
    return normalized;
  }

  registerView(viewType: HouseViewType, group: CanvasGroup, side?: HouseSide): void {
    const aggregate = this.args.getAggregate();
    const house = this.args.getHouse();
    if (!aggregate || !house) return;

    const result = registerHouseView({
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

    const rebuild = rebuildHouseViewsFromCanvas({
      aggregate,
      house,
      canvasGroups: canvasState.canvasGroups,
      pilotisFromCanvas: canvasState.pilotisFromCanvas,
      terrainTypeFromCanvas: canvasState.terrainTypeFromCanvas,
    });
    this.args.replaceRuntimeViewGroups(rebuild.runtimeViewGroups);
    this.args.persistHouse();

    applyCurrentHouseDataToGroups({
      groups: rebuild.groupsToSync,
      terrainType: this.args.getTerrainType(),
      pilotis: house.pilotis,
    });

    this.args.notify();
  }

  removeView(group: CanvasGroup): void {
    const aggregate = this.args.getAggregate();
    if (!aggregate) return;

    const result = removeHouseView({
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

    const result = updateHousePiloti({
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

    calculateRecommendedHousePilotiHeights({
      aggregate,
      selectedPilotiHeights: this.args.getSelectedPilotiHeights(),
    });
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
