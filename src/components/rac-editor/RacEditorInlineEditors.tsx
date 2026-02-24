import type {LineArrowDistanceCanvasSelection, ObjectCanvasSelection, PilotiCanvasSelection,} from './Canvas';
import {PilotiEditor} from '@/components/rac-editor/modals/editors/piloti/PilotiEditor.tsx';
import {GenericInlineEditor} from '@/components/rac-editor/modals/editors/generic/GenericInlineEditor.tsx';
import {HouseSideSelector} from './modals/selectors/HouseSideSelector.tsx';
import type {ContraventamentoSide} from '@/lib/canvas-utils';
import type {HouseSide, ViewType} from '@/lib/house-manager';

interface ContraventamentoEditorState {
  leftDisabled: boolean;
  rightDisabled: boolean;
  leftActive: boolean;
  rightActive: boolean;
}

interface HouseSideSlot {
  label: string;
  side: HouseSide;
  onCanvas: boolean;
}

interface RacEditorInlineEditorsProps {
  isMobile: boolean;

  // House Type Selector
  pendingViewType: ViewType | null;
  houseSideSlots: HouseSideSlot[];
  sideSelectorOpen: boolean;
  sideSelectorMode: 'position' | 'choose-instance';
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
  onObjectApply: (newValue: string, newColor: string) => void;
  objectSelection: ObjectCanvasSelection | null;
  objectEditorColor: string;
  isObjectEditorOpen: boolean;
  onObjectEditorClose: () => void;

  // Line/Arrow Object
  onLineArrowDistanceApply: (newValue: string, newColor: string) => void;
  lineArrowDistanceSelection: LineArrowDistanceCanvasSelection | null;
  lineArrowDistanceEditorType: 'line' | 'arrow' | 'distance';
  isLineArrowDistanceEditorOpen: boolean;
  onLineArrowDistanceEditorClose: () => void;
}

export function RacEditorInlineEditors({
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

  onObjectApply,
  objectSelection,
  objectEditorColor,
  isObjectEditorOpen,
  onObjectEditorClose,

  onLineArrowDistanceApply,
  lineArrowDistanceSelection,
  lineArrowDistanceEditorType,
  isLineArrowDistanceEditorOpen,
  onLineArrowDistanceEditorClose,
}: RacEditorInlineEditorsProps) {
  return (
    <>
      {pendingViewType && (
        <HouseSideSelector
          viewType={pendingViewType}
          houseSideSlots={houseSideSlots}
          isOpen={sideSelectorOpen}
          mode={sideSelectorMode}
          onSelectSide={onSideSelected}
          onClose={onSideSelectorClose}
        />
      )}

      <PilotiEditor
        isOpen={isPilotiEditorOpen}
        onClose={onPilotiEditorClose}
        pilotiId={pilotiSelection?.pilotiId ?? null}
        currentHeight={pilotiSelection?.currentHeight ?? 1.0}
        currentIsMaster={pilotiSelection?.currentIsMaster ?? false}
        currentNivel={pilotiSelection?.currentNivel ?? 0.2}
        group={pilotiSelection?.group ?? null}
        isMobile={isMobile}
        anchorPosition={pilotiSelection?.screenPosition}
        houseView={pilotiSelection?.houseView ?? 'top'}
        onHeightChange={onPilotiHeightChange}
        onNavigate={onPilotiNavigate}
        contraventamentoLeftDisabled={contraventamentoEditorState.leftDisabled}
        contraventamentoRightDisabled={contraventamentoEditorState.rightDisabled}
        contraventamentoLeftActive={contraventamentoEditorState.leftActive}
        contraventamentoRightActive={contraventamentoEditorState.rightActive}
        onContraventamentoSideAction={onContraventamentoSideAction}
      />

      <GenericInlineEditor
        editorType="wall"
        currentValue={objectSelection?.currentLabel ?? ''}
        currentColor={objectEditorColor ?? '#000000'}
        isOpen={isObjectEditorOpen}
        isMobile={isMobile}
        onApply={(value, color) => onObjectApply(value, color)}
        onClose={onObjectEditorClose}
        anchorPosition={objectSelection?.screenPosition}
      />

      <GenericInlineEditor
        editorType={lineArrowDistanceEditorType}
        currentValue={lineArrowDistanceSelection?.currentLabel ?? ''}
        currentColor={lineArrowDistanceSelection?.currentColor ?? '#000000'}
        isOpen={isLineArrowDistanceEditorOpen}
        isMobile={isMobile}
        onApply={(value, color) => onLineArrowDistanceApply(value, color)}
        onClose={onLineArrowDistanceEditorClose}
        anchorPosition={lineArrowDistanceSelection?.screenPosition}
      />
    </>
  );
}
