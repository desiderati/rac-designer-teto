import {houseManager} from '@/components/rac-editor/lib/house-manager.ts';
import type {CanvasGroup} from '@/components/rac-editor/canvas/lib';
import type {HouseWritePort} from '@/components/rac-editor/store/HouseWritePort.ts';

/**
 * Adapter transitório de escrita sobre o `houseManager`.
 *
 * Ele preserva o estado canônico atual, mas impede que componentes e hooks de
 * UI dependam diretamente do singleton de gerenciamento da casa.
 */
export const houseManagerWritePort: HouseWritePort<CanvasGroup> = {
  applyFamilySetup: (setup) => {
    houseManager.setSelectedPilotiHeights([...setup.selectedPilotiHeights]);
    houseManager.setFamilyName(setup.familyName);
  },

  renameFamily: (name) => houseManager.setFamilyName(name),

  refreshAutoStairsForCurrentSettings: () => houseManager.refreshAutoStairsForCurrentSettings(),

  setHouseType: (type) => houseManager.setHouseType(type),

  resetHouse: () => houseManager.reset(),

  rebuildHouseFromCanvas: () => houseManager.rebuildFromCanvas(),

  setTerrainType: (terrainType) => houseManager.setTerrainType(terrainType),

  insert3DSnapshotOnCanvas: (dataUrl) => houseManager.insert3DSnapshotOnCanvas(dataUrl),

  canDeleteTopView: () => houseManager.canDeletePlant(),

  removeView: (group) => houseManager.removeView(group),

  registerView: (viewType, group, side) => houseManager.registerView(viewType, group, side),

  isViewAtLimit: (viewType) => houseManager.isViewAtLimit(viewType),

  getCurrentHouseType: () => houseManager.getHouseType(),

  getPreAssignedSides: (viewType) => houseManager.getPreAssignedSides(viewType),

  getAvailableSides: (viewType) => houseManager.getAvailableSides(viewType),

  hasPreAssignedSides: () => houseManager.hasPreAssignedSides(),

  autoAssignAllSides: (initialViewType, initialSide) => houseManager.autoAssignAllSides(initialViewType, initialSide),

  updatePiloti: (pilotiId, pilotiData) => houseManager.updatePiloti(pilotiId, pilotiData),

  calculateAndApplyRecommendedHeights: () => houseManager.calculateAndApplyRecommendedHeights(),

  getStackedViewGroups: (viewType, side) => {
    const house = houseManager.getHouse();
    return {
      topGroup: house?.views.top?.[0]?.group ?? null,
      viewGroup: house?.views[viewType]?.find((view) => view.side === side)?.group ?? null,
    };
  },
};
