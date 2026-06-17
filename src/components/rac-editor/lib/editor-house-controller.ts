import {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import type {HousePersistencePort} from '@/domain/house/house-persistence.port.ts';
import {
  HousePiloti,
  HouseSide,
  HouseState,
  HouseType,
  HouseViewInstanceId,
  HouseViewType,
} from '@/shared/types/house.ts';
import type {
  HouseViewRegistration,
  HouseViewRegistrationRequest,
} from '@/components/rac-editor/ports/HouseViewPort.ts';
import {EditorHouseState} from '@/components/rac-editor/lib/editor-house-state.ts';
import {EditorHouseVisualRuntime} from '@/components/rac-editor/lib/editor-house-visual-runtime.ts';
import {EditorHouseNotifier} from '@/components/rac-editor/lib/editor-house-notifier.ts';
import {EditorHouseQueryService} from '@/components/rac-editor/lib/editor-house-query-service.ts';
import {EditorHouseCommandService} from '@/components/rac-editor/lib/editor-house-command-service.ts';
import type {EditorHouseViewRuntime} from '@/components/rac-editor/lib/editor-house-view-runtime.ts';
import {EditorHouseSessionService} from '@/components/rac-editor/lib/editor-house-session-service.ts';
import {EditorHouseConstructionSiteBridge} from '@/components/rac-editor/lib/editor-house-construction-site-bridge.ts';
import type {
  CreateHouseInput,
  CreateConstructionSiteInput,
  ConstructionSiteSessionPort,
  CreateMonitorInput,
  UpdateFamilyInput,
  UpdateHouseExtraMaterialsInput,
  UpdateHouseConfigurationInput,
  UpdateConstructionSiteInput,
  UpdateMonitorInput,
} from '@/components/rac-editor/lib/construction-site-session.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import {createHouseStateSnapshot} from '@/components/rac-editor/lib/house-state-snapshot.ts';
import type {
  HouseRuntimeGroupRef,
  HouseVisualRuntimePort,
} from '@/components/rac-editor/lib/editor-house-runtime-port.ts';
import type {HouseDrawingDocument} from '@/shared/types/house-drawing-document.ts';
import type {
  MonitorRecord,
  PersistedHouseRecord,
  ConstructionSiteState,
  ConstructionSiteSummary,
  SiteAssessment,
} from '@/shared/types/construction-site.ts';

interface EditorHouseEffectsPort {
  refreshTopDoorMarkers(): void;

  refreshAutoStairs(): void;

  refreshAutoContraventamento(): void;

  refreshHouseViewReferenceMarkers(): void;

  refreshPilotiNameLabels(): void;

  refreshElevationNivelLabels(): void;
}

interface EditorHouseEffectsArgs<TGroup extends HouseRuntimeGroupRef> {
  getHouse: () => HouseRuntimeSnapshot<TGroup> | null;
  requestCanvasRender: () => void;
}

interface EditorHouseControllerArgs<TGroup extends HouseRuntimeGroupRef> {
  persistence: HousePersistencePort;
  constructionSiteSession: ConstructionSiteSessionPort;
  viewRuntime: EditorHouseViewRuntime<TGroup>;
  createEffects(args: EditorHouseEffectsArgs<TGroup>): EditorHouseEffectsPort;
  shouldAutoAdjustPilotiHeightsFromNivel?: () => boolean;
}

export class EditorHouseController<TGroup extends HouseRuntimeGroupRef> {

  private readonly state: EditorHouseState;

  private readonly visualRuntime = new EditorHouseVisualRuntime<TGroup>();

  private readonly notifier = new EditorHouseNotifier();

  private runtimeHouseCache: HouseRuntimeSnapshot<TGroup> | null | undefined = undefined;

  private readonly effects: EditorHouseEffectsPort;

  private readonly commands: EditorHouseCommandService<TGroup>;

  private readonly queries: EditorHouseQueryService<TGroup>;

  private readonly session: EditorHouseSessionService;

  private readonly constructionSiteSession: ConstructionSiteSessionPort;

  private readonly constructionSites: EditorHouseConstructionSiteBridge;

  constructor(args: EditorHouseControllerArgs<TGroup>) {
    this.constructionSiteSession = args.constructionSiteSession;
    this.state = new EditorHouseState(args.persistence);
    this.constructionSites = new EditorHouseConstructionSiteBridge({
      constructionSiteSession: this.constructionSiteSession,
      loadHouseDrawingDocument: (document) => this.loadNullableHouseDrawingDocument(document),
      notify: () => this.notify(),
    });
    this.session = new EditorHouseSessionService({
      constructionSiteSession: this.constructionSiteSession,
      getAggregate: () => this.getHouseAggregate(),
      getHouseType: () => this.getHouseType(),
      getTerrainType: () => this.getTerrainType(),
      persistHouse: () => this.persistHouse(),
      notify: () => this.notify(),
    });

    this.effects = args.createEffects({
      getHouse: () => this.runtimeHouse,
      requestCanvasRender: () => this.requestCanvasRender(),
    });

    this.commands = new EditorHouseCommandService<TGroup>({
      getHouse: () => this.house,
      getRuntimeHouse: () => this.runtimeHouse,
      getAggregate: () => this.getHouseAggregate(),
      getDefaultTerrainType: () => this.getDefaultTerrainType(),
      getSelectedPilotiHeights: () => this.session.getSelectedPilotiHeights(),
      shouldAutoAdjustPilotiHeightsFromNivel:
        () => args.shouldAutoAdjustPilotiHeightsFromNivel?.() ?? true,
      getAllGroups: () => this.getAllGroups(),
      unregisterRuntimeViewGroup: (instanceId) => this.visualRuntime.unregisterViewGroup(instanceId),
      viewRuntime: args.viewRuntime,
      persistHouse: () => this.persistHouse(),
      syncConstructionSiteSession: () => this.session.syncConstructionSiteSession(),
      requestCanvasRender: () => this.requestCanvasRender(),
      notify: () => this.notify(),
      refreshAutoContraventamento: () => this.effects.refreshAutoContraventamento(),
    });

    this.queries = new EditorHouseQueryService<TGroup>({
      getHouse: () => this.house,
      getAggregate: () => this.getHouseAggregate(),
      getAllRuntimeGroups: () => this.visualRuntime.getRegisteredGroups(),
      getDefaultTerrainType: () => this.getDefaultTerrainType(),
      cleanupStaleViews: (viewType) => this.cleanupStaleViews(viewType),
    });

    this.notifier.addInternalListener(() => this.effects.refreshTopDoorMarkers());
    this.notifier.addInternalListener(() => this.effects.refreshAutoStairs());
    this.notifier.addInternalListener(() => this.effects.refreshHouseViewReferenceMarkers());
    this.notifier.addInternalListener(() => this.effects.refreshPilotiNameLabels());
    this.notifier.addInternalListener(() => this.effects.refreshElevationNivelLabels());
  }

  private get house(): HouseState | null {
    return this.state.house;
  }

  private set house(nextHouse: HouseState | null) {
    this.state.house = nextHouse;
    this.invalidateRuntimeHouseCache();
  }

  private get runtimeHouse(): HouseRuntimeSnapshot<TGroup> | null {
    if (this.runtimeHouseCache === undefined) {
      this.runtimeHouseCache = this.visualRuntime.createRuntimeHouseSnapshot(this.house);
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
    this.visualRuntime.requestRender();
  }

  refreshAutoStairsForCurrentSettings(): void {
    this.effects.refreshAutoStairs();
  }

  refreshAutoContraventamentoForCurrentHouse(): void {
    this.effects.refreshAutoContraventamento();
  }

  refreshHouseViewReferenceMarkersForCurrentHouse(): void {
    this.invalidateRuntimeHouseCache();
    this.effects.refreshHouseViewReferenceMarkers();
  }

  refreshPilotiNameLabelsForCurrentSettings(): void {
    this.invalidateRuntimeHouseCache();
    this.effects.refreshPilotiNameLabels();
  }

  refreshElevationNivelLabelsForCurrentSettings(): void {
    this.invalidateRuntimeHouseCache();
    this.effects.refreshElevationNivelLabels();
  }

  subscribe(listener: () => void): () => void {
    return this.notifier.subscribe(listener);
  }

  initialize(canvas: HouseVisualRuntimePort<TGroup>): void {
    this.visualRuntime.initialize(canvas);
    this.invalidateRuntimeHouseCache();
    this.notify();
  }

  reset(): void {
    this.state.reset();
    this.visualRuntime.clearViewGroups();
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

  getHouse(): HouseRuntimeSnapshot<TGroup> | null {
    return this.runtimeHouse;
  }

  getHouseState(): HouseState | null {
    return createHouseStateSnapshot(this.queries.getHouse());
  }

  loadHouseDrawingDocument(document: HouseDrawingDocument): void {
    this.house = createHouseStateSnapshot(document.house);
    this.session.setSelectedPilotiHeights(document.setup.selectedPilotiHeights);
    this.session.setFamilyName(document.setup.familyName);
    this.session.syncConstructionSiteSession();
    this.notify();
  }

  getConstructionSiteSummaries(): ConstructionSiteSummary[] {
    return this.constructionSites.getConstructionSiteSummaries();
  }

  getConstructionSiteSnapshots(): ConstructionSiteState[] {
    return this.constructionSites.getConstructionSiteSnapshots();
  }

  getConstructionSiteSnapshot(): ConstructionSiteState | null {
    return this.constructionSites.getConstructionSiteSnapshot();
  }

  createConstructionSite(input: CreateConstructionSiteInput): ConstructionSiteState {
    return this.constructionSites.createConstructionSite(input);
  }

  updateActiveConstructionSite(input: UpdateConstructionSiteInput): void {
    this.constructionSites.updateActiveConstructionSite(input);
  }

  archiveActiveConstructionSite(): void {
    this.constructionSites.archiveActiveConstructionSite();
  }

  archiveConstructionSite(constructionSiteId: string): void {
    this.constructionSites.archiveConstructionSite(constructionSiteId);
  }

  unarchiveConstructionSite(constructionSiteId: string): void {
    this.constructionSites.unarchiveConstructionSite(constructionSiteId);
  }

  activateConstructionSite(constructionSiteId: string): HouseDrawingDocument | null {
    return this.constructionSites.activateConstructionSite(constructionSiteId);
  }

  createMonitor(input: CreateMonitorInput): MonitorRecord {
    return this.constructionSites.createMonitor(input);
  }

  updateMonitor(monitorId: string, input: UpdateMonitorInput): void {
    this.constructionSites.updateMonitor(monitorId, input);
  }

  inactivateMonitor(monitorId: string): void {
    this.constructionSites.inactivateMonitor(monitorId);
  }

  reactivateMonitor(monitorId: string): void {
    this.constructionSites.reactivateMonitor(monitorId);
  }

  createHouse(input: CreateHouseInput): PersistedHouseRecord {
    return this.constructionSites.createHouse(input);
  }

  duplicateActiveHouse(): PersistedHouseRecord {
    return this.constructionSites.duplicateActiveHouse();
  }

  archiveActiveHouse(): void {
    this.constructionSites.archiveActiveHouse();
  }

  archiveHouse(houseId: string): void {
    this.constructionSites.archiveHouse(houseId);
  }

  unarchiveHouse(houseId: string): void {
    this.constructionSites.unarchiveHouse(houseId);
  }

  activateHouse(constructionSiteId: string, houseId: string): HouseDrawingDocument | null {
    return this.constructionSites.activateHouse(constructionSiteId, houseId);
  }

  updateActiveFamily(input: UpdateFamilyInput): void {
    this.constructionSites.updateActiveFamily(input);
  }

  updateActiveHouseSiteAssessment(input: Partial<SiteAssessment>): void {
    this.constructionSites.updateActiveHouseSiteAssessment(input);
  }

  updateActiveHouseConfiguration(input: UpdateHouseConfigurationInput): void {
    this.constructionSites.updateActiveHouseConfiguration(input);
  }

  updateActiveHouseExtraMaterials(input: UpdateHouseExtraMaterialsInput): void {
    this.constructionSites.updateActiveHouseExtraMaterials(input);
  }

  saveActiveHouseDrawingDocument(document: HouseDrawingDocument): void {
    this.constructionSites.saveActiveHouseDrawingDocument(document);
  }

  getActiveHouseDrawingDocument(): HouseDrawingDocument | null {
    return this.constructionSites.getActiveHouseDrawingDocument();
  }

  canOpenRacEditor(): boolean {
    return this.constructionSites.canOpenRacEditor();
  }

  private loadNullableHouseDrawingDocument(document: HouseDrawingDocument | null): void {
    if (!document) {
      this.house = null;
      this.notify();
      return;
    }

    this.loadHouseDrawingDocument(document);
  }

  private getHouseAggregate(): HouseAggregate | null {
    return this.state.aggregate;
  }

  private isViewInstanceOnCanvas(instanceId: HouseViewInstanceId): boolean {
    return this.visualRuntime.includesViewInstance(instanceId);
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

  registerView(request: HouseViewRegistrationRequest): HouseViewRegistration | null {
    return this.commands.registerView(request);
  }

  removeView(instanceId: HouseViewInstanceId): void {
    this.commands.removeView(instanceId);
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

  getAllGroups(): TGroup[] {
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
