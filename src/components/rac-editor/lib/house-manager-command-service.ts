import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {
  HousePiloti,
  HouseViewInstanceId,
  HouseSide,
  HouseState,
  HouseType,
} from '@/shared/types/house.ts';
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
import {HouseManagerSetupCommandService} from '@/components/rac-editor/lib/house-manager-setup-command-service.ts';
import {HouseManagerTerrainCommandService} from '@/components/rac-editor/lib/house-manager-terrain-command-service.ts';
import {HouseManagerViewCommandService} from '@/components/rac-editor/lib/house-manager-view-command-service.ts';
import type {HouseManagerViewRuntime} from '@/components/rac-editor/lib/house-manager-view-runtime.ts';

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
  private readonly setupCommands: HouseManagerSetupCommandService;
  private readonly terrainCommands: HouseManagerTerrainCommandService<TGroup>;
  private readonly viewCommands: HouseManagerViewCommandService<TGroup>;

  constructor(private readonly args: HouseManagerCommandServiceArgs<TGroup>) {
    this.setupCommands = new HouseManagerSetupCommandService({
      getAggregate: args.getAggregate,
      persistHouse: args.persistHouse,
      syncProjectSession: args.syncProjectSession,
      notify: args.notify,
    });
    this.terrainCommands = new HouseManagerTerrainCommandService<TGroup>({
      getAggregate: args.getAggregate,
      getDefaultTerrainType: args.getDefaultTerrainType,
      getRuntimeHouse: args.getRuntimeHouse,
      viewRuntime: args.viewRuntime,
      persistHouse: args.persistHouse,
      syncProjectSession: args.syncProjectSession,
      requestCanvasRender: args.requestCanvasRender,
      notify: args.notify,
    });
    this.viewCommands = new HouseManagerViewCommandService<TGroup>({
      getHouse: args.getHouse,
      getAggregate: args.getAggregate,
      getTerrainType: args.getTerrainType,
      getAllGroups: args.getAllGroups,
      unregisterRuntimeViewGroup: args.unregisterRuntimeViewGroup,
      replaceRuntimeViewGroups: args.replaceRuntimeViewGroups,
      createVisualRebuildInput: args.createVisualRebuildInput,
      viewRuntime: args.viewRuntime,
      persistHouse: args.persistHouse,
      notify: args.notify,
      refreshAutoContraventamento: args.refreshAutoContraventamento,
    });
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
    this.setupCommands.setHouseType(type);
  }

  setTerrainType(terrainType: number): number {
    return this.terrainCommands.setTerrainType(terrainType);
  }

  registerView(request: HouseViewRegistrationRequest): HouseViewRegistration | null {
    return this.viewCommands.registerView(request);
  }

  rebuildFromCanvas(): void {
    this.viewCommands.rebuildFromCanvas();
  }

  removeView(instanceId: HouseViewInstanceId): void {
    this.viewCommands.removeView(instanceId);
  }

  updatePiloti(pilotiId: string, pilotiData: Partial<HousePiloti>): void {
    this.pilotiCommands.updatePiloti(pilotiId, pilotiData);
  }

  calculateAndApplyRecommendedHeights(): void {
    this.pilotiCommands.calculateAndApplyRecommendedHeights();
  }

  autoAssignAllSides(initialSide: HouseSide): void {
    this.viewCommands.autoAssignAllSides(initialSide);
  }
}
