import type {HouseReadPort} from '@/components/rac-editor/ports/HouseReadPort.ts';
import type {
  HousePiloti,
  HousePreAssignedSideDisplay,
  HouseSide,
  HouseType,
  HouseViewType,
} from '@/shared/types/house.ts';

/**
 * Adapter transitório de leitura sobre o `houseManager`.
 *
 * Mantém a UI dependente de uma porta explícita enquanto o estado canônico da
 * casa ainda não foi migrado para uma store/use case sem Fabric.
 */
interface HouseManagerReadSource {
  getHouseType(): HouseType;
  getFamilyName(): string;
  getSelectedPilotiHeights(): readonly number[];
  getTerrainType(): number;
  getHouse(): { pilotis: Record<string, HousePiloti> } | null;
  getPilotiData(pilotiId: string): HousePiloti;
  getHouseViewCount(viewType: HouseViewType): number;
  getMaxHouseViewCount(viewType: HouseViewType): number;
  canDeletePlant(): boolean;
  isViewAtLimit(viewType: HouseViewType): boolean;
  getPreAssignedSides(viewType: HouseViewType): HousePreAssignedSideDisplay[];
  getAvailableSides(viewType: HouseViewType): HouseSide[];
  hasPreAssignedSides(): boolean;
}

export function createHouseManagerReadPort(houseManager: HouseManagerReadSource): HouseReadPort {
  return {
    getCurrentHouseType: () => houseManager.getHouseType(),

    getFamilyName: () => houseManager.getFamilyName(),

    getSelectedPilotiHeights: () => houseManager.getSelectedPilotiHeights(),

    getTerrainType: () => houseManager.getTerrainType(),

    getPilotis: () => houseManager.getHouse()?.pilotis,

    getPilotiData: (pilotiId) => houseManager.getPilotiData(pilotiId),

    getViewCount: (viewType) => ({
      current: houseManager.getHouseViewCount(viewType),
      max: houseManager.getMaxHouseViewCount(viewType),
    }),

    canDeleteTopView: () => houseManager.canDeletePlant(),

    isViewAtLimit: (viewType) => houseManager.isViewAtLimit(viewType),

    getPreAssignedSides: (viewType) => houseManager.getPreAssignedSides(viewType),

    getAvailableSides: (viewType) => houseManager.getAvailableSides(viewType),

    hasPreAssignedSides: () => houseManager.hasPreAssignedSides(),
  };
}
