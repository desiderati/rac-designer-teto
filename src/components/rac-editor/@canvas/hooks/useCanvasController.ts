import {useCallback, type Dispatch, type RefObject, type SetStateAction} from 'react';
import type {CanvasControllerHandle} from '@/components/rac-editor/@canvas/ports/CanvasControllerHandle.ts';
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

interface UseRacEditorCanvasControllerArgs extends HouseTypeFlowState {
  canvasRef: RefObject<CanvasControllerHandle | null>;
  isDrawing: boolean;
  setIsDrawing: Dispatch<SetStateAction<boolean>>;
  setInfoMessage: Dispatch<SetStateAction<string>>;
  setActiveSubmenu: Dispatch<SetStateAction<MenuSubmenu>>;
  setSideSelectorOpen: Dispatch<SetStateAction<boolean>>;
  setNivelDefinitionOpen: Dispatch<SetStateAction<boolean>>;
  onHouseDrawingChange: () => void;
}

/**
 * Coordena a camada de aplicação que transforma comandos da UI em operações do canvas.
 */
export function useCanvasController({
  canvasRef,
  isDrawing,
  setIsDrawing,
  setInfoMessage,
  setActiveSubmenu,
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
  onHouseDrawingChange,
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
    onCloseSubmenus: () => setActiveSubmenu(null),
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
    onHouseDrawingChange,
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
