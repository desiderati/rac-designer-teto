import {houseManager} from '@/components/rac-editor/@canvas/lib/canvas-house-manager.ts';
import type {HouseReadPort} from '@/components/rac-editor/ports/HouseReadPort.ts';

/**
 * Adapter transitório de leitura sobre o `houseManager`.
 *
 * Mantém a UI dependente de uma porta explícita enquanto o estado canônico da
 * casa ainda não foi migrado para uma store/use case sem Fabric.
 */
export const houseManagerReadPort: HouseReadPort = {
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
