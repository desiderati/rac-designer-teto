import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {useRacEditorMenuHouseViewCounts} from '@/components/rac-editor/@menus/hooks/useRacEditorMenuHouseViewCounts.ts';

/**
 * Read model transitório da casa consumido pela composição do editor.
 */
export function useRacEditorHouseReadModel(houseVersion: number) {
  void houseVersion;
  const {houseReadPort} = useEditorPorts();
  const viewCounts = useRacEditorMenuHouseViewCounts(houseReadPort);

  return {
    ...viewCounts,
    currentFamilyName: houseReadPort.getFamilyName(),
    selectedPilotiHeights: houseReadPort.getSelectedPilotiHeights(),
    terrainPilotis: houseReadPort.getPilotis(),
  };
}
