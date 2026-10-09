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
  handleAddStreetStraight: () => void;
  handleAddStreetCorner: () => void;
  handleAddDirtRoad: () => void;
  handleAddSquare: () => void;
  handleAddTriangle: () => void;
  handleAddCircle: () => void;
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
  handleOpenHouseEdit?: (constructionId: string, houseId: string) => Promise<void>;
  handleAddHouse?: (constructionId: string) => Promise<void>;
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
  handleReloadDrawing?: () => void | Promise<boolean>;
  handleExit: () => void;
  handleRenameFamily: (newName: string) => void;
  handleSetCanvasToolMode: (mode: CanvasToolMode) => void;
  handleFitToView: () => void;
  handleFitContent: () => void;
  setIs3DViewerOpen: Dispatch<SetStateAction<boolean>>;
  setActiveSubmenu: Dispatch<SetStateAction<MenuSubmenu>>;
  setIsSettingsOpen: Dispatch<SetStateAction<boolean>>;
}

export function useRacEditorMenuActions({
  handleOpenHouseTypeSelector,
  handleAddHouseView,
  handleAddWall,
  handleAddStreetStraight,
  handleAddStreetCorner,
  handleAddDirtRoad,
  handleAddSquare,
  handleAddTriangle,
  handleAddCircle,
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
  handleOpenHouseEdit,
  handleAddHouse,
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
  handleReloadDrawing,
  handleExit,
  handleRenameFamily,
  handleSetCanvasToolMode,
  handleFitToView,
  handleFitContent,
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
    addStreetStraight: handleAddStreetStraight,
    addStreetCorner: handleAddStreetCorner,
    addDirtRoad: handleAddDirtRoad,
    addSquare: handleAddSquare,
    addTriangle: handleAddTriangle,
    addCircle: handleAddCircle,
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
    openHouseEdit: handleOpenHouseEdit,
    addHouse: handleAddHouse,
    activateHouse: handleActivateHouse,
    deleteSelection: handleDelete,
    savePDF: handleSavePDF,
    toggleHouseMenu: handleToggleHouseMenu,
    toggleElementsMenu: handleToggleElementsMenu,
    toggleGeometryMenu: () => setActiveSubmenu((current) => current === 'geometry' ? null : 'geometry'),
    toggleLinesMenu: handleToggleLinesMenu,
    toggleOverflowMenu: handleToggleOverflowMenu,
    toggleTips: handleToggleTips,
    toggleZoomControls: handleToggleZoomControls,
    open3DViewer: () => setIs3DViewerOpen(true),
    reloadDrawing: handleReloadDrawing,
    toggleMenu: handleToggleMenu,
    restartDrawing: handleRestartDrawing,
    exit: handleExit,
    renameFamily: handleRenameFamily,
    setCanvasToolMode: handleSetCanvasToolMode,
    fitToView: handleFitToView,
    fitContent: handleFitContent,
    openSettings: () => {
      setActiveSubmenu(null);
      setIsSettingsOpen(true);
    },
  }), [
    handleOpenHouseEdit,
    handleAddHouse,
    handleAddArrow,
    handleAddDirtRoad,
    handleAddSquare,
    handleAddTriangle,
    handleAddCircle,
    handleAddDistance,
    handleAddDoor,
    handleAddFossa,
    handleAddHouseView,
    handleAddLine,
    handleAddStairs,
    handleAddStreetCorner,
    handleAddStreetStraight,
    handleAddText,
    handleAddTree,
    handleAddWall,
    handleAddWater,
    handleDelete,
    handleExit,
    handleFitToView,
    handleFitContent,
    handleOpenImageUpload,
    handleOpenConstructionSites,
    handleActivateHouse,
    handleOpenHouseTypeSelector,
    handleRenameFamily,
    handleRestartDrawing,
    handleReloadDrawing,
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
