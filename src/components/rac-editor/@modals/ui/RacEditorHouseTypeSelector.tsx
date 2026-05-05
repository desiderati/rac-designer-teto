import type {HouseType} from '@/shared/types/house.ts';
import {HouseTypeSelector} from '@/components/rac-editor/@modals/ui/selectors/HouseTypeSelector.tsx';
import {
  NivelDefinition,
  NivelDefinitionEditor
} from '@/components/rac-editor/@modals/ui/editors/NivelDefinitionEditor.tsx';
import {FamilySetupModal, FamilySetupResult} from '@/components/rac-editor/@modals/ui/editors/FamilySetupModal.tsx';

interface RacEditorHouseTypeSelectorProps {
  familySetupOpen: boolean;
  onFamilySetupClose: () => void;
  onFamilySetupConfirm: (result: FamilySetupResult) => void;
  houseTypeSelectorOpen: boolean;
  onHouseTypeSelectorClose: () => void;
  onHouseTypeSelected: (type: HouseType) => void;
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
        onSelectType={onHouseTypeSelected}/>

      <NivelDefinitionEditor
        isOpen={nivelDefinitionOpen}
        onClose={onCloseNivelDefinition}
        onApply={onApplyNiveis}/>
    </>
  );
}
