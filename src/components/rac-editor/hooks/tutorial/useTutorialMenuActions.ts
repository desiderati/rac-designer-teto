import type {Dispatch, MouseEvent as ReactMouseEvent, SetStateAction} from 'react';
import {useCallback} from 'react';
import {ToolbarSubmenu} from '@/components/rac-editor/ui/toolbar/helpers/toolbar-types.ts';
import {TutorialStepId} from '@/components/rac-editor/ui/tutorial/Tutorial.tsx';

interface UseTutorialMenuActionsArgs {
  tutorialStep: TutorialStepId | null;
  advanceTutorial: (step: TutorialStepId) => void;
  completeTutorial: () => void;
  isMenuOpen: boolean;
  setIsMenuOpen: Dispatch<SetStateAction<boolean>>;
  setActiveSubmenu: Dispatch<SetStateAction<ToolbarSubmenu>>;
  setShowTips: Dispatch<SetStateAction<boolean>>;
  setShowZoomControls: Dispatch<SetStateAction<boolean>>;
  setHouseTypeSelectorOpen: Dispatch<SetStateAction<boolean>>;
  setTutorialHouseSelectorPreview: Dispatch<SetStateAction<boolean>>;
  closeAllMenus: () => void;
  dismissPilotiTutorial: () => void;
  disableDrawingMode: () => void;
  isHouseTypeSelected: () => boolean;
}

export function useTutorialMenuActions({
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
  isHouseTypeSelected,
}: UseTutorialMenuActionsArgs) {

  const handleOpenHouseTypeSelector = useCallback(() => {
    closeAllMenus();
    setHouseTypeSelectorOpen(true);

    if (tutorialStep === 'house') {
      setTutorialHouseSelectorPreview(true);
      advanceTutorial('house');
    }
  }, [
    advanceTutorial,
    closeAllMenus,
    setHouseTypeSelectorOpen,
    setTutorialHouseSelectorPreview,
    tutorialStep,
  ]);

  const handleHouseTypeSelectorClose = useCallback(() => {
    setHouseTypeSelectorOpen(false);
    setTutorialHouseSelectorPreview(false);
  }, [setHouseTypeSelectorOpen, setTutorialHouseSelectorPreview]);

  const handleToggleMenu = useCallback(() => {
    dismissPilotiTutorial();
    const newIsOpen = !isMenuOpen;
    setIsMenuOpen(newIsOpen);

    if (!newIsOpen) {
      setActiveSubmenu(null);
    }

    if (tutorialStep === 'main-fab' && newIsOpen) {
      advanceTutorial('main-fab');
    }
  }, [
    advanceTutorial,
    dismissPilotiTutorial,
    isMenuOpen,
    setActiveSubmenu,
    setIsMenuOpen,
    tutorialStep,
  ]);

  const handleToggleHouseMenu = useCallback(() => {
    disableDrawingMode();

    if (tutorialStep === 'house') {
      closeAllMenus();
      setHouseTypeSelectorOpen(true);
      setTutorialHouseSelectorPreview(true);
      advanceTutorial('house');
      return;
    }

    if (isHouseTypeSelected()) {
      setActiveSubmenu((previous) => previous === 'house' ? null : 'house');
      return;
    }

    handleOpenHouseTypeSelector();
  }, [
    advanceTutorial,
    closeAllMenus,
    disableDrawingMode,
    handleOpenHouseTypeSelector,
    isHouseTypeSelected,
    setActiveSubmenu,
    setHouseTypeSelectorOpen,
    setTutorialHouseSelectorPreview,
    tutorialStep,
  ]);

  const toggleSubmenu =
    useCallback((submenu: 'elements' | 'lines' | 'overflow', tutorialGate?: TutorialStepId) => {
      disableDrawingMode();
      setActiveSubmenu((previous) => previous === submenu ? null : submenu);

      if (tutorialGate && tutorialStep === tutorialGate) {
        advanceTutorial(tutorialGate);
      }
    }, [advanceTutorial, disableDrawingMode, setActiveSubmenu, tutorialStep]);

  const handleToggleElementsMenu = useCallback(() => {
    toggleSubmenu('elements', 'elements');
  }, [toggleSubmenu]);

  const handleToggleLinesMenu = useCallback(() => {
    toggleSubmenu('lines');
  }, [toggleSubmenu]);

  const handleToggleOverflowMenu = useCallback(() => {
    toggleSubmenu('overflow', 'more-options');
  }, [toggleSubmenu]);

  const handleToggleTips = useCallback(() => {
    setShowTips((previous) => !previous);
  }, [setShowTips]);

  const handleContainerClick = useCallback((event: ReactMouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.submenu') && !target.closest('button')) {
      closeAllMenus();
    }
  }, [closeAllMenus]);

  const handleTutorialComplete = useCallback(() => {
    setHouseTypeSelectorOpen(false);
    completeTutorial();
  }, [completeTutorial, setHouseTypeSelectorOpen]);

  const handleZoomTutorialInteraction = useCallback(() => {
    if (tutorialStep === 'zoom-minimap') {
      advanceTutorial('zoom-minimap');
    }
  }, [advanceTutorial, tutorialStep]);

  const handleToggleZoomControls = useCallback(() => {
    setShowZoomControls((previous) => !previous);
    handleZoomTutorialInteraction();
  }, [handleZoomTutorialInteraction, setShowZoomControls]);

  return {
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
  };
}
