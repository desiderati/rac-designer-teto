import {Dispatch, RefObject, SetStateAction, useCallback} from 'react';
import {toast} from 'sonner';
import type {CanvasHandle} from '@/components/rac-editor/canvas/ports/CanvasInteractionPort.ts';
import {isPilotiTutorialShown, markPilotiTutorialShown} from '@/infra/storage/tutorial.storage.ts';
import {TOAST_MESSAGES} from '@/shared/config.ts';
import {TutorialBalloonPosition} from '@/components/rac-editor/lib/tutorial.ts';
import type {HouseWritePort} from '@/components/rac-editor/ports/HouseWritePort.ts';

interface UseTutorialUiActionsArgs {
  isMobile: boolean;
  canvasRef: RefObject<CanvasHandle | null>;
  tutorialPilotiPosition: TutorialBalloonPosition | null;
  setTutorialPilotiPosition: Dispatch<SetStateAction<TutorialBalloonPosition | null>>;
  setShowRestartConfirm: Dispatch<SetStateAction<boolean>>;
  restartTutorialProgress: () => void;
  resetUiAfterRestart: () => void;
  clearTutorialBalloon: () => void;
  houseWritePort: Pick<HouseWritePort, 'resetHouse'>;
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

  const showPilotiTutorialIfNeeded = useCallback((position: TutorialBalloonPosition | null) => {
    if (isMobile) return;
    if (isPilotiTutorialShown()) return;
    if (!position) return;

    setTutorialPilotiPosition(position);
  }, [isMobile, setTutorialPilotiPosition]);

  return {
    handleRestartTutorial,
    confirmRestartTutorial,
    closeRestartConfirm,
    dismissPilotiTutorial,
    handleClosePilotiTutorial,
    showPilotiTutorialIfNeeded,
  };
}


