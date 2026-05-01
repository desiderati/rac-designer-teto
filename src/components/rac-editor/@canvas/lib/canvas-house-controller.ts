import {EditorHouseController} from '@/components/rac-editor/lib/editor-house-controller.ts';
import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import {HouseVisualEffects} from '@/components/rac-editor/@canvas/lib/house-visual-effects.ts';
import {
  applyCurrentHouseDataToGroups,
  applyTerrainTypeToElevationViews,
  rebuildHouseViewsFromCanvas,
  updateHousePiloti,
} from '@/components/rac-editor/@canvas/lib/house-visual-runtime.ts';

export function createCanvasHouseController(): EditorHouseController<CanvasGroup> {
  return new EditorHouseController<CanvasGroup>({
    createEffects: (args) => new HouseVisualEffects(args),
    viewRuntime: {
      rebuildViewsFromRuntime: rebuildHouseViewsFromCanvas,
      applyCurrentHouseDataToGroups,
      applyTerrainTypeToElevationViews,
      updatePiloti: updateHousePiloti,
    },
  });
}
