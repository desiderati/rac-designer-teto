import {RefObject, useCallback} from 'react';
import type {CanvasHandle, wallSelection} from '@/components/rac-editor/canvas/Canvas.tsx';
import {Group} from 'fabric';
import {CanvasObject} from '@/components/lib/canvas/canvas.ts';
import {
  getGenericObjectEditorStrategy
} from '@/components/rac-editor/modals/editors/generic/strategies/generic-object-editor-strategy.ts';

interface UseWallEditorActionsArgs {
  canvasRef: RefObject<CanvasHandle | null>;
  wallSelection: wallSelection | null;
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
    const canvas = canvasRef.current?.canvas;
    const object = wallSelection?.object;
    if (!canvas || !object) return;

    const strategy = getGenericObjectEditorStrategy('wall');
    strategy.apply({
      canvas,
      object,
      color: newColor,
      label: newValue,
    });

    canvasRef.current?.saveHistory();
    setInfoMessage(strategy.getInfoMessage());
    return;
  }, [canvasRef, wallSelection, setInfoMessage]);

  const resolveWallEditorColor = useCallback(() => {
    const wall = wallSelection?.object as Group | undefined;
    if (!wall || wall.type !== 'group') return '#666666';

    const wallChildren = (wall as CanvasObject).getObjects?.() ?? [];
    const wallBody = wallChildren.find(
      (child) => child.myType === 'wallBody'
    ) as CanvasObject | undefined;

    return (wallBody?.stroke as string) || '#666666';
  }, [wallSelection?.object]);

  return {
    handleWallApply,
    resolveWallEditorColor,
  };
}
