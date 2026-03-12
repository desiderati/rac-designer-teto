import type {HouseType} from '@/shared/types/house.ts';
import {HouseTypeSelector} from '@/components/rac-editor/ui/modals/selectors/HouseTypeSelector.tsx';
import {
  NivelDefinition,
  NivelDefinitionEditor
} from '@/components/rac-editor/ui/modals/editors/NivelDefinitionEditor.tsx';
import {PilotiSetupModal} from '@/components/rac-editor/ui/modals/editors/PilotiSetupModal.tsx';

interface RacEditorHouseTypeSelectorProps {
  houseTypeSelectorOpen: boolean;
  onHouseTypeSelectorClose: () => void;
  onHouseTypeSelected: (type: HouseType) => void;
  tutorialHouseSelectorPreview: boolean;
  pilotiSetupOpen: boolean;
  onPilotiSetupClose: () => void;
  onPilotiSetupConfirm: (heights: number[]) => void;
  nivelDefinitionOpen: boolean;
  onCloseNivelDefinition: () => void;
  onApplyNiveis: (niveis: Record<string, NivelDefinition>) => void;
}

export function RacEditorHouseTypeSelector({
  houseTypeSelectorOpen,
  onHouseTypeSelectorClose,
  onHouseTypeSelected,
  tutorialHouseSelectorPreview,
  pilotiSetupOpen,
  onPilotiSetupClose,
  onPilotiSetupConfirm,
  nivelDefinitionOpen,
  onCloseNivelDefinition,
  onApplyNiveis,
}: RacEditorHouseTypeSelectorProps) {
  return (
    <>
      <HouseTypeSelector
        isOpen={houseTypeSelectorOpen}
        onClose={onHouseTypeSelectorClose}
        onSelectType={onHouseTypeSelected}
        tutorialLocked={tutorialHouseSelectorPreview}/>

      <PilotiSetupModal
        isOpen={pilotiSetupOpen}
        onClose={onPilotiSetupClose}
        onConfirm={onPilotiSetupConfirm}/>

      <NivelDefinitionEditor
        isOpen={nivelDefinitionOpen}
        onClose={onCloseNivelDefinition}
        onApply={onApplyNiveis}/>
    </>
  );
}
