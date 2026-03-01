import {RefObject, useCallback} from 'react';
import type {CanvasHandle, WallCanvasSelection} from '@/components/rac-editor/ui/canvas/Canvas.tsx';
import {toCanvasObject} from '@/components/rac-editor/lib/canvas';
import {
  getGenericObjectEditorStrategy
} from '@/components/rac-editor/ui/modals/editors/generic/strategies/generic-object-editor-strategy.ts';
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
    const wall = wallSelection?.object;
    if (!wall || wall.type !== 'group') return CANVAS_ELEMENT_STYLE.strokeColor.wallElement;

    const wallChildren = toCanvasObject(wall)?.getObjects?.() ?? [];
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



