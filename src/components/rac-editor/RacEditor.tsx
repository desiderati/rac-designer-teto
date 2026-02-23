import {useCallback, useEffect, useRef, useState} from 'react';
import {FabricObject} from 'fabric';
import {Toolbar} from './Toolbar';
import {CanvasHandle, PilotiSelection,} from './Canvas';
import {RacEditorInlineEditors} from './RacEditorInlineEditors.tsx';
import {RacEditorOverlays} from './RacEditorOverlays.tsx';
import {RacEditorCanvasSection} from './RacEditorCanvasSection.tsx';
import {useContraventamentoFlow} from './hooks/useContraventamentoFlow';
import {useHouseTypeFlow} from './hooks/useHouseTypeFlow';
import {useRacHotkeys} from './hooks/useRacHotkeys';
import {useRacInlineEditorBindings} from './hooks/useRacInlineEditorBindings';
import {useRacTutorialFlow} from './hooks/useRacTutorialFlow';
import {useRacModalState} from './hooks/useRacModalState';
import {useRacDebugBridge} from './hooks/useRacDebugBridge';
import {useRacContraventamento} from './hooks/useRacContraventamento';
import {useRacViewActions} from './hooks/useRacViewActions';
import {useRacCanvasTools} from './hooks/useRacCanvasTools';
import {useRacProjectActions} from './hooks/useRacProjectActions';
import {useRacGroupingActions} from './hooks/useRacGroupingActions';
import {useRacMenuTutorialActions} from './hooks/useRacMenuTutorialActions';
import {useRacPilotiActions} from './hooks/useRacPilotiActions';
import {useRacTutorialUiActions} from './hooks/useRacTutorialUiActions';
import {useRacHouseInitialization} from './hooks/useRacHouseInitialization';
import {useRacGenericEditorActions} from './hooks/useRacGenericEditorActions';
import {useRacPdfExportAction} from './hooks/useRacPdfExportAction';
import {useRacToolbarViewCounts} from './hooks/useRacToolbarViewCounts';
import {useRacCanvasInteractionActions} from './hooks/useRacCanvasInteractionActions';
import {useRacToolbarActions} from './hooks/useRacToolbarActions';
import {useIsMobile} from '@/shared/hooks/use-mobile';
import {getSettings} from '@/lib/settings';
import {useHouseStoreVersion} from '@/lib/state/house-store';
import {houseManager, HouseType} from '@/lib/house-manager';

export function RacEditor() {
  const [infoMessage, setInfoMessage] =
    useState('Dica: Selecione uma ferramenta. (Ctrl+C Copiar, Ctrl+V Colar, Ctrl+Z Desfazer)');

  const [isDrawing, setIsDrawing] = useState(false);

  const {
    activeSubmenu, setActiveSubmenu, showTips, setShowTips, showZoomControls, setShowZoomControls,
    isSettingsOpen, setIsSettingsOpen, isMenuOpen, setIsMenuOpen, showRestartConfirm, setShowRestartConfirm,
    showUngroupConfirm, setShowUngroupConfirm, sideSelectorOpen, setSideSelectorOpen, houseTypeSelectorOpen,
    setHouseTypeSelectorOpen, is3DViewerOpen, setIs3DViewerOpen, nivelDefinitionOpen, setNivelDefinitionOpen,
  } = useRacModalState();

  const {tutorialStep, tutorialHouseSelectorPreview, setTutorialHouseSelectorPreview, advanceTutorial, completeTutorial, restartTutorialProgress,}
    = useRacTutorialFlow();

  const [pilotiSelection, setPilotiSelection] = useState<PilotiSelection | null>(null);
  const [isPilotiEditorOpen, setIsPilotiEditorOpen] = useState(false);

  const {
    distanceSelection, isDistanceEditorOpen, objectNameSelection, isObjectNameEditorOpen, lineArrowSelection,
    isLineArrowEditorOpen, isEditorOpen, canvasSelectionBindings, openDistanceEditor, closeDistanceEditor,
    closeObjectNameEditor, closeLineArrowEditor,
  } = useRacInlineEditorBindings({isPilotiEditorOpen});

  const [onboardingBalloon, setOnboardingBalloon] = useState<{
    position: { x: number; y: number; };
    text: string;
  } | null>(null);

  const [pilotiTutorialPosition, setPilotiTutorialPosition] = useState<{ x: number; y: number; } | null>(null);

  const {
    pendingViewType, setPendingViewType, sideSelectorMode, setSideSelectorMode, instanceSlots, setInstanceSlots,
    pendingNivelSide, setPendingNivelSide, niveisAppliedRef, transitionToNivelRef,
  } = useHouseTypeFlow();
  const houseVersion = useHouseStoreVersion();
  const canvasRef = useRef<CanvasHandle>(null);
  const isMobile = useIsMobile();
  const showTipsRef = useRef(showTips);
  const showZoomControlsRef = useRef(showZoomControls);

  useEffect(() => {
    showTipsRef.current = showTips;
  }, [showTips]);

  useEffect(() => {
    showZoomControlsRef.current = showZoomControls;
  }, [showZoomControls]);

  useRacDebugBridge({
    canvasRef,
    showTipsRef,
    showZoomControlsRef,
    setPilotiSelection,
    setIsPilotiEditorOpen,
  });

  // ── Contraventamento state ─────────────────────────────────────────────────
  const {
    isContraventamentoMode, setIsContraventamentoMode, selectedContraventamento, setSelectedContraventamento,
    contraventamentoStep, setContraventamentoStep, contraventamentoFirst, setContraventamentoFirst,
    contraventamentoSide, setContraventamentoSide, resetContraventamentoFlow,
  } = useContraventamentoFlow();

  useRacHouseInitialization({canvasRef});

  const clearOnboardingBalloon = useCallback(() => {
    setOnboardingBalloon(null);
  }, []);

  const {
    handleRestartTutorial,
    confirmRestartTutorial,
    closeRestartConfirm,
    dismissPilotiTutorial,
    handleClosePilotiTutorial,
    showPilotiTutorialIfNeeded,
  } = useRacTutorialUiActions({
    isMobile,
    canvasRef,
    pilotiTutorialPosition,
    setPilotiTutorialPosition,
    setShowRestartConfirm,
    restartTutorialProgress,
    resetUiAfterRestart: () => {
      setActiveSubmenu(null);
      setIsMenuOpen(false);
      setHouseTypeSelectorOpen(false);
      setTutorialHouseSelectorPreview(false);
      setShowRestartConfirm(false);
    },
    clearOnboardingBalloon,
  });

  const {
    getCanvas,
    getVisibleCenter,
    addObjectToCanvas,
    closeAllMenus,
    disableDrawingMode,
  } = useRacCanvasInteractionActions({
    canvasRef,
    isDrawing,
    setIsDrawing,
    setInfoMessage,
    clearOnboardingBalloon,
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
  } = useRacViewActions({
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

  const handleHouseTypeSelected = (type: HouseType) => {
    handleHouseTypeSelectedFromFlow(type);
  };

  const {
    handleGroup,
    handleUngroup,
    confirmUngroup,
    closeUngroupConfirm,
  } = useRacGroupingActions({
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
    handleAddDimension,
    handleToggleDrawMode,
    handleAddText,
  } = useRacCanvasTools({
    canvasRef,
    getCanvas,
    getVisibleCenter,
    addObjectToCanvas,
    closeAllMenus,
    disableDrawingMode,
    isDrawing,
    setIsDrawing,
    setInfoMessage,
    setOnboardingBalloon,
    openDistanceEditor,
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
  } = useRacMenuTutorialActions({
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

  useRacHotkeys({
    onToggleDrawMode: handleToggleDrawMode,
    onToggleZoomControls: handleToggleZoomControls,
  });

  const {handleSavePDF} = useRacPdfExportAction({
    getCanvas,
  });

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
  } = useRacContraventamento({
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

  const {
    handleExportJSON,
    handleImportJSON,
    handleDelete,
  } = useRacProjectActions({
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

  const {
    handlePilotiSelect,
    handlePilotiEditorClose,
    handlePilotiHeightChange,
    handlePilotiNavigate,
  } = useRacPilotiActions({
    isContraventamentoMode,
    onContraventamentoSelect: handleContraventamentoSelect,
    hasPilotiTutorial: !!pilotiTutorialPosition,
    closePilotiTutorial: handleClosePilotiTutorial,
    canvasRef,
    pilotiSelection,
    setPilotiSelection,
    setIsPilotiEditorOpen,
    syncContraventamentoElevations,
    setInfoMessage,
  });

  const {
    handleGenericApply,
    resolveDimensionEditorColor,
    resolveWallEditorColor,
    lineArrowEditorType,
  } = useRacGenericEditorActions({
    canvasRef,
    distanceSelection,
    objectNameSelection,
    lineArrowSelection,
    setInfoMessage,
  });
  const {
    currentHouseType,
    frontViewCount,
    backViewCount,
    side1ViewCount,
    side2ViewCount,
  } = useRacToolbarViewCounts();
  const toolbarActions = useRacToolbarActions({
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

      <RacEditorCanvasSection
        canvasRef={canvasRef}
        tutorialStep={tutorialStep}
        showTips={showTips}
        showZoomControls={showZoomControls}
        infoMessage={infoMessage}
        isEditorOpen={isEditorOpen}
        isContraventamentoMode={isContraventamentoMode}
        isSelectingContraventamentoDestination={isContraventamentoMode && contraventamentoStep === 'select-second'}
        isPilotiEligibleForContraventamento={isPilotiEligible}
        onSelectionMessage={setInfoMessage}
        onSelectionAuxCleanup={() => {
          dismissPilotiTutorial();
          clearOnboardingBalloon();
        }}
        onZoomInteraction={handleZoomTutorialInteraction}
        onPilotiSelect={handlePilotiSelect}
        onDistanceSelect={canvasSelectionBindings.onDistanceSelect}
        onObjectNameSelect={canvasSelectionBindings.onObjectNameSelect}
        onLineArrowSelect={canvasSelectionBindings.onLineArrowSelect}
        onDelete={handleDelete}
        onContraventamentoPilotiClick={handleContraventamentoPilotiClick}
        onContraventamentoSelect={handleContraventamentoSelect}
        onContraventamentoCancel={handleCancelContraventamento}
      />

      <RacEditorInlineEditors
        isMobile={isMobile}
        canvas={canvasRef.current?.canvas ?? null}
        isPilotiEditorOpen={isPilotiEditorOpen}
        pilotiSelection={pilotiSelection}
        onPilotiEditorClose={handlePilotiEditorClose}
        onPilotiHeightChange={handlePilotiHeightChange}
        onPilotiNavigate={handlePilotiNavigate}
        contraventamentoEditorState={contraventamentoEditorState}
        onContraventamentoSideAction={handleContraventamentoFromPilotiSide}
        isDistanceEditorOpen={isDistanceEditorOpen}
        distanceSelection={distanceSelection}
        onDistanceEditorClose={closeDistanceEditor}
        distanceEditorColor={resolveDimensionEditorColor()}
        isObjectNameEditorOpen={isObjectNameEditorOpen}
        objectNameSelection={objectNameSelection}
        onObjectNameEditorClose={closeObjectNameEditor}
        objectNameEditorColor={resolveWallEditorColor()}
        isLineArrowEditorOpen={isLineArrowEditorOpen}
        lineArrowSelection={lineArrowSelection}
        onLineArrowEditorClose={closeLineArrowEditor}
        lineArrowEditorType={lineArrowEditorType}
        onGenericApply={handleGenericApply}
        pendingViewType={pendingViewType}
        sideSelectorOpen={sideSelectorOpen}
        sideSelectorMode={sideSelectorMode}
        instanceSlots={instanceSlots}
        onSideSelectorClose={handleSideSelectorClose}
        onSideSelected={handleSideSelected}
      />

      <RacEditorOverlays
        isMobile={isMobile}
        houseTypeSelectorOpen={houseTypeSelectorOpen}
        onHouseTypeSelectorClose={handleHouseTypeSelectorClose}
        onHouseTypeSelected={handleHouseTypeSelected}
        tutorialHouseSelectorPreview={tutorialHouseSelectorPreview}
        is3DViewerOpen={is3DViewerOpen}
        on3DViewerOpenChange={setIs3DViewerOpen}
        isSettingsOpen={isSettingsOpen}
        onSettingsOpenChange={setIsSettingsOpen}
        onSettingsChange={() => setShowZoomControls(getSettings().zoomEnabledByDefault)}
        tutorialStep={tutorialStep}
        onTutorialComplete={handleTutorialComplete}
        pilotiTutorialPosition={pilotiTutorialPosition}
        onClosePilotiTutorial={handleClosePilotiTutorial}
        onboardingBalloon={onboardingBalloon}
        onCloseOnboardingBalloon={clearOnboardingBalloon}
        showRestartConfirm={showRestartConfirm}
        onConfirmRestartTutorial={confirmRestartTutorial}
        onCloseRestartConfirm={closeRestartConfirm}
        showUngroupConfirm={showUngroupConfirm}
        onConfirmUngroup={confirmUngroup}
        onCloseUngroupConfirm={closeUngroupConfirm}
        nivelDefinitionOpen={nivelDefinitionOpen}
        onCloseNivelDefinition={handleNivelDefinitionClose}
        onApplyNiveis={handleNiveisApplied}
        pilotiData={houseManager.getHouse()?.pilotis || {}}
      />

    </div>);
}

