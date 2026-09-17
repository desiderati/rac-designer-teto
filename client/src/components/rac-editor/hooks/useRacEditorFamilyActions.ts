import {useCallback} from 'react';
import type {PilotisSetupResult} from '@/components/rac-editor/@modals/ui/editors/PilotisSetupModal.tsx';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';

interface UseRacEditorFamilyActionsArgs {
  setPilotisSetupOpen: (open: boolean) => void;
  setHouseTypeSelectorOpen: (open: boolean) => void;
}

/**
 * Coordena comandos de pilotis iniciais e família disparados pelo editor RAC.
 */
export function useRacEditorFamilyActions({
  setPilotisSetupOpen,
  setHouseTypeSelectorOpen,
}: UseRacEditorFamilyActionsArgs) {
  const {houseWritePort} = useEditorPorts();

  const handlePilotisSetupConfirm = useCallback((result: PilotisSetupResult) => {
    houseWritePort.applyPilotisSetup({
      selectedPilotiHeights: result.selectedHeights,
    });
    setPilotisSetupOpen(false);
    setHouseTypeSelectorOpen(true);
  }, [houseWritePort, setPilotisSetupOpen, setHouseTypeSelectorOpen]);

  const handleRenameFamily = useCallback((newName: string) => {
    houseWritePort.renameFamily(newName);
  }, [houseWritePort]);

  return {
    handlePilotisSetupConfirm,
    handleRenameFamily,
  };
}
