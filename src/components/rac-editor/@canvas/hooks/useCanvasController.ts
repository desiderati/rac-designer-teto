import {useCallback, type Dispatch, type RefObject, type SetStateAction} from 'react';
import type {CanvasHistoryHandle} from '@/components/rac-editor/@canvas/ports/CanvasHistoryHandle.ts';
import type {CanvasObjectCreationHandle} from '@/components/rac-editor/@canvas/ports/CanvasObjectCreationHandle.ts';
import type {CanvasScreenProjectionHandle} from '@/components/rac-editor/@canvas/ports/CanvasScreenProjectionHandle.ts';
import type {
  CanvasActiveSelectionHandle,
  CanvasDrawingModeHandle,
  CanvasRenderHandle,
} from '@/components/rac-editor/@canvas/ports/CanvasSurfaceHandle.ts';
import type {CanvasViewportHandle} from '@/components/rac-editor/@canvas/ports/CanvasViewportHandle.ts';
import type {TutorialBalloonPosition, TutorialBalloonState} from '@/components/rac-editor/lib/tutorial.ts';
import type {MenuSubmenu} from '@/components/rac-editor/@menus/lib/menu-types.ts';
import {useEditorPorts, useEditorStore} from '@/bootstrap/editor-bootstrap.ts';
import {useCanvasActions} from '@/components/rac-editor/@canvas/hooks/useCanvasActions.ts';
import {useRacEditorTerrainActions} from '@/components/rac-editor/hooks/useRacEditorTerrainActions.ts';
import {useCanvasHouseViewActions} from '@/components/rac-editor/@canvas/hooks/useCanvasHouseViewActions.ts';
import {useCanvasTools} from '@/components/rac-editor/@canvas/hooks/useCanvasTools.ts';
import type {useHouseTypeFlow} from '@/components/rac-editor/@modals/hooks/useHouseTypeFlow.ts';

type HouseTypeFlowState = Pick<
  ReturnType<typeof useHouseTypeFlow>,
  | 'pendingViewType'
  | 'setPendingViewType'
  | 'sideSelectorMode'
  | 'setSideSelectorMode'
  | 'setHouseSideSlots'
  | 'pendingNivelSide'
  | 'setPendingNivelSide'
  | 'niveisAppliedRef'
  | 'transitionToNivelRef'
>;

export type CanvasControllerHandle =
  CanvasActiveSelectionHandle
  & CanvasDrawingModeHandle
  & CanvasHistoryHandle
  & CanvasObjectCreationHandle
  & CanvasRenderHandle
  & CanvasScreenProjectionHandle
  & CanvasViewportHandle;

interface UseRacEditorCanvasControllerArgs extends HouseTypeFlowState {
  canvasRef: RefObject<CanvasControllerHandle | null>;
  isDrawing: boolean;
  setIsDrawing: Dispatch<SetStateAction<boolean>>;
  setInfoMessage: Dispatch<SetStateAction<string>>;
  setTutorialBalloon: Dispatch<SetStateAction<TutorialBalloonState>>;
  clearTutorialBalloon: () => void;
  setActiveSubmenu: Dispatch<SetStateAction<MenuSubmenu>>;
  dismissPilotiTutorial: () => void;
  showPilotiTutorialIfNeeded: (position: TutorialBalloonPosition | null) => void;
  setSideSelectorOpen: Dispatch<SetStateAction<boolean>>;
  setNivelDefinitionOpen: Dispatch<SetStateAction<boolean>>;
}

/**
 * Coordena a camada de aplicação que transforma comandos da UI em operações do canvas.
 */
export function useCanvasController({
  canvasRef,
  isDrawing,
  setIsDrawing,
  setInfoMessage,
  setTutorialBalloon,
  clearTutorialBalloon,
  setActiveSubmenu,
  dismissPilotiTutorial,
  showPilotiTutorialIfNeeded,
  pendingViewType,
  setPendingViewType,
  sideSelectorMode,
  setSideSelectorMode,
  setHouseSideSlots,
  pendingNivelSide,
  setPendingNivelSide,
  niveisAppliedRef,
  transitionToNivelRef,
  setSideSelectorOpen,
  setNivelDefinitionOpen,
}: UseRacEditorCanvasControllerArgs) {
  const editorStore = useEditorStore();
  const {houseReadPort, houseWritePort} = useEditorPorts();

  const {
    getVisibleCenter,
    addObjectToCanvas,
    closeAllMenus,
    disableDrawingMode,
    handleDelete,
  } = useCanvasActions({
    canvasRef,
    isDrawing,
    setIsDrawing,
    setInfoMessage,
    houseReadPort,
    houseWritePort,
    clearTutorialBalloon,
    onCloseSubmenus: () => setActiveSubmenu(null),
    onDismissPilotiTutorial: dismissPilotiTutorial,
  });

  const {
    terrainSelection,
    isTerrainEditorOpen,
    handleTerrainSelect,
    handleTerrainEditorClose,
    handleTerrainApply,
  } = useRacEditorTerrainActions({
    canvasRef,
    editorStore,
    setInfoMessage,
  });

  const handleFreeDrawPathCreated = useCallback(() => {
    setIsDrawing(false);
    setInfoMessage('<b>Dica:</b> Modo Lápis desativado após concluir o desenho à mão livre.');
  }, [setInfoMessage, setIsDrawing]);

  const {
    handleSideSelected,
    handleNiveisApplied,
    handleNivelDefinitionClose,
    handleSideSelectorClose,
    handleAddHouseView,
    handleHouseTypeSelected: handleHouseTypeSelectedFromFlow,
  } = useCanvasHouseViewActions({
    canvasRef,
    getVisibleCenter,
    closeAllMenus,
    addObjectToCanvas,
    showPilotiTutorialIfNeeded,
    houseReadPort,
    houseWritePort,
    pendingViewType,
    setPendingViewType,
    sideSelectorMode,
    setSideSelectorMode,
    setHouseSideSlots,
    pendingNivelSide,
    setPendingNivelSide,
    niveisAppliedRef,
    transitionToNivelRef,
    setSideSelectorOpen,
    setNivelDefinitionOpen,
  });

  const {
    handleAddWall,
    handleAddDoor,
    handleAddStairs,
    handleAddTree,
    handleAddWater,
    handleAddFossa,
    handleAddLine,
    handleAddArrow,
    handleAddDistance,
    handleToggleDrawMode,
    handleAddText,
  } = useCanvasTools({
    canvasRef,
    addObjectToCanvas,
    closeAllMenus,
    disableDrawingMode,
    isDrawing,
    setIsDrawing,
    setInfoMessage,
    setTutorialBalloon,
  });

  return {
    closeAllMenus,
    disableDrawingMode,
    handleDelete,
    terrainSelection,
    isTerrainEditorOpen,
    handleTerrainSelect,
    handleTerrainEditorClose,
    handleTerrainApply,
    handleFreeDrawPathCreated,
    handleSideSelected,
    handleNiveisApplied,
    handleNivelDefinitionClose,
    handleSideSelectorClose,
    handleAddHouseView,
    handleHouseTypeSelectedFromFlow,
    handleAddWall,
    handleAddDoor,
    handleAddStairs,
    handleAddTree,
    handleAddWater,
    handleAddFossa,
    handleAddLine,
    handleAddArrow,
    handleAddDistance,
    handleToggleDrawMode,
    handleAddText,
  };
}
