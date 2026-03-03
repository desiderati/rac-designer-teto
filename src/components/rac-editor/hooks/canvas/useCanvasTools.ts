import {Dispatch, RefObject, SetStateAction, useCallback} from 'react';
import {Canvas as FabricCanvas} from 'fabric';
import type {CanvasHandle} from '@/components/rac-editor/ui/canvas/Canvas.tsx';
import {toCanvasScreenPoint} from '@/components/rac-editor/lib/canvas/canvas-screen-position.ts';
import {CanvasObject, getElementStrategy,} from '@/components/rac-editor/lib/canvas';
import {isTutorialTipShown, markTutorialTipShown} from '@/infra/storage/tutorial.storage.ts';
import {TutorialBalloonState} from '@/components/rac-editor/ui/tutorial/Tutorial.tsx';
import {TIMINGS} from '@/shared/config.ts';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from "@/shared/constants.ts";

interface UseCanvasToolsArgs {
  canvasRef: RefObject<CanvasHandle | null>;
  getCanvas: () => FabricCanvas | null;
  getVisibleCenter: () => { x: number; y: number };
  addObjectToCanvas: (object: CanvasObject) => void;
  closeAllMenus: () => void;
  disableDrawingMode: () => void;
  isDrawing: boolean;
  setIsDrawing: Dispatch<SetStateAction<boolean>>;
  setInfoMessage: Dispatch<SetStateAction<string>>;
  setTutorialBalloon: Dispatch<SetStateAction<TutorialBalloonState | null>>;
}

interface TutorialConfig {
  key: 'wall' | 'line' | 'arrow' | 'distance';
  message: string;
}

export function useCanvasTools({
  canvasRef,
  getCanvas,
  addObjectToCanvas,
  closeAllMenus,
  disableDrawingMode,
  isDrawing,
  setIsDrawing,
  setInfoMessage,
  setTutorialBalloon,
}: UseCanvasToolsArgs) {

  const showTutorialBalloon =
    useCallback((object: CanvasObject, text: string) => {

      const canvas = canvasRef.current?.canvas;
      if (!canvas) return;

      const canvasPosition = canvasRef.current?.getCanvasPosition();
      const container = canvas.getElement().parentElement?.parentElement;
      if (!container || !canvasPosition) return;

      const center = object.getCenterPoint();
      const point = toCanvasScreenPoint({
        canvasPosition,
        containerRect: container.getBoundingClientRect(),
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        point: {x: center.x, y: center.y},
      });
      setTutorialBalloon({position: point, text});
    }, [canvasRef, setTutorialBalloon]);

  const addCanvasObject = useCallback((
    factory: (canvas: FabricCanvas) => CanvasObject,
    tutorial?: TutorialConfig,
  ) => {
    closeAllMenus();
    const canvas = getCanvas();
    if (!canvas) return null;

    const object = factory(canvas);
    addObjectToCanvas(object);

    if (tutorial && !isTutorialTipShown(tutorial.key)) {
      markTutorialTipShown(tutorial.key);
      setTimeout(() => showTutorialBalloon(object, tutorial.message), TIMINGS.tutorialBalloonDelayMs);
    }

    return object;
  }, [addObjectToCanvas, closeAllMenus, getCanvas, showTutorialBalloon]);

  const handleAddWall = useCallback(() => {
    addCanvasObject(getElementStrategy('wall').create, {
      key: 'wall',
      message: 'Clique duas vezes para definir ou alterar o nome do objeto.',
    });
  }, [addCanvasObject]);

  const handleAddDoor =
    useCallback(() =>
      addCanvasObject(getElementStrategy('door').create), [addCanvasObject]
    );

  const handleAddStairs =
    useCallback(() =>
      addCanvasObject(getElementStrategy('stairs').create), [addCanvasObject]
    );

  const handleAddTree =
    useCallback(() =>
      addCanvasObject(getElementStrategy('tree').create), [addCanvasObject]
    );

  const handleAddWater =
    useCallback(() =>
      addCanvasObject(getElementStrategy('water').create), [addCanvasObject]
    );

  const handleAddFossa =
    useCallback(() =>
      addCanvasObject(getElementStrategy('fossa').create), [addCanvasObject]
    );

  const handleAddLine = useCallback(() => {
    addCanvasObject(getElementStrategy('line').create, {
      key: 'line',
      message: 'Clique duas vezes para definir um texto ou a cor da linha reta.',
    });
  }, [addCanvasObject]);

  const handleAddArrow = useCallback(() => {
    addCanvasObject(getElementStrategy('arrow').create, {
      key: 'arrow',
      message: 'Clique duas vezes para definir um texto ou a cor da seta simples.',
    });
  }, [addCanvasObject]);

  const handleAddDistance = useCallback(() => {
    addCanvasObject(getElementStrategy('distance').create, {
      key: 'distance',
      message: 'Clique duas vezes para definir um texto ou a cor da distância.',
    });
  }, [addCanvasObject]);

  const handleToggleDrawMode = useCallback(() => {
    closeAllMenus();
    const canvas = getCanvas();
    if (!canvas) return;

    const nextDrawingState = !isDrawing;
    setIsDrawing(nextDrawingState);
    canvas.isDrawingMode = nextDrawingState;
    canvas.selection = !nextDrawingState;

    setInfoMessage(
      nextDrawingState ?
        '<b>Modo Desenho:</b> Risque na tela livremente.' :
        '<b>Dica:</b> Modo desenho desativado.'
    );
  }, [closeAllMenus, getCanvas, isDrawing, setInfoMessage, setIsDrawing]);

  const handleAddText = useCallback(() => {
    disableDrawingMode();
    const canvas = getCanvas();
    if (!canvas) return;

    const text = getElementStrategy('text').create(canvas);
    addObjectToCanvas(text);
  }, [addObjectToCanvas, disableDrawingMode, getCanvas]);

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
