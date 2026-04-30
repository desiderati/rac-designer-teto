import React, {Dispatch, SetStateAction, useCallback} from 'react';
import {CanvasGroup, CanvasObject} from '@/components/rac-editor/@canvas/lib';
import type {CanvasHandle} from '@/components/rac-editor/@canvas/ports/CanvasInteractionPort.ts';
import type {HouseReadPort} from '@/components/rac-editor/ports/HouseReadPort.ts';
import type {HouseWritePort} from '@/components/rac-editor/ports/HouseWritePort.ts';
import {TOAST_MESSAGES} from '@/shared/config.ts';
import {toast} from 'sonner';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';

interface UseCanvasActionsArgs {
  canvasRef: React.RefObject<CanvasHandle | null>;
  isDrawing: boolean;
  setIsDrawing: Dispatch<SetStateAction<boolean>>;
  setInfoMessage: Dispatch<SetStateAction<string>>;
  houseReadPort: Pick<HouseReadPort<CanvasGroup>, 'canDeleteTopView'>;
  houseWritePort: Pick<HouseWritePort<CanvasGroup>, 'removeView' | 'setHouseType'>;
  clearTutorialBalloon: () => void;
  onCloseSubmenus: () => void;
  onDismissPilotiTutorial: () => void;
}

export function useCanvasActions({
  canvasRef,
  isDrawing,
  setIsDrawing,
  setInfoMessage,
  houseReadPort,
  houseWritePort,
  clearTutorialBalloon,
  onCloseSubmenus,
  onDismissPilotiTutorial,
}: UseCanvasActionsArgs) {

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
    const result = canvasRef.current?.deleteActiveObjects({
      canDeleteTopView: () => houseReadPort.canDeleteTopView(),
      onTopViewDeleted: () => houseWritePort.setHouseType(null),
      onHouseViewRemoved: (group) => {
        if (group) houseWritePort.removeView(group);
      },
      onBlockedTopViewDelete: () => toast.error(TOAST_MESSAGES.removeOtherViewsBeforeDeletingTopView),
    });

    if (result === 'deleted') {
      setInfoMessage('Objeto excluído.');
    }
  }, [canvasRef, houseReadPort, houseWritePort, setInfoMessage]);

  return {
    getVisibleCenter,
    addObjectToCanvas,
    closeAllMenus,
    disableDrawingMode,
    handleDelete,
  };
}
