import {
  CanvasGroup,
} from '@/components/rac-editor/lib/canvas';
import {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import {
  ALL_HOUSE_VIEW_TYPES,
  DEFAULT_HOUSE_PILOTI,
  HousePiloti,
  HouseSide,
  HouseState,
  HouseType,
  HouseViewType,
} from '@/shared/types/house.ts';
import {normalizeTerrainSolidityLevel} from '@/shared/config.ts';
import {
  applyTerrainTypeToElevationViews,
} from '@/components/rac-editor/lib/house-manager-terrain.ts';
import {HouseManagerSessionMetadata} from '@/components/rac-editor/lib/house-manager-session.ts';
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
import {
  refreshAutoContraventamento,
  refreshAutoStairs,
  refreshTopDoorMarkers,
} from '@/components/rac-editor/lib/house-manager-auto-effects.ts';
import type {HouseManagerCanvasPort} from '@/components/rac-editor/store/HouseManagerCanvasPort.ts';
import {HouseManagerState} from '@/components/rac-editor/lib/house-manager-state.ts';
import {HouseManagerCanvasRuntime} from '@/components/rac-editor/lib/house-manager-canvas-runtime.ts';
import {HouseManagerNotifier} from '@/components/rac-editor/lib/house-manager-notifier.ts';

export class HouseManagerFacade {

  private readonly state = new HouseManagerState<CanvasGroup>();
  private readonly sessionMetadata = new HouseManagerSessionMetadata();
  private readonly canvasRuntime = new HouseManagerCanvasRuntime();
  private readonly notifier = new HouseManagerNotifier();

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
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return null;

    return aggregate.getHouseType();
  }

  setHouseType(type: HouseType): void {
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return;

    aggregate.setHouseType(type);
    this.persistHouse();
    this.syncProjectSession();
    this.notify();
  }

  getTerrainType(): number {
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return this.getDefaultTerrainType();

    return normalizeTerrainSolidityLevel(aggregate.getTerrainType());
  }

  setTerrainType(terrainType: number): number {
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return this.getDefaultTerrainType();

    const normalized = normalizeTerrainSolidityLevel(terrainType);
    aggregate.setTerrainType(normalized);
    this.persistHouse();
    this.syncProjectSession();
    applyTerrainTypeToElevationViews(this.house, normalized);
    this.requestCanvasRender();
    this.notify();
    return normalized;
  }

  // Get max count for a view type based on current house type
  getMaxHouseViewCount(viewType: HouseViewType): number {
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return 0;
    return aggregate.getMaxViewCount(viewType);
  }

  // Get current count of a view type
  getHouseViewCount(viewType: HouseViewType): number {
    if (!this.house) return 0;
    return this.house.views[viewType].length;
  }

  // Check if can add more of this view type
  canAddView(viewType: HouseViewType): boolean {
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return false;
    return aggregate.canAddView(viewType);
  }

  // Check if plant (top view) can be deleted
  canDeletePlant(): boolean {
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return false;
    return aggregate.canDeletePlant();
  }

  // Check if any non-plant views exist
  hasOtherViews(): boolean {
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return false;
    return aggregate.hasOtherViews();
  }

  getHouse(): HouseState<CanvasGroup> | null {
    return this.house;
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
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return true;
    this.cleanupStaleViews(viewType);
    return aggregate.isViewLimitAchieved(viewType);
  }

  getAvailableViews(): HouseViewType[] {
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return [];

    ALL_HOUSE_VIEW_TYPES.forEach((viewType) => {
      this.cleanupStaleViews(viewType);
    });

    return aggregate.getAvailableViews();
  }

  // Get which sides are available for a given view type
  getAvailableSides(viewType: HouseViewType): HouseSide[] {
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return [];
    return aggregate.getAvailableSides(viewType);
  }

  // Register a view with its group and side
  registerView(viewType: HouseViewType, group: CanvasGroup, side?: HouseSide): void {
    const aggregate = this.getHouseAggregate();
    if (!aggregate || !this.house) return;

    const result = registerHouseView({
      aggregate,
      house: this.house,
      viewType,
      group,
      side,
      terrainType: this.getTerrainType(),
    });
    if (!result.registered) return;

    this.persistHouse();

    if (result.registeredTopView) {
      this.refreshAutoContraventamento();
    }

    this.notify();
  }

  // Rebuild house view registry from current canvas groups (used after undo/import).
  rebuildFromCanvas(): void {
    const aggregate = this.getHouseAggregate();
    if (!this.house || !aggregate) return;

    const canvasState = this.canvasRuntime.createRebuildInput({
      currentPilotis: this.house.pilotis,
      fallbackTerrainType: this.getTerrainType(),
    });
    if (!canvasState) return;

    const rebuild = rebuildHouseViewsFromCanvas({
      aggregate,
      house: this.house,
      canvasGroups: canvasState.canvasGroups,
      pilotisFromCanvas: canvasState.pilotisFromCanvas,
      terrainTypeFromCanvas: canvasState.terrainTypeFromCanvas,
    });
    this.persistHouse();

    applyCurrentHouseDataToGroups({
      groups: rebuild.groupsToSync,
      terrainType: this.getTerrainType(),
      pilotis: this.house.pilotis,
    });

    this.notify();
  }

  // Remove a view (when deleted from canvas)
  removeView(group: CanvasGroup): void {
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return;

    const result = removeHouseView({
      aggregate,
      group,
    });

    if (result.removedCount > 0) {
      this.persistHouse();
      this.notify();
    }
  }

  // Update piloti data and sync across all views
  updatePiloti(pilotiId: string, pilotiData: Partial<HousePiloti>): void {
    const aggregate = this.getHouseAggregate();
    if (!aggregate || !this.house) return;

    const result = updateHousePiloti({
      aggregate,
      house: this.house,
      pilotiId,
      pilotiData,
      selectedPilotiHeights: this.sessionMetadata.getSelectedPilotiHeights(),
      groups: this.getAllGroups(),
    });
    if (!result.updated) return;

    this.persistHouse();
    if (result.shouldRefreshAutoContraventamento) {
      this.refreshAutoContraventamento();
    }
    this.requestCanvasRender();
    this.notify();
  }

  // Get piloti data
  getPilotiData(pilotiId: string): HousePiloti {
    return this.house?.pilotis[pilotiId] || {...DEFAULT_HOUSE_PILOTI};
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
    const aggregate = this.getHouseAggregate();
    if (!this.house || !aggregate) return;

    calculateRecommendedHousePilotiHeights({
      aggregate,
      selectedPilotiHeights: this.sessionMetadata.getSelectedPilotiHeights(),
    });
    this.persistHouse();
  }

  // Check if any views exist
  hasAnyView(): boolean {
    const aggregate = this.getHouseAggregate();
    if (!aggregate && !this.house) return false;
    return aggregate.hasAnyViewInstances(this.house.views);
  }

  // Get all registered groups
  getAllGroups(): CanvasGroup[] {
    const aggregate = this.getHouseAggregate();
    if (!aggregate && !this.house) return [];
    return aggregate.collectAllViewGroups(this.house.views);
  }

  // Insert a 3D viewer snapshot on the current canvas
  async insert3DSnapshotOnCanvas(dataUrl: string): Promise<boolean> {
    return this.canvasRuntime.insert3DSnapshot(dataUrl);
  }

  // Auto-assign all sides based on initial view positioning
  autoAssignAllSides(_initialViewType: HouseViewType, initialSide: HouseSide): void {
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return;

    aggregate.autoAssignAllSides(initialSide);
    this.persistHouse();
    this.notify();
  }

  // Get pre-assigned slots for a view type
  getPreAssignedSides(viewType: HouseViewType): { label: string; side: HouseSide; onCanvas: boolean }[] {
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return [];

    return aggregate.getPreAssignedSides(viewType);
  }

  // Check if pre-assigned slots exist
  hasPreAssignedSides(): boolean {
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return false;

    return aggregate.hasPreAssignedSides();
  }

  private getDefaultTerrainType(): number {
    return this.state.getDefaultTerrainType();
  }

}
