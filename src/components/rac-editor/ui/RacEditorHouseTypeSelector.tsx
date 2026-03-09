import type {HouseType} from '@/shared/types/house.ts';
import {HouseTypeSelector} from '@/components/rac-editor/ui/modals/selectors/HouseTypeSelector.tsx';
import {
  NivelDefinition,
  NivelDefinitionEditor
} from '@/components/rac-editor/ui/modals/editors/NivelDefinitionEditor.tsx';
import {FamilySetupModal, FamilySetupResult} from '@/components/rac-editor/ui/modals/editors/FamilySetupModal.tsx';

interface RacEditorHouseTypeSelectorProps {
  familySetupOpen: boolean;
  onFamilySetupClose: () => void;
  onFamilySetupConfirm: (result: FamilySetupResult) => void;
  houseTypeSelectorOpen: boolean;
  onHouseTypeSelectorClose: () => void;
  onHouseTypeSelected: (type: HouseType) => void;
  tutorialHouseSelectorPreview: boolean;
  nivelDefinitionOpen: boolean;
  onCloseNivelDefinition: () => void;
  onApplyNiveis: (niveis: Record<string, NivelDefinition>) => void;
}

export function RacEditorHouseTypeSelector({
  familySetupOpen,
  onFamilySetupClose,
  onFamilySetupConfirm,
  houseTypeSelectorOpen,
  onHouseTypeSelectorClose,
  onHouseTypeSelected,
  tutorialHouseSelectorPreview,
  nivelDefinitionOpen,
  onCloseNivelDefinition,
  onApplyNiveis,
}: RacEditorHouseTypeSelectorProps) {
  return (
    <>
      <FamilySetupModal
        isOpen={familySetupOpen}
        onClose={onFamilySetupClose}
        onConfirm={onFamilySetupConfirm}
      />

      <HouseTypeSelector
        isOpen={houseTypeSelectorOpen}
        onClose={onHouseTypeSelectorClose}
        onSelectType={onHouseTypeSelected}
        tutorialLocked={tutorialHouseSelectorPreview}/>

      <NivelDefinitionEditor
        isOpen={nivelDefinitionOpen}
        onClose={onCloseNivelDefinition}
        onApply={onApplyNiveis}/>
    </>
  );
}
