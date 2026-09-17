import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {
  HousePiloti,
  HouseViewInstanceId,
  HouseSide,
  HouseState,
  HouseType,
} from '@/shared/types/house.ts';
import type {
  HouseRuntimeGroupRef,
} from '@/components/rac-editor/lib/editor-house-runtime-port.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import type {
  HouseViewRegistration,
  HouseViewRegistrationRequest,
} from '@/components/rac-editor/ports/HouseViewPort.ts';
import {EditorHousePilotiCommandService} from '@/components/rac-editor/lib/editor-house-piloti-command-service.ts';
import {EditorHouseSetupCommandService} from '@/components/rac-editor/lib/editor-house-setup-command-service.ts';
import {EditorHouseTerrainCommandService} from '@/components/rac-editor/lib/editor-house-terrain-command-service.ts';
import {EditorHouseViewCommandService} from '@/components/rac-editor/lib/editor-house-view-command-service.ts';
import type {EditorHouseViewRuntime} from '@/components/rac-editor/lib/editor-house-view-runtime.ts';
import type {InitialPilotiNivelDefinition} from '@/components/rac-editor/ports/HousePilotiPort.ts';

interface EditorHouseCommandServiceArgs<TGroup extends HouseRuntimeGroupRef> {
  getHouse: () => HouseState | null;
  getRuntimeHouse: () => HouseRuntimeSnapshot<TGroup> | null;
  getAggregate: () => HouseAggregate | null;
  getDefaultTerrainType: () => number;
  getSelectedPilotiHeights: () => readonly number[];
  shouldAutoAdjustPilotiHeightsFromNivel: () => boolean;
  getAllGroups: () => TGroup[];
  unregisterRuntimeViewGroup: (instanceId: HouseViewInstanceId) => void;
  viewRuntime: EditorHouseViewRuntime<TGroup>;
  persistHouse: () => void;
  syncConstructionSiteSession: () => void;
  requestCanvasRender: () => void;
  notify: () => void;
  refreshAutoContraventamento: () => void;
}

/**
 * Centraliza comandos de mutação da casa mantendo a fachada pública fina.
 */
export class EditorHouseCommandService<TGroup extends HouseRuntimeGroupRef> {
  private readonly pilotiCommands: EditorHousePilotiCommandService<TGroup>;
  private readonly setupCommands: EditorHouseSetupCommandService;
  private readonly terrainCommands: EditorHouseTerrainCommandService<TGroup>;
  private readonly viewCommands: EditorHouseViewCommandService<TGroup>;

  constructor(private readonly args: EditorHouseCommandServiceArgs<TGroup>) {
    this.setupCommands = new EditorHouseSetupCommandService({
      getAggregate: args.getAggregate,
      persistHouse: args.persistHouse,
      syncConstructionSiteSession: args.syncConstructionSiteSession,
      notify: args.notify,
    });
    this.terrainCommands = new EditorHouseTerrainCommandService<TGroup>({
      getAggregate: args.getAggregate,
      getDefaultTerrainType: args.getDefaultTerrainType,
      getRuntimeHouse: args.getRuntimeHouse,
      viewRuntime: args.viewRuntime,
      persistHouse: args.persistHouse,
      syncConstructionSiteSession: args.syncConstructionSiteSession,
      requestCanvasRender: args.requestCanvasRender,
      notify: args.notify,
    });
    this.viewCommands = new EditorHouseViewCommandService<TGroup>({
      getHouse: args.getHouse,
      getAggregate: args.getAggregate,
      unregisterRuntimeViewGroup: args.unregisterRuntimeViewGroup,
      persistHouse: args.persistHouse,
      notify: args.notify,
      refreshAutoContraventamento: args.refreshAutoContraventamento,
    });
    this.pilotiCommands = new EditorHousePilotiCommandService<TGroup>({
      getHouse: args.getHouse,
      getRuntimeHouse: args.getRuntimeHouse,
      getAggregate: args.getAggregate,
      getSelectedPilotiHeights: args.getSelectedPilotiHeights,
      shouldAutoAdjustPilotiHeightsFromNivel: args.shouldAutoAdjustPilotiHeightsFromNivel,
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

  removeView(instanceId: HouseViewInstanceId): void {
    this.viewCommands.removeView(instanceId);
  }

  updatePiloti(pilotiId: string, pilotiData: Partial<HousePiloti>): void {
    this.pilotiCommands.updatePiloti(pilotiId, pilotiData);
  }

  calculateAndApplyRecommendedHeights(): void {
    this.pilotiCommands.calculateAndApplyRecommendedHeights();
  }

  applyInitialPilotiNiveis(niveis: Record<string, InitialPilotiNivelDefinition>): void {
    this.pilotiCommands.applyInitialPilotiNiveis(niveis);
  }

  autoAssignAllSides(initialSide: HouseSide): void {
    this.viewCommands.autoAssignAllSides(initialSide);
  }
}
