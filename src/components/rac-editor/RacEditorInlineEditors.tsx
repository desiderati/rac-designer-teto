import type {Canvas as FabricCanvas} from 'fabric';
import type {DistanceSelection, LineArrowCanvasSelection, ObjectNameSelection, PilotiSelection,} from './Canvas';
import {PilotiEditor} from './modals/editors/PilotiEditor.tsx';
import {GenericEditor, GenericEditorType} from './modals/editors/GenericEditor.tsx';
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
  canvas: FabricCanvas | null;
  isPilotiEditorOpen: boolean;
  pilotiSelection: PilotiSelection | null;
  onPilotiEditorClose: () => void;
  onPilotiHeightChange: (newHeight: number) => void;
  onPilotiNavigate: (pilotiId: string, height: number, isMaster: boolean, nivel: number) => void;
  contraventamentoEditorState: ContraventamentoEditorState;
  onContraventamentoSideAction: (side: ContraventamentoSide) => void;
  isDistanceEditorOpen: boolean;
  distanceSelection: DistanceSelection | null;
  onDistanceEditorClose: () => void;
  distanceEditorColor: string;
  isObjectNameEditorOpen: boolean;
  objectNameSelection: ObjectNameSelection | null;
  onObjectNameEditorClose: () => void;
  objectNameEditorColor: string;
  isLineArrowEditorOpen: boolean;
  lineArrowSelection: LineArrowCanvasSelection | null;
  onLineArrowEditorClose: () => void;
  lineArrowEditorType: GenericEditorType;
  onGenericApply: (editorType: GenericEditorType, newValue: string, newColor: string) => void;
  pendingViewType: ViewType | null;
  sideSelectorOpen: boolean;
  sideSelectorMode: 'position' | 'choose-instance';
  instanceSlots: HouseSideSlot[];
  onSideSelectorClose: () => void;
  onSideSelected: (side: HouseSide) => void;
}

export function RacEditorInlineEditors({
  isMobile,
  canvas,
  isPilotiEditorOpen,
  pilotiSelection,
  onPilotiEditorClose,
  onPilotiHeightChange,
  onPilotiNavigate,
  contraventamentoEditorState,
  onContraventamentoSideAction,
  isDistanceEditorOpen,
  distanceSelection,
  onDistanceEditorClose,
  distanceEditorColor,
  isObjectNameEditorOpen,
  objectNameSelection,
  onObjectNameEditorClose,
  objectNameEditorColor,
  isLineArrowEditorOpen,
  lineArrowSelection,
  onLineArrowEditorClose,
  lineArrowEditorType,
  onGenericApply,
  pendingViewType,
  sideSelectorOpen,
  sideSelectorMode,
  instanceSlots,
  onSideSelectorClose,
  onSideSelected,
}: RacEditorInlineEditorsProps) {
  return (
    <>
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

      <GenericEditor
        isOpen={isDistanceEditorOpen}
        onClose={onDistanceEditorClose}
        editorType="dimension"
        object={distanceSelection?.group ?? null}
        canvas={canvas}
        currentValue={distanceSelection?.currentValue ?? ''}
        currentColor={distanceEditorColor}
        isMobile={isMobile}
        anchorPosition={distanceSelection?.screenPosition}
        onApply={(value, color) => onGenericApply('dimension', value, color)}
      />

      <GenericEditor
        isOpen={isObjectNameEditorOpen}
        onClose={onObjectNameEditorClose}
        editorType="wall"
        object={objectNameSelection?.object ?? null}
        canvas={canvas}
        currentValue={objectNameSelection?.currentValue ?? ''}
        currentColor={objectNameEditorColor}
        isMobile={isMobile}
        anchorPosition={objectNameSelection?.screenPosition}
        onApply={(value, color) => onGenericApply('wall', value, color)}
      />

      <GenericEditor
        isOpen={isLineArrowEditorOpen}
        onClose={onLineArrowEditorClose}
        editorType={lineArrowEditorType}
        object={lineArrowSelection?.object ?? null}
        canvas={canvas}
        currentValue={lineArrowSelection?.currentLabel ?? ''}
        currentColor={lineArrowSelection?.currentColor ?? '#000000'}
        isMobile={isMobile}
        anchorPosition={lineArrowSelection?.screenPosition}
        onApply={(value, color) => onGenericApply(lineArrowEditorType, value, color)}
      />

      {pendingViewType && (
        <HouseSideSelector
          isOpen={sideSelectorOpen}
          onClose={onSideSelectorClose}
          viewType={pendingViewType}
          onSelectSide={onSideSelected}
          mode={sideSelectorMode}
          houseSideSlots={instanceSlots}
        />
      )}
    </>
  );
}
