import type {linearSelection, PilotiCanvasSelection, wallSelection} from '@/components/rac-editor/canvas/Canvas.tsx';
import {PilotiEditor} from '@/components/rac-editor/modals/editors/piloti/PilotiEditor.tsx';
import {GenericObjectEditor} from '@/components/rac-editor/modals/editors/generic/GenericObjectEditor.tsx';
import {HouseSideSelector, HouseSideSelectorMode} from '@/components/rac-editor/modals/selectors/HouseSideSelector.tsx';
import type {HousePreAssignedSideDisplay, HouseSide, HouseViewType} from '@/shared/types/house.ts';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';
import {LinearEditorType} from '@/components/rac-editor/modals/editors/generic/hooks/useLinearEditorActions.ts';
import {ContraventamentoEditorState, ContraventamentoSide} from '@/shared/types/contraventamento.ts';
import {CANVAS_ELEMENT_STYLE} from '@/shared/config.ts';

interface RacEditorModalEditorsProps {
  isMobile: boolean;

  // House Type Selector
  pendingViewType: HouseViewType | null;
  houseSideSlots: HousePreAssignedSideDisplay[];
  sideSelectorOpen: boolean;
  sideSelectorMode: HouseSideSelectorMode;
  onSideSelected: (side: HouseSide) => void;
  onSideSelectorClose: () => void;

  isPilotiEditorOpen: boolean;
  pilotiSelection: PilotiCanvasSelection | null;
  onPilotiEditorClose: () => void;
  onPilotiHeightChange: (newHeight: number) => void;
  onPilotiNavigate: (pilotiId: string, height: number, isMaster: boolean, nivel: number) => void;

  contraventamentoEditorState: ContraventamentoEditorState;
  onContraventamentoSideAction: (side: ContraventamentoSide) => void;

  // Wall Object
  onWallApply: (newValue: string, newColor: string) => void;
  wallSelection: wallSelection | null;
  wallEditorColor: string;
  isWallEditorOpen: boolean;
  onWallEditorClose: () => void;

  // Line/Arrow Object
  onLinearApply: (newValue: string, newColor: string) => void;
  linearSelection: linearSelection | null;
  linearEditorType: LinearEditorType;
  isLinearEditorOpen: boolean;
  onLinearEditorClose: () => void;
}

export function RacEditorModalEditors({
  isMobile,

  pendingViewType,
  houseSideSlots,
  sideSelectorOpen,
  sideSelectorMode,
  onSideSelected,
  onSideSelectorClose,

  isPilotiEditorOpen,
  pilotiSelection,
  onPilotiEditorClose,
  onPilotiHeightChange,
  onPilotiNavigate,

  contraventamentoEditorState,
  onContraventamentoSideAction,

  onWallApply,
  wallSelection,
  wallEditorColor,
  isWallEditorOpen,
  onWallEditorClose,

  onLinearApply,
  linearSelection,
  linearEditorType,
  isLinearEditorOpen,
  onLinearEditorClose,
}: RacEditorModalEditorsProps) {
  return (
    <>
      {pendingViewType && (
        <HouseSideSelector
          houseViewType={pendingViewType}
          houseSideSlots={houseSideSlots}
          mode={sideSelectorMode}
          isOpen={sideSelectorOpen}
          onSelectSide={onSideSelected}
          onClose={onSideSelectorClose}
        />
      )}

      <PilotiEditor
        pilotiId={pilotiSelection?.pilotiId ?? null}
        group={pilotiSelection?.group ?? null}
        houseView={pilotiSelection?.houseView ?? 'top'}
        anchorPosition={pilotiSelection?.screenPosition}

        currentHeight={pilotiSelection?.currentHeight ?? DEFAULT_HOUSE_PILOTI.height}
        currentIsMaster={pilotiSelection?.currentIsMaster ?? DEFAULT_HOUSE_PILOTI.isMaster}
        currentNivel={pilotiSelection?.currentNivel ?? DEFAULT_HOUSE_PILOTI.nivel}

        isMobile={isMobile}
        isOpen={isPilotiEditorOpen}

        onClose={onPilotiEditorClose}
        onHeightChange={onPilotiHeightChange}
        onNavigate={onPilotiNavigate}

        contraventamentoLeftDisabled={contraventamentoEditorState.leftDisabled}
        contraventamentoRightDisabled={contraventamentoEditorState.rightDisabled}
        contraventamentoLeftActive={contraventamentoEditorState.leftActive}
        contraventamentoRightActive={contraventamentoEditorState.rightActive}
        onContraventamentoSideAction={onContraventamentoSideAction}
      />

      <GenericObjectEditor
        editorType='wall'
        currentValue={wallSelection?.currentLabel ?? ''}
        currentColor={wallEditorColor ?? CANVAS_ELEMENT_STYLE.strokeColor.wallElement}
        isOpen={isWallEditorOpen}
        isMobile={isMobile}
        onApply={(value, color) => onWallApply(value, color)}
        onClose={onWallEditorClose}
        anchorPosition={wallSelection?.screenPosition}
      />

      <GenericObjectEditor
        editorType={linearEditorType}
        currentValue={linearSelection?.currentLabel ?? ''}
        currentColor={linearSelection?.currentColor ?? CANVAS_ELEMENT_STYLE.strokeColor.linearElement}
        isOpen={isLinearEditorOpen}
        isMobile={isMobile}
        onApply={(value, color) => onLinearApply(value, color)}
        onClose={onLinearEditorClose}
        anchorPosition={linearSelection?.screenPosition}
      />
    </>
  );
}



