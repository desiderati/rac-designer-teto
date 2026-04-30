import {useCallback} from 'react';
import type {FamilySetupResult} from '@/components/rac-editor/@modals/ui/editors/FamilySetupModal.tsx';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';

interface UseRacEditorFamilyActionsArgs {
  setFamilySetupOpen: (open: boolean) => void;
  setHouseTypeSelectorOpen: (open: boolean) => void;
}

/**
 * Coordena comandos de família disparados pelo editor RAC.
 */
export function useRacEditorFamilyActions({
  setFamilySetupOpen,
  setHouseTypeSelectorOpen,
}: UseRacEditorFamilyActionsArgs) {
  const {houseWritePort} = useEditorPorts();

  const handleFamilySetupConfirm = useCallback((result: FamilySetupResult) => {
    houseWritePort.applyHouseSetup({
      familyName: result.familyName,
      selectedPilotiHeights: result.selectedHeights,
    });
    setFamilySetupOpen(false);
    setHouseTypeSelectorOpen(true);
  }, [houseWritePort, setFamilySetupOpen, setHouseTypeSelectorOpen]);

  const handleRenameFamily = useCallback((newName: string) => {
    houseWritePort.renameFamily(newName);
  }, [houseWritePort]);

  return {
    handleFamilySetupConfirm,
    handleRenameFamily,
  };
}
