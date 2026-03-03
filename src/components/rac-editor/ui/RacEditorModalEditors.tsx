import type {
  LinearCanvasSelection,
  TerrainCanvasSelection,
  WallCanvasSelection
} from '@/components/rac-editor/ui/canvas/Canvas.tsx';
import {PilotiEditor} from '@/components/rac-editor/ui/modals/editors/piloti/PilotiEditor.tsx';
import {GenericObjectEditor} from '@/components/rac-editor/ui/modals/editors/generic/GenericObjectEditor.tsx';
import {
  HouseSideSelector,
  HouseSideSelectorMode
} from '@/components/rac-editor/ui/modals/selectors/HouseSideSelector.tsx';
import type {HousePreAssignedSideDisplay, HousePiloti, HouseSide, HouseViewType} from '@/shared/types/house.ts';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';
import {ContraventamentoEditorState, ContraventamentoSide} from '@/shared/types/contraventamento.ts';
import {CANVAS_ELEMENT_STYLE} from '@/shared/config.ts';
import {PilotiCanvasSelection} from '@/components/rac-editor/lib/canvas';
import {TerrainEditor} from '@/components/rac-editor/ui/modals/editors/terrain/TerrainEditor.tsx';
import {LinearEditorType} from '@/components/rac-editor/hooks/modals/useLinearEditorActions.ts';

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
  onContraventamentoSelect: (side: ContraventamentoSide) => void;

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
  onPilotiEditorClose,
  onPilotiHeightChange,
  onPilotiNavigate,

  contraventamentoEditorState,
  onContraventamentoSelect,

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
        onContraventamentoSelect={onContraventamentoSelect}
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

      <TerrainEditor
        isOpen={isTerrainEditorOpen}
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



