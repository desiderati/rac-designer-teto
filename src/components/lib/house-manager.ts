import {Canvas as FabricCanvas, FabricImage, FabricObject, Group} from 'fabric';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CanvasObject,
  createDiagonalStripePattern,
  formatNivel,
  formatPilotiHeight,
  PILOTI_BASE_HEIGHT_PX,
  PILOTI_BASE_HEIGHT_PX_WITH_SCALE,
  PILOTI_MASTER_FILL_COLOR,
  PILOTI_MASTER_STROKE_COLOR,
  refreshHouseGroupRendering,
  toCanvasGroup,
  toCanvasObject,
  updateGroundInGroup,
  updatePilotiHeight,
  updatePilotiMaster,
} from '@/components/lib/canvas';
import {getAvailableViewsByCounts, isViewAtLimitForType} from '@/domain/use-cases/house-use-cases.ts';
import {
  addElement as addElementInRepository,
  removeElement as removeElementInRepository,
  resetDefaultElements,
  updateElement as updateElementInRepository,
} from '@/domain/application/house-elements-application.ts';
import {createElementId, createHouseId, createViewInstanceId} from '@/domain/use-cases/house-identity-use-cases.ts';
import {
  collectHouseGroupPilotiSources,
  collectHouseGroupRebuildSources,
  type HouseGroupWithObjects,
} from '@/domain/use-cases/house-canvas-source-use-cases.ts';
import type {RebuildViewSource} from '@/domain/use-cases/house-views-rebuild-use-cases.ts';
import {
  buildAutoAssignedSlots,
  canDeletePlant as canDeletePlantInViews,
  getAvailableSides as getAvailableSidesInViews,
  getPreAssignedSlots as getPreAssignedSlotsForView,
  hasOtherViews as hasOtherViewsInViews,
  hasPreAssignedSlots as hasAnyPreAssignedSlots,
} from '@/domain/use-cases/house-view-layout-use-cases.ts';
import {
  createViewGroupControlsVisibilityPatch,
  createViewGroupMetadataPatch,
  extractViewGroupRemovalHints,
} from '@/domain/use-cases/house-view-metadata-use-cases.ts';
import {
  applyPilotiUpdate,
  canAddView,
  getMaxViewCount,
  recalculateRecommendedPilotiData,
} from '@/domain/application/house-application.ts';
import {
  getAllPilotiIds,
  rebuildPilotiDataFromSources,
  type RebuildPilotiSource,
  type RebuildPilotiSourceObject,
} from '@/domain/use-cases/house-piloti-rebuild-use-cases.ts';
import {
  calculatePilotiSizeLabelPosition,
  calculatePilotiStripeGeometry,
  createPilotiNivelTextPatch,
} from '@/domain/use-cases/house-piloti-render-use-cases.ts';
import {buildPilotiObjectIndex} from '@/domain/use-cases/house-piloti-object-index-use-cases.ts';
import {
  createNivelLabelBackgroundPatch,
  createPilotiHeightTextPatch,
  createPilotiSizeLabelPatch,
  createPilotiVisualDataPatch,
} from '@/domain/use-cases/house-piloti-visual-use-cases.ts';
import {createInitialHouseState} from '@/domain/use-cases/house-state-factory-use-cases.ts';
import {
  calculateRenderedDoorGeometryForTopMarker,
  calculateTopDoorMarkerBodySize,
  calculateTopDoorPlacement,
  createTopDoorMarkerVisualPatch,
  resolveTopDoorMarkerSide,
} from '@/domain/use-cases/house-top-door-marker-use-cases.ts';
import {create3DSnapshotImagePatch} from '@/domain/use-cases/house-snapshot-use-cases.ts';
import {
  cleanupStaleViews as cleanupStaleViewsInRepository,
  rebuildViewsFromCanvasSources,
  registerView as registerViewInRepository,
  removeView as removeViewInRepository,
} from '@/domain/application/house-views-application.ts';
import {
  collectAllViewGroups,
  countViewInstances,
  hasAnyViewInstances,
} from '@/domain/use-cases/house-views-use-cases.ts';
import {HouseAggregate} from '@/domain/house-aggregate.ts';
import type {HouseCanvasPort, HouseElementsPort, HousePilotiPort, HouseViewsPort} from '@/domain/house-ports.ts';
import {
  ALL_HOUSE_VIEW_TYPES,
  DEFAULT_HOUSE_PILOTI,
  HouseElement,
  HousePiloti,
  HouseSide,
  HouseState,
  HouseType,
  HouseViewType,
} from '@/shared/types/house.ts';
import {HOUSE_DEFAULTS, PILOTI_CORNER_ID, PILOTI_CORNER_IDS} from '@/config.ts';

function isHouseGroupWithObjects(object: FabricObject): object is Group & HouseGroupWithObjects {
  return object.type === 'group' && typeof (object as { getObjects?: unknown }).getObjects === 'function';
}

function toRebuildViewSource(group: Group): RebuildViewSource<Group> {
  const canvasGroup = toCanvasGroup(group);
  return {
    group,
    meta: {
      houseViewType: canvasGroup.houseViewType,
      houseView: canvasGroup.houseViewType,
      houseSide: canvasGroup.houseSide,
      houseInstanceId: canvasGroup.houseInstanceId,
      isFlippedHorizontally: Boolean(canvasGroup.flipX),
      isRightSide: canvasGroup.houseSide === 'right',
    },
  };
}

function toRebuildPilotiSourceObject(value: unknown): RebuildPilotiSourceObject | null {
  if (!value || typeof value !== 'object') return null;
  return value as RebuildPilotiSourceObject;
}

class HouseManager {
  private aggregate: HouseAggregate<Group> | null = null;
  private canvas: FabricCanvas | null = null;
  private listeners = new Set<() => void>();

  private get house(): HouseState<Group> | null {
    return this.aggregate?.getState() ?? null;
  }

  private set house(nextHouse: HouseState<Group> | null) {
    this.aggregate = nextHouse ? new HouseAggregate(nextHouse) : null;
  }

  private getCanvasPort(): HouseCanvasPort<FabricObject> | null {
    if (!this.canvas) return null;
    return this.canvas as HouseCanvasPort<FabricObject>;
  }

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
        const markers =
          topInstance.group.getObjects().filter(
            (object) => toCanvasObject(object).isTopDoorMarker
          );

        for (const marker of markers) {
          const canvasObjectMarker = toCanvasObject(marker);
          canvasObjectMarker.set({visible: false});
          canvasObjectMarker.setCoords?.();
          canvasObjectMarker.dirty = true;
        }
      }
      this.canvas?.requestRenderAll();
      return;
    }

    const doorMarkerSide = resolveTopDoorMarkerSide({
      houseType: this.house.houseType,
      doorFace: door.face,
      sideAssignments,
    });

    for (const topInstance of topViews) {
      const group = topInstance.group;
      const markers =
        group.getObjects().filter(
          (object) => toCanvasObject(object).isTopDoorMarker
        );
      if (markers.length === 0) continue;

      const houseBody =
        group.getObjects().find(
          (object) => toCanvasObject(object).isHouseBody
        );

      const canvasObjectHouseBody = houseBody ? toCanvasObject(houseBody) : null;
      const {bodyWidth, bodyHeight} = calculateTopDoorMarkerBodySize({
        width: canvasObjectHouseBody?.width ?? 0,
        height: canvasObjectHouseBody?.height ?? 0,
        scaleX: canvasObjectHouseBody?.scaleX ?? 1,
        scaleY: canvasObjectHouseBody?.scaleY ?? 1,
      });

      const renderedDoorGeometry =
        calculateRenderedDoorGeometryForTopMarker({
          doorMarkerSide,
          bodyWidth,
          bodyHeight,
        });

      const placement = calculateTopDoorPlacement({
        doorMarkerSide,
        doorX: renderedDoorGeometry.doorX,
        doorWidth: renderedDoorGeometry.doorWidth,
        bodyWidth,
        bodyHeight,
      });

      for (const marker of markers) {
        const canvasObjectMarker = toCanvasObject(marker);
        const side = canvasObjectMarker.doorMarkerSide;
        if (!side) continue;

        canvasObjectMarker.set(
          createTopDoorMarkerVisualPatch({
            doorMarkerSide: placement.doorMarkerSide,
            markerCandidateSide: side,
            targetLeft: placement.targetLeft,
            targetTop: placement.targetTop,
          }),
        );
        canvasObjectMarker.setCoords?.();
        canvasObjectMarker.dirty = true;
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
    this.house = createInitialHouseState<Group>({
      id: createHouseId(),
      pilotiIds: getAllPilotiIds(),
      defaultPiloti: DEFAULT_HOUSE_PILOTI,
    });

    this.notify();
  }

  // Get/Set house type
  getHouseType(): HouseType {
    return this.house?.houseType || null;
  }

  setHouseType(type: HouseType): void {
    if (!this.aggregate) return;
    this.aggregate.setHouseType(type);
    this.notify();
  }

  // Get max count for a view type based on current house type
  getMaxViewCount(viewType: HouseViewType): number {
    const repository = this.getHousePilotiRepository();
    if (!repository) return 0;
    return getMaxViewCount(repository, viewType);
  }

  // Get current count of a view type
  getViewCount(viewType: HouseViewType): number {
    if (!this.house) return 0;
    return this.house.views[viewType].length;
  }

  // Check if can add more of this view type
  canAddView(viewType: HouseViewType): boolean {
    const repository = this.getHousePilotiRepository();
    if (!repository) return false;
    return canAddView(repository, viewType);
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

  getHouse(): HouseState<Group> | null {
    return this.house;
  }

  private getHousePilotiRepository(): HousePilotiPort | null {
    if (!this.house) return null;

    return {
      getHouseType: () => this.house?.houseType ?? null,
      getViewCount: (viewType) => this.house?.views[viewType].length ?? 0,
      getPilotis: () => this.house?.pilotis ?? {},
      setPilotis: (pilotis) => {
        if (!this.aggregate) return;
        this.aggregate.setPilotis(pilotis);
      },
    };
  }

  private getHouseViewsRepository(): HouseViewsPort<HouseViewType, HouseSide, Group> | null {
    if (!this.house) return null;

    return {
      getViews: () =>
        this.house?.views ?? {top: [], front: [], back: [], side1: [], side2: []},

      setViews: (views) => {
        if (!this.aggregate) return;
        this.aggregate.setViews(views);
      },

      getSideAssignments: () =>
        this.house?.sideAssignments ?? {top: null, bottom: null, left: null, right: null},

      setSideAssignments: (sideAssignments) => {
        if (!this.aggregate) return;
        this.aggregate.setSideAssignments(sideAssignments);
      },
    };
  }

  private getHouseElementsRepository(): HouseElementsPort<HouseElement> | null {
    if (!this.house) return null;

    return {
      getElements: () => this.house?.elements ?? [],

      setElements: (elements) => {
        if (!this.aggregate) return;
        this.aggregate.setElements(elements);
      },
    };
  }

  private isGroupOnCanvas(group: Group): boolean {
    const canvasPort = this.getCanvasPort();
    if (!canvasPort) return false;
    return canvasPort.getObjects().includes(group);
  }

  private cleanupStaleViews(viewType: HouseViewType): void {
    const repository = this.getHouseViewsRepository();
    if (!repository) return;

    cleanupStaleViewsInRepository(repository, viewType, (group) => this.isGroupOnCanvas(group));
  }

  // Check if this specific view type has reached its maximum
  isViewAtLimit(viewType: HouseViewType): boolean {
    if (!this.house) return true;
    this.cleanupStaleViews(viewType);
    return isViewAtLimitForType(this.house.houseType, viewType, this.house.views[viewType].length);
  }

  getAvailableViews(): HouseViewType[] {
    if (!this.house) return [];

    ALL_HOUSE_VIEW_TYPES.forEach((viewType) => {
      this.cleanupStaleViews(viewType);
    });

    return getAvailableViewsByCounts({
      houseType: this.house.houseType,
      counts: countViewInstances(this.house.views),
    });
  }

  // Get which sides are available for a given view type
  getAvailableSides(viewType: HouseViewType): HouseSide[] {
    if (!this.house) return [];

    return getAvailableSidesInViews({
      viewType,
      sideAssignments: this.house.sideAssignments,
    });
  }

  // Register a view with its group and side
  registerView(viewType: HouseViewType, group: Group, side?: HouseSide): void {
    if (!this.house) return;
    const repository = this.getHouseViewsRepository();
    if (!repository) return;

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

  private readPilotiDataFromCanvas(): Record<string, HousePiloti> {
    const canvasPort = this.getCanvasPort();
    const houseGroups = canvasPort
      ? canvasPort.getObjects().filter(
        (object): object is Group & HouseGroupWithObjects => isHouseGroupWithObjects(object)
      ) : [];

    const sources: RebuildPilotiSource[] =
      collectHouseGroupPilotiSources(houseGroups).map((source) => ({
        objects: source.objects
          .map((value) => toRebuildPilotiSourceObject(value))
          .filter((value): value is RebuildPilotiSourceObject => value !== null),
      }));

    return rebuildPilotiDataFromSources({
      pilotiIds: getAllPilotiIds(),
      currentPilotis: this.house?.pilotis ?? {},
      defaultPiloti: DEFAULT_HOUSE_PILOTI,
      sources,
    });
  }

  // Rebuild house view registry from current canvas groups (used after undo/import).
  rebuildFromCanvas(): void {
    if (!this.canvas || !this.house) return;
    const viewsRepository = this.getHouseViewsRepository();
    if (!viewsRepository) return;

    const canvasGroups = this.canvas
      .getObjects()
      .filter((object): object is Group => object.type === 'group');

    const rebuildSources =
      collectHouseGroupRebuildSources(canvasGroups).map((source) =>
        toRebuildViewSource(source.group),
      );

    const rebuilt = rebuildViewsFromCanvasSources(viewsRepository, {
      houseType: this.house.houseType,
      sources: rebuildSources,
    });

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

    this.aggregate?.setPilotis(this.readPilotiDataFromCanvas());

    // If no house views remain on canvas, clear type to keep add-view rules coherent.
    if (!hasAnyViewInstances(rebuilt.views)) {
      this.aggregate?.clearHouseTypeAndSlots();
    }

    // Re-apply current piloti data to normalized groups after restore.
    this.getAllGroups().forEach((group) => this.applyPilotiDataToGroup(group));

    this.notify();
  }

  // Remove a view (when deleted from canvas)
  removeView(group: Group): void {
    const repository = this.getHouseViewsRepository();
    if (!repository) return;

    const hints = extractViewGroupRemovalHints<HouseViewType>({
      houseViewType: toCanvasGroup(group).houseViewType,
      houseInstanceId: toCanvasGroup(group).houseInstanceId,
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

  private applyPilotiDataFirstPass(
    objects: FabricObject[],
    pilotiObjectIndex: Record<string, { circle?: CanvasObject; rect?: CanvasObject }>,
  ): void {
    if (!this.house) return;

    objects.forEach((obj: FabricObject) => {
      const canvasObject = toCanvasObject(obj);
      const pilotiId = canvasObject.pilotiId;
      if (!pilotiId) return;

      const data = this.house!.pilotis[pilotiId];
      if (!data) return;

      if (canvasObject.isPilotiCircle || canvasObject.isPilotiRect) {
        const isRect = Boolean(canvasObject.isPilotiRect);
        canvasObject.set(
          createPilotiVisualDataPatch({
            height: data.height,
            isMaster: data.isMaster,
            nivel: data.nivel,
            isRect,
            baseHeight: canvasObject.pilotiBaseHeight ?? PILOTI_BASE_HEIGHT_PX_WITH_SCALE,
            masterFill: PILOTI_MASTER_FILL_COLOR,
            masterStroke: PILOTI_MASTER_STROKE_COLOR,
          }),
        );

        if (isRect) {
          canvasObject.setCoords();
          canvasObject.dirty = true;
        }
      }

      if (canvasObject.isPilotiText) {
        canvasObject.set(createPilotiHeightTextPatch(formatPilotiHeight(data.height)));
      }

      if (canvasObject.isPilotiNivelText) {
        const isCorner = PILOTI_CORNER_IDS.includes(pilotiId);
        const pilotiCircle = pilotiObjectIndex[pilotiId]?.circle;
        const centerX = Number(pilotiCircle?.left ?? canvasObject.left ?? 0);
        const centerY = Number(pilotiCircle?.top ?? canvasObject.top ?? 0);
        const radius = Number(
          pilotiCircle?.radius ?? HOUSE_DEFAULTS.pilotiRadius * HOUSE_DEFAULTS.viewScale,
        );
        const offset = HOUSE_DEFAULTS.pilotiNivelLabelOffset * HOUSE_DEFAULTS.viewScale;
        const isTopCorner = pilotiId === PILOTI_CORNER_ID.topLeft || pilotiId === PILOTI_CORNER_ID.topRight;

        canvasObject.set(
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

      if (canvasObject.isPilotiSizeLabel) {
        canvasObject.set(createPilotiSizeLabelPatch(formatPilotiHeight(data.height)));
      }
    });
  }

  private applyNivelLabelsBackground(objects: FabricObject[]): void {
    objects.forEach((obj: FabricObject) => {
      const canvasObject = toCanvasObject(obj);
      if (canvasObject.isNivelLabel) {
        canvasObject.set(createNivelLabelBackgroundPatch());
      }
    });
  }

  private applyPilotiSizeLabelPositions(
    objects: FabricObject[],
    pilotiObjectIndex: Record<string, { circle?: CanvasObject; rect?: CanvasObject }>,
  ): void {
    objects.forEach((obj: FabricObject) => {
      const canvasObject = toCanvasObject(obj);
      if (!canvasObject.isPilotiSizeLabel) return;

      const pilotiId = canvasObject.pilotiId;
      if (!pilotiId) return;

      const rect = pilotiObjectIndex[pilotiId]?.rect;
      if (!rect) return;

      const baseHeight = rect.pilotiBaseHeight ?? PILOTI_BASE_HEIGHT_PX_WITH_SCALE;
      const rectWidth = Number(rect.width ?? 0);
      const rectHeight = Number(rect.height ?? 0);
      const position = calculatePilotiSizeLabelPosition({
        rectLeft: Number(rect.left ?? 0),
        rectTop: Number(rect.top ?? 0),
        rectWidth,
        rectHeight,
        baseHeight,
        basePilotiHeight: PILOTI_BASE_HEIGHT_PX,
      });

      canvasObject.set('left', position.left);
      canvasObject.set('top', position.top);
      canvasObject.setCoords?.();
      canvasObject.dirty = true;
    });
  }

  private applyPilotiStripeOverlays(
    objects: FabricObject[],
    pilotiObjectIndex: Record<string, { circle?: CanvasObject; rect?: CanvasObject }>,
  ): void {
    objects.forEach((obj: FabricObject) => {
      const canvasObject = toCanvasObject(obj);
      if (!canvasObject.isPilotiStripe) return;

      const pilotiId = canvasObject.pilotiId;
      if (!pilotiId) return;

      const rect = pilotiObjectIndex[pilotiId]?.rect;
      if (!rect) return;

      const geometry = calculatePilotiStripeGeometry({
        rectTop: Number(rect.top ?? 0),
        rectHeight: Number(rect.height ?? 0),
      });
      canvasObject.set({height: geometry.height, top: geometry.top});
      canvasObject.set('fill', createDiagonalStripePattern());
      canvasObject.objectCaching = false;
      canvasObject.setCoords();
      canvasObject.dirty = true;
    });
  }

  private syncPilotiUpdateOnGroup(
    group: Group,
    pilotiId: string,
    data: Partial<HousePiloti>,
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
    if ((data.height !== undefined || data.nivel !== undefined) && PILOTI_CORNER_IDS.includes(pilotiId)) {
      updateGroundInGroup(group);
    }

    refreshHouseGroupRendering(group);
  }

  private syncPilotiUpdateAcrossViews(
    pilotiId: string,
    data: Partial<HousePiloti>,
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
    const canvasObjects =
      objects.map((object) => toCanvasObject(object));

    const pilotiObjectIndex = buildPilotiObjectIndex(canvasObjects);
    this.applyPilotiDataFirstPass(canvasObjects, pilotiObjectIndex);
    this.applyNivelLabelsBackground(canvasObjects);
    this.applyPilotiSizeLabelPositions(canvasObjects, pilotiObjectIndex);
    this.applyPilotiStripeOverlays(canvasObjects, pilotiObjectIndex);

    // Update ground line based on the applied nivel values
    updateGroundInGroup(group);
    refreshHouseGroupRendering(group);
  }

  // Update piloti data and sync across all views
  updatePiloti(pilotiId: string, data: Partial<HousePiloti>): void {
    const repository = this.getHousePilotiRepository();
    if (!this.house || !repository) return;

    const {clearedMasters} = applyPilotiUpdate(repository, pilotiId, data, DEFAULT_HOUSE_PILOTI);
    this.syncPilotiUpdateAcrossViews(pilotiId, data, clearedMasters);

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
    const repository = this.getHousePilotiRepository();
    if (!this.house || !repository) return;

    recalculateRecommendedPilotiData(repository, DEFAULT_HOUSE_PILOTI);

    console.log('[HouseManager] Calculated recommended heights:',
      Object.entries(this.house.pilotis).map(
        ([id, d]) => `${id}: nivel=${d.nivel} h=${d.height}`).join(', ')
    );
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
  initializeDefaultElements(): void {
    if (!this.house?.houseType) return;
    const repository = this.getHouseElementsRepository();
    if (!repository) return;

    resetDefaultElements(repository, this.house.houseType, () => createElementId());
    this.notify();
  }

  // Auto-assign all sides based on initial view positioning
  autoAssignAllSides(_initialViewType: HouseViewType, initialSide: HouseSide): void {
    if (!this.house?.houseType) return;

    const slots = buildAutoAssignedSlots({
      houseType: this.house.houseType,
      initialSide,
    });
    this.aggregate?.setPreAssignedSlots(slots);
    console.log('[HouseManager] Auto-assigned slots:', this.house?.preAssignedSides ?? {});
    this.notify();
  }

  // Get pre-assigned slots for a view type
  getPreAssignedSlots(viewType: HouseViewType): { label: string; side: HouseSide; onCanvas: boolean }[] {
    if (!this.house) return [];

    return getPreAssignedSlotsForView({
      viewType,
      preAssignedSides: this.house.preAssignedSides,
      sideAssignments: this.house.sideAssignments,
    });
  }

  // Check if pre-assigned slots exist
  hasPreAssignedSlots(): boolean {
    return this.house ? hasAnyPreAssignedSlots(this.house.preAssignedSides) : false;
  }
}

// Singleton instance
export const houseManager = new HouseManager();
