import {RefObject, useCallback} from 'react';
import type {WallCanvasSelection} from '@/components/rac-editor/canvas/ports/CanvasSelectionPort.ts';
import type {CanvasHandle} from '@/components/rac-editor/canvas/ports/CanvasInteractionPort.ts';
import {CANVAS_ELEMENT_STYLE} from '@/shared/config.ts';

interface UseWallEditorActionsArgs {
  canvasRef: RefObject<CanvasHandle | null>;
  wallSelection: WallCanvasSelection | null;
  setInfoMessage: (message: string) => void;
}

export function useWallEditorActions({
  canvasRef,
  wallSelection,
  setInfoMessage,
}: UseWallEditorActionsArgs) {

  const handleWallApply = useCallback((
    newValue: string,
    newColor: string
  ) => {
    const objectId = wallSelection?.objectId;
    if (!objectId) return;

    const infoMessage = canvasRef.current?.applyGenericObjectEdit({
      kind: 'wall',
      objectId,
      color: newColor,
      label: newValue,
    });
    if (!infoMessage) return;

    setInfoMessage(infoMessage);
    return;
  }, [canvasRef, wallSelection, setInfoMessage]);

  const resolveWallEditorColor = useCallback(
    () => wallSelection?.currentColor ?? CANVAS_ELEMENT_STYLE.strokeColor.wallElement,
    [wallSelection?.currentColor],
  );

  return {
    handleWallApply,
    resolveWallEditorColor,
  };
}



