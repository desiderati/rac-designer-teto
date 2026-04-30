import type {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import {
  ALL_HOUSE_VIEW_TYPES,
  DEFAULT_HOUSE_PILOTI,
  type HousePiloti,
  type HouseSide,
  type HouseState,
  type HouseType,
  type HouseViewType,
} from '@/shared/types/house.ts';
import {normalizeTerrainSolidityLevel} from '@/shared/config.ts';

interface HouseManagerQueryServiceArgs<TGroup> {
  getHouse: () => HouseState | null;
  getAggregate: () => HouseAggregate | null;
  getAllRuntimeGroups: () => TGroup[];
  getDefaultTerrainType: () => number;
  cleanupStaleViews: (viewType: HouseViewType) => void;
}

export class HouseManagerQueryService<TGroup = unknown> {
  constructor(private readonly args: HouseManagerQueryServiceArgs<TGroup>) {
  }

  getHouse(): HouseState | null {
    return this.args.getHouse();
  }

  getHouseType(): HouseType {
    return this.args.getAggregate()?.getHouseType() ?? null;
  }

  getTerrainType(): number {
    const aggregate = this.args.getAggregate();
    if (!aggregate) return this.args.getDefaultTerrainType();

    return normalizeTerrainSolidityLevel(aggregate.getTerrainType());
  }

  getMaxHouseViewCount(viewType: HouseViewType): number {
    return this.args.getAggregate()?.getMaxViewCount(viewType) ?? 0;
  }

  getHouseViewCount(viewType: HouseViewType): number {
    return this.args.getHouse()?.views[viewType].length ?? 0;
  }

  canAddView(viewType: HouseViewType): boolean {
    return this.args.getAggregate()?.canAddView(viewType) ?? false;
  }

  canDeletePlant(): boolean {
    return this.args.getAggregate()?.canDeletePlant() ?? false;
  }

  hasOtherViews(): boolean {
    return this.args.getAggregate()?.hasOtherViews() ?? false;
  }

  isViewAtLimit(viewType: HouseViewType): boolean {
    const aggregate = this.args.getAggregate();
    if (!aggregate) return true;

    this.args.cleanupStaleViews(viewType);
    return aggregate.isViewLimitAchieved(viewType);
  }

  getAvailableViews(): HouseViewType[] {
    const aggregate = this.args.getAggregate();
    if (!aggregate) return [];

    ALL_HOUSE_VIEW_TYPES.forEach((viewType) => {
      this.args.cleanupStaleViews(viewType);
    });

    return aggregate.getAvailableViews();
  }

  getAvailableSides(viewType: HouseViewType): HouseSide[] {
    return this.args.getAggregate()?.getAvailableSides(viewType) ?? [];
  }

  getPilotiData(pilotiId: string): HousePiloti {
    return this.args.getHouse()?.pilotis[pilotiId] || {...DEFAULT_HOUSE_PILOTI};
  }

  hasAnyView(): boolean {
    const aggregate = this.args.getAggregate();
    const house = this.args.getHouse();
    if (!aggregate || !house) return false;

    return aggregate.hasAnyViewInstances(house.views);
  }

  getAllGroups(): TGroup[] {
    return this.args.getAllRuntimeGroups();
  }

  getPreAssignedSides(viewType: HouseViewType): { label: string; side: HouseSide; onCanvas: boolean }[] {
    return this.args.getAggregate()?.getPreAssignedSides(viewType) ?? [];
  }

  hasPreAssignedSides(): boolean {
    return this.args.getAggregate()?.hasPreAssignedSides() ?? false;
  }
}
