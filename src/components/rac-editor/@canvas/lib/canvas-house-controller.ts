import {EditorHouseController} from '@/components/rac-editor/lib/editor-house-controller.ts';
import type {HousePersistencePort} from '@/domain/house/house-persistence.port.ts';
import type {ConstructionSiteSessionPort} from '@/components/rac-editor/lib/construction-site-session.ts';
import type {SettingsPort} from '@/components/rac-editor/ports/SettingsPort.ts';
import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import {HouseVisualEffects} from '@/components/rac-editor/@canvas/lib/house-visual-effects.ts';
import {
  applyCurrentHouseDataToGroups,
  applyTerrainTypeToElevationViews,
  updateHousePiloti,
} from '@/components/rac-editor/@canvas/lib/house-visual-runtime.ts';

interface CanvasHouseControllerArgs {
  persistence: HousePersistencePort;
  settingsPort: SettingsPort;
  constructionSiteSession: ConstructionSiteSessionPort;
}

export function createCanvasHouseController(args: CanvasHouseControllerArgs): EditorHouseController<CanvasGroup> {
  return new EditorHouseController<CanvasGroup>({
    persistence: args.persistence,
    constructionSiteSession: args.constructionSiteSession,
    createEffects: (effectsArgs) => new HouseVisualEffects({
      ...effectsArgs,
      settingsPort: args.settingsPort,
    }),
    viewRuntime: {
      applyCurrentHouseDataToGroups,
      applyTerrainTypeToElevationViews,
      updatePiloti: updateHousePiloti,
    },
  });
}
