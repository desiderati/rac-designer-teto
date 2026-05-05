import {Dispatch, RefObject, SetStateAction, useCallback} from 'react';
import type {CanvasObjectCreationHandle} from '@/components/rac-editor/@canvas/ports/CanvasObjectCreationHandle.ts';
import type {CanvasScreenProjectionHandle} from '@/components/rac-editor/@canvas/ports/CanvasScreenProjectionHandle.ts';
import type {CanvasDrawingModeHandle} from '@/components/rac-editor/@canvas/ports/CanvasSurfaceHandle.ts';
import type {CanvasObject, ElementStrategyKey} from '@/components/rac-editor/@canvas/lib';
import {
  dispatchRacCanvasObjectEvent,
  RAC_CANVAS_OBJECT_INSERTED_EVENT,
  type RacCanvasObjectEventKind,
} from '@/components/rac-editor/@canvas/lib/canvas-object-dom-events.ts';

interface UseCanvasToolsArgs {
  canvasRef: RefObject<(
    CanvasDrawingModeHandle
    & CanvasObjectCreationHandle
    & CanvasScreenProjectionHandle
  ) | null>;
  addObjectToCanvas: (object: CanvasObject) => boolean;
  closeAllMenus: () => void;
  disableDrawingMode: () => void;
  isDrawing: boolean;
  setIsDrawing: Dispatch<SetStateAction<boolean>>;
  setInfoMessage: Dispatch<SetStateAction<string>>;
}

type CanvasInsertedObjectKind = Extract<RacCanvasObjectEventKind, ElementStrategyKey>;

const GUIDED_TIP_OBJECT_KINDS = new Set<ElementStrategyKey>(['wall', 'line', 'arrow', 'distance']);

function isGuidedTipObjectKind(kind: ElementStrategyKey): kind is CanvasInsertedObjectKind {
  return GUIDED_TIP_OBJECT_KINDS.has(kind);
}

function getObjectScreenRect(
  canvasRef: RefObject<CanvasScreenProjectionHandle | null>,
  object: CanvasObject,
): DOMRect | null {
  object.setCoords();
  const bounds = object.getBoundingRect();
  const topLeft = canvasRef.current?.getCanvasPointScreenPosition({x: bounds.left, y: bounds.top});
  const bottomRight = canvasRef.current?.getCanvasPointScreenPosition({
    x: bounds.left + bounds.width,
    y: bounds.top + bounds.height,
  });
  if (topLeft && bottomRight) {
    const left = Math.min(topLeft.x, bottomRight.x);
    const top = Math.min(topLeft.y, bottomRight.y);
    const width = Math.abs(bottomRight.x - topLeft.x);
    const height = Math.abs(bottomRight.y - topLeft.y);
    if (width > 0 && height > 0) return new DOMRect(left, top, width, height);
  }

  const center = canvasRef.current?.getCanvasPointScreenPosition(object.getCenterPoint());
  return center ? new DOMRect(center.x - 24, center.y - 24, 48, 48) : null;
}

function dispatchObjectInsertedEvent(kind: ElementStrategyKey, rect: DOMRect | null): void {
  if (!rect || !isGuidedTipObjectKind(kind)) return;

  dispatchRacCanvasObjectEvent(RAC_CANVAS_OBJECT_INSERTED_EVENT, {
    kind,
    rect: {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    },
  });
}

export function useCanvasTools({
  canvasRef,
  addObjectToCanvas,
  closeAllMenus,
  disableDrawingMode,
  isDrawing,
  setIsDrawing,
  setInfoMessage,
}: UseCanvasToolsArgs) {

  const addCanvasObject = useCallback((kind: ElementStrategyKey) => {
    closeAllMenus();
    const object = canvasRef.current?.createElementObject(kind);
    if (!object) return null;

    if (!addObjectToCanvas(object)) return null;
    window.setTimeout(() => {
      dispatchObjectInsertedEvent(kind, getObjectScreenRect(canvasRef, object));
    }, 0);
    return object;
  }, [addObjectToCanvas, canvasRef, closeAllMenus]);

  const handleAddWall = useCallback(() => {
    addCanvasObject('wall');
  }, [addCanvasObject]);

  const handleAddDoor =
    useCallback(() =>
      addCanvasObject('door'), [addCanvasObject]
    );

  const handleAddStairs =
    useCallback(() =>
      addCanvasObject('stairs'), [addCanvasObject]
    );

  const handleAddTree =
    useCallback(() =>
      addCanvasObject('tree'), [addCanvasObject]
    );

  const handleAddWater =
    useCallback(() =>
      addCanvasObject('water'), [addCanvasObject]
    );

  const handleAddFossa =
    useCallback(() =>
      addCanvasObject('fossa'), [addCanvasObject]
    );

  const handleAddLine = useCallback(() => {
    addCanvasObject('line');
  }, [addCanvasObject]);

  const handleAddArrow = useCallback(() => {
    addCanvasObject('arrow');
  }, [addCanvasObject]);

  const handleAddDistance = useCallback(() => {
    addCanvasObject('distance');
  }, [addCanvasObject]);

  const handleToggleDrawMode = useCallback(() => {
    closeAllMenus();

    const nextDrawingState = !isDrawing;
    if (!canvasRef.current?.setDrawingModeEnabled(nextDrawingState)) return;

    setIsDrawing(nextDrawingState);

    setInfoMessage(
      nextDrawingState ?
        '<b>Modo Desenho:</b> Risque na tela livremente.' :
        '<b>Dica:</b> Modo desenho desativado.'
    );
  }, [canvasRef, closeAllMenus, isDrawing, setInfoMessage, setIsDrawing]);

  const handleAddText = useCallback(() => {
    disableDrawingMode();
    addCanvasObject('text');
  }, [addCanvasObject, disableDrawingMode]);

  return {
    handleAddWall,
    handleAddDoor,
    handleAddStairs,
    handleAddTree,
    handleAddWater,
    handleAddFossa,
    handleAddLine,
    handleAddArrow,
    handleAddDistance,
    handleToggleDrawMode,
    handleAddText,
  };
}
