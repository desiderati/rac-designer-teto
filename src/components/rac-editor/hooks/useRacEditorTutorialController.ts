import type {Dispatch, RefObject, SetStateAction} from 'react';
import type {CanvasHandle} from '@/components/rac-editor/ui/canvas/Canvas.tsx';
import type {ToolbarSubmenu} from '@/components/rac-editor/ui/toolbar/helpers/toolbar-types.ts';
import type {TutorialBalloonPosition} from '@/components/rac-editor/lib/tutorial.ts';
import {useTutorialFlow} from '@/components/rac-editor/hooks/tutorial/useTutorialFlow.ts';
import {useTutorialUiActions} from '@/components/rac-editor/hooks/tutorial/useTutorialUiActions.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';

interface UseRacEditorTutorialControllerArgs {
  isMobile: boolean;
  canvasRef: RefObject<CanvasHandle | null>;
  tutorialPilotiPosition: TutorialBalloonPosition | null;
  setTutorialPilotiPosition: Dispatch<SetStateAction<TutorialBalloonPosition | null>>;
  clearTutorialBalloon: () => void;
  setActiveSubmenu: Dispatch<SetStateAction<ToolbarSubmenu>>;
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
