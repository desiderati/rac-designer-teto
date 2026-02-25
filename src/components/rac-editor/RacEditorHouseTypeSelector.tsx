import type {HouseType} from '@/shared/types/house.ts';
import {HouseTypeSelector} from '@/components/rac-editor/modals/selectors/HouseTypeSelector.tsx';
import {NivelDefinition, NivelDefinitionEditor} from '@/components/rac-editor/modals/editors/NivelDefinitionEditor.tsx';

interface RacEditorHouseTypeSelectorProps {
  houseTypeSelectorOpen: boolean;
  onHouseTypeSelectorClose: () => void;
  onHouseTypeSelected: (type: HouseType) => void;
  tutorialHouseSelectorPreview: boolean;
  nivelDefinitionOpen: boolean;
  onCloseNivelDefinition: () => void;
  onApplyNiveis: (niveis: Record<string, NivelDefinition>) => void;
}

export function RacEditorHouseTypeSelector({
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
