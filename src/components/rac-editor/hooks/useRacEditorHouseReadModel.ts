import {legacyHouseReadPort} from '@/infra/house/legacy-house-read-adapter.ts';

/**
 * Read model transitório da casa consumido pela composição do editor.
 */
export function useRacEditorHouseReadModel(houseVersion: number) {
  void houseVersion;

  return {
    currentFamilyName: legacyHouseReadPort.getFamilyName(),
    selectedPilotiHeights: legacyHouseReadPort.getSelectedPilotiHeights(),
    terrainPilotis: legacyHouseReadPort.getPilotis(),
  };
}
