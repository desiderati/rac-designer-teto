import type {
  HousePiloti,
  HousePreAssignedSideDisplay,
  HouseSide,
  HouseType,
  HouseViewType,
} from '@/shared/types/house.ts';

export interface HouseFamilySetup {
  familyName: string;
  selectedPilotiHeights: readonly number[];
}

export interface HouseStackedViewGroups<TGroup = unknown> {
  topGroup: TGroup | null;
  viewGroup: TGroup | null;
}

/**
 * Porta de escrita para os fluxos de casa usados pelo editor.
 *
 * Esta porta ainda pode ser implementada por adapters legados, mas a UI passa
 * a depender de comandos explícitos em vez de conhecer diretamente o
 * `houseManager`.
 */
export interface HouseWritePort<TGroup = unknown> {
  applyFamilySetup(setup: HouseFamilySetup): void;
  renameFamily(name: string): void;
  refreshAutoStairsForCurrentSettings(): void;

  setHouseType(type: HouseType): void;
  resetHouse(): void;
  rebuildHouseFromCanvas(): void;

  setTerrainType(terrainType: number): number;
  insert3DSnapshotOnCanvas(dataUrl: string): Promise<boolean>;

  canDeleteTopView(): boolean;
  removeView(group: TGroup): void;

  registerView(viewType: HouseViewType, group: TGroup, side?: HouseSide): void;
  isViewAtLimit(viewType: HouseViewType): boolean;
  getCurrentHouseType(): HouseType;
  getPreAssignedSides(viewType: HouseViewType): HousePreAssignedSideDisplay[];
  getAvailableSides(viewType: HouseViewType): HouseSide[];
  hasPreAssignedSides(): boolean;
  autoAssignAllSides(initialViewType: HouseViewType, initialSide: HouseSide): void;
  updatePiloti(pilotiId: string, pilotiData: Partial<HousePiloti>): void;
  calculateAndApplyRecommendedHeights(): void;
  getStackedViewGroups(viewType: HouseViewType, side?: HouseSide): HouseStackedViewGroups<TGroup>;
}
