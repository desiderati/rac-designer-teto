import type {HouseType} from '@/shared/types/house.ts';
import {HouseTypeSelector} from '@/components/rac-editor/@modals/ui/selectors/HouseTypeSelector.tsx';
import {
  NivelDefinition,
  NivelDefinitionEditor
} from '@/components/rac-editor/@modals/ui/editors/NivelDefinitionEditor.tsx';
import {PilotisSetupModal, PilotisSetupResult} from '@/components/rac-editor/@modals/ui/editors/PilotisSetupModal.tsx';

interface RacEditorHouseTypeSelectorProps {
  pilotisSetupOpen: boolean;
  onPilotisSetupClose: () => void;
  onPilotisSetupConfirm: (result: PilotisSetupResult) => void;
  houseTypeSelectorOpen: boolean;
  onHouseTypeSelectorClose: () => void;
  onHouseTypeSelected: (type: HouseType) => void;
  nivelDefinitionOpen: boolean;
  onCloseNivelDefinition: () => void;
  onApplyNiveis: (niveis: Record<string, NivelDefinition>) => void;
}

export function RacEditorHouseTypeSelector({
  pilotisSetupOpen,
  onPilotisSetupClose,
  onPilotisSetupConfirm,
  houseTypeSelectorOpen,
  onHouseTypeSelectorClose,
  onHouseTypeSelected,
  nivelDefinitionOpen,
  onCloseNivelDefinition,
  onApplyNiveis,
}: RacEditorHouseTypeSelectorProps) {
  return (
    <>
      <PilotisSetupModal
        isOpen={pilotisSetupOpen}
        onClose={onPilotisSetupClose}
        onConfirm={onPilotisSetupConfirm}
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
