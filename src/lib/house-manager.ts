import {Canvas as FabricCanvas, FabricImage, FabricObject, Group} from 'fabric';
import {
  BASE_PILOTI_HEIGHT_PX,
  CORNER_PILOTI_IDS,
  createDiagonalStripePattern,
  formatNivel,
  formatPilotiHeight,
  MASTER_PILOTI_FILL,
  MASTER_PILOTI_STROKE,
  refreshHouseGroupRendering,
  updateGroundInGroup,
  updatePilotiHeight,
  updatePilotiMaster,
} from '@/lib/canvas';
import {
  ALL_VIEW_TYPES,
  getAvailableViewsByCounts,
  HOUSE_VIEW_LIMITS,
  isViewAtLimitForType,
  STANDARD_PILOTI_HEIGHTS,
} from './domain/house-use-cases';
import type {HouseElementsRepository} from './domain/house-elements-repository';
import {
  addElement as addElementInRepository,
  removeElement as removeElementInRepository,
  resetDefaultElements,
  updateElement as updateElementInRepository,
} from './domain/house-elements-application';
import {createElementId, createHouseId, createViewInstanceId,} from './domain/house-identity-use-cases';
import {collectHouseGroupPilotiSources, collectHouseGroupRebuildSources,} from './domain/house-canvas-source-use-cases';
import {
  buildAutoAssignedSlots,
  canDeletePlant as canDeletePlantInViews,
  getAutoSelectedSide as getAutoSelectedSideInViews,
  getAvailableSides as getAvailableSidesInViews,
  getAvailableViewsForType as getAvailableViewsForHouseType,
  getPreAssignedSlots as getPreAssignedSlotsForView,
  hasOtherViews as hasOtherViewsInViews,
  hasPreAssignedSlots as hasAnyPreAssignedSlots,
  needsSideSelection as needsSideSelectionInViews,
  OPPOSITE_SIDE as DOMAIN_OPPOSITE_SIDE,
  OPPOSITE_VIEW as DOMAIN_OPPOSITE_VIEW,
  SIDE_VIEW_MAPPING as DOMAIN_SIDE_VIEW_MAPPING,
} from './domain/house-view-layout-use-cases';
import {
  createViewGroupControlsVisibilityPatch,
  createViewGroupMetadataPatch,
  extractViewGroupRemovalHints,
} from './domain/house-view-metadata-use-cases';
import type {HousePilotiRepository} from './domain/house-repository';
import {
  applyPilotiUpdate,
  canAddView,
  getMaxViewCount,
  recalculateRecommendedPilotiData,
} from './domain/house-application';
import {getAllPilotiIds, rebuildPilotiDataFromSources,} from './domain/house-piloti-rebuild-use-cases';
import {
  calculatePilotiSizeLabelPosition,
  calculatePilotiStripeGeometry,
  createPilotiNivelTextPatch,
} from './domain/house-piloti-render-use-cases';
import {buildPilotiObjectIndex} from './domain/house-piloti-object-index-use-cases';
import {
  createNivelLabelBackgroundPatch,
  createPilotiHeightTextPatch,
  createPilotiSizeLabelPatch,
  createPilotiVisualDataPatch,
} from './domain/house-piloti-visual-use-cases';
import {createInitialHouseState,} from './domain/house-state-factory-use-cases';
import {
  calculateTopDoorMarkerBodySize,
  calculateTopDoorPlacement,
  createTopDoorMarkerVisualPatch,
  resolveTopDoorMarkerSide,
} from './domain/house-top-door-marker-use-cases';
import {create3DSnapshotImagePatch} from './domain/house-snapshot-use-cases';
import type {HouseViewsRepository} from './domain/house-views-repository';
import {
  cleanupStaleViews as cleanupStaleViewsInRepository,
  rebuildViewsFromCanvasSources,
  registerView as registerViewInRepository,
  removeAllViewsByType as removeAllViewsByTypeInRepository,
  removeView as removeViewInRepository,
} from './domain/house-views-application';
import {collectAllViewGroups, countViewInstances, hasAnyViewInstances,} from './domain/house-views-use-cases';

// Types for house sides
export type HouseSide = 'top' | 'bottom' | 'left' | 'right';
export type ViewType = 'top' | 'front' | 'back' | 'side1' | 'side2';
export type HouseType = 'tipo6' | 'tipo3' | null;

// Mapping between sides and view types
// Front/Back can only be on top/bottom (longer sides)
// Side1/Side2 can only be on left/right (shorter sides)
export const SIDE_VIEW_MAPPING: Record<HouseSide, ViewType[]> = DOMAIN_SIDE_VIEW_MAPPING;

// Opposite sides
export const OPPOSITE_SIDE: Record<HouseSide, HouseSide> = DOMAIN_OPPOSITE_SIDE;

// Opposite views
export const OPPOSITE_VIEW: Record<ViewType, ViewType | null> = DOMAIN_OPPOSITE_VIEW;

// Piloti data structure
export interface PilotiData {
  height: number;
  isMaster: boolean;
  nivel: number;
}

// Window/Door element types
export type ElementType = 'window' | 'door';

// Element position on house face (using absolute pixel dimensions matching 2D canvas)
export interface HouseElement {
  id: string;
  type: ElementType;
  face: 'front' | 'back' | 'left' | 'right'; // Which face of the house
  x: number; // X position in pixels from left edge of house body
  y: number; // Y position in pixels from top of house body
  width: number; // Width in pixels (e.g., 90 for window, 100 for door)
  height: number; // Height in pixels (e.g., 75 for window, 180 for door)
}

// View instance for tracking multiple views of the same type
export interface ViewInstance {
  group: Group;
  side?: HouseSide;
  instanceId: string;
}

// House state
export interface HouseState {
  id: string;
  houseType: HouseType;
  pilotis: Record<string, PilotiData>; // pilotiId -> data
  elements: HouseElement[]; // Windows and doors
  views: Record<ViewType, ViewInstance[]>; // Changed to array for multiple instances
  sideAssignments: Record<HouseSide, ViewType | null>;
  preAssignedSlots: Record<string, HouseSide>;
}

// View limits per house type
export const VIEW_LIMITS: Record<Exclude<HouseType, null>, Record<ViewType, number>> = HOUSE_VIEW_LIMITS;

// Default piloti data
const DEFAULT_PILOTI: PilotiData = {
  height: 1.0,
  isMaster: false,
  nivel: 0.2,
};

class HouseManager {
  private house: HouseState | null = null;
  private canvas: FabricCanvas | null = null;
  private listeners = new Set<() => void>();

  private notify(): void {
    this.refreshTopDoorMarkers();
    this.listeners.forEach((l) => l());
  }

  private refreshTopDoorMarkers(): void {
    if (!this.house) return;
    const topViews = this.house.views.top;
    if (!topViews || topViews.length === 0) return;

    const door = this.house.elements.find((e) => e.type === 'door');
    const sideAssignments = this.house.sideAssignments;

    if (!door) {
      for (const topInstance of topViews) {
        const markers = topInstance.group.getObjects().filter((o: any) => o?.isTopDoorMarker) as any[];
        for (const marker of markers) {
          marker.set({visible: false});
          marker.setCoords?.();
          marker.dirty = true;
        }
      }
      this.canvas?.requestRenderAll();
      return;
    }

    const markerSide = resolveTopDoorMarkerSide({
      houseType: this.house.houseType,
      doorFace: door.face,
      sideAssignments,
    });

    for (const topInstance of topViews) {
      const group = topInstance.group;
      const markers = group.getObjects().filter((o: any) => o?.isTopDoorMarker) as any[];
      if (markers.length === 0) continue;

      const houseBody = group.getObjects().find((o: any) => o?.isHouseBody) as any;
      const {bodyWidth, bodyHeight} = calculateTopDoorMarkerBodySize({
        width: houseBody?.width ?? 0,
        height: houseBody?.height ?? 0,
        scaleX: houseBody?.scaleX ?? 1,
        scaleY: houseBody?.scaleY ?? 1,
      });

      const placement = calculateTopDoorPlacement({
        markerSide,
        doorX: door.x,
        doorWidth: door.width,
        bodyWidth,
        bodyHeight,
      });

      for (const marker of markers) {
        const side = marker.markerSide as HouseSide | undefined;
        if (!side) continue;

        marker.set(
          createTopDoorMarkerVisualPatch({
            markerSide: placement.markerSide,
            markerCandidateSide: side,
            targetLeft: placement.targetLeft,
            targetTop: placement.targetTop,
          }),
        );
        marker.setCoords?.();
        marker.dirty = true;
      }

      group.setCoords();
      group.dirty = true;
    }

    this.canvas?.requestRenderAll();
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
    this.house = createInitialHouseState<HouseElement, ViewInstance>({
      id: createHouseId(),
      pilotiIds: getAllPilotiIds(),
      defaultPiloti: DEFAULT_PILOTI,
    });

    this.notify();
  }

  // Get/Set house type
  getHouseType(): HouseType {
    return this.house?.houseType || null;
  }

  setHouseType(type: HouseType): void {
    if (!this.house) return;
    this.house.houseType = type;
    if (type === null) {
      this.house.preAssignedSlots = {};
    }
    this.notify();
  }

  // Get max count for a view type based on current house type
  getMaxViewCount(viewType: ViewType): number {
    const repository = this.getHousePilotiRepository();
    if (!repository) return 0;
    return getMaxViewCount(repository, viewType);
  }

  // Get current count of a view type
  getViewCount(viewType: ViewType): number {
    if (!this.house) return 0;
    return this.house.views[viewType].length;
  }

  // Check if can add more of this view type
  canAddView(viewType: ViewType): boolean {
    const repository = this.getHousePilotiRepository();
    if (!repository) return false;
    return canAddView(repository, viewType);
  }

  // Get available views for current house type (views that can still be added)
  getAvailableViewsForType(): ViewType[] {
    if (!this.house) return [];

    return getAvailableViewsForHouseType({
      houseType: this.house.houseType,
      views: this.house.views,
    });
  }

  // Check if plant (top view) can be deleted
  canDeletePlant(): boolean {
    if (!this.house) return false;
    return canDeletePlantInViews(this.house.views);
  }

  // Check if any non-plant views exist
  hasOtherViews(): boolean {
    if (!this.house) return false;
    return hasOtherViewsInViews(this.house.views);
  }

  getHouse(): HouseState | null {
    return this.house;
  }

  private getHousePilotiRepository(): HousePilotiRepository | null {
    if (!this.house) return null;

    return {
      getHouseType: () => this.house?.houseType ?? null,
      getViewCount: (viewType) => this.house?.views[viewType].length ?? 0,
      getPilotis: () => this.house?.pilotis ?? {},
      setPilotis: (pilotis) => {
        if (!this.house) return;
        this.house.pilotis = pilotis;
      },
    };
  }

  private getHouseViewsRepository(): HouseViewsRepository<ViewType, HouseSide, Group> | null {
    if (!this.house) return null;

    return {
      getViews: () => this.house?.views ?? {top: [], front: [], back: [], side1: [], side2: []},
      setViews: (views) => {
        if (!this.house) return;
        this.house.views = views;
      },
      getSideAssignments: () =>
        this.house?.sideAssignments ?? {top: null, bottom: null, left: null, right: null},
      setSideAssignments: (sideAssignments) => {
        if (!this.house) return;
        this.house.sideAssignments = sideAssignments;
      },
    };
  }

  private getHouseElementsRepository(): HouseElementsRepository<HouseElement> | null {
    if (!this.house) return null;

    return {
      getElements: () => this.house?.elements ?? [],
      setElements: (elements) => {
        if (!this.house) return;
        this.house.elements = elements;
      },
    };
  }

  private isGroupOnCanvas(group: Group): boolean {
    if (!this.canvas) return false;
    return this.canvas.getObjects().includes(group as any);
  }

  private cleanupStaleViews(viewType: ViewType): void {
    const repository = this.getHouseViewsRepository();
    if (!repository) return;

    cleanupStaleViewsInRepository(repository, viewType, (group) => this.isGroupOnCanvas(group));
  }

  hasView(viewType: ViewType): boolean {
    // When house isn't initialized yet, no views exist.
    if (!this.house) return false;

    this.cleanupStaleViews(viewType);
    return this.house.views[viewType].length > 0;
  }

  // Check if this specific view type has reached its maximum
  isViewAtLimit(viewType: ViewType): boolean {
    if (!this.house) return true;
    this.cleanupStaleViews(viewType);
    return isViewAtLimitForType(this.house.houseType, viewType, this.house.views[viewType].length);
  }

  getAvailableViews(): ViewType[] {
    if (!this.house) return [];

    ALL_VIEW_TYPES.forEach((viewType) => {
      this.cleanupStaleViews(viewType);
    });

    return getAvailableViewsByCounts({
      houseType: this.house.houseType,
      counts: countViewInstances(this.house.views),
    });
  }

  // Get which sides are available for a given view type
  getAvailableSides(viewType: ViewType): HouseSide[] {
    if (!this.house) return [];

    return getAvailableSidesInViews({
      viewType,
      sideAssignments: this.house.sideAssignments,
    });
  }

  // Check if user needs to select a side for this view
  // ALWAYS ask user for side selection when there are available sides
  needsSideSelection(viewType: ViewType): boolean {
    if (!this.house) return false;
    return needsSideSelectionInViews({
      viewType,
      sideAssignments: this.house.sideAssignments,
    });
  }

  // Get the auto-selected side if only one is available or opposite is assigned
  getAutoSelectedSide(viewType: ViewType): HouseSide | null {
    if (!this.house) return null;
    return getAutoSelectedSideInViews({
      viewType,
      views: this.house.views,
      sideAssignments: this.house.sideAssignments,
    });
  }

  // Register a view with its group and side
  registerView(viewType: ViewType, group: Group, side?: HouseSide): void {
    if (!this.house) return;
    const repository = this.getHouseViewsRepository();
    if (!repository) return;

    const instanceId = createViewInstanceId(viewType);

    // Mark the group with its view type and instance ID for later identification.
    Object.assign(
      group as any,
      createViewGroupMetadataPatch<ViewType, HouseSide>({
        viewType,
        instanceId,
        side,
      }),
    );

    // Apply current piloti data to the new group
    this.applyPilotiDataToGroup(group);

    registerViewInRepository(repository, {
      viewType,
      group,
      instanceId,
      side,
    });

    console.log(`[HouseManager] Registered view ${viewType}, instance: ${instanceId}, side: ${side}`);
    this.notify();
  }

  private readPilotiDataFromCanvas(): Record<string, PilotiData> {
    const sources = this.canvas
      ? collectHouseGroupPilotiSources(this.canvas.getObjects() as any[])
      : [];

    return rebuildPilotiDataFromSources({
      pilotiIds: getAllPilotiIds(),
      currentPilotis: this.house?.pilotis ?? {},
      defaultPiloti: DEFAULT_PILOTI,
      sources: sources as Array<{ objects: any[] }>,
    });
  }

  // Rebuild house view registry from current canvas groups (used after undo/import).
  rebuildFromCanvas(): void {
    if (!this.canvas || !this.house) return;
    const viewsRepository = this.getHouseViewsRepository();
    if (!viewsRepository) return;

    const rebuilt = rebuildViewsFromCanvasSources(viewsRepository, {
      houseType: this.house.houseType,
      sources: collectHouseGroupRebuildSources(this.canvas.getObjects() as any[]) as any,
    });

    rebuilt.normalizedItems.forEach((item) => {
      Object.assign(
        item.group as any,
        createViewGroupMetadataPatch<ViewType, HouseSide>({
          viewType: item.viewType as ViewType,
          instanceId: item.instanceId,
          side: item.side as HouseSide | undefined,
        }),
      );
      const controlsVisibility = createViewGroupControlsVisibilityPatch() as unknown as Record<string, boolean>;
      item.group.setControlsVisibility(controlsVisibility);
    });

    this.house.pilotis = this.readPilotiDataFromCanvas();

    // If no house views remain on canvas, clear type to keep add-view rules coherent.
    if (!hasAnyViewInstances(rebuilt.views)) {
      this.house.houseType = null;
      this.house.preAssignedSlots = {};
    }

    // Re-apply current piloti data to normalized groups after restore.
    this.getAllGroups().forEach((group) => this.applyPilotiDataToGroup(group));

    this.notify();
  }

  // Remove a view (when deleted from canvas)
  removeView(group: Group): void {
    const repository = this.getHouseViewsRepository();
    if (!repository) return;

    const hints = extractViewGroupRemovalHints<ViewType>({
      houseViewType: (group as any).houseViewType,
      houseInstanceId: (group as any).houseInstanceId,
    });

    const removedWithHint = removeViewInRepository(repository, {
      viewType: hints.viewType,
      instanceId: hints.instanceId,
      group,
    });

    if (removedWithHint.removedCount > 0) {
      if (removedWithHint.removedViewType) {
        console.log(`[HouseManager] View ${removedWithHint.removedViewType} instance removed`);
      }
      this.notify();
      return;
    }

    const removedFallback = removeViewInRepository(repository, {group});
    if (removedFallback.removedCount > 0) {
      if (removedFallback.removedViewType) {
        console.log(`[HouseManager] View ${removedFallback.removedViewType} removed by reference`);
      }
      this.notify();
    }
  }

  // Remove all instances of a view type (alternative method)
  removeViewByType(viewType: ViewType): void {
    const repository = this.getHouseViewsRepository();
    if (!repository) return;

    const removedCount = removeAllViewsByTypeInRepository(repository, viewType);
    if (removedCount > 0) {
      console.log(`[HouseManager] Removing all ${removedCount} instances of view type: ${viewType}`);
      this.notify();
    }
  }

  private applyPilotiDataFirstPass(
    objects: FabricObject[],
    pilotiObjectIndex: Record<string, { circle?: FabricObject; rect?: FabricObject }>,
  ): void {
    if (!this.house) return;

    objects.forEach((obj: FabricObject) => {
      const pilotiId = (obj as any).pilotiId;
      if (!pilotiId) return;

      const data = this.house!.pilotis[pilotiId];
      if (!data) return;

      if ((obj as any).isPilotiCircle || (obj as any).isPilotiRect) {
        const isRect = Boolean((obj as any).isPilotiRect);
        obj.set(
          createPilotiVisualDataPatch({
            height: data.height,
            isMaster: data.isMaster,
            nivel: data.nivel,
            isRect,
            baseHeight: (obj as any).pilotiBaseHeight || 60,
            masterFill: MASTER_PILOTI_FILL,
            masterStroke: MASTER_PILOTI_STROKE,
          }),
        );

        if (isRect) {
          obj.setCoords();
          (obj as any).dirty = true;
        }
      }

      if ((obj as any).isPilotiText) {
        (obj as any).set(createPilotiHeightTextPatch(formatPilotiHeight(data.height)));
      }

      if ((obj as any).isPilotiNivelText) {
        const isCorner = CORNER_PILOTI_IDS.includes(pilotiId);
        const pilotiCircle = pilotiObjectIndex[pilotiId]?.circle as any;
        const centerX = Number(pilotiCircle?.left ?? (obj as any).left ?? 0);
        const centerY = Number(pilotiCircle?.top ?? (obj as any).top ?? 0);
        const radius = Number(pilotiCircle?.radius ?? 15 * 0.6);
        const offset = 12 * 0.6;
        const isTopCorner = pilotiId === 'piloti_0_0' || pilotiId === 'piloti_3_0';

        (obj as any).set(
          createPilotiNivelTextPatch({
            isCorner,
            formattedNivel: formatNivel(data.nivel),
            centerX,
            centerY,
            radius,
            offset,
            isTopCorner,
          }),
        );
      }

      if ((obj as any).isPilotiSizeLabel) {
        (obj as any).set(createPilotiSizeLabelPatch(formatPilotiHeight(data.height)));
      }
    });
  }

  private applyNivelLabelsBackground(objects: FabricObject[]): void {
    objects.forEach((obj: FabricObject) => {
      if ((obj as any).isNivelLabel) {
        (obj as any).set(createNivelLabelBackgroundPatch());
      }
    });
  }

  private applyPilotiSizeLabelPositions(
    objects: FabricObject[],
    pilotiObjectIndex: Record<string, { circle?: FabricObject; rect?: FabricObject }>,
  ): void {
    objects.forEach((obj: FabricObject) => {
      if (!(obj as any).isPilotiSizeLabel) return;

      const pilotiId = (obj as any).pilotiId;
      if (!pilotiId) return;

      const rect = pilotiObjectIndex[pilotiId]?.rect as any;
      if (!rect) return;

      const baseHeight = (rect as any).pilotiBaseHeight || 60;
      const rectWidth = (rect.width ?? 0) as number;
      const rectHeight = (rect.height ?? 0) as number;
      const position = calculatePilotiSizeLabelPosition({
        rectLeft: (rect.left ?? 0) as number,
        rectTop: (rect.top ?? 0) as number,
        rectWidth,
        rectHeight,
        baseHeight,
        basePilotiHeightPx: BASE_PILOTI_HEIGHT_PX,
      });

      (obj as any).set('left', position.left);
      (obj as any).set('top', position.top);
      (obj as any).setCoords?.();
      (obj as any).dirty = true;
    });
  }

  private applyPilotiStripeOverlays(
    objects: FabricObject[],
    pilotiObjectIndex: Record<string, { circle?: FabricObject; rect?: FabricObject }>,
  ): void {
    objects.forEach((obj: FabricObject) => {
      if (!(obj as any).isPilotiStripe) return;

      const pilotiId = (obj as any).pilotiId;
      if (!pilotiId) return;

      const rect = pilotiObjectIndex[pilotiId]?.rect as any;
      if (!rect) return;

      const geometry = calculatePilotiStripeGeometry({
        rectTop: (rect.top ?? 0) as number,
        rectHeight: (rect.height ?? 0) as number,
      });
      obj.set({height: geometry.height, top: geometry.top});
      obj.set('fill', createDiagonalStripePattern());
      obj.objectCaching = false;
      obj.setCoords();
      (obj as any).dirty = true;
    });
  }

  private syncPilotiUpdateOnGroup(
    group: Group,
    pilotiId: string,
    data: Partial<PilotiData>,
    clearedMasters: string[],
  ): void {
    if (!this.house) return;

    if (clearedMasters.length) {
      clearedMasters.forEach((id) => {
        const p = this.house!.pilotis[id];
        updatePilotiMaster(group, id, p.isMaster, p.nivel);
      });
    }

    const newData = this.house.pilotis[pilotiId];
    if (data.height !== undefined) {
      updatePilotiHeight(group, pilotiId, newData.height);
    }
    if (data.isMaster !== undefined || data.nivel !== undefined) {
      updatePilotiMaster(group, pilotiId, newData.isMaster, newData.nivel);
    }
    if ((data.height !== undefined || data.nivel !== undefined) && CORNER_PILOTI_IDS.includes(pilotiId)) {
      updateGroundInGroup(group);
    }

    refreshHouseGroupRendering(group);
  }

  private syncPilotiUpdateAcrossViews(
    pilotiId: string,
    data: Partial<PilotiData>,
    clearedMasters: string[],
  ): void {
    if (!this.house) return;

    Object.values(this.house.views).forEach((instances) => {
      if (!instances || instances.length === 0) return;
      for (const instance of instances) {
        this.syncPilotiUpdateOnGroup(instance.group, pilotiId, data, clearedMasters);
      }
    });
  }

  // Apply current piloti data to a group (when creating a new view)
  private applyPilotiDataToGroup(group: Group): void {
    if (!this.house) return;

    const objects = group.getObjects();
    const pilotiObjectIndex = buildPilotiObjectIndex(objects as any[]);
    this.applyPilotiDataFirstPass(objects, pilotiObjectIndex);
    this.applyNivelLabelsBackground(objects);
    this.applyPilotiSizeLabelPositions(objects, pilotiObjectIndex);
    this.applyPilotiStripeOverlays(objects, pilotiObjectIndex);

    // Update ground line based on the applied nivel values
    updateGroundInGroup(group);

    refreshHouseGroupRendering(group);
  }

  // Update piloti data and sync across all views
  updatePiloti(pilotiId: string, data: Partial<PilotiData>): void {
    const repository = this.getHousePilotiRepository();
    if (!this.house || !repository) return;

    const {clearedMasters} = applyPilotiUpdate(repository, pilotiId, data, DEFAULT_PILOTI);
    this.syncPilotiUpdateAcrossViews(pilotiId, data, clearedMasters);

    this.canvas?.requestRenderAll();
    this.notify();
  }

  // Get piloti data
  getPilotiData(pilotiId: string): PilotiData {
    return this.house?.pilotis[pilotiId] || {...DEFAULT_PILOTI};
  }

  /** Standard available piloti heights */
  static readonly STANDARD_HEIGHTS = STANDARD_PILOTI_HEIGHTS;

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
    const repository = this.getHousePilotiRepository();
    if (!this.house || !repository) return;

    recalculateRecommendedPilotiData(repository, DEFAULT_PILOTI);

    console.log('[HouseManager] Calculated recommended heights:',
      Object.entries(this.house.pilotis).map(([id, d]) => `${id}: nivel=${d.nivel} h=${d.height}`).join(', '));
  }

  // Check if any views exist
  hasAnyView(): boolean {
    if (!this.house) return false;
    return hasAnyViewInstances(this.house.views);
  }

  // Get all registered groups
  getAllGroups(): Group[] {
    if (!this.house) return [];
    return collectAllViewGroups(this.house.views);
  }

  // Get all house elements (windows/doors)
  getElements(): HouseElement[] {
    return this.house?.elements || [];
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
          canvasWidth: canvas.getWidth() || 1300,
          canvasHeight: canvas.getHeight() || 1300,
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

  // Add an element (window/door)
  addElement(element: Omit<HouseElement, 'id'>): void {
    const repository = this.getHouseElementsRepository();
    if (!repository) return;

    addElementInRepository(repository, element, () => createElementId());
    this.notify();
  }

  // Remove an element by id
  removeElement(elementId: string): void {
    const repository = this.getHouseElementsRepository();
    if (!repository) return;

    removeElementInRepository(repository, elementId);
    this.notify();
  }

  // Update an element
  updateElement(elementId: string, updates: Partial<Omit<HouseElement, 'id'>>): void {
    const repository = this.getHouseElementsRepository();
    if (!repository) return;

    if (updateElementInRepository(repository, elementId, updates)) {
      this.notify();
    }
  }

  // Initialize default elements based on house type
  // Uses absolute pixel dimensions matching the 2D canvas scale
  // House body dimensions at SCALE=0.6: width=366px, height=132px
  initializeDefaultElements(): void {
    if (!this.house?.houseType) return;
    const repository = this.getHouseElementsRepository();
    if (!repository) return;

    resetDefaultElements(repository, this.house.houseType, () => createElementId());
    this.notify();
  }

  // Auto-assign all sides based on initial view positioning
  autoAssignAllSides(_initialViewType: ViewType, initialSide: HouseSide): void {
    if (!this.house?.houseType) return;

    const slots = buildAutoAssignedSlots({
      houseType: this.house.houseType,
      initialSide,
    });
    this.house.preAssignedSlots = slots;
    console.log('[HouseManager] Auto-assigned slots:', this.house.preAssignedSlots);
    this.notify();
  }

  // Get pre-assigned slots for a view type
  getPreAssignedSlots(viewType: ViewType): { label: string; side: HouseSide; onCanvas: boolean }[] {
    if (!this.house) return [];

    return getPreAssignedSlotsForView({
      viewType,
      preAssignedSlots: this.house.preAssignedSlots,
      sideAssignments: this.house.sideAssignments,
    });
  }

  // Check if pre-assigned slots exist
  hasPreAssignedSlots(): boolean {
    return this.house ? hasAnyPreAssignedSlots(this.house.preAssignedSlots) : false;
  }
}

// Singleton instance
export const houseManager = new HouseManager();
