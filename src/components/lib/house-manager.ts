import {Canvas as FabricCanvas, FabricImage, Group} from 'fabric';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CanvasObject,
  getAllPilotiIds,
  normalizeTerrainSolidityLevel,
  toCanvasGroup,
  toCanvasObject,
  updateGroundTerrainType
} from '@/components/lib/canvas';
import {createHouseId, createViewInstanceId,} from '@/components/lib/house-identity.ts';
import {
  createViewGroupControlsVisibilityPatch,
  createViewGroupMetadataPatch,
  extractViewGroupRemovalHints,
} from '@/components/lib/house-view.ts';
import {HouseAggregate} from '@/domain/house/house-aggregate.ts';
import {refreshTopDoorMarkersInViews,} from '@/components/lib/house-top-view-door-marker.ts';
import {create3DSnapshotImagePatch} from '@/components/lib/house-snapshot.ts';
import type {HousePersistencePort} from '@/domain/house/house-persistence-port.ts';
import {
  ALL_HOUSE_VIEW_TYPES,
  DEFAULT_HOUSE_PILOTI,
  HousePiloti,
  HouseSide,
  HouseState,
  HouseType,
  HouseViewType,
} from '@/shared/types/house.ts';
import {InMemoryHousePersistence} from '@/infra/persistence/in-memory-house-persistence.ts';
import {applyPilotiDataToGroup, syncPilotiUpdateAcrossViews} from '@/components/lib/canvas/piloti-visual.ts';
import {
  collectHouseGroupRebuildSources,
  readPilotiDataFromCanvas,
  toRebuildViewSource
} from '@/components/lib/canvas/canvas-rebuild.ts';
import {refreshAutoStairsInViews} from '@/components/lib/house-auto-stairs.ts';
import {refreshAutoContraventamentoInAllViews} from '@/components/lib/house-auto-contraventamento.ts';
import {TERRAIN_SOLIDITY} from '@/shared/config.ts';

class HouseManager {

  private readonly persistence: HousePersistencePort<Group> = new InMemoryHousePersistence<Group>();
  private houseAggregate: HouseAggregate<Group> | null = null;
  private canvas: FabricCanvas | null = null;

  private listeners = new Set<() => void>();

  constructor() {
    let persisted = this.persistence.load();
    if (!persisted) {
      persisted = HouseAggregate.createInitialHouseState<Group>({
        id: createHouseId(),
        pilotiIds: getAllPilotiIds(),
        defaultPiloti: DEFAULT_HOUSE_PILOTI,
        defaultTerrainType: this.getDefaultTerrainType(),
      });
    } else {
      persisted.terrainType = normalizeTerrainSolidityLevel(
        persisted.terrainType ?? this.getDefaultTerrainType(),
      );
    }

    this.houseAggregate = HouseAggregate.fromState(persisted);
    this.listeners.add(() => this.refreshTopDoorMarkers());
    this.listeners.add(() => this.refreshAutoContraventamento());
    this.listeners.add(() => this.refreshAutoStairs());
  }

  private get house(): HouseState<Group> | null {
    return this.houseAggregate?.toState() ?? null;
  }

  private set house(nextHouse: HouseState<Group> | null) {
    this.houseAggregate = nextHouse ? HouseAggregate.fromState(nextHouse) : null;
    this.persistence.save(nextHouse);
  }

  private persistHouse(): void {
    this.persistence.save(this.houseAggregate?.toState() ?? null);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  private refreshTopDoorMarkers(): void {
    if (!this.house) return;

    const hasChanges = refreshTopDoorMarkersInViews({
      houseType: this.house.houseType,
      sideMappings: this.house.sideMappings,
      topViews: this.house.views.top,
    });

    if (hasChanges) {
      this.canvas?.requestRenderAll();
    }
  }

  private refreshAutoStairs(): void {
    if (!this.house) return;

    const hasChanges = refreshAutoStairsInViews({
      houseType: this.house.houseType,
      sideMappings: this.house.sideMappings,
      pilotis: this.house.pilotis,
      topViews: this.house.views.top,
      elevationViews: this.getElevationViewInstances(),
    });

    if (hasChanges) {
      this.canvas?.requestRenderAll();
    }
  }

  private refreshAutoContraventamento(): void {
    if (!this.house) return;

    const hasChanges = refreshAutoContraventamentoInAllViews({
      pilotis: this.house.pilotis,
      topViews: this.house.views.top,
      elevationViews: this.getElevationViewInstances(),
    });

    if (hasChanges) {
      this.canvas?.requestRenderAll();
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  initialize(canvas: FabricCanvas): void {
    this.canvas = canvas;
    this.reset();
  }

  reset(): void {
    this.house = HouseAggregate.createInitialHouseState<Group>({
      id: createHouseId(),
      pilotiIds: getAllPilotiIds(),
      defaultPiloti: DEFAULT_HOUSE_PILOTI,
      defaultTerrainType: this.getDefaultTerrainType(),
    });

    this.notify();
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
    this.applyTerrainTypeToElevationViews(normalized);
    this.canvas?.requestRenderAll();
    this.notify();
    return normalized;
  }

  // Get max count for a view type based on current house type
  getMaxViewCount(viewType: HouseViewType): number {
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return 0;
    return aggregate.getMaxViewCount(viewType);
  }

  // Get current count of a view type
  getViewCount(viewType: HouseViewType): number {
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

  getHouse(): HouseState<Group> | null {
    return this.house;
  }

  private getHouseAggregate(): HouseAggregate<Group> | null {
    return this.houseAggregate;
  }

  private isGroupOnCanvas(group: Group): boolean {
    if (!this.canvas) return false;
    return this.canvas.getObjects().includes(group);
  }

  private cleanupStaleViews(viewType: HouseViewType): void {
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return;
    const removedCount = aggregate.cleanupStaleViews(viewType, (group) => this.isGroupOnCanvas(group));
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
  registerView(viewType: HouseViewType, group: Group, side?: HouseSide): void {
    const aggregate = this.getHouseAggregate();
    if (!aggregate || !this.house) return;

    const instanceId = createViewInstanceId(viewType);

    // Mark the group with its view type and instance ID for later identification.
    Object.assign(
      toCanvasGroup(group),
      createViewGroupMetadataPatch<HouseViewType, HouseSide>({
        viewType,
        instanceId,
        side,
      }),
    );
    (toCanvasGroup(group) as any).groundTerrainType = this.getTerrainType();

    // Apply current piloti data to the new group
    applyPilotiDataToGroup(group, this.house.pilotis);

    aggregate.registerView({
      viewType,
      group,
      instanceId,
      side,
    });
    this.persistHouse();

    console.log(`[HouseManager] Registered view ${viewType}, instance: ${instanceId}, side: ${side}`);
    this.notify();
  }

  // Rebuild house view registry from current canvas groups (used after undo/import).
  rebuildFromCanvas(): void {
    const aggregate = this.getHouseAggregate();
    if (!this.canvas || !this.house || !aggregate) return;

    const canvasGroups = this.canvas
      .getObjects()
      .filter((object): object is Group & CanvasObject => object.type === 'group');

    const rebuildSources =
      collectHouseGroupRebuildSources(canvasGroups).map((source) =>
        toRebuildViewSource(source.group),
      );

    const rebuilt = aggregate.rebuildViewsFromCanvasSources(rebuildSources);
    this.persistHouse();

    rebuilt.normalizedItems.forEach((item) => {
      Object.assign(
        toCanvasGroup(item.group),
        createViewGroupMetadataPatch<HouseViewType, HouseSide>({
          viewType: item.viewType as HouseViewType,
          instanceId: item.instanceId,
          side: item.side as HouseSide | undefined,
        }),
      );
      item.group.setControlsVisibility(createViewGroupControlsVisibilityPatch());
    });

    if (this.house) {
      const nextHouse = this.house;
      nextHouse.pilotis = readPilotiDataFromCanvas(this.canvas, this.house?.pilotis);
      nextHouse.terrainType = this.resolveTerrainTypeFromCanvasFallback();
      this.house = nextHouse;
    }

    // If no house views remain on canvas, clear type to keep add-view rules coherent.
    if (!aggregate.hasAnyViewInstances(rebuilt.views)) {
      if (this.house) {
        const nextHouse = this.house;
        nextHouse.houseType = null;
        nextHouse.preAssignedSides = {};
        this.house = nextHouse;
      }
    }

    // Re-apply current piloti data to normalized groups after restore.
    this.getAllGroups().forEach((group) => {
      (toCanvasGroup(group) as any).groundTerrainType = this.getTerrainType();
      applyPilotiDataToGroup(group, this.house.pilotis);
    });

    this.notify();
  }

  // Remove a view (when deleted from canvas)
  removeView(group: Group): void {
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return;

    const hints = extractViewGroupRemovalHints<HouseViewType>({
      houseViewType: toCanvasGroup(group).houseViewType,
      houseInstanceId: toCanvasGroup(group).houseInstanceId,
    });

    const removedWithHint = aggregate.removeView({
      viewType: hints.viewType,
      instanceId: hints.instanceId,
      group,
    });

    if (removedWithHint.removedCount > 0) {
      this.persistHouse();
      if (removedWithHint.removedViewType) {
        console.log(`[HouseManager] View ${removedWithHint.removedViewType} instance removed`);
      }
      this.notify();
      return;
    }

    const removedFallback = aggregate.removeView({group});
    if (removedFallback.removedCount > 0) {
      this.persistHouse();
      if (removedFallback.removedViewType) {
        console.log(`[HouseManager] View ${removedFallback.removedViewType} removed by reference`);
      }
      this.notify();
    }
  }

  // Update piloti data and sync across all views
  updatePiloti(pilotiId: string, pilotiData: Partial<HousePiloti>): void {
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return;

    const {clearedMasters} = aggregate.applyPilotiPatch(pilotiId, pilotiData);
    this.persistHouse();
    syncPilotiUpdateAcrossViews(pilotiId, this.house.pilotis, pilotiData, this.house.views, clearedMasters);

    this.canvas?.requestRenderAll();
    this.notify();
  }

  // Get piloti data
  getPilotiData(pilotiId: string): HousePiloti {
    return this.house?.pilotis[pilotiId] || {...DEFAULT_HOUSE_PILOTI};
  }

  /**
   * Calculate recommended heights for all 12 pilotis using bilinear interpolation
   * of the 4 corner levels and the 2/3 rule.
   *
   * - The nivel at each grid point is interpolated from corners A1, A4, C1, C4.
   * - Minimum required height = nivel × 3 (so 1/3 above ground, 2/3 buried).
   * - Select the smallest standard height (1.0, 1.2, 1.5, 2.0, 2.5, 3.0) >= minimum.
   * - If minimum exceeds 3.0m, cap at 3.0m (out-of-level acceptable).
   */
  calculateAndApplyRecommendedHeights(): void {
    const aggregate = this.getHouseAggregate();
    if (!this.house || !aggregate) return;

    aggregate.recalculateRecommendedPilotiData(DEFAULT_HOUSE_PILOTI);
    this.persistHouse();

    console.log('[HouseManager] Calculated recommended heights:',
      Object.entries(this.house.pilotis).map(
        ([id, d]) => `${id}: nivel=${d.nivel} h=${d.height}`).join(', ')
    );
  }

  // Check if any views exist
  hasAnyView(): boolean {
    const aggregate = this.getHouseAggregate();
    if (!aggregate && !this.house) return false;
    return aggregate.hasAnyViewInstances(this.house.views);
  }

  // Get all registered groups
  getAllGroups(): Group[] {
    const aggregate = this.getHouseAggregate();
    if (!aggregate && !this.house) return [];
    return aggregate.collectAllViewGroups(this.house.views);
  }

  // Insert a 3D viewer snapshot on the current canvas
  async insert3DSnapshotOnCanvas(dataUrl: string): Promise<boolean> {
    if (!this.canvas) return false;
    if (!dataUrl) return false;

    try {
      const image = await FabricImage.fromURL(dataUrl, {crossOrigin: 'anonymous'});
      const canvas = this.canvas;
      const center = canvas.getVpCenter();

      image.set(
        create3DSnapshotImagePatch({
          centerX: center.x,
          centerY: center.y,
          imageWidth: image.width ?? 1,
          imageHeight: image.height ?? 1,
          canvasWidth: canvas.getWidth() || CANVAS_WIDTH,
          canvasHeight: canvas.getHeight() || CANVAS_HEIGHT,
        }),
      );
      image.setControlsVisibility?.({mtr: false});
      canvas.add(image);
      canvas.setActiveObject(image);
      canvas.requestRenderAll();
      return true;

    } catch (error) {
      console.error('[HouseManager] Failed to insert 3D snapshot on canvas:', error);
      return false;
    }
  }

  // Auto-assign all sides based on initial view positioning
  autoAssignAllSides(_initialViewType: HouseViewType, initialSide: HouseSide): void {
    const aggregate = this.getHouseAggregate();
    if (!aggregate) return;

    aggregate.autoAssignAllSides(initialSide);
    this.persistHouse();

    console.log('[HouseManager] Auto-assigned slots:', this.house?.preAssignedSides ?? {});
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
    return normalizeTerrainSolidityLevel(TERRAIN_SOLIDITY.defaultLevel);
  }

  private getElevationViewInstances() {
    if (!this.house) return [];
    return [
      ...this.house.views.front,
      ...this.house.views.back,
      ...this.house.views.side1,
      ...this.house.views.side2,
    ];
  }

  private applyTerrainTypeToElevationViews(terrainType: number): void {
    this.getElevationViewInstances().forEach((instance) => {
      updateGroundTerrainType(instance.group, terrainType);
    });
  }

  private resolveTerrainTypeFromCanvasFallback(): number {
    const fromCanvas = this.canvas
      ?.getObjects()
      .find((object): object is Group & CanvasObject => {
        const runtime = toCanvasObject(object);
        return (
          object.type === 'group'
          && runtime.myType === 'house'
          && runtime.houseView !== 'top'
          && Number.isFinite(Number(runtime.groundTerrainType))
        );
      });

    const terrainFromCanvas = Number((fromCanvas as CanvasObject | undefined)?.groundTerrainType);
    if (Number.isFinite(terrainFromCanvas)) {
      return normalizeTerrainSolidityLevel(terrainFromCanvas);
    }

    return this.getTerrainType();
  }

}

// Singleton instance
export const houseManager = new HouseManager();
