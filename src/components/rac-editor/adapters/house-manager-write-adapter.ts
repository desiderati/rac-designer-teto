import {houseManager} from '@/components/rac-editor/lib/house-manager.ts';
import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import type {HouseWritePort} from '@/components/rac-editor/ports/HouseWritePort.ts';

/**
 * Adapter transitório de escrita sobre o `houseManager`.
 *
 * Ele preserva o estado canônico atual, mas impede que componentes e hooks de
 * UI dependam diretamente do singleton de gerenciamento da casa.
 */
export const houseManagerWritePort: HouseWritePort<CanvasGroup> = {
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

  removeView: (group) => houseManager.removeView(group),

  registerView: (viewType, group, side) => houseManager.registerView(viewType, group, side),

  autoAssignAllSides: (initialViewType, initialSide) => houseManager.autoAssignAllSides(initialViewType, initialSide),

  updatePiloti: (pilotiId, pilotiData) => {
    houseManager.updatePiloti(pilotiId, pilotiData);
    return houseManager.getPilotiData(pilotiId);
  },

  calculateAndApplyRecommendedHeights: () => houseManager.calculateAndApplyRecommendedHeights(),
};
