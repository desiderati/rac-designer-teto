import type {Dispatch, RefObject, SetStateAction} from 'react';
import type {CanvasSurfaceResetHandle} from '@/components/rac-editor/@canvas/ports/CanvasInteractionPort.ts';
import type {MenuSubmenu} from '@/components/rac-editor/@menus/lib/menu-types.ts';
import type {TutorialBalloonPosition} from '@/components/rac-editor/lib/tutorial.ts';
import {useTutorialFlow} from '@/components/rac-editor/hooks/tutorial/useTutorialFlow.ts';
import {useTutorialUiActions} from '@/components/rac-editor/hooks/tutorial/useTutorialUiActions.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';

interface UseRacEditorTutorialControllerArgs {
  isMobile: boolean;
  canvasRef: RefObject<CanvasSurfaceResetHandle | null>;
  tutorialPilotiPosition: TutorialBalloonPosition | null;
  setTutorialPilotiPosition: Dispatch<SetStateAction<TutorialBalloonPosition | null>>;
  clearTutorialBalloon: () => void;
  setActiveSubmenu: Dispatch<SetStateAction<MenuSubmenu>>;
  setIsMenuOpen: Dispatch<SetStateAction<boolean>>;
  setHouseTypeSelectorOpen: Dispatch<SetStateAction<boolean>>;
  setShowRestartConfirm: Dispatch<SetStateAction<boolean>>;
}

/**
 * Agrupa estado do tutorial e ações de UI que não dependem dos comandos do canvas.
 */
export function useRacEditorTutorialController({
  isMobile,
  canvasRef,
  tutorialPilotiPosition,
  setTutorialPilotiPosition,
  clearTutorialBalloon,
  setActiveSubmenu,
  setIsMenuOpen,
  setHouseTypeSelectorOpen,
  setShowRestartConfirm,
}: UseRacEditorTutorialControllerArgs) {
  const {houseWritePort} = useEditorPorts();

  const {
    tutorialStep,
    tutorialHouseSelectorPreview,
    setTutorialHouseSelectorPreview,
    advanceTutorial,
    completeTutorial,
    restartTutorialProgress,
  } = useTutorialFlow();

  const tutorialUiActions = useTutorialUiActions({
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
    houseWritePort,
  });

  return {
    tutorialStep,
    tutorialHouseSelectorPreview,
    setTutorialHouseSelectorPreview,
    advanceTutorial,
    completeTutorial,
    restartTutorialProgress,
    ...tutorialUiActions,
  };
}
