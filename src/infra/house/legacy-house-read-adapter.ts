import {houseManager} from '@/components/rac-editor/lib/house-manager.ts';
import type {HouseReadPort} from '@/components/rac-editor/store/HouseReadPort.ts';

/**
 * Adapter transitório de leitura sobre o `houseManager`.
 *
 * Mantém a UI dependente de uma porta explícita enquanto o estado canônico da
 * casa ainda não foi migrado para uma store/use case sem Fabric.
 */
export const legacyHouseReadPort: HouseReadPort = {
  getCurrentHouseType: () => houseManager.getHouseType(),

  getFamilyName: () => houseManager.getFamilyName(),

  getSelectedPilotiHeights: () => houseManager.getSelectedPilotiHeights(),

  getTerrainType: () => houseManager.getTerrainType(),

  getPilotis: () => houseManager.getHouse()?.pilotis,

  getViewCount: (viewType) => ({
    current: houseManager.getHouseViewCount(viewType),
    max: houseManager.getMaxHouseViewCount(viewType),
  }),
};
