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
import {
  useConstructionSiteManagementController,
} from '@/components/construction-site/hooks/useConstructionSiteManagementController.ts';
import {restartActiveHouseDrawing} from '@/components/rac-editor/hooks/restart-active-house-drawing.ts';
import type {House3DPdfSnapshotHandle} from '@/components/rac-editor/@viewer-3d/ports/House3DPdfSnapshotHandle.ts';
import {hasHouseViewInsertedInCanvas} from '@/components/rac-editor/lib/house-export-availability.ts';
import {
  useRacEditorConstructionSitePanelController,
} from '@/components/rac-editor/hooks/useRacEditorConstructionSitePanelController.ts';

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
  const house3DPdfSnapshotRef = useRef<House3DPdfSnapshotHandle>(null);

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
    isImageUploadOpen,
    setIsImageUploadOpen,
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
    pilotisSetupOpen,
    setPilotisSetupOpen,
    constructionSiteManagementOpen,
    setConstructionSiteManagementOpen,
    canvasToolMode,
    setCanvasToolMode,
    displayZoom,
    setDisplayZoom,
  } = useRacEditorModalState();

  const {showTipsRef, showZoomControlsRef} = useRacEditorUiRefs(showTips, showZoomControls);

  const constructionSiteManagement = useConstructionSiteManagementController({
    canvasRef,
  });

  const {
    handlePilotisSetupConfirm,
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
    setPilotisSetupOpen,
    setHouseTypeSelectorOpen,
    setShowZoomControls,
    setCanvasToolMode,
  });

  const handleRestartDrawing = useCallback(() => {
    setShowRestartConfirm(true);
  }, [setShowRestartConfirm]);

  const {
    constructionSiteManagementInitialScreen,
    handleOpenConstructionSites,
    handleCanvasDocumentChange,
    handleActivateHouse,
    closeConstructionSiteManagement,
  } = useRacEditorConstructionSitePanelController({
    constructionSiteManagement,
    setActiveSubmenu,
    setIsMenuOpen,
    setConstructionSiteManagementOpen,
  });

  const closeRestartConfirm = useCallback(() => {
    setShowRestartConfirm(false);
  }, [setShowRestartConfirm]);

  const confirmRestartDrawing = useCallback(() => {
    restartActiveHouseDrawing({
      canvasRef,
      houseWritePort,
      resetInsertionFlow: () => {
        setPendingViewType(null);
        setSideSelectorMode('position');
        setHouseSideSlots([]);
        setPendingNivelSide(null);
        niveisAppliedRef.current = false;
        transitionToNivelRef.current = false;
        setSideSelectorOpen(false);
        setNivelDefinitionOpen(false);
        setHouseTypeSelectorOpen(false);
        setPilotisSetupOpen(false);
      },
    });
    setActiveSubmenu(null);
    setIsMenuOpen(false);
    setShowRestartConfirm(false);
    toast.success(TOAST_MESSAGES.canvasRestartedSuccessfully);
  }, [
    canvasRef,
    houseWritePort,
    niveisAppliedRef,
    setActiveSubmenu,
    setPilotisSetupOpen,
    setHouseSideSlots,
    setHouseTypeSelectorOpen,
    setIsMenuOpen,
    setNivelDefinitionOpen,
    setPendingNivelSide,
    setPendingViewType,
    setShowRestartConfirm,
    setSideSelectorMode,
    setSideSelectorOpen,
    transitionToNivelRef,
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
    onHouseDrawingChange: handleCanvasDocumentChange,
  });

  const handleOpenHouseTypeSelector = useCallback(() => {
    closeAllMenus();
    setPilotisSetupOpen(true);
  }, [closeAllMenus, setPilotisSetupOpen]);

  const handleOpenImageUpload = useCallback(() => {
    disableDrawingMode();
    closeAllMenus();
    setIsImageUploadOpen(true);
  }, [closeAllMenus, disableDrawingMode, setIsImageUploadOpen]);

  const handleInsertUploadedImage = useCallback(async (dataUrl: string) => {
    const inserted = await canvasRef.current?.createSnapshotPort()?.insertImageSnapshot(dataUrl) ?? false;

    if (inserted) {
      canvasRef.current?.saveHistory();
      toast.success(TOAST_MESSAGES.imageInsertedSuccessfully);
      return true;
    }

    toast.error(TOAST_MESSAGES.failedToInsertImageOnCanvas);
    return false;
  }, [canvasRef]);

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
    handleHorizontalContraventamentoSelect,
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
    handleSavePDF,
  } = useRacEditorDocumentHotkeysController({
    canvasRef,
    house3DPdfSnapshotRef,
    canExportPdf: () => hasHouseViewInsertedInCanvas(houseReadPort),
    onBeforeExportPdf: () => constructionSiteManagement.flushActiveHouseDocumentSave({force: true}),
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
    canExportPDF,
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
    },
  });

  return buildRacEditorLayoutProps({
    handleContainerClick,
    menuActions,
    constructionGroups: constructionSiteManagement.constructionGroups,
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
    documentSaveStatus: constructionSiteManagement.documentSaveStatus,
    documentTransitioning: constructionSiteManagement.isDocumentTransitioning,
    canExportPDF,
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
    onCanvasDocumentChange: handleCanvasDocumentChange,
    pilotisSetupOpen,
    setPilotisSetupOpen,
    handlePilotisSetupConfirm,
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
    handleHorizontalContraventamentoSelect,
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
    isImageUploadOpen,
    setIsImageUploadOpen,
    handleInsertUploadedImage,
    showRestartConfirm,
    confirmRestartDrawing,
    closeRestartConfirm,
    is3DViewerOpen,
    setIs3DViewerOpen,
    house3DPdfSnapshotRef,
    constructionSiteManagementOpen,
    closeConstructionSiteManagement,
    constructionSiteManagementPanel: {
      ...constructionSiteManagement,
      initialScreen: constructionSiteManagementInitialScreen,
    },
  });
}
