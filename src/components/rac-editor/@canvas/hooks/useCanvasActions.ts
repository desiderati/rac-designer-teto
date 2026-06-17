import React, {Dispatch, SetStateAction, useCallback} from 'react';
import {CanvasObject} from '@/components/rac-editor/@canvas/lib';
import type {CanvasObjectCreationHandle} from '@/components/rac-editor/@canvas/ports/CanvasObjectCreationHandle.ts';
import type {
  CanvasActiveSelectionHandle,
  CanvasDrawingModeHandle,
} from '@/components/rac-editor/@canvas/ports/CanvasSurfaceHandle.ts';
import type {CanvasViewportHandle} from '@/components/rac-editor/@canvas/ports/CanvasViewportHandle.ts';
import type {HouseReadPort} from '@/components/rac-editor/ports/HouseReadPort.ts';
import type {HouseWritePort} from '@/components/rac-editor/ports/HouseWritePort.ts';
import {TOAST_MESSAGES} from '@/shared/config.ts';
import {toast} from 'sonner';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';

interface UseCanvasActionsArgs {
  canvasRef: React.RefObject<(
    CanvasActiveSelectionHandle
    & CanvasDrawingModeHandle
    & CanvasObjectCreationHandle
    & CanvasViewportHandle
  ) | null>;
  isDrawing: boolean;
  setIsDrawing: Dispatch<SetStateAction<boolean>>;
  setInfoMessage: Dispatch<SetStateAction<string>>;
  houseReadPort: Pick<HouseReadPort, 'canDeleteTopView'>;
  houseWritePort: Pick<HouseWritePort, 'refreshHouseViewReferenceMarkersForCurrentHouse' | 'removeView' | 'setHouseType'>;
  onCloseSubmenus: () => void;
}

export function useCanvasActions({
  canvasRef,
  isDrawing,
  setIsDrawing,
  setInfoMessage,
  houseReadPort,
  houseWritePort,
  onCloseSubmenus,
}: UseCanvasActionsArgs) {

  const getVisibleCenter = useCallback(() => {
    const handle = canvasRef.current;
    if (handle && typeof handle.getVisibleCenter === 'function') {
      return handle.getVisibleCenter();
    }
    return {x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2};
  }, [canvasRef]);

  const addObjectToCanvas = useCallback((obj: CanvasObject) => {
    return canvasRef.current?.addObjectAtVisibleCenter(obj) ?? false;
  }, [canvasRef]);

  const closeAllMenus = useCallback(() => {
    onCloseSubmenus();
  }, [onCloseSubmenus]);

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
      onHouseViewRemoved: (instanceId) => {
        if (instanceId) houseWritePort.removeView(instanceId);
      },
      onBlockedTopViewDelete: () => toast.error(TOAST_MESSAGES.removeOtherViewsBeforeDeletingTopView),
    });

    if (result === 'deleted') {
      houseWritePort.refreshHouseViewReferenceMarkersForCurrentHouse();
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
