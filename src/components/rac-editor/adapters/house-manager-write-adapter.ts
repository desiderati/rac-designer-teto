import {houseManager} from '@/components/rac-editor/@canvas/lib/canvas-house-manager.ts';
import type {HouseWritePort} from '@/components/rac-editor/ports/HouseWritePort.ts';

/**
 * Adapter transitório de escrita sobre o `houseManager`.
 *
 * Ele preserva o estado canônico atual, mas impede que componentes e hooks de
 * UI dependam diretamente do singleton de gerenciamento da casa.
 */
export const houseManagerWritePort: HouseWritePort = {
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
