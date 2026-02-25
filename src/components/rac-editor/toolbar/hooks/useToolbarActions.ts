import {Dispatch, SetStateAction, useMemo} from 'react';
import {ToolbarActionMap, ToolbarSubmenu} from "@/components/rac-editor/toolbar/helpers/toolbar-types.ts";

interface UseToolbarActionsArgs {
  handleOpenHouseTypeSelector: () => void;
  handleAddHouseView: (viewType: 'front' | 'back' | 'side1' | 'side2') => void;
  handleUngroup: () => void;
  handleGroup: () => void;
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
  handleExportJSON: () => void;
  handleImportJSON: (file: File) => void;
  handleDelete: () => void;
  handleSavePDF: () => void;
  handleToggleHouseMenu: () => void;
  handleToggleElementsMenu: () => void;
  handleToggleLinesMenu: () => void;
  handleToggleOverflowMenu: () => void;
  handleToggleTips: () => void;
  handleToggleZoomControls: () => void;
  handleToggleMenu: () => void;
  handleRestartTutorial: () => void;
  setIs3DViewerOpen: Dispatch<SetStateAction<boolean>>;
  setActiveSubmenu: Dispatch<SetStateAction<ToolbarSubmenu>>;
  setIsSettingsOpen: Dispatch<SetStateAction<boolean>>;
}

export function useToolbarActions({
  handleOpenHouseTypeSelector,
  handleAddHouseView,
  handleUngroup,
  handleGroup,
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
  handleExportJSON,
  handleImportJSON,
  handleDelete,
  handleSavePDF,
  handleToggleHouseMenu,
  handleToggleElementsMenu,
  handleToggleLinesMenu,
  handleToggleOverflowMenu,
  handleToggleTips,
  handleToggleZoomControls,
  handleToggleMenu,
  handleRestartTutorial,
  setIs3DViewerOpen,
  setActiveSubmenu,
  setIsSettingsOpen,
}: UseToolbarActionsArgs): ToolbarActionMap {

  return useMemo(() => ({
    openHouseTypeSelector: handleOpenHouseTypeSelector,
    addHouseFront: () => handleAddHouseView('front'),
    addHouseBack: () => handleAddHouseView('back'),
    addHouseSide1: () => handleAddHouseView('side1'),
    addHouseSide2: () => handleAddHouseView('side2'),
    ungroup: handleUngroup,
    group: handleGroup,
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
    exportJSON: handleExportJSON,
    importJSON: handleImportJSON,
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
    restartTutorial: handleRestartTutorial,
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
    handleExportJSON,
    handleGroup,
    handleImportJSON,
    handleOpenHouseTypeSelector,
    handleRestartTutorial,
    handleSavePDF,
    handleToggleDrawMode,
    handleToggleElementsMenu,
    handleToggleHouseMenu,
    handleToggleLinesMenu,
    handleToggleMenu,
    handleToggleOverflowMenu,
    handleToggleTips,
    handleToggleZoomControls,
    handleUngroup,
    setActiveSubmenu,
    setIs3DViewerOpen,
    setIsSettingsOpen,
  ]);
}
