import {useCallback, useEffect, useRef, useState} from 'react';
import {Toolbar} from '@/components/rac-editor/toolbar/Toolbar.tsx';
import {CanvasHandle, PilotiCanvasSelection} from '@/components/rac-editor/canvas/Canvas.tsx';
import {RacEditorModalEditors} from './RacEditorModalEditors.tsx';
import {RacEditorModals} from './RacEditorModals.tsx';
import {RacEditorCanvas} from './RacEditorCanvas.tsx';
import {useContraventamentoFlow} from './hooks/useContraventamentoFlow.ts';
import {useHouseTypeFlow} from './hooks/useHouseTypeFlow.ts';
import {useHotkeys} from './hooks/useHotkeys.ts';
import {
  useGenericObjectEditorBindings
} from '@/components/rac-editor/modals/editors/generic/hooks/useGenericObjectEditorBindings.ts';
import {useRacEditorModalState} from './hooks/useRacEditorModalState.ts';
import {useRacEditorDebugBridge} from './hooks/useRacEditorDebugBridge.ts';
import {useContraventamento} from './hooks/useContraventamento.ts';
import {useCanvasTools} from '@/components/rac-editor/canvas/hooks/useCanvasTools.ts';
import {usePilotiActions} from './hooks/usePilotiActions.ts';
import {useWallEditorActions} from '@/components/rac-editor/modals/editors/generic/hooks/useWallEditorActions.ts';
import {useRacEditorPdfExportAction} from './hooks/useRacEditorPdfExportAction.ts';
import {useToolbarViewCounts} from '@/components/rac-editor/toolbar/hooks/useToolbarViewCounts.ts';
import {useCanvasInteractionActions} from '@/components/rac-editor/canvas/hooks/useCanvasInteractionActions.ts';
import {useToolbarActions} from '@/components/rac-editor/toolbar/hooks/useToolbarActions.ts';
import {useIsMobile} from '@/components/lib/use-mobile.tsx';
import {getSettings} from '@/infra/settings.ts';
import {useHouseStoreVersion} from '@/components/lib/house-store.ts';
import {houseManager} from '@/components/lib/house-manager.ts';
import type {HouseType} from '@/shared/types/house.ts';
import {
  useLinearEditorActions
} from "@/components/rac-editor/modals/editors/generic/hooks/useLinearEditorActions.ts";
import {useTutorialFlow} from "@/components/rac-editor/tutorial/hooks/useTutorialFlow.ts";
import {useCanvasHouseInitialization} from "@/components/rac-editor/canvas/hooks/useCanvasHouseInitialization.ts";
import {useTutorialUiActions} from "@/components/rac-editor/tutorial/hooks/useTutorialUiActions.ts";
import {useCanvasHouseViewActions} from "@/components/rac-editor/canvas/hooks/useCanvasHouseViewActions.ts";
import {useCanvasGroupingActions} from "@/components/rac-editor/canvas/hooks/useCanvasGroupingActions.ts";
import {useTutorialMenuActions} from "@/components/rac-editor/tutorial/hooks/useTutorialMenuActions.ts";
import {useRacEditorJsonActions} from "@/components/rac-editor/hooks/useRacEditorJsonActions.ts";
import {RacEditorHouseTypeSelector} from "@/components/rac-editor/RacEditorHouseTypeSelector.tsx";
import {RacEditorTutorial} from "@/components/rac-editor/RacEditorTutorial.tsx";
import {House3DViewer} from "@/components/rac-editor/House3DViewer.tsx";

export function RacEditor() {
  const [infoMessage, setInfoMessage] =
    useState('Dica: Selecione uma ferramenta. (Ctrl+C Copiar, Ctrl+V Colar, Ctrl+Z Desfazer)');

  const isMobile = useIsMobile();

  const {
    pendingViewType,
    setPendingViewType,
    sideSelectorMode,
    setSideSelectorMode,
    instanceSlots,
    setInstanceSlots,
    pendingNivelSide,
    setPendingNivelSide,
    niveisAppliedRef,
    transitionToNivelRef,
  } = useHouseTypeFlow();

  const houseVersion = useHouseStoreVersion();

  const handleHouseTypeSelected = (type: HouseType) => {
    handleHouseTypeSelectedFromFlow(type);
  };

  const [pilotiSelection, setPilotiSelection] = useState<PilotiCanvasSelection | null>(null);
  const [isPilotiEditorOpen, setIsPilotiEditorOpen] = useState(false);

  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef<CanvasHandle>(null);

  // ── RAC Editor ─────────────────────────────────────────────────

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
    showUngroupConfirm,
    setShowUngroupConfirm,
    sideSelectorOpen,
    setSideSelectorOpen,
    houseTypeSelectorOpen,
    setHouseTypeSelectorOpen,
    is3DViewerOpen,
    setIs3DViewerOpen,
    nivelDefinitionOpen,
    setNivelDefinitionOpen,
  } = useRacEditorModalState();

  const showTipsRef = useRef(showTips);
  const showZoomControlsRef = useRef(showZoomControls);

  useEffect(() => {
    showTipsRef.current = showTips;
  }, [showTips]);

  useEffect(() => {
    showZoomControlsRef.current = showZoomControls;
  }, [showZoomControls]);

  useRacEditorDebugBridge({
    canvasRef,
    showTipsRef,
    showZoomControlsRef,
    setPilotiSelection,
    setIsPilotiEditorOpen,
  });

  // ── Tutorial ─────────────────────────────────────────────────

  const [tutorialBalloon, setTutorialBalloon] = useState<{
    position: { x: number; y: number; };
    text: string;
  } | null>(null);

  const clearTutorialBalloon = useCallback(() => {
    setTutorialBalloon(null);
  }, []);

  const [tutorialPilotiPosition, setTutorialPilotiPosition] =
    useState<{ x: number; y: number; } | null>(null);

  const {
    tutorialStep,
    tutorialHouseSelectorPreview,
    setTutorialHouseSelectorPreview,
    advanceTutorial,
    completeTutorial,
    restartTutorialProgress
  } = useTutorialFlow();

  const {
    handleRestartTutorial,
    confirmRestartTutorial,
    closeRestartConfirm,
    dismissPilotiTutorial,
    handleClosePilotiTutorial,
    showPilotiTutorialIfNeeded,
  } = useTutorialUiActions({
    isMobile,
    canvasRef,
    tutorialPilotiPosition,
    setTutorialPilotiPosition,
    setShowRestartConfirm,
    restartTutorialProgress,
    resetUiAfterRestart: () => {
      setActiveSubmenu(null);
      setIsMenuOpen(false);
      setHouseTypeSelectorOpen(false);
      setTutorialHouseSelectorPreview(false);
      setShowRestartConfirm(false);
    },
    clearTutorialBalloon,
  });

  // ── Canvas ─────────────────────────────────────────────────

  useCanvasHouseInitialization({canvasRef});

  const {
    getCanvas,
    getVisibleCenter,
    addObjectToCanvas,
    closeAllMenus,
    disableDrawingMode,
  } = useCanvasInteractionActions({
    canvasRef,
    isDrawing,
    setIsDrawing,
    setInfoMessage,
    clearTutorialBalloon,
    onCloseSubmenus: () => setActiveSubmenu(null),
    onDismissPilotiTutorial: dismissPilotiTutorial,
  });

  const {
    handleSideSelected,
    handleNiveisApplied,
    handleNivelDefinitionClose,
    handleSideSelectorClose,
    handleAddHouseView,
    handleHouseTypeSelected: handleHouseTypeSelectedFromFlow,
  } = useCanvasHouseViewActions({
    getCanvas,
    getVisibleCenter,
    closeAllMenus,
    addObjectToCanvas,
    showPilotiTutorialIfNeeded,
    pendingViewType,
    setPendingViewType,
    sideSelectorMode,
    setSideSelectorMode,
    setInstanceSlots,
    pendingNivelSide,
    setPendingNivelSide,
    niveisAppliedRef,
    transitionToNivelRef,
    setSideSelectorOpen,
    setNivelDefinitionOpen,
  });

  const {
    handleGroup,
    handleUngroup,
    confirmUngroup,
    closeUngroupConfirm,
  } = useCanvasGroupingActions({
    canvasRef,
    getCanvas,
    setInfoMessage,
    setShowUngroupConfirm,
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
    getCanvas,
    getVisibleCenter,
    addObjectToCanvas,
    closeAllMenus,
    disableDrawingMode,
    isDrawing,
    setIsDrawing,
    setInfoMessage,
    setTutorialBalloon,
  });

  // ── Other Tutorial ─────────────────────────────────────────────────

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
    setHouseTypeSelectorOpen,
    setTutorialHouseSelectorPreview,
    closeAllMenus,
    dismissPilotiTutorial,
    disableDrawingMode,
    isHouseTypeSelected: () => !!houseManager.getHouseType(),
  });

  // ── Contraventamento ─────────────────────────────────────────────────

  const {
    isContraventamentoMode,
    setIsContraventamentoMode,
    selectedContraventamento,
    setSelectedContraventamento,
    contraventamentoStep,
    setContraventamentoStep,
    contraventamentoFirst,
    setContraventamentoFirst,
    contraventamentoSide,
    setContraventamentoSide,
    resetContraventamentoFlow,
  } = useContraventamentoFlow();

  const {
    getTopViewGroup,
    clearContraventamentoSelection,
    syncContraventamentoElevations,
    handleCancelContraventamento,
    handleContraventamentoPilotiClick,
    handleContraventamentoSelect,
    isPilotiEligible,
    getContraventamentoEditorState,
    handleContraventamentoFromPilotiSide,
  } = useContraventamento({
    canvasRef,
    getCanvas,
    houseVersion,
    isContraventamentoMode,
    setIsContraventamentoMode,
    setInfoMessage,
    selectedContraventamento,
    setSelectedContraventamento,
    contraventamentoStep,
    setContraventamentoStep,
    contraventamentoFirst,
    setContraventamentoFirst,
    contraventamentoSide,
    setContraventamentoSide,
    resetContraventamentoFlow,
    pilotiSelection,
    setPilotiSelection,
    setIsPilotiEditorOpen,
    setActiveSubmenu,
  });

  // ── RAC Editor Import/Export ─────────────────────────────────────────────────

  const {
    handleExportJSON,
    handleImportJSON,
    handleDelete,
  } = useRacEditorJsonActions({
    canvasRef,
    getCanvas,
    setInfoMessage,
    resetContraventamentoFlow,
    syncContraventamentoElevations,
    selectedContraventamento,
    setSelectedContraventamento,
    clearContraventamentoSelection,
    getTopViewGroup,
  });

  const {handleSavePDF} = useRacEditorPdfExportAction({
    getCanvas,
  });

  // ── Hotkeys ─────────────────────────────────────────────────

  useHotkeys({
    onToggleDrawMode: handleToggleDrawMode,
    onToggleZoomControls: handleToggleZoomControls,
  });

  // ── Piloti ─────────────────────────────────────────────────

  const {
    handlePilotiSelect,
    handlePilotiEditorClose,
    handlePilotiHeightChange,
    handlePilotiNavigate,
  } = usePilotiActions({
    isContraventamentoMode,
    onContraventamentoSelect: handleContraventamentoSelect,
    hasPilotiTutorial: !!tutorialPilotiPosition,
    closePilotiTutorial: handleClosePilotiTutorial,
    canvasRef,
    pilotiSelection,
    setPilotiSelection,
    setIsPilotiEditorOpen,
    syncContraventamentoElevations,
    setInfoMessage,
  });

  // ── Modal Editors ─────────────────────────────────────────────────

  const {
    wallSelection,
    isWallEditorOpen,
    handleWallSelect,
    closeWallEditor,

    linearSelection,
    isLinearEditorOpen,
    handleLinearSelect,
    closeLinearEditor,

    isAnyEditorOpen,
  } = useGenericObjectEditorBindings({isPilotiEditorOpen});

  const {
    handleWallApply,
    resolveWallEditorColor,
  } = useWallEditorActions({
    canvasRef,
    wallSelection,
    setInfoMessage,
  });

  const {handleLinearApply} = useLinearEditorActions({
    canvasRef,
    linearSelection,
    setInfoMessage,
  });

  const onLinearApply = useCallback(
    (newValue: string, newColor: string) => {
      handleLinearApply(newValue, newColor);
    }, [handleLinearApply]
  );

  // ── Toolbar ─────────────────────────────────────────────────

  const {
    currentHouseType,
    frontViewCount,
    backViewCount,
    side1ViewCount,
    side2ViewCount,
  } = useToolbarViewCounts();

  const toolbarActions = useToolbarActions({
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
  });

  const contraventamentoEditorState = getContraventamentoEditorState();
  return (
    <div className="relative h-full overflow-hidden bg-muted" onClick={handleContainerClick}>
      <Toolbar
        actions={toolbarActions}
        isDrawing={isDrawing}
        activeSubmenu={activeSubmenu}
        showTips={showTips}
        showZoomControls={showZoomControls}
        tutorialHighlight={tutorialStep}
        isMenuOpen={isMenuOpen}
        isTutorialActive={tutorialStep !== null}
        houseType={currentHouseType}
        frontViewCount={frontViewCount}
        backViewCount={backViewCount}
        side1ViewCount={side1ViewCount}
        side2ViewCount={side2ViewCount}
      />

      <RacEditorCanvas
        canvasRef={canvasRef}
        tutorialStep={tutorialStep}
        showTips={showTips}
        showZoomControls={showZoomControls}
        infoMessage={infoMessage}
        isAnyEditorOpen={isAnyEditorOpen}
        isContraventamentoMode={isContraventamentoMode}
        isSelectingContraventamentoDestination={isContraventamentoMode && contraventamentoStep === 'select-second'}
        isPilotiEligibleForContraventamento={isPilotiEligible}
        onSelectionMessage={setInfoMessage}
        onSelectionAuxCleanup={() => {
          dismissPilotiTutorial();
          clearTutorialBalloon();
        }}
        onZoomInteraction={handleZoomTutorialInteraction}
        onPilotiSelect={handlePilotiSelect}
        onWallSelect={handleWallSelect}
        onLinearSelect={handleLinearSelect}
        onDelete={handleDelete}
        onContraventamentoPilotiClick={handleContraventamentoPilotiClick}
        onContraventamentoSelect={handleContraventamentoSelect}
        onContraventamentoCancel={handleCancelContraventamento}
      />

      <RacEditorHouseTypeSelector
        houseTypeSelectorOpen={houseTypeSelectorOpen}
        onHouseTypeSelectorClose={handleHouseTypeSelectorClose}
        onHouseTypeSelected={handleHouseTypeSelected}
        tutorialHouseSelectorPreview={tutorialHouseSelectorPreview}
        nivelDefinitionOpen={nivelDefinitionOpen}
        onCloseNivelDefinition={handleNivelDefinitionClose}
        onApplyNiveis={handleNiveisApplied}
      />

      <RacEditorModalEditors
        isMobile={isMobile}
        isPilotiEditorOpen={isPilotiEditorOpen}
        pilotiSelection={pilotiSelection}
        onPilotiEditorClose={handlePilotiEditorClose}
        onPilotiHeightChange={handlePilotiHeightChange}
        onPilotiNavigate={handlePilotiNavigate}
        contraventamentoEditorState={contraventamentoEditorState}
        onContraventamentoSideAction={handleContraventamentoFromPilotiSide}

        onWallApply={handleWallApply}
        onWallEditorClose={closeWallEditor}
        wallSelection={wallSelection}
        wallEditorColor={resolveWallEditorColor()}
        isWallEditorOpen={isWallEditorOpen}

        onLinearApply={onLinearApply}
        onLinearEditorClose={closeLinearEditor}
        linearSelection={linearSelection}
        linearEditorType={linearSelection?.myType ?? 'line'}
        isLinearEditorOpen={isLinearEditorOpen}

        pendingViewType={pendingViewType}
        sideSelectorOpen={sideSelectorOpen}
        sideSelectorMode={sideSelectorMode}
        houseSideSlots={instanceSlots}
        onSideSelectorClose={handleSideSelectorClose}
        onSideSelected={handleSideSelected}
      />

      <RacEditorModals
        isMobile={isMobile}
        isSettingsOpen={isSettingsOpen}
        onSettingsOpenChange={setIsSettingsOpen}
        onSettingsChange={() => setShowZoomControls(getSettings().zoomEnabledByDefault)}
        showRestartConfirm={showRestartConfirm}
        onConfirmRestartTutorial={confirmRestartTutorial}
        onCloseRestartConfirm={closeRestartConfirm}
        showUngroupConfirm={showUngroupConfirm}
        onConfirmUngroup={confirmUngroup}
        onCloseUngroupConfirm={closeUngroupConfirm}
      />

      <RacEditorTutorial
        tutorialStep={tutorialStep}
        onTutorialComplete={handleTutorialComplete}
        tutorialPilotiPosition={tutorialPilotiPosition}
        onCloseTutorialPiloti={handleClosePilotiTutorial}
        tutorialBalloon={tutorialBalloon}
        onCloseTutorialBalloon={clearTutorialBalloon}
      />

      <House3DViewer
        open={is3DViewerOpen}
        onOpenChange={setIs3DViewerOpen}/>

    </div>
  );
}
