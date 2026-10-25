import {useEffect} from 'react';
import {useCanvasMobileViewport} from '@/components/rac-editor/lib/use-canvas-mobile-viewport.ts';
import type {
  LinearCanvasSelection,
  PilotiCanvasSelection,
  TerrainCanvasSelection,
  WallCanvasSelection
} from '@/components/rac-editor/@canvas/ports/CanvasSelectionPort.ts';
import {PilotiEditor} from '@/components/rac-editor/@modals/ui/editors/piloti/PilotiEditor.tsx';
import {GenericObjectEditor} from '@/components/rac-editor/@modals/ui/editors/generic/GenericObjectEditor.tsx';
import {
  HouseSideSelector,
  HouseSideSelectorMode
} from '@/components/rac-editor/@modals/ui/selectors/HouseSideSelector.tsx';
import type {HousePreAssignedSideDisplay, HousePiloti, HouseSide, HouseViewType} from '@/shared/types/house.ts';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';
import type {
  ContraventamentoEditorState,
  ContraventamentoHorizontalSide,
  ContraventamentoVerticalSide,
} from '@/shared/types/contraventamento.ts';
import {CANVAS_ELEMENT_STYLE} from '@/shared/config.ts';
import {TerrainEditor} from '@/components/rac-editor/@modals/ui/editors/terrain/TerrainEditor.tsx';
import {LinearEditorType} from '@/components/rac-editor/@modals/hooks/useLinearEditorActions.ts';
import {useHouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-store.ts';
import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib/canvas.ts';
import {createCanvasPilotiPreviewDraft, getEligibleCanvasDestinationPilotiIds} from '@/components/rac-editor/@modals/lib/canvas-piloti-preview.ts';
import {parsePilotiGridPosition} from '@/shared/types/piloti.ts';

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
  selectedPilotiHeights: readonly number[];
  onPilotiEditorClose: () => void;
  onPilotiHeightChange: (newHeight: number) => void;
  onPilotiNavigate: (pilotiId: string, height: number, isMaster: boolean, nivel: number) => void;

  contraventamentoEditorState: ContraventamentoEditorState;
  onContraventamentoSelect: (side: ContraventamentoVerticalSide, pilotiId?: string) => void;
  onHorizontalContraventamentoSelect: (side: ContraventamentoHorizontalSide, pilotiId?: string) => void;
  isContraventamentoMode: boolean;
  isPilotiEligibleAsDestination: (pilotiId: string) => boolean;
  onContraventamentoPilotiClick: (col: number, row: number) => void;
  onCancelContraventamento: () => void;

  // Wall Object
  onWallApply: (newValue: string, newColor: string) => void;
  wallSelection: WallCanvasSelection | null;
  wallEditorColor: string;
  isWallEditorOpen: boolean;
  onWallEditorClose: () => void;

  // Line/Arrow Object
  onLinearApply: (newValue: string, newColor: string) => void;
  linearSelection: LinearCanvasSelection | null;
  linearEditorType: LinearEditorType;
  isLinearEditorOpen: boolean;
  onLinearEditorClose: () => void;

  // Terrain
  terrainSelection: TerrainCanvasSelection | null;
  terrainPilotis?: Record<string, HousePiloti>;
  isTerrainEditorOpen: boolean;
  onTerrainEditorClose: () => void;
  onTerrainApply: (terrainType: number) => void;
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
  selectedPilotiHeights,
  onPilotiEditorClose,
  onPilotiHeightChange,
  onPilotiNavigate,

  contraventamentoEditorState,
  onContraventamentoSelect,
  onHorizontalContraventamentoSelect,
  isContraventamentoMode,
  isPilotiEligibleAsDestination,
  onContraventamentoPilotiClick,
  onCancelContraventamento,

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

  terrainSelection,
  terrainPilotis,
  isTerrainEditorOpen,
  onTerrainEditorClose,
  onTerrainApply,
}: RacEditorModalEditorsProps) {
  const {mobile, portrait, compact} = useCanvasMobileViewport();
  const blockEditors = mobile && portrait;
  useEffect(() => {
    if (!blockEditors) return;

    if (isContraventamentoMode) onCancelContraventamento();
    if (isPilotiEditorOpen) onPilotiEditorClose();
    if (isWallEditorOpen) onWallEditorClose();
    if (isLinearEditorOpen) onLinearEditorClose();
    if (isTerrainEditorOpen) onTerrainEditorClose();
  }, [mobile, blockEditors, isContraventamentoMode, isPilotiEditorOpen, isWallEditorOpen, isLinearEditorOpen,
    isTerrainEditorOpen, onCancelContraventamento, onPilotiEditorClose,
    onWallEditorClose, onLinearEditorClose, onTerrainEditorClose]);

  const houseSnapshot = useHouseRuntimeSnapshot<CanvasGroup>();
  const mobilePanel = isPilotiEditorOpen && compact;
  const previewDraft = mobilePanel ? createCanvasPilotiPreviewDraft(houseSnapshot, selectedPilotiHeights) : null;
  const destinationPilotiIds = mobilePanel && isContraventamentoMode
    ? getEligibleCanvasDestinationPilotiIds(isPilotiEligibleAsDestination) : undefined;

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
        presentation={mobilePanel ? 'mobile-panel' : 'floating'}
        previewDraft={previewDraft}
        destinationPilotiIds={destinationPilotiIds}
        onDestinationPilotiSelect={(id) => {
          if (!destinationPilotiIds?.includes(id)) return;
          const point = parsePilotiGridPosition(id);
          if (point) onContraventamentoPilotiClick(point.col, point.row);
        }}
        onCancelDestination={onCancelContraventamento}
        pilotiId={pilotiSelection?.pilotiId ?? null}
        pilotiIds={pilotiSelection?.pilotiIds ?? []}
        selectedPilotiHeights={selectedPilotiHeights}
        houseView={pilotiSelection?.houseView ?? 'top'}
        anchorPosition={pilotiSelection?.screenPosition}

        currentHeight={pilotiSelection?.currentHeight ?? DEFAULT_HOUSE_PILOTI.height}
        currentIsMaster={pilotiSelection?.currentIsMaster ?? DEFAULT_HOUSE_PILOTI.isMaster}
        currentNivel={pilotiSelection?.currentNivel ?? DEFAULT_HOUSE_PILOTI.nivel}

        isMobile={isMobile}
        isOpen={isPilotiEditorOpen && !blockEditors}

        onClose={onPilotiEditorClose}
        onHeightChange={onPilotiHeightChange}
        onNavigate={onPilotiNavigate}

        contraventamentoLeftDisabled={contraventamentoEditorState.leftDisabled}
        contraventamentoRightDisabled={contraventamentoEditorState.rightDisabled}
        contraventamentoLeftActive={contraventamentoEditorState.leftActive}
        contraventamentoRightActive={contraventamentoEditorState.rightActive}
        contraventamentoTopDisabled={contraventamentoEditorState.topDisabled}
        contraventamentoBottomDisabled={contraventamentoEditorState.bottomDisabled}
        contraventamentoTopActive={contraventamentoEditorState.topActive}
        contraventamentoBottomActive={contraventamentoEditorState.bottomActive}
        onContraventamentoSelect={onContraventamentoSelect}
        onHorizontalContraventamentoSelect={onHorizontalContraventamentoSelect}
      />

      <GenericObjectEditor
        presentation={compact ? 'mobile-panel' : 'floating'}
        editorType={wallSelection?.editorType ?? 'wall'}
        currentValue={wallSelection?.currentLabel ?? ''}
        currentColor={wallEditorColor ?? CANVAS_ELEMENT_STYLE.strokeColor.wallElement}
        isOpen={isWallEditorOpen && !blockEditors}
        isMobile={isMobile}
        onApply={(value, color) => onWallApply(value, color)}
        onClose={onWallEditorClose}
        anchorPosition={wallSelection?.screenPosition}
      />

      <GenericObjectEditor
        presentation={compact ? 'mobile-panel' : 'floating'}
        editorType={linearEditorType}
        currentValue={linearSelection?.currentLabel ?? ''}
        currentColor={linearSelection?.currentColor ?? CANVAS_ELEMENT_STYLE.strokeColor.linearElement}
        isOpen={isLinearEditorOpen && !blockEditors}
        isMobile={isMobile}
        onApply={(value, color) => onLinearApply(value, color)}
        onClose={onLinearEditorClose}
        anchorPosition={linearSelection?.screenPosition}
      />

      <TerrainEditor
        presentation={compact ? 'mobile-panel' : 'floating'}
        isOpen={isTerrainEditorOpen && !blockEditors}
        isMobile={isMobile}
        currentTerrainType={terrainSelection?.terrainType ?? 1}
        pilotis={terrainPilotis}
        anchorPosition={terrainSelection?.screenPosition}
        onApply={onTerrainApply}
        onClose={onTerrainEditorClose}
      />
    </>
  );
}
