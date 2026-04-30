import type {HouseWritePort} from '@/components/rac-editor/ports/HouseWritePort.ts';
import type {
  HousePiloti,
  HouseSide,
  HouseType,
  HouseViewInstanceId,
  HouseViewType,
} from '@/shared/types/house.ts';
import type {HousePilotiPatch} from '@/components/rac-editor/ports/HousePilotiPort.ts';
import type {
  HouseViewRegistration,
  HouseViewRegistrationRequest,
} from '@/components/rac-editor/ports/HouseViewPort.ts';

/**
 * Adapter transitório de escrita sobre o `houseManager`.
 *
 * Ele preserva o estado canônico atual, mas impede que componentes e hooks de
 * UI dependam diretamente do singleton de gerenciamento da casa.
 */
interface HouseManagerWriteSource {
  setSelectedPilotiHeights(heights: number[]): void;
  setFamilyName(name: string): void;
  refreshAutoStairsForCurrentSettings(): void;
  setHouseType(type: HouseType): void;
  reset(): void;
  rebuildFromCanvas(): void;
  setTerrainType(terrainType: number): number;
  removeView(instanceId: HouseViewInstanceId): void;
  registerView(request: HouseViewRegistrationRequest): HouseViewRegistration | null;
  autoAssignAllSides(initialViewType: HouseViewType, initialSide: HouseSide): void;
  updatePiloti(pilotiId: string, pilotiData: HousePilotiPatch): void;
  getPilotiData(pilotiId: string): HousePiloti;
  calculateAndApplyRecommendedHeights(): void;
}

export function createHouseManagerWritePort(houseManager: HouseManagerWriteSource): HouseWritePort {
  return {
    applyHouseSetup: (setup) => {
      houseManager.setSelectedPilotiHeights([...setup.selectedPilotiHeights]);
      houseManager.setFamilyName(setup.familyName);
    },

    renameFamily: (name) => houseManager.setFamilyName(name),

    refreshAutoStairsForCurrentSettings: () => houseManager.refreshAutoStairsForCurrentSettings(),

    setHouseType: (type) => houseManager.setHouseType(type),

    resetHouse: () => houseManager.reset(),

    rebuildHouseFromCanvas: () => houseManager.rebuildFromCanvas(),

    setTerrainType: (terrainType) => houseManager.setTerrainType(terrainType),

    removeView: (instanceId) => houseManager.removeView(instanceId),

    registerView: (request) => houseManager.registerView(request),

    autoAssignAllSides: (initialViewType, initialSide) => houseManager.autoAssignAllSides(initialViewType, initialSide),

    updatePiloti: (pilotiId, pilotiData) => {
      houseManager.updatePiloti(pilotiId, pilotiData);
      return houseManager.getPilotiData(pilotiId);
    },

    calculateAndApplyRecommendedHeights: () => houseManager.calculateAndApplyRecommendedHeights(),
  };
}
