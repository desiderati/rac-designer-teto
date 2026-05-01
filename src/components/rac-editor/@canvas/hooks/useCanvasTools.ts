import {Dispatch, RefObject, SetStateAction, useCallback} from 'react';
import type {CanvasObjectCreationHandle} from '@/components/rac-editor/@canvas/ports/CanvasObjectCreationHandle.ts';
import type {CanvasScreenProjectionHandle} from '@/components/rac-editor/@canvas/ports/CanvasScreenProjectionHandle.ts';
import type {CanvasDrawingModeHandle} from '@/components/rac-editor/@canvas/ports/CanvasSurfaceHandle.ts';
import {CanvasObject, ElementStrategyKey} from '@/components/rac-editor/@canvas/lib';
import {TIMINGS} from '@/shared/config.ts';
import {TutorialBalloonState} from '@/components/rac-editor/lib/tutorial.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import type {TutorialTipKey} from '@/components/rac-editor/ports/TutorialProgressPort.ts';

interface UseCanvasToolsArgs {
  canvasRef: RefObject<(
    CanvasDrawingModeHandle
    & CanvasObjectCreationHandle
    & CanvasScreenProjectionHandle
  ) | null>;
  addObjectToCanvas: (object: CanvasObject) => void;
  closeAllMenus: () => void;
  disableDrawingMode: () => void;
  isDrawing: boolean;
  setIsDrawing: Dispatch<SetStateAction<boolean>>;
  setInfoMessage: Dispatch<SetStateAction<string>>;
  setTutorialBalloon: Dispatch<SetStateAction<TutorialBalloonState | null>>;
}

interface TutorialConfig {
  key: TutorialTipKey;
  message: string;
}

export function useCanvasTools({
  canvasRef,
  addObjectToCanvas,
  closeAllMenus,
  disableDrawingMode,
  isDrawing,
  setIsDrawing,
  setInfoMessage,
  setTutorialBalloon,
}: UseCanvasToolsArgs) {
  const {tutorialProgressPort} = useEditorPorts();

  const showTutorialBalloon =
    useCallback((object: CanvasObject, text: string) => {
      const point = canvasRef.current?.getCanvasPointScreenPosition(object.getCenterPoint());
      if (!point) return;

      setTutorialBalloon({position: point, text});
    }, [canvasRef, setTutorialBalloon]);

  const addCanvasObject = useCallback((
    kind: ElementStrategyKey,
    tutorial?: TutorialConfig,
  ) => {
    closeAllMenus();
    const object = canvasRef.current?.createElementObject(kind);
    if (!object) return null;

    addObjectToCanvas(object);

    if (tutorial && !tutorialProgressPort.isTutorialTipShown(tutorial.key)) {
      tutorialProgressPort.markTutorialTipShown(tutorial.key);
      setTimeout(() => showTutorialBalloon(object, tutorial.message), TIMINGS.tutorialBalloonDelayMs);
    }

    return object;
  }, [addObjectToCanvas, canvasRef, closeAllMenus, showTutorialBalloon, tutorialProgressPort]);

  const handleAddWall = useCallback(() => {
    addCanvasObject('wall', {
      key: 'wall',
      message: 'Clique duas vezes para definir ou alterar o nome do objeto.',
    });
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
    addCanvasObject('line', {
      key: 'line',
      message: 'Clique duas vezes para definir um texto ou a cor da linha reta.',
    });
  }, [addCanvasObject]);

  const handleAddArrow = useCallback(() => {
    addCanvasObject('arrow', {
      key: 'arrow',
      message: 'Clique duas vezes para definir um texto ou a cor da seta simples.',
    });
  }, [addCanvasObject]);

  const handleAddDistance = useCallback(() => {
    addCanvasObject('distance', {
      key: 'distance',
      message: 'Clique duas vezes para definir um texto ou a cor da distância.',
    });
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

    const text = canvasRef.current?.createElementObject('text');
    if (!text) return;

    addObjectToCanvas(text);
  }, [addObjectToCanvas, canvasRef, disableDrawingMode]);

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
