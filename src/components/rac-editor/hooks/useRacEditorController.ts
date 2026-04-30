import {useRef} from 'react';
import type {CanvasHandle} from '@/components/rac-editor/@canvas/ports/CanvasInteractionPort.ts';
import type {RacEditorLayoutProps} from '@/components/rac-editor/ui/RacEditorLayout.tsx';
import {useHouseTypeFlow} from '@/components/rac-editor/@modals/hooks/useHouseTypeFlow.ts';
import {useRacEditorHotkeys} from '@/components/rac-editor/hooks/useRacEditorHotkeys.ts';
import {useRacEditorModalState} from '@/components/rac-editor/hooks/useRacEditorModalState.ts';
import {useRacEditorLocalState} from '@/components/rac-editor/hooks/useRacEditorLocalState.ts';
import {useRacEditorUiRefs} from '@/components/rac-editor/hooks/useRacEditorUiRefs.ts';
import {usePilotiEditorActions} from '@/components/rac-editor/@modals/hooks/usePilotiEditorActions.ts';
import {useIsMobile} from '@/components/rac-editor/lib/use-mobile.tsx';
import {useHouseStoreVersion} from '@/components/rac-editor/lib/house-store.ts';
import type {HouseType} from '@/shared/types/house.ts';
import {useCanvasHouseInitialization} from '@/components/rac-editor/@canvas/hooks/useCanvasHouseInitialization.ts';
import {useTutorialMenuActions} from '@/components/rac-editor/hooks/tutorial/useTutorialMenuActions.ts';
import {useRacEditorObjectEditorActions} from '@/components/rac-editor/hooks/useRacEditorObjectEditorActions.ts';
import {useRacEditorDocumentActions} from '@/components/rac-editor/hooks/useRacEditorDocumentActions.ts';
import {useRacEditorMenuController} from '@/components/rac-editor/@menus/hooks/useRacEditorMenuController.ts';
import {useRacEditorContraventamentoController} from '@/components/rac-editor/hooks/useRacEditorContraventamentoController.ts';
import {useCanvasController} from '@/components/rac-editor/@canvas/hooks/useCanvasController.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {useRacEditorTutorialController} from '@/components/rac-editor/hooks/useRacEditorTutorialController.ts';
import {useRacEditorShellController} from '@/components/rac-editor/hooks/useRacEditorShellController.ts';
import {buildRacEditorLayoutProps} from '@/components/rac-editor/hooks/buildRacEditorLayoutProps.ts';

/**
 * Compõe os controladores do RAC editor e devolve o contrato de layout da tela.
 */
export function useRacEditorController(): RacEditorLayoutProps {
  const isMobile = useIsMobile();
  const {houseReadPort} = useEditorPorts();

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
    tutorialBalloon,
    setTutorialBalloon,
    clearTutorialBalloon,
    tutorialPilotiPosition,
    setTutorialPilotiPosition,
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

  const {
    tutorialStep,
    tutorialHouseSelectorPreview,
    setTutorialHouseSelectorPreview,
    advanceTutorial,
    completeTutorial,
    restartTutorialProgress,
    handleRestartTutorial,
    confirmRestartTutorial,
    closeRestartConfirm,
    dismissPilotiTutorial,
    handleClosePilotiTutorial,
    showPilotiTutorialIfNeeded,
  } = useRacEditorTutorialController({
    isMobile,
    canvasRef,
    tutorialPilotiPosition,
    setTutorialPilotiPosition,
    clearTutorialBalloon,
    setActiveSubmenu,
    setIsMenuOpen,
    setHouseTypeSelectorOpen,
    setShowRestartConfirm,
  });

  useCanvasHouseInitialization({canvasRef});

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
  } = useCanvasController({
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
  });

  const {
    handleToggleMenu,
    handleOpenHouseTypeSelector,
    handleHouseTypeSelectorClose,
    handleToggleHouseMenu,
    handleToggleElementsMenu,
    handleToggleLinesMenu,
    handleToggleOverflowMenu,
    handleToggleTips,
    handleContainerClick,
    handleTutorialComplete,
    handleZoomTutorialInteraction,
    handleToggleZoomControls,
  } = useTutorialMenuActions({
    tutorialStep,
    advanceTutorial,
    completeTutorial,
    isMenuOpen,
    setIsMenuOpen,
    setActiveSubmenu,
    setShowTips,
    setShowZoomControls,
    setFamilySetupOpen,
    setHouseTypeSelectorOpen,
    setTutorialHouseSelectorPreview,
    closeAllMenus,
    dismissPilotiTutorial,
    disableDrawingMode,
    isHouseTypeSelected: () => !!houseReadPort.getCurrentHouseType(),
  });

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
  } = useRacEditorDocumentActions({
    canvasRef,
    setInfoMessage,
    resetContraventamentoFlow,
    syncContraventamentoElevations,
  });

  useRacEditorHotkeys({
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
  } = usePilotiEditorActions({
    isContraventamentoMode,
    hasPilotiTutorial: !!tutorialPilotiPosition,
    closePilotiTutorial: handleClosePilotiTutorial,
    canvasRef,
    pilotiSelection,
    setPilotiSelection,
    setIsPilotiEditorOpen,
    syncContraventamentoElevations,
    setInfoMessage,
  });

  const {
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
  } = useRacEditorObjectEditorActions({
    canvasRef,
    isPilotiEditorOpen,
    setInfoMessage,
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
      handleRestartTutorial,
      handleOpenTutorial: restartTutorialProgress,
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
    tutorialStep,
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
    dismissPilotiTutorial,
    clearTutorialBalloon,
    handleZoomTutorialInteraction,
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
    tutorialHouseSelectorPreview,
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
    confirmRestartTutorial,
    closeRestartConfirm,
    handleTutorialComplete,
    tutorialPilotiPosition,
    handleClosePilotiTutorial,
    tutorialBalloon,
    is3DViewerOpen,
    setIs3DViewerOpen,
  });
}
