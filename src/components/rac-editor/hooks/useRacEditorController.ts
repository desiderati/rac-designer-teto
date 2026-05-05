import {MouseEvent as ReactMouseEvent, useCallback, useRef} from 'react';
import {toast} from 'sonner';
import type {CanvasHandle} from '@/components/rac-editor/@canvas/ports/CanvasHandle.ts';
import type {RacEditorLayoutProps} from '@/components/rac-editor/ui/RacEditorLayout.tsx';
import {useHouseTypeFlow} from '@/components/rac-editor/@modals/hooks/useHouseTypeFlow.ts';
import {useRacEditorModalState} from '@/components/rac-editor/hooks/useRacEditorModalState.ts';
import {useRacEditorLocalState} from '@/components/rac-editor/hooks/useRacEditorLocalState.ts';
import {useRacEditorUiRefs} from '@/components/rac-editor/hooks/useRacEditorUiRefs.ts';
import {useIsMobile} from '@/components/rac-editor/lib/use-mobile.tsx';
import {useHouseStoreVersion} from '@/components/rac-editor/lib/house-store.ts';
import type {HouseType} from '@/shared/types/house.ts';
import {useRacEditorMenuController} from '@/components/rac-editor/@menus/hooks/useRacEditorMenuController.ts';
import {useRacEditorContraventamentoController} from '@/components/rac-editor/hooks/useRacEditorContraventamentoController.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {useRacEditorShellController} from '@/components/rac-editor/hooks/useRacEditorShellController.ts';
import {buildRacEditorLayoutProps} from '@/components/rac-editor/hooks/buildRacEditorLayoutProps.ts';
import {useRacEditorCanvasFlowController} from '@/components/rac-editor/hooks/useRacEditorCanvasFlowController.ts';
import {
  useRacEditorDocumentHotkeysController
} from '@/components/rac-editor/hooks/useRacEditorDocumentHotkeysController.ts';
import {useRacEditorModalEditorController} from '@/components/rac-editor/hooks/useRacEditorModalEditorController.ts';
import {TOAST_MESSAGES} from '@/shared/config.ts';

/**
 * Compõe os controladores do RAC editor e devolve o contrato de layout da tela.
 */
export function useRacEditorController(): RacEditorLayoutProps {
  const isMobile = useIsMobile();
  const {houseReadPort, houseWritePort} = useEditorPorts();

  const {
    pendingViewType,
    setPendingViewType,
    sideSelectorMode,
    setSideSelectorMode,
    houseSideSlots,
    setHouseSideSlots,
    pendingNivelSide,
    setPendingNivelSide,
    niveisAppliedRef,
    transitionToNivelRef,
  } = useHouseTypeFlow();

  const houseVersion = useHouseStoreVersion();

  const handleHouseTypeSelected = (type: HouseType) => {
    handleHouseTypeSelectedFromFlow(type);
  };


  const {
    infoMessage,
    setInfoMessage,
    pilotiSelection,
    setPilotiSelection,
    isPilotiEditorOpen,
    setIsPilotiEditorOpen,
    isDrawing,
    setIsDrawing,
  } = useRacEditorLocalState();

  const canvasRef = useRef<CanvasHandle>(null);

  const {
    isMenuOpen,
    setIsMenuOpen,
    activeSubmenu,
    setActiveSubmenu,
    showTips,
    setShowTips,
    showZoomControls,
    setShowZoomControls,
    isSettingsOpen,
    setIsSettingsOpen,
    showRestartConfirm,
    setShowRestartConfirm,
    sideSelectorOpen,
    setSideSelectorOpen,
    houseTypeSelectorOpen,
    setHouseTypeSelectorOpen,
    is3DViewerOpen,
    setIs3DViewerOpen,
    nivelDefinitionOpen,
    setNivelDefinitionOpen,
    familySetupOpen,
    setFamilySetupOpen,
    canvasToolMode,
    setCanvasToolMode,
    displayZoom,
    setDisplayZoom,
  } = useRacEditorModalState();

  const {showTipsRef, showZoomControlsRef} = useRacEditorUiRefs(showTips, showZoomControls);

  const {
    handleFamilySetupConfirm,
    handleRenameFamily,
    handleSettingsChange,
    handleSetCanvasToolMode,
    handleFitToView,
    handleExit,
  } = useRacEditorShellController({
    canvasRef,
    showTipsRef,
    showZoomControlsRef,
    setPilotiSelection,
    setIsPilotiEditorOpen,
    setFamilySetupOpen,
    setHouseTypeSelectorOpen,
    setShowZoomControls,
    setCanvasToolMode,
  });

  const handleRestartDrawing = useCallback(() => {
    setShowRestartConfirm(true);
  }, [setShowRestartConfirm]);

  const closeRestartConfirm = useCallback(() => {
    setShowRestartConfirm(false);
  }, [setShowRestartConfirm]);

  const confirmRestartDrawing = useCallback(() => {
    canvasRef.current?.resetSurface();
    houseWritePort.resetHouse();
    setActiveSubmenu(null);
    setIsMenuOpen(false);
    setHouseTypeSelectorOpen(false);
    setShowRestartConfirm(false);
    toast.success(TOAST_MESSAGES.canvasRestartedSuccessfully);
  }, [
    canvasRef,
    houseWritePort,
    setActiveSubmenu,
    setHouseTypeSelectorOpen,
    setIsMenuOpen,
    setShowRestartConfirm,
  ]);

  const {
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
  } = useRacEditorCanvasFlowController({
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
  });

  const handleOpenHouseTypeSelector = useCallback(() => {
    closeAllMenus();
    setFamilySetupOpen(true);
  }, [closeAllMenus, setFamilySetupOpen]);

  const handleHouseTypeSelectorClose = useCallback(() => {
    setHouseTypeSelectorOpen(false);
  }, [setHouseTypeSelectorOpen]);

  const handleToggleMenu = useCallback(() => {
    const newIsOpen = !isMenuOpen;
    setIsMenuOpen(newIsOpen);
    if (!newIsOpen) {
      setActiveSubmenu(null);
    }
  }, [isMenuOpen, setActiveSubmenu, setIsMenuOpen]);

  const handleToggleHouseMenu = useCallback(() => {
    disableDrawingMode();
    if (houseReadPort.getCurrentHouseType()) {
      setActiveSubmenu((current) => current === 'house' ? null : 'house');
      return;
    }
    handleOpenHouseTypeSelector();
  }, [disableDrawingMode, handleOpenHouseTypeSelector, houseReadPort, setActiveSubmenu]);

  const toggleSubmenu = useCallback((submenu: 'elements' | 'lines' | 'overflow') => {
    disableDrawingMode();
    setActiveSubmenu((current) => current === submenu ? null : submenu);
  }, [disableDrawingMode, setActiveSubmenu]);

  const handleToggleElementsMenu = useCallback(() => toggleSubmenu('elements'), [toggleSubmenu]);
  const handleToggleLinesMenu = useCallback(() => toggleSubmenu('lines'), [toggleSubmenu]);
  const handleToggleOverflowMenu = useCallback(() => toggleSubmenu('overflow'), [toggleSubmenu]);
  const handleToggleTips = useCallback(() => setShowTips((current) => !current), [setShowTips]);
  const handleToggleZoomControls = useCallback(
    () => setShowZoomControls((current) => !current),
    [setShowZoomControls],
  );

  const handleContainerClick = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.submenu') && !target.closest('button')) {
      closeAllMenus();
    }
  }, [closeAllMenus]);

  const handleZoomInteraction = useCallback(() => {
  }, []);

  const {
    isContraventamentoMode,
    syncContraventamentoElevations,
    handleCancelContraventamento,
    handleContraventamentoPilotiClick,
    isPilotiEligibleAsDestination,
    contraventamentoEditorState,
    handleContraventamentoSelect,
    resetContraventamentoFlow,
  } = useRacEditorContraventamentoController({
    canvasRef,
    houseVersion,
    pilotiSelection,
    setPilotiSelection,
    setIsPilotiEditorOpen,
    setActiveSubmenu,
    setInfoMessage,
  });

  const {
    handleExportJSON,
    handleImportJSON,
    handleSavePDF,
  } = useRacEditorDocumentHotkeysController({
    canvasRef,
    setInfoMessage,
    resetContraventamentoFlow,
    syncContraventamentoElevations,
    onToggleDrawMode: handleToggleDrawMode,
    onToggleZoomControls: handleToggleZoomControls,
    onSetCanvasToolMode: handleSetCanvasToolMode,
    onFitToView: handleFitToView,
  });

  const {
    handlePilotiSelect,
    handlePilotiEditorClose,
    handlePilotiHeightChange,
    handlePilotiNavigate,
    wallSelection,
    isWallEditorOpen,
    handleWallSelect,
    closeWallEditor,
    handleWallApply,
    wallEditorColor,
    linearSelection,
    isLinearEditorOpen,
    handleLinearSelect,
    closeLinearEditor,
    onLinearApply,
    isAnyEditorOpen,
  } = useRacEditorModalEditorController({
    isContraventamentoMode,
    canvasRef,
    pilotiSelection,
    setPilotiSelection,
    setIsPilotiEditorOpen,
    syncContraventamentoElevations,
    setInfoMessage,
    isPilotiEditorOpen,
  });

  const {
    menuActions,
    currentHouseType,
    frontViewCount,
    backViewCount,
    side1ViewCount,
    side2ViewCount,
    currentFamilyName,
    selectedPilotiHeights,
    terrainPilotis,
  } = useRacEditorMenuController({
    houseVersion,
    actions: {
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
      handleRestartDrawing,
      handleExit,
      handleRenameFamily,
      handleSetCanvasToolMode,
      handleFitToView,
      setIs3DViewerOpen,
      setActiveSubmenu,
      setIsSettingsOpen,
    },
  });

  return buildRacEditorLayoutProps({
    handleContainerClick,
    menuActions,
    isDrawing,
    activeSubmenu,
    showTips,
    showZoomControls,
    isMenuOpen,
    currentHouseType,
    frontViewCount,
    backViewCount,
    side1ViewCount,
    side2ViewCount,
    currentFamilyName,
    displayZoom,
    canvasToolMode,
    isMobile,
    canvasRef,
    infoMessage,
    isAnyEditorOpen,
    isContraventamentoMode,
    isPilotiEligibleAsDestination,
    setDisplayZoom,
    setInfoMessage,
    handleZoomInteraction,
    handlePilotiSelect,
    handleWallSelect,
    handleLinearSelect,
    handleTerrainSelect,
    handleDelete,
    handleContraventamentoPilotiClick,
    handleCancelContraventamento,
    handleFreeDrawPathCreated,
    familySetupOpen,
    setFamilySetupOpen,
    handleFamilySetupConfirm,
    houseTypeSelectorOpen,
    handleHouseTypeSelectorClose,
    handleHouseTypeSelected,
    nivelDefinitionOpen,
    handleNivelDefinitionClose,
    handleNiveisApplied,
    isPilotiEditorOpen,
    pilotiSelection,
    selectedPilotiHeights,
    handlePilotiEditorClose,
    handlePilotiHeightChange,
    handlePilotiNavigate,
    contraventamentoEditorState,
    handleContraventamentoSelect,
    handleWallApply,
    closeWallEditor,
    wallSelection,
    wallEditorColor,
    isWallEditorOpen,
    onLinearApply,
    closeLinearEditor,
    linearSelection,
    isLinearEditorOpen,
    terrainSelection,
    terrainPilotis,
    isTerrainEditorOpen,
    handleTerrainEditorClose,
    handleTerrainApply,
    pendingViewType,
    sideSelectorOpen,
    sideSelectorMode,
    houseSideSlots,
    handleSideSelectorClose,
    handleSideSelected,
    isSettingsOpen,
    setIsSettingsOpen,
    handleSettingsChange,
    showRestartConfirm,
    confirmRestartDrawing,
    closeRestartConfirm,
    is3DViewerOpen,
    setIs3DViewerOpen,
  });
}
