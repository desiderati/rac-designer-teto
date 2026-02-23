import {Dispatch, SetStateAction, useMemo} from 'react';
import {ToolbarActionMap} from '@/components/rac-editor/Toolbar';
import {RacSubmenu} from '@/components/rac-editor/hooks/useRacModalState';

interface UseRacToolbarActionsArgs {
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
  handleAddDimension: () => void;
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
  setActiveSubmenu: Dispatch<SetStateAction<RacSubmenu>>;
  setIsSettingsOpen: Dispatch<SetStateAction<boolean>>;
}

export function useRacToolbarActions({
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
  handleAddDimension,
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
}: UseRacToolbarActionsArgs): ToolbarActionMap {
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
    addDimension: handleAddDimension,
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
    handleAddDimension,
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
