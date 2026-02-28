import {PILOTI_CORNER_ID} from '@/shared/config.ts';
import {
  ALL_HOUSE_VIEW_TYPES,
  DEFAULT_HOUSE_PILOTI,
  DEFAULT_HOUSE_PILOTI_HEIGHTS,
  HOUSE_VIEW_LIMITS,
  HousePiloti,
  HousePreAssignedSideDisplay,
  HouseSide,
  HouseState,
  HouseType,
  HouseViews,
  HouseViewType,
} from '@/shared/types/house.ts';
import {
  cleanupStaleViewInstances,
  rebuildSideMappingsFromViews,
  registerViewInstance,
  removeViewInstance,
  removeViewInstanceByGroup,
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
import {rebuildViewsFromSources,} from "@/domain/house/use-cases/house-views-rebuild.use-case.ts";
import {RebuildViewSource, RebuildViewsResult} from "@/shared/types/house-rebuild.ts";

export class HouseAggregate<TGroup = unknown> {

  private constructor(private readonly state: HouseState<TGroup>) {
  }

  static createInitialHouseState<TGroup = unknown>(params: {
    id: string;
    pilotiIds: string[];
    defaultPiloti: HousePiloti;
    defaultTerrainType: number;
  }): HouseState<TGroup> {
    return {
      id: params.id,
      houseType: null,
      pilotis: createDefaultPilotis({
        pilotiIds: params.pilotiIds,
        defaultPiloti: params.defaultPiloti,
      }),
      terrainType: params.defaultTerrainType,
      views: createEmptyViews(),
      sideMappings: createEmptySideMappings(),
      preAssignedSides: {},
    };
  }

  static fromState<TGroup>(state: HouseState<TGroup>): HouseAggregate<TGroup> {
    return new HouseAggregate(state);
  }

  toState(): HouseState<TGroup> {
    return this.state;
  }

  private static round2(value: number): number {
    return Math.round(value * 100) / 100;
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
    instanceId: string;
    side?: HouseSide;
    viewType: HouseViewType;
    group: TGroup;
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
    instanceId?: string;
    viewType?: HouseViewType;
    group: TGroup;
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
        group: params.group,
      });

      this.state.views = result.views;
      this.state.sideMappings = result.sideMappings;

      return {
        removedViewType: result.removed ? params.viewType : null,
        removedCount: result.removed ? 1 : 0,
      };
    }

    const result = removeViewInstanceByGroup({
      views: this.state.views,
      sideMappings: this.state.sideMappings,
      group: params.group,
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
    isAlive: (group: TGroup) => boolean,
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
    const nextPilotis: Record<string, HousePiloti> = {...this.state.pilotis};
    const clearedMasters: string[] = [];

    if (patch.isMaster === true) {
      Object.entries(nextPilotis).forEach(([id, p]) => {
        if (id !== pilotiId && p.isMaster) {
          nextPilotis[id] = {...p, isMaster: false};
          clearedMasters.push(id);
        }
      });
    }

    const current = nextPilotis[pilotiId] ?? DEFAULT_HOUSE_PILOTI;
    nextPilotis[pilotiId] = {...current, ...patch};
    this.state.pilotis = nextPilotis;

    return {clearedMasters};
  }

  recalculateRecommendedPilotiData(defaultPiloti: HousePiloti): void {
    const nextPilotis: Record<string, HousePiloti> = {...this.state.pilotis};

    const a1 = this.state.pilotis[PILOTI_CORNER_ID.topLeft]?.nivel ?? defaultPiloti.nivel;
    const a4 = this.state.pilotis[PILOTI_CORNER_ID.topRight]?.nivel ?? defaultPiloti.nivel;
    const c1 = this.state.pilotis[PILOTI_CORNER_ID.bottomLeft]?.nivel ?? defaultPiloti.nivel;
    const c4 = this.state.pilotis[PILOTI_CORNER_ID.bottomRight]?.nivel ?? defaultPiloti.nivel;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const id = `piloti_${col}_${row}`;
        const u = col / 3;
        const v = row / 2;

        const nivel = (1 - u) * (1 - v) * a1 + u * (1 - v) * a4 + (1 - u) * v * c1 + u * v * c4;
        const minHeight = nivel * 3;
        const height =
          DEFAULT_HOUSE_PILOTI_HEIGHTS.find((h) => h >= minHeight) ?? 3.0;

        nextPilotis[id] = {
          ...(nextPilotis[id] ?? defaultPiloti),
          nivel: HouseAggregate.round2(nivel),
          height,
        };
      }
    }

    this.state.pilotis = nextPilotis;
  }

  collectAllViewGroups<TGroup>(
    views: HouseViews<TGroup>,
  ): TGroup[] {
    const groups: TGroup[] = [];
    (Object.keys(views) as HouseViewType[]).forEach((viewType) => {
      views[viewType].forEach((instance) => {
        groups.push(instance.group);
      });
    });
    return groups;
  }

  hasAnyViewInstances<TGroup>(
    views: HouseViews<TGroup>,
  ): boolean {
    return (Object.keys(views) as HouseViewType[]).some(
      (viewType) => views[viewType].length > 0
    );
  }

  rebuildViewsFromCanvasSources(sources: RebuildViewSource<TGroup>[]): RebuildViewsResult<TGroup> {
    const rebuilt = rebuildViewsFromSources({
      houseType: this.state.houseType,
      sources,
    });
    this.state.views = rebuilt.views;
    this.state.sideMappings = rebuildSideMappingsFromViews({
      views: rebuilt.views,
      sideMappingsTemplate: this.state.sideMappings,
    });

    return rebuilt;
  }
}
