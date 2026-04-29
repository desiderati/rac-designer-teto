import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';

/**
 * Read model transitório da casa consumido pela composição do editor.
 */
export function useRacEditorHouseReadModel(houseVersion: number) {
  void houseVersion;
  const {houseReadPort} = useEditorPorts();

  return {
    currentFamilyName: houseReadPort.getFamilyName(),
    selectedPilotiHeights: houseReadPort.getSelectedPilotiHeights(),
    terrainPilotis: houseReadPort.getPilotis(),
  };
}
