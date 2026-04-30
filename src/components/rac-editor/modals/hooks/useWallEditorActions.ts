import {RefObject, useCallback} from 'react';
import type {WallCanvasSelection} from '@/components/rac-editor/canvas/ports/CanvasSelectionPort.ts';
import type {CanvasHandle} from '@/components/rac-editor/canvas/ports/CanvasInteractionPort.ts';
import {isCanvasGroup} from '@/components/rac-editor/canvas/lib';
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
    const object = wallSelection?.object;
    if (!object) return;

    const infoMessage = canvasRef.current?.applyGenericObjectEdit({
      kind: 'wall',
      object,
      color: newColor,
      label: newValue,
    });
    if (!infoMessage) return;

    setInfoMessage(infoMessage);
    return;
  }, [canvasRef, wallSelection, setInfoMessage]);

  const resolveWallEditorColor = useCallback(() => {
    const wall = wallSelection?.object;
    if (!isCanvasGroup(wall)) return CANVAS_ELEMENT_STYLE.strokeColor.wallElement;

    const wallChildren = wall.getCanvasObjects() ?? [];
    const wallBody = wallChildren.find(
      (child) => child.myType === 'wallBody'
    );

    return (wallBody?.stroke as string) || CANVAS_ELEMENT_STYLE.strokeColor.wallElement;
  }, [wallSelection?.object]);

  return {
    handleWallApply,
    resolveWallEditorColor,
  };
}



