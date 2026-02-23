import {Dispatch, RefObject, SetStateAction, useCallback} from 'react';
import {Group, type FabricObject} from 'fabric';
import {toast} from 'sonner';
import type {CanvasHandle} from '@/components/rac-editor/Canvas';
import {
  isPilotiTutorialShown,
  markPilotiTutorialShown,
} from '@/lib/persistence/tutorial-storage';
import {projectGroupLocalPointToScreen} from '@/lib/canvas/piloti-screen-position';
import {houseManager} from '@/lib/house-manager';

interface BallonPosition {
  x: number;
  y: number;
}

type TutorialMetaObject = FabricObject & {
  pilotiId?: string;
  isPilotiCircle?: boolean;
  left?: number;
  top?: number;
};

interface UseRacTutorialUiActionsArgs {
  isMobile: boolean;
  canvasRef: RefObject<CanvasHandle | null>;
  pilotiTutorialPosition: BallonPosition | null;
  setPilotiTutorialPosition: Dispatch<SetStateAction<BallonPosition | null>>;
  setShowRestartConfirm: Dispatch<SetStateAction<boolean>>;
  restartTutorialProgress: () => void;
  resetUiAfterRestart: () => void;
  clearOnboardingBalloon: () => void;
}

export function useRacTutorialUiActions({
  isMobile,
  canvasRef,
  pilotiTutorialPosition,
  setPilotiTutorialPosition,
  setShowRestartConfirm,
  restartTutorialProgress,
  resetUiAfterRestart,
  clearOnboardingBalloon,
}: UseRacTutorialUiActionsArgs) {
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
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
      canvasRef.current?.clearHistory();
      canvasRef.current?.saveHistory();
    }

    houseManager.reset();
    resetUiAfterRestart();
    restartTutorialProgress();
    setPilotiTutorialPosition(null);
    clearOnboardingBalloon();
    toast.success('Canvas reiniciado!');
  }, [
    canvasRef,
    clearOnboardingBalloon,
    resetUiAfterRestart,
    restartTutorialProgress,
    setPilotiTutorialPosition,
  ]);

  const dismissPilotiTutorial = useCallback(() => {
    if (!pilotiTutorialPosition) return;
    setPilotiTutorialPosition(null);
    markPilotiTutorialShown();
  }, [pilotiTutorialPosition, setPilotiTutorialPosition]);

  const handleClosePilotiTutorial = useCallback(() => {
    setPilotiTutorialPosition(null);
    markPilotiTutorialShown();
  }, [setPilotiTutorialPosition]);

  const showPilotiTutorialIfNeeded = useCallback((house: Group) => {
    if (isMobile) return;
    if (isPilotiTutorialShown()) return;

    const canvas = canvasRef.current?.canvas;
    if (!canvas) return;

    setTimeout(() => {
      const objects = house.getObjects();
      const pilotiA1 = objects.find((object) => {
        const typedObject = object as TutorialMetaObject;
        return typedObject.pilotiId === 'piloti_0_0' && typedObject.isPilotiCircle === true;
      });

      if (!pilotiA1) return;

      const groupMatrix = house.calcTransformMatrix();
      const typedPiloti = pilotiA1 as TutorialMetaObject;
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
      setPilotiTutorialPosition(position);
    }, 100);
  }, [canvasRef, isMobile, setPilotiTutorialPosition]);

  return {
    handleRestartTutorial,
    confirmRestartTutorial,
    closeRestartConfirm,
    dismissPilotiTutorial,
    handleClosePilotiTutorial,
    showPilotiTutorialIfNeeded,
  };
}
