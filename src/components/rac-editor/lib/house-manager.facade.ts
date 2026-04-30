import {
  CanvasGroup,
} from '@/components/rac-editor/@canvas/lib';
import {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import {
  HousePiloti,
  HouseSide,
  HouseState,
  HouseType,
  HouseViewInstanceId,
  HouseViewType,
} from '@/shared/types/house.ts';
import type {CanvasHouseRuntimePort} from '@/components/rac-editor/@canvas/ports/CanvasHouseRuntimePort.ts';
import {HouseManagerState} from '@/components/rac-editor/lib/house-manager-state.ts';
import {HouseManagerCanvasRuntime} from '@/components/rac-editor/lib/house-manager-canvas-runtime.ts';
import {HouseManagerNotifier} from '@/components/rac-editor/lib/house-manager-notifier.ts';
import {HouseManagerQueryService} from '@/components/rac-editor/lib/house-manager-query-service.ts';
import {HouseManagerCommandService} from '@/components/rac-editor/lib/house-manager-command-service.ts';
import {HouseManagerEffects} from '@/components/rac-editor/lib/house-manager-effects.ts';
import {HouseManagerSessionService} from '@/components/rac-editor/lib/house-manager-session-service.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import {createHouseStateSnapshot} from '@/components/rac-editor/lib/house-state-snapshot.ts';

export class HouseManagerFacade {

  private readonly state = new HouseManagerState();

  private readonly canvasRuntime = new HouseManagerCanvasRuntime<CanvasGroup>();

  private readonly notifier = new HouseManagerNotifier();

  private runtimeHouseCache: HouseRuntimeSnapshot<CanvasGroup> | null | undefined = undefined;

  private readonly session = new HouseManagerSessionService({
    getAggregate: () => this.getHouseAggregate(),
    getHouseType: () => this.getHouseType(),
    getTerrainType: () => this.getTerrainType(),
    persistHouse: () => this.persistHouse(),
    notify: () => this.notify(),
  });

  private readonly effects = new HouseManagerEffects({
    getHouse: () => this.runtimeHouse,
    requestCanvasRender: () => this.requestCanvasRender(),
  });

  private readonly commands = new HouseManagerCommandService({
    getHouse: () => this.house,
    getRuntimeHouse: () => this.runtimeHouse,
    getAggregate: () => this.getHouseAggregate(),
    getDefaultTerrainType: () => this.getDefaultTerrainType(),
    getTerrainType: () => this.getTerrainType(),
    getSelectedPilotiHeights: () => this.session.getSelectedPilotiHeights(),
    getAllGroups: () => this.getAllGroups(),
    registerRuntimeViewGroup: (instanceId, group) => this.canvasRuntime.registerViewGroup(instanceId, group),
    unregisterRuntimeViewGroup: (instanceId) => this.canvasRuntime.unregisterViewGroup(instanceId),
    replaceRuntimeViewGroups: (entries) => this.canvasRuntime.replaceViewGroups(entries),
    findRuntimeViewInstanceId: (group) => this.canvasRuntime.findViewInstanceId(group),
    createCanvasRebuildInput: (params) => this.canvasRuntime.createRebuildInput(params),
    persistHouse: () => this.persistHouse(),
    syncProjectSession: () => this.session.syncProjectSession(),
    requestCanvasRender: () => this.requestCanvasRender(),
    notify: () => this.notify(),
    refreshAutoContraventamento: () => this.effects.refreshAutoContraventamento(),
  });

  private readonly queries = new HouseManagerQueryService<CanvasGroup>({
    getHouse: () => this.house,
    getAggregate: () => this.getHouseAggregate(),
    getAllRuntimeGroups: () => this.canvasRuntime.getRegisteredGroups(),
    getDefaultTerrainType: () => this.getDefaultTerrainType(),
    cleanupStaleViews: (viewType) => this.cleanupStaleViews(viewType),
  });

  constructor() {
    this.notifier.addInternalListener(() => this.effects.refreshTopDoorMarkers());
    this.notifier.addInternalListener(() => this.effects.refreshAutoStairs());
  }

  private get house(): HouseState | null {
    return this.state.house;
  }

  private set house(nextHouse: HouseState | null) {
    this.state.house = nextHouse;
    this.invalidateRuntimeHouseCache();
  }

  private get runtimeHouse(): HouseRuntimeSnapshot<CanvasGroup> | null {
    if (this.runtimeHouseCache === undefined) {
      this.runtimeHouseCache = this.canvasRuntime.createRuntimeHouseSnapshot(this.house);
    }

    return this.runtimeHouseCache;
  }

  private persistHouse(): void {
    this.state.persist();
    this.invalidateRuntimeHouseCache();
  }

  private notify(): void {
    this.invalidateRuntimeHouseCache();
    this.notifier.notify();
  }

  private invalidateRuntimeHouseCache(): void {
    this.runtimeHouseCache = undefined;
  }

  private requestCanvasRender(): void {
    this.canvasRuntime.requestRender();
  }

  refreshAutoStairsForCurrentSettings(): void {
    this.effects.refreshAutoStairs();
  }

  subscribe(listener: () => void): () => void {
    return this.notifier.subscribe(listener);
  }

  initialize(canvas: CanvasHouseRuntimePort): void {
    this.canvasRuntime.initialize(canvas);
    this.reset();
  }

  reset(): void {
    this.state.reset();
    this.canvasRuntime.clearViewGroups();
    this.invalidateRuntimeHouseCache();
    this.session.reset();
    this.notify();
  }

  getFamilyName(): string {
    return this.session.getFamilyName();
  }

  setFamilyName(name: string): void {
    this.session.setFamilyName(name);
  }

  getSelectedPilotiHeights(): readonly number[] {
    return this.session.getSelectedPilotiHeights();
  }

  setSelectedPilotiHeights(heights: number[]): void {
    this.session.setSelectedPilotiHeights(heights);
  }

  getHouseType(): HouseType {
    return this.queries.getHouseType();
  }

  setHouseType(type: HouseType): void {
    this.commands.setHouseType(type);
  }

  getTerrainType(): number {
    return this.queries.getTerrainType();
  }

  setTerrainType(terrainType: number): number {
    return this.commands.setTerrainType(terrainType);
  }

  getMaxHouseViewCount(viewType: HouseViewType): number {
    return this.queries.getMaxHouseViewCount(viewType);
  }

  getHouseViewCount(viewType: HouseViewType): number {
    return this.queries.getHouseViewCount(viewType);
  }

  canAddView(viewType: HouseViewType): boolean {
    return this.queries.canAddView(viewType);
  }

  canDeletePlant(): boolean {
    return this.queries.canDeletePlant();
  }

  hasOtherViews(): boolean {
    return this.queries.hasOtherViews();
  }

  getHouse(): HouseRuntimeSnapshot<CanvasGroup> | null {
    return this.runtimeHouse;
  }

  getHouseState(): HouseState | null {
    return createHouseStateSnapshot(this.queries.getHouse());
  }

  private getHouseAggregate(): HouseAggregate | null {
    return this.state.aggregate;
  }

  private isViewInstanceOnCanvas(instanceId: HouseViewInstanceId): boolean {
    return this.canvasRuntime.includesViewInstance(instanceId);
  }

  private cleanupStaleViews(viewType: HouseViewType): void {
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return;
    const removedCount =
      aggregate.cleanupStaleViews(viewType, (instanceId) => this.isViewInstanceOnCanvas(instanceId));
    if (removedCount > 0) {
      this.persistHouse();
    }
  }

  isViewAtLimit(viewType: HouseViewType): boolean {
    return this.queries.isViewAtLimit(viewType);
  }

  getAvailableViews(): HouseViewType[] {
    return this.queries.getAvailableViews();
  }

  getAvailableSides(viewType: HouseViewType): HouseSide[] {
    return this.queries.getAvailableSides(viewType);
  }

  registerView(viewType: HouseViewType, group: CanvasGroup, side?: HouseSide): void {
    this.commands.registerView(viewType, group, side);
  }

  rebuildFromCanvas(): void {
    this.commands.rebuildFromCanvas();
  }

  removeView(group: CanvasGroup): void {
    this.commands.removeView(group);
  }

  updatePiloti(pilotiId: string, pilotiData: Partial<HousePiloti>): void {
    this.commands.updatePiloti(pilotiId, pilotiData);
  }

  // Obtém os dados de um piloti.
  getPilotiData(pilotiId: string): HousePiloti {
    return this.queries.getPilotiData(pilotiId);
  }

  /**
   * Calcula as alturas recomendadas para os 12 pilotis usando interpolação bilinear
   * dos 4 níveis de canto e da proporção estrutural atual.
   *
   * - O nível de cada ponto da grade é interpolado a partir dos cantos A1, A4, C1 e C4.
   * - A altura mínima exigida é igual ao nível multiplicado por 3.
   * - A menor altura padrão maior ou igual à mínima é selecionada.
   * - Se a mínima exceder a tabela disponível, usa-se a maior altura disponível.
   */
  calculateAndApplyRecommendedHeights(): void {
    this.commands.calculateAndApplyRecommendedHeights();
  }

  hasAnyView(): boolean {
    return this.queries.hasAnyView();
  }

  getAllGroups(): CanvasGroup[] {
    return this.queries.getAllGroups();
  }

  autoAssignAllSides(_initialViewType: HouseViewType, initialSide: HouseSide): void {
    this.commands.autoAssignAllSides(initialSide);
  }

  getPreAssignedSides(viewType: HouseViewType): { label: string; side: HouseSide; onCanvas: boolean }[] {
    return this.queries.getPreAssignedSides(viewType);
  }

  hasPreAssignedSides(): boolean {
    return this.queries.hasPreAssignedSides();
  }

  private getDefaultTerrainType(): number {
    return this.state.getDefaultTerrainType();
  }
}
