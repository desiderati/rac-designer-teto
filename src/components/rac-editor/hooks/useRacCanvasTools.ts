import {Dispatch, RefObject, SetStateAction, useCallback} from 'react';
import {Canvas as FabricCanvas, FabricObject} from 'fabric';
import type {CanvasHandle, DistanceSelection} from '@/components/rac-editor/Canvas';
import {toCanvasScreenPoint} from '@/components/rac-editor/utils/canvas-screen-position';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  createArrow,
  createDimension,
  createDoor,
  createFossa,
  createLine,
  createStairs,
  createText,
  createTree,
  createWall,
  createWater,
} from '@/lib/canvas-utils';
import {isOnboardingTipShown, markOnboardingTipShown} from '@/lib/persistence/tutorial-storage';

interface OnboardingBalloonState {
  position: { x: number; y: number };
  text: string;
}

interface UseRacCanvasToolsArgs {
  canvasRef: RefObject<CanvasHandle | null>;
  getCanvas: () => FabricCanvas | null;
  getVisibleCenter: () => { x: number; y: number };
  addObjectToCanvas: (object: FabricObject) => void;
  closeAllMenus: () => void;
  disableDrawingMode: () => void;
  isDrawing: boolean;
  setIsDrawing: Dispatch<SetStateAction<boolean>>;
  setInfoMessage: Dispatch<SetStateAction<string>>;
  setOnboardingBalloon: Dispatch<SetStateAction<OnboardingBalloonState | null>>;
  openDistanceEditor: (selection: DistanceSelection) => void;
}

interface OnboardingConfig {
  key: 'wall' | 'line' | 'arrow';
  message: string;
}

export function useRacCanvasTools({
  canvasRef,
  getCanvas,
  getVisibleCenter,
  addObjectToCanvas,
  closeAllMenus,
  disableDrawingMode,
  isDrawing,
  setIsDrawing,
  setInfoMessage,
  setOnboardingBalloon,
  openDistanceEditor,
}: UseRacCanvasToolsArgs) {

  const showOnboardingBalloon =
    useCallback((object: FabricObject, text: string) => {

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
      setOnboardingBalloon({position: point, text});
    }, [canvasRef, setOnboardingBalloon]);

  const addCanvasObject = useCallback((
    factory: (canvas: FabricCanvas) => FabricObject,
    onboarding?: OnboardingConfig,
  ) => {
    closeAllMenus();
    const canvas = getCanvas();
    if (!canvas) return null;

    const object = factory(canvas);
    addObjectToCanvas(object);

    if (onboarding && !isOnboardingTipShown(onboarding.key)) {
      markOnboardingTipShown(onboarding.key);
      setTimeout(() => showOnboardingBalloon(object, onboarding.message), 100);
    }

    return object;
  }, [addObjectToCanvas, closeAllMenus, getCanvas, showOnboardingBalloon]);

  const handleAddWall = useCallback(() => {
    addCanvasObject(createWall, {
      key: 'wall',
      message: 'Clique duas vezes para definir ou alterar o nome do objeto.',
    });
  }, [addCanvasObject]);

  const handleAddDoor =
    useCallback(() => addCanvasObject(createDoor), [addCanvasObject]);

  const handleAddStairs =
    useCallback(() => addCanvasObject(createStairs), [addCanvasObject]);

  const handleAddTree =
    useCallback(() => addCanvasObject(createTree), [addCanvasObject]);

  const handleAddWater =
    useCallback(() => addCanvasObject(createWater), [addCanvasObject]);

  const handleAddFossa =
    useCallback(() => addCanvasObject(createFossa), [addCanvasObject]);

  const handleAddLine = useCallback(() => {
    addCanvasObject(createLine, {
      key: 'line',
      message: 'Clique duas vezes para definir um texto ou a cor da linha reta.',
    });
  }, [addCanvasObject]);

  const handleAddArrow = useCallback(() => {
    addCanvasObject(createArrow, {
      key: 'arrow',
      message: 'Clique duas vezes para definir um texto ou a cor da seta simples.',
    });
  }, [addCanvasObject]);

  const handleAddDimension = useCallback(() => {
    closeAllMenus();
    const canvas = getCanvas();
    if (!canvas) return;

    const center = getVisibleCenter();
    const dimension = createDimension(canvas, center);
    canvas.add(dimension);
    canvas.setActiveObject(dimension);

    const textObject = dimension.getObjects().find((object) =>
      object.type === 'i-text'
    ) as (FabricObject & {
      text?: string;
    }) | undefined;
    const currentValue = textObject?.text?.trim() || '';

    const canvasPosition = canvasRef.current?.getCanvasPosition();
    const container = canvas.getElement().parentElement?.parentElement;
    if (!container || !canvasPosition) return;

    const point = toCanvasScreenPoint({
      canvasPosition,
      containerRect: container.getBoundingClientRect(),
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
      point: {
        x: dimension.left || 0,
        y: dimension.top || 0,
      },
    });

    openDistanceEditor({
      group: dimension,
      currentValue,
      screenPosition: point,
    });
  }, [canvasRef, closeAllMenus, getCanvas, getVisibleCenter, openDistanceEditor]);

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
    const text = createText(canvas);
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
    handleAddDimension,
    handleToggleDrawMode,
    handleAddText,
  };
}
