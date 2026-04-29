import {
  CanvasGroup,
} from '@/components/rac-editor/lib/canvas';
import {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import {
  HousePiloti,
  HouseSide,
  HouseState,
  HouseType,
  HouseViewType,
} from '@/shared/types/house.ts';
import {HouseManagerSessionMetadata} from '@/components/rac-editor/lib/house-manager-session.ts';
import {
  refreshAutoContraventamento,
  refreshAutoStairs,
  refreshTopDoorMarkers,
} from '@/components/rac-editor/lib/house-manager-auto-effects.ts';
import type {HouseManagerCanvasPort} from '@/components/rac-editor/store/HouseManagerCanvasPort.ts';
import {HouseManagerState} from '@/components/rac-editor/lib/house-manager-state.ts';
import {HouseManagerCanvasRuntime} from '@/components/rac-editor/lib/house-manager-canvas-runtime.ts';
import {HouseManagerNotifier} from '@/components/rac-editor/lib/house-manager-notifier.ts';
import {HouseManagerQueryService} from '@/components/rac-editor/lib/house-manager-query-service.ts';
import {HouseManagerCommandService} from '@/components/rac-editor/lib/house-manager-command-service.ts';

export class HouseManagerFacade {

  private readonly state = new HouseManagerState<CanvasGroup>();
  private readonly sessionMetadata = new HouseManagerSessionMetadata();
  private readonly canvasRuntime = new HouseManagerCanvasRuntime();
  private readonly notifier = new HouseManagerNotifier();
  private readonly commands = new HouseManagerCommandService({
    getHouse: () => this.house,
    getAggregate: () => this.getHouseAggregate(),
    getDefaultTerrainType: () => this.getDefaultTerrainType(),
    getTerrainType: () => this.getTerrainType(),
    getSelectedPilotiHeights: () => this.sessionMetadata.getSelectedPilotiHeights(),
    getAllGroups: () => this.getAllGroups(),
    createCanvasRebuildInput: (params) => this.canvasRuntime.createRebuildInput(params),
    persistHouse: () => this.persistHouse(),
    syncProjectSession: () => this.syncProjectSession(),
    requestCanvasRender: () => this.requestCanvasRender(),
    notify: () => this.notify(),
    refreshAutoContraventamento: () => this.refreshAutoContraventamento(),
  });
  private readonly queries = new HouseManagerQueryService({
    getHouse: () => this.house,
    getAggregate: () => this.getHouseAggregate(),
    getDefaultTerrainType: () => this.getDefaultTerrainType(),
    cleanupStaleViews: (viewType) => this.cleanupStaleViews(viewType),
  });

  constructor() {
    this.notifier.addInternalListener(() => this.refreshTopDoorMarkers());
    this.notifier.addInternalListener(() => this.refreshAutoStairs());
  }

  private get house(): HouseState<CanvasGroup> | null {
    return this.state.house;
  }

  private set house(nextHouse: HouseState<CanvasGroup> | null) {
    this.state.house = nextHouse;
  }

  private persistHouse(): void {
    this.state.persist();
  }

  private hydrateEditorMetadataFromProjectSession(): void {
    this.sessionMetadata.hydrateFromProjectSession({
      aggregate: this.getHouseAggregate(),
      persistHouse: () => this.persistHouse(),
    });
  }

  private syncProjectSession(): void {
    this.sessionMetadata.syncProjectSession({
      houseType: this.getHouseType(),
      terrainType: this.getTerrainType(),
    });
  }

  private notify(): void {
    this.notifier.notify();
  }

  private requestCanvasRender(): void {
    this.canvasRuntime.requestRender();
  }

  private refreshTopDoorMarkers(): void {
    refreshTopDoorMarkers({
      house: this.house,
      requestRender: () => this.requestCanvasRender(),
    });
  }

  private refreshAutoStairs(): void {
    refreshAutoStairs({
      house: this.house,
      requestRender: () => this.requestCanvasRender(),
    });
  }

  refreshAutoStairsForCurrentSettings(): void {
    this.refreshAutoStairs();
  }

  private refreshAutoContraventamento(): void {
    refreshAutoContraventamento({
      house: this.house,
      requestRender: () => this.requestCanvasRender(),
    });
  }

  subscribe(listener: () => void): () => void {
    return this.notifier.subscribe(listener);
  }

  initialize(canvas: HouseManagerCanvasPort): void {
    this.canvasRuntime.initialize(canvas);
    this.reset();
  }

  reset(): void {
    this.state.reset();
    this.sessionMetadata.reset();
    this.hydrateEditorMetadataFromProjectSession();
    this.notify();
  }

  getFamilyName(): string {
    return this.sessionMetadata.getFamilyName();
  }

  setFamilyName(name: string): void {
    this.sessionMetadata.setFamilyName(name);
    this.syncProjectSession();
    this.notify();
  }

  getSelectedPilotiHeights(): readonly number[] {
    return this.sessionMetadata.getSelectedPilotiHeights();
  }

  setSelectedPilotiHeights(heights: number[]): void {
    this.sessionMetadata.setSelectedPilotiHeights(heights);
    this.syncProjectSession();
  }

  // Get/Set house type
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

  // Get max count for a view type based on current house type
  getMaxHouseViewCount(viewType: HouseViewType): number {
    return this.queries.getMaxHouseViewCount(viewType);
  }

  // Get current count of a view type
  getHouseViewCount(viewType: HouseViewType): number {
    return this.queries.getHouseViewCount(viewType);
  }

  // Check if can add more of this view type
  canAddView(viewType: HouseViewType): boolean {
    return this.queries.canAddView(viewType);
  }

  // Check if plant (top view) can be deleted
  canDeletePlant(): boolean {
    return this.queries.canDeletePlant();
  }

  // Check if any non-plant views exist
  hasOtherViews(): boolean {
    return this.queries.hasOtherViews();
  }

  getHouse(): HouseState<CanvasGroup> | null {
    return this.queries.getHouse();
  }

  private getHouseAggregate(): HouseAggregate<CanvasGroup> | null {
    return this.state.aggregate;
  }

  private isGroupOnCanvas(group: CanvasGroup): boolean {
    return this.canvasRuntime.includesGroup(group);
  }

  private cleanupStaleViews(viewType: HouseViewType): void {
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return;
    const removedCount =
      aggregate.cleanupStaleViews(viewType, (group) => this.isGroupOnCanvas(group));
    if (removedCount > 0) {
      this.persistHouse();
    }
  }

  // Check if this specific view type has reached its maximum
  isViewAtLimit(viewType: HouseViewType): boolean {
    return this.queries.isViewAtLimit(viewType);
  }

  getAvailableViews(): HouseViewType[] {
    return this.queries.getAvailableViews();
  }

  // Get which sides are available for a given view type
  getAvailableSides(viewType: HouseViewType): HouseSide[] {
    return this.queries.getAvailableSides(viewType);
  }

  // Register a view with its group and side
  registerView(viewType: HouseViewType, group: CanvasGroup, side?: HouseSide): void {
    this.commands.registerView(viewType, group, side);
  }

  // Rebuild house view registry from current canvas groups (used after undo/import).
  rebuildFromCanvas(): void {
    this.commands.rebuildFromCanvas();
  }

  // Remove a view (when deleted from canvas)
  removeView(group: CanvasGroup): void {
    this.commands.removeView(group);
  }

  // Update piloti data and sync across all views
  updatePiloti(pilotiId: string, pilotiData: Partial<HousePiloti>): void {
    this.commands.updatePiloti(pilotiId, pilotiData);
  }

  // Get piloti data
  getPilotiData(pilotiId: string): HousePiloti {
    return this.queries.getPilotiData(pilotiId);
  }

  /**
   * Calculate recommended heights for all 12 pilotis using bilinear interpolation
   * of the 4 corner levels and the current proporção estrutural.
   *
   * - The nivel at each grid point is interpolated from corners A1, A4, C1, C4.
   * - Minimum required height = nivel × 3.
   * - Select the smallest standard height >= minimum.
   * - If minimum exceeds the available table, cap at the highest available height.
   */
  calculateAndApplyRecommendedHeights(): void {
    this.commands.calculateAndApplyRecommendedHeights();
  }

  // Check if any views exist
  hasAnyView(): boolean {
    return this.queries.hasAnyView();
  }

  // Get all registered groups
  getAllGroups(): CanvasGroup[] {
    return this.queries.getAllGroups();
  }

  // Insert a 3D viewer snapshot on the current canvas
  async insert3DSnapshotOnCanvas(dataUrl: string): Promise<boolean> {
    return this.canvasRuntime.insert3DSnapshot(dataUrl);
  }

  // Auto-assign all sides based on initial view positioning
  autoAssignAllSides(_initialViewType: HouseViewType, initialSide: HouseSide): void {
    this.commands.autoAssignAllSides(initialSide);
  }

  // Get pre-assigned slots for a view type
  getPreAssignedSides(viewType: HouseViewType): { label: string; side: HouseSide; onCanvas: boolean }[] {
    return this.queries.getPreAssignedSides(viewType);
  }

  // Check if pre-assigned slots exist
  hasPreAssignedSides(): boolean {
    return this.queries.hasPreAssignedSides();
  }

  private getDefaultTerrainType(): number {
    return this.state.getDefaultTerrainType();
  }

}
