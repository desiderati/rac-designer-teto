import {Dispatch, RefObject, SetStateAction, useCallback} from 'react';
import {toast} from 'sonner';
import type {CanvasHandle} from '@/components/rac-editor/store/CanvasInteractionPort.ts';
import {isPilotiTutorialShown, markPilotiTutorialShown} from '@/infra/storage/tutorial.storage.ts';
import {CanvasGroup} from '@/components/rac-editor/lib/canvas';
import {PILOTI_CORNER_ID, TIMINGS, TOAST_MESSAGES} from '@/shared/config.ts';
import {TutorialBalloonPosition} from '@/components/rac-editor/lib/tutorial.ts';
import type {HouseWritePort} from '@/components/rac-editor/store/HouseWritePort.ts';

interface UseTutorialUiActionsArgs {
  isMobile: boolean;
  canvasRef: RefObject<CanvasHandle | null>;
  tutorialPilotiPosition: TutorialBalloonPosition | null;
  setTutorialPilotiPosition: Dispatch<SetStateAction<TutorialBalloonPosition | null>>;
  setShowRestartConfirm: Dispatch<SetStateAction<boolean>>;
  restartTutorialProgress: () => void;
  resetUiAfterRestart: () => void;
  clearTutorialBalloon: () => void;
  houseWritePort: Pick<HouseWritePort<CanvasGroup>, 'resetHouse'>;
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
  houseWritePort,
}: UseTutorialUiActionsArgs) {

  const handleRestartTutorial = useCallback(() => {
    setShowRestartConfirm(true);
  }, [setShowRestartConfirm]);

  const closeRestartConfirm = useCallback(() => {
    setShowRestartConfirm(false);
  }, [setShowRestartConfirm]);

  const confirmRestartTutorial = useCallback(() => {
    canvasRef.current?.resetSurface();

    houseWritePort.resetHouse();
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
    houseWritePort,
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

  const showPilotiTutorialIfNeeded = useCallback((house: CanvasGroup) => {
    if (isMobile) return;
    if (isPilotiTutorialShown()) return;

    setTimeout(() => {
      const objects = house.getCanvasObjects();
      const typedPiloti = objects.find((typedObject) => {
        if (!typedObject) return false;
        return typedObject.pilotiId === PILOTI_CORNER_ID.topLeft && typedObject.isPilotiCircle === true;
      });

      if (!typedPiloti) return;

      const pilotiLeft = typedPiloti.left || 0;
      const pilotiTop = typedPiloti.top || 0;
      const position = canvasRef.current?.getGroupLocalPointScreenPosition(
        house,
        {x: pilotiLeft, y: pilotiTop},
      );
      if (!position) return;

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


