import React, {Dispatch, SetStateAction, useCallback} from 'react';
import {Canvas as FabricCanvas} from 'fabric';
import {
  CanvasObject,
  toCanvasGroup,
  toCanvasObject
} from '@/components/rac-editor/lib/canvas';
import {CanvasHandle} from '@/components/rac-editor/ui/canvas/Canvas.tsx';
import {houseManager} from '@/components/rac-editor/lib/house-manager.ts';
import {TOAST_MESSAGES} from '@/shared/config.ts';
import {toast} from 'sonner';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';

interface UseCanvasActionsArgs {
  canvasRef: React.RefObject<CanvasHandle | null>;
  isDrawing: boolean;
  setIsDrawing: Dispatch<SetStateAction<boolean>>;
  setInfoMessage: Dispatch<SetStateAction<string>>;
  clearTutorialBalloon: () => void;
  onCloseSubmenus: () => void;
  onDismissPilotiTutorial: () => void;
}

export function useCanvasActions({
  canvasRef,
  isDrawing,
  setIsDrawing,
  setInfoMessage,
  clearTutorialBalloon,
  onCloseSubmenus,
  onDismissPilotiTutorial,
}: UseCanvasActionsArgs) {

  const getCanvas = useCallback((): FabricCanvas | null => canvasRef.current?.canvas || null, [canvasRef]);

  const getVisibleCenter = useCallback(() => {
    const handle = canvasRef.current;
    if (handle && typeof handle.getVisibleCenter === 'function') {
      return handle.getVisibleCenter();
    }
    return {x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2};
  }, [canvasRef]);

  const addObjectToCanvas = useCallback((obj: CanvasObject) => {
    canvasRef.current?.addObjectAtVisibleCenter(obj);
  }, [canvasRef]);

  const closeAllMenus = useCallback(() => {
    onCloseSubmenus();
    onDismissPilotiTutorial();
    clearTutorialBalloon();
  }, [clearTutorialBalloon, onCloseSubmenus, onDismissPilotiTutorial]);

  const disableDrawingMode = useCallback(() => {
    if (isDrawing && canvasRef.current?.setDrawingModeEnabled(false)) {
      setIsDrawing(false);
      setInfoMessage('Dica: Selecione uma ferramenta.');
    }
  }, [canvasRef, isDrawing, setInfoMessage, setIsDrawing]);

  const handleDelete = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;

    canvas.discardActiveObject();
    for (const object of activeObjects) {
      const typedObject = toCanvasObject(object);
      if (!typedObject) continue;

      if (typedObject.myType === 'house') {
        const rawView = typedObject.houseViewType ?? typedObject.houseView;
        if (rawView === 'top') {
          if (!houseManager.canDeletePlant()) {
            toast.error(TOAST_MESSAGES.removeOtherViewsBeforeDeletingTopView);
            canvas.setActiveObject(object);
            return;
          }
          houseManager.setHouseType(null);
        }
        houseManager.removeView(toCanvasGroup(object));
      }
      canvas.remove(object);
    }

    setInfoMessage('Objeto excluído.');
  }, [getCanvas, setInfoMessage]);

  return {
    getCanvas,
    getVisibleCenter,
    addObjectToCanvas,
    closeAllMenus,
    disableDrawingMode,
    handleDelete,
  };
}
