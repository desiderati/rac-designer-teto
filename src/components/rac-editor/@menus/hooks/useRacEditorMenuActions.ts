import {Dispatch, SetStateAction, useMemo} from 'react';
import {
  CanvasToolMode,
  MenuActionMap,
  MenuSubmenu,
} from '@/components/rac-editor/@menus/lib/menu-types.ts';

export interface UseMenuActionsArgs {
  handleOpenHouseTypeSelector: () => void;
  handleAddHouseView: (viewType: 'front' | 'back' | 'side1' | 'side2') => void;
  handleAddWall: () => void;
  handleAddDoor: () => void;
  handleAddStairs: () => void;
  handleAddTree: () => void;
  handleAddWater: () => void;
  handleAddFossa: () => void;
  handleAddLine: () => void;
  handleAddArrow: () => void;
  handleAddDistance: () => void;
  handleToggleDrawMode: () => void;
  handleAddText: () => void;
  handleOpenImageUpload: () => void;
  handleOpenConstructionSites: () => void;
  handleActivateHouse: (constructionId: string, houseId: string) => Promise<void>;
  handleDelete: () => void;
  handleSavePDF: () => void;
  handleToggleHouseMenu: () => void;
  handleToggleElementsMenu: () => void;
  handleToggleLinesMenu: () => void;
  handleToggleOverflowMenu: () => void;
  handleToggleTips: () => void;
  handleToggleZoomControls: () => void;
  handleToggleMenu: () => void;
  handleRestartDrawing: () => void;
  handleExit: () => void;
  handleRenameFamily: (newName: string) => void;
  handleSetCanvasToolMode: (mode: CanvasToolMode) => void;
  handleFitToView: () => void;
  setIs3DViewerOpen: Dispatch<SetStateAction<boolean>>;
  setActiveSubmenu: Dispatch<SetStateAction<MenuSubmenu>>;
  setIsSettingsOpen: Dispatch<SetStateAction<boolean>>;
}

export function useRacEditorMenuActions({
  handleOpenHouseTypeSelector,
  handleAddHouseView,
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
  handleOpenImageUpload,
  handleOpenConstructionSites,
  handleActivateHouse,
  handleDelete,
  handleSavePDF,
  handleToggleHouseMenu,
  handleToggleElementsMenu,
  handleToggleLinesMenu,
  handleToggleOverflowMenu,
  handleToggleTips,
  handleToggleZoomControls,
  handleToggleMenu,
  handleRestartDrawing,
  handleExit,
  handleRenameFamily,
  handleSetCanvasToolMode,
  handleFitToView,
  setIs3DViewerOpen,
  setActiveSubmenu,
  setIsSettingsOpen,
}: UseMenuActionsArgs): MenuActionMap {

  return useMemo(() => ({
    openHouseTypeSelector: handleOpenHouseTypeSelector,
    addHouseFront: () => handleAddHouseView('front'),
    addHouseBack: () => handleAddHouseView('back'),
    addHouseSide1: () => handleAddHouseView('side1'),
    addHouseSide2: () => handleAddHouseView('side2'),
    addWall: handleAddWall,
    addDoor: handleAddDoor,
    addStairs: handleAddStairs,
    addTree: handleAddTree,
    addWater: handleAddWater,
    addFossa: handleAddFossa,
    addLine: handleAddLine,
    addArrow: handleAddArrow,
    addDistance: handleAddDistance,
    toggleDrawMode: handleToggleDrawMode,
    addText: handleAddText,
    openImageUpload: handleOpenImageUpload,
    openConstructionSites: handleOpenConstructionSites,
    activateHouse: handleActivateHouse,
    deleteSelection: handleDelete,
    savePDF: handleSavePDF,
    toggleHouseMenu: handleToggleHouseMenu,
    toggleElementsMenu: handleToggleElementsMenu,
    toggleLinesMenu: handleToggleLinesMenu,
    toggleOverflowMenu: handleToggleOverflowMenu,
    toggleTips: handleToggleTips,
    toggleZoomControls: handleToggleZoomControls,
    open3DViewer: () => setIs3DViewerOpen(true),
    toggleMenu: handleToggleMenu,
    restartDrawing: handleRestartDrawing,
    exit: handleExit,
    renameFamily: handleRenameFamily,
    setCanvasToolMode: handleSetCanvasToolMode,
    fitToView: handleFitToView,
    openSettings: () => {
      setActiveSubmenu(null);
      setIsSettingsOpen(true);
    },
  }), [
    handleAddArrow,
    handleAddDistance,
    handleAddDoor,
    handleAddFossa,
    handleAddHouseView,
    handleAddLine,
    handleAddStairs,
    handleAddText,
    handleAddTree,
    handleAddWall,
    handleAddWater,
    handleDelete,
    handleExit,
    handleFitToView,
    handleOpenImageUpload,
    handleOpenConstructionSites,
    handleActivateHouse,
    handleOpenHouseTypeSelector,
    handleRenameFamily,
    handleRestartDrawing,
    handleSavePDF,
    handleSetCanvasToolMode,
    handleToggleDrawMode,
    handleToggleElementsMenu,
    handleToggleHouseMenu,
    handleToggleLinesMenu,
    handleToggleMenu,
    handleToggleOverflowMenu,
    handleToggleTips,
    handleToggleZoomControls,
    setActiveSubmenu,
    setIs3DViewerOpen,
    setIsSettingsOpen,
  ]);
}
