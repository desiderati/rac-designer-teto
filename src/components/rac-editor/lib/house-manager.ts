import {HouseManagerFacade} from '@/components/rac-editor/lib/house-manager.facade.ts';
import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import {HouseVisualEffects} from '@/components/rac-editor/@canvas/lib/house-visual-effects.ts';
import {
  applyCurrentHouseDataToGroups,
  applyTerrainTypeToElevationViews,
  rebuildHouseViewsFromCanvas,
  updateHousePiloti,
} from '@/components/rac-editor/@canvas/lib/house-visual-runtime.ts';

export const houseManager = new HouseManagerFacade<CanvasGroup>({
  createEffects: (args) => new HouseVisualEffects(args),
  viewRuntime: {
    rebuildViewsFromRuntime: rebuildHouseViewsFromCanvas,
    applyCurrentHouseDataToGroups,
    applyTerrainTypeToElevationViews,
    updatePiloti: updateHousePiloti,
  },
});
