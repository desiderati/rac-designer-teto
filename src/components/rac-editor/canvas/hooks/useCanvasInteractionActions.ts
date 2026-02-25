import React, {Dispatch, SetStateAction, useCallback} from 'react';
import {Canvas as FabricCanvas, FabricObject} from 'fabric';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from "@/components/lib/canvas";
import {CanvasHandle} from '@/components/rac-editor/canvas/Canvas.tsx';

interface UseCanvasInteractionActionsArgs {
  canvasRef: React.RefObject<CanvasHandle | null>;
  isDrawing: boolean;
  setIsDrawing: Dispatch<SetStateAction<boolean>>;
  setInfoMessage: Dispatch<SetStateAction<string>>;
  clearTutorialBalloon: () => void;
  onCloseSubmenus: () => void;
  onDismissPilotiTutorial: () => void;
}

export function useCanvasInteractionActions({
  canvasRef,
  isDrawing,
  setIsDrawing,
  setInfoMessage,
  clearTutorialBalloon,
  onCloseSubmenus,
  onDismissPilotiTutorial,
}: UseCanvasInteractionActionsArgs) {
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
    clearTutorialBalloon();
  }, [clearTutorialBalloon, onCloseSubmenus, onDismissPilotiTutorial]);

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
