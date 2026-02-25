import {Dispatch, RefObject, SetStateAction, useCallback} from 'react';
import {Group} from 'fabric';
import {toast} from 'sonner';
import type {CanvasHandle} from '@/components/rac-editor/canvas/Canvas.tsx';
import {isPilotiTutorialShown, markPilotiTutorialShown} from '@/infra/storage/tutorial.storage.ts';
import {projectGroupLocalPointToScreen} from '@/components/lib/canvas/piloti-screen-position.ts';
import {houseManager} from '@/components/lib/house-manager.ts';
import {toCanvasObject} from '@/components/lib/canvas';
import {TutorialBalloonPosition} from '@/components/rac-editor/tutorial/Tutorial.tsx';
import {CANVAS_STYLE, PILOTI_CORNER_ID, TIMINGS, TOAST_MESSAGES} from '@/config.ts';

interface UseTutorialUiActionsArgs {
  isMobile: boolean;
  canvasRef: RefObject<CanvasHandle | null>;
  tutorialPilotiPosition: TutorialBalloonPosition | null;
  setTutorialPilotiPosition: Dispatch<SetStateAction<TutorialBalloonPosition | null>>;
  setShowRestartConfirm: Dispatch<SetStateAction<boolean>>;
  restartTutorialProgress: () => void;
  resetUiAfterRestart: () => void;
  clearTutorialBalloon: () => void;
}

export function useTutorialUiActions({
  isMobile,
  canvasRef,
  tutorialPilotiPosition,
  setTutorialPilotiPosition,
  setShowRestartConfirm,
  restartTutorialProgress,
  resetUiAfterRestart,
  clearTutorialBalloon,
}: UseTutorialUiActionsArgs) {
  const handleRestartTutorial = useCallback(() => {
    setShowRestartConfirm(true);
  }, [setShowRestartConfirm]);

  const closeRestartConfirm = useCallback(() => {
    setShowRestartConfirm(false);
  }, [setShowRestartConfirm]);

  const confirmRestartTutorial = useCallback(() => {
    const canvas = canvasRef.current?.canvas;
    if (canvas) {
      canvas.clear();
      canvas.backgroundColor = CANVAS_STYLE.backgroundColor;
      canvas.renderAll();
      canvasRef.current?.clearHistory();
      canvasRef.current?.saveHistory();
    }

    houseManager.reset();
    resetUiAfterRestart();
    restartTutorialProgress();
    setTutorialPilotiPosition(null);
    clearTutorialBalloon();
    toast.success(TOAST_MESSAGES.canvasRestartedSuccessfully);
  }, [
    canvasRef,
    clearTutorialBalloon,
    resetUiAfterRestart,
    restartTutorialProgress,
    setTutorialPilotiPosition,
  ]);

  const dismissPilotiTutorial = useCallback(() => {
    if (!tutorialPilotiPosition) return;
    setTutorialPilotiPosition(null);
    markPilotiTutorialShown();
  }, [tutorialPilotiPosition, setTutorialPilotiPosition]);

  const handleClosePilotiTutorial = useCallback(() => {
    setTutorialPilotiPosition(null);
    markPilotiTutorialShown();
  }, [setTutorialPilotiPosition]);

  const showPilotiTutorialIfNeeded = useCallback((house: Group) => {
    if (isMobile) return;
    if (isPilotiTutorialShown()) return;

    const canvas = canvasRef.current?.canvas;
    if (!canvas) return;

    setTimeout(() => {
      const objects = house.getObjects();
      const pilotiA1 = objects.find((object) => {
        const typedObject = toCanvasObject(object);
        if (!typedObject) return false;
        return typedObject.pilotiId === PILOTI_CORNER_ID.topLeft && typedObject.isPilotiCircle === true;
      });

      if (!pilotiA1) return;

      const groupMatrix = house.calcTransformMatrix();
      const typedPiloti = toCanvasObject(pilotiA1);
      if (!typedPiloti) return;
      const pilotiLeft = typedPiloti.left || 0;
      const pilotiTop = typedPiloti.top || 0;
      const container = canvas.getElement().parentElement;
      if (!container) return;

      const position = projectGroupLocalPointToScreen({
        groupMatrix,
        localPoint: {x: pilotiLeft, y: pilotiTop},
        containerRect: container.getBoundingClientRect(),
        viewportTransform: canvas.viewportTransform ?? undefined,
      });
      setTutorialPilotiPosition(position);
    }, TIMINGS.pilotiTutorialDelayMs);
  }, [canvasRef, isMobile, setTutorialPilotiPosition]);

  return {
    handleRestartTutorial,
    confirmRestartTutorial,
    closeRestartConfirm,
    dismissPilotiTutorial,
    handleClosePilotiTutorial,
    showPilotiTutorialIfNeeded,
  };
}


