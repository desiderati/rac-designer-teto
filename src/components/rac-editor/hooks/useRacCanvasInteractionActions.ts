import {Dispatch, SetStateAction, useCallback} from 'react';
import {Canvas as FabricCanvas, FabricObject} from 'fabric';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/lib/canvas-utils';
import {CanvasHandle} from '../Canvas';

interface UseRacCanvasInteractionActionsArgs {
  canvasRef: React.RefObject<CanvasHandle | null>;
  isDrawing: boolean;
  setIsDrawing: Dispatch<SetStateAction<boolean>>;
  setInfoMessage: Dispatch<SetStateAction<string>>;
  clearOnboardingBalloon: () => void;
  onCloseSubmenus: () => void;
  onDismissPilotiTutorial: () => void;
}

export function useRacCanvasInteractionActions({
  canvasRef,
  isDrawing,
  setIsDrawing,
  setInfoMessage,
  clearOnboardingBalloon,
  onCloseSubmenus,
  onDismissPilotiTutorial,
}: UseRacCanvasInteractionActionsArgs) {
  const getCanvas = useCallback((): FabricCanvas | null => canvasRef.current?.canvas || null, [canvasRef]);

  const getVisibleCenter = useCallback(() => {
    const handle = canvasRef.current;
    if (handle && typeof handle.getVisibleCenter === 'function') {
      return handle.getVisibleCenter();
    }
    return {x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2};
  }, [canvasRef]);

  const addObjectToCanvas = useCallback((obj: FabricObject) => {
    const canvas = getCanvas();
    if (!canvas) return;

    const center = getVisibleCenter();
    obj.set({left: center.x, top: center.y});
    canvas.add(obj);
    canvas.setActiveObject(obj);
  }, [getCanvas, getVisibleCenter]);

  const closeAllMenus = useCallback(() => {
    onCloseSubmenus();
    onDismissPilotiTutorial();
    clearOnboardingBalloon();
  }, [clearOnboardingBalloon, onCloseSubmenus, onDismissPilotiTutorial]);

  const disableDrawingMode = useCallback(() => {
    const canvas = getCanvas();
    if (isDrawing && canvas) {
      setIsDrawing(false);
      canvas.isDrawingMode = false;
      canvas.selection = true;
      setInfoMessage('Dica: Selecione uma ferramenta.');
    }
  }, [getCanvas, isDrawing, setInfoMessage, setIsDrawing]);

  return {
    getCanvas,
    getVisibleCenter,
    addObjectToCanvas,
    closeAllMenus,
    disableDrawingMode,
  };
}
