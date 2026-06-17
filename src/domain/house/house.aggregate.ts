import {
  ALL_HOUSE_VIEW_TYPES,
  DEFAULT_HOUSE_PILOTI,
  HOUSE_VIEW_LIMITS,
  HousePiloti,
  HousePreAssignedSideDisplay,
  HouseSide,
  HouseState,
  HouseType,
  HouseViewInstance,
  HouseViews,
  HouseViewInstanceId,
  HouseViewType,
} from '@/shared/types/house.ts';
import {
  cleanupStaleViewInstances,
  registerViewInstance,
  removeViewInstance,
  removeViewInstanceById,
} from '@/domain/house/use-cases/house-views.use-case.ts';
import {
  buildAutoAssignedSides,
  canDeleteTopView as canDeletePlantInViews,
  getAvailableSides as getAvailableSidesInViews,
  getPreAssignedSides as getPreAssignedSidesForView,
  hasOtherViews as hasOtherViewsInViews,
  hasPreAssignedSides as hasAnyPreAssignedSides,
} from '@/domain/house/use-cases/house-views-layout.use-case.ts';
import {
  createDefaultPilotis,
  createEmptySideMappings,
  createEmptyViews
} from '@/domain/house/use-cases/house-state.use-case.ts';
import {
  applyPilotiPatch as applyHousePilotiPatch,
  recalculateRecommendedPilotiData,
} from '@/domain/house/use-cases/house-piloti.use-case.ts';

export class HouseAggregate {

  private constructor(private readonly state: HouseState) {
  }

  static createInitialHouseState(params: {
    id: string;
    pilotiIds: string[];
    defaultPiloti: HousePiloti;
    defaultTerrainType: number;
  }): HouseState {
    return {
      id: params.id,
      houseType: null,
      pilotis: createDefaultPilotis({
        pilotiIds: params.pilotiIds,
        defaultPiloti: params.defaultPiloti,
      }),
      terrainType: params.defaultTerrainType,
      views: createEmptyViews<HouseViewInstance>(),
      sideMappings: createEmptySideMappings(),
      preAssignedSides: {},
    };
  }

  static fromState(state: HouseState): HouseAggregate {
    return new HouseAggregate(state);
  }

  toState(): HouseState {
    return this.state;
  }

  getHouseType(): HouseType {
    return this.state.houseType;
  }

  getTerrainType(): number {
    return Number(this.state.terrainType ?? 0);
  }

  setHouseType(type: HouseType): void {
    this.state.houseType = type;
    if (type === null) {
      this.state.preAssignedSides = {};
    }
  }

  setTerrainType(terrainType: number): void {
    this.state.terrainType = terrainType;
  }

  getAvailableViews(): HouseViewType[] {
    return ALL_HOUSE_VIEW_TYPES.filter((viewType) => !this.isViewLimitAchieved(viewType));
  }

  canDeletePlant(): boolean {
    return canDeletePlantInViews(this.state.views);
  }

  hasOtherViews(): boolean {
    return hasOtherViewsInViews(this.state.views);
  }

  getAvailableSides(viewType: HouseViewType): HouseSide[] {
    return getAvailableSidesInViews({
      viewType,
      sideMappings: this.state.sideMappings,
    });
  }

  autoAssignAllSides(initialSide: HouseSide): void {
    if (!this.state.houseType) return;
    this.state.preAssignedSides = buildAutoAssignedSides({
      houseType: this.state.houseType,
      initialSide,
    });
  }

  getPreAssignedSides(viewType: HouseViewType): HousePreAssignedSideDisplay[] {
    return getPreAssignedSidesForView({
      viewType,
      preAssignedSides: this.state.preAssignedSides,
      sideMappings: this.state.sideMappings,
    });
  }

  hasPreAssignedSides(): boolean {
    return hasAnyPreAssignedSides(this.state.preAssignedSides);
  }

  registerView(params: {
    instanceId: HouseViewInstanceId;
    side?: HouseSide;
    viewType: HouseViewType;
  }): void {
    const result = registerViewInstance({
      views: this.state.views,
      sideMappings: this.state.sideMappings,
      ...params,
    });

    this.state.views = result.views;
    this.state.sideMappings = result.sideMappings;
  }

  removeView(params: {
    instanceId: HouseViewInstanceId;
    viewType?: HouseViewType;
  }): {
    removedViewType: HouseViewType | null;
    removedCount: number;
  } {
    if (params.viewType) {
      const result = removeViewInstance({
        views: this.state.views,
        sideMappings: this.state.sideMappings,
        viewType: params.viewType,
        instanceId: params.instanceId,
      });

      this.state.views = result.views;
      this.state.sideMappings = result.sideMappings;

      return {
        removedViewType: result.removed ? params.viewType : null,
        removedCount: result.removed ? 1 : 0,
      };
    }

    const result = removeViewInstanceById({
      views: this.state.views,
      sideMappings: this.state.sideMappings,
      instanceId: params.instanceId,
    });

    this.state.views = result.views;
    this.state.sideMappings = result.sideMappings;

    return {
      removedViewType: result.removedViewType,
      removedCount: result.removed ? 1 : 0,
    };
  }

  cleanupStaleViews(
    viewType: HouseViewType,
    isAlive: (instanceId: HouseViewInstanceId) => boolean,
  ): number {
    const result = cleanupStaleViewInstances({
      views: this.state.views,
      sideMappings: this.state.sideMappings,
      viewType,
      isAlive,
    });

    this.state.views = result.views;
    this.state.sideMappings = result.sideMappings;
    return result.removedCount;
  }


  getMaxViewCount(viewType: HouseViewType): number {
    if (!this.state.houseType) return 0;

    return HOUSE_VIEW_LIMITS[this.state.houseType][viewType];
  }

  canAddView(viewType: HouseViewType): boolean {
    if (!this.state.houseType) return false;

    return this.state.views[viewType].length < this.getMaxViewCount(viewType);
  }

  isViewLimitAchieved(viewType: HouseViewType): boolean {
    if (!this.state.houseType) return true;

    return this.state.views[viewType].length >= this.getMaxViewCount(viewType);
  }

  applyPilotiPatch(
    pilotiId: string,
    patch: Partial<HousePiloti>,
  ): { clearedMasters: string[] } {
    const result = applyHousePilotiPatch({
      pilotis: this.state.pilotis,
      pilotiId,
      patch,
      defaultPiloti: DEFAULT_HOUSE_PILOTI,
    });
    this.state.pilotis = result.pilotis;

    return {clearedMasters: result.clearedMasters};
  }

  recalculateRecommendedPilotiData(
    defaultPiloti: HousePiloti,
    recalculateHeight: boolean = true,
    availableHeights?: readonly number[],
  ): void {
    this.state.pilotis = recalculateRecommendedPilotiData({
      pilotis: this.state.pilotis,
      defaultPiloti,
      recalculateHeight,
      availableHeights,
    });
  }

  hasAnyViewInstances(views: HouseViews): boolean {
    return (Object.keys(views) as HouseViewType[]).some(
      (viewType) => views[viewType].length > 0
    );
  }
}
