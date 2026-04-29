import {useCallback} from 'react';
import type {FamilySetupResult} from '@/components/rac-editor/ui/modals/editors/FamilySetupModal.tsx';
import {legacyHouseWritePort} from '@/infra/house/legacy-house-write-adapter.ts';

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
  const handleFamilySetupConfirm = useCallback((result: FamilySetupResult) => {
    legacyHouseWritePort.applyFamilySetup({
      familyName: result.familyName,
      selectedPilotiHeights: result.selectedHeights,
    });
    setFamilySetupOpen(false);
    setHouseTypeSelectorOpen(true);
  }, [setFamilySetupOpen, setHouseTypeSelectorOpen]);

  const handleRenameFamily = useCallback((newName: string) => {
    legacyHouseWritePort.renameFamily(newName);
  }, []);

  return {
    handleFamilySetupConfirm,
    handleRenameFamily,
  };
}
