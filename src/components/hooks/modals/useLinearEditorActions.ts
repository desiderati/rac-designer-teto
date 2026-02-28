import {RefObject, useCallback} from 'react';
import type {CanvasHandle, LinearCanvasSelection} from '@/components/rac-editor/canvas/Canvas.tsx';
import {
  getGenericObjectEditorStrategy
} from '@/components/rac-editor/modals/editors/generic/strategies/generic-object-editor-strategy.ts';

export type LinearEditorType = 'wall' | 'line' | 'arrow' | 'distance';

interface UseLinearEditorActionsArgs {
  canvasRef: RefObject<CanvasHandle | null>;
  linearSelection: LinearCanvasSelection | null;
  setInfoMessage: (message: string) => void;
}

export function useLinearEditorActions({
  canvasRef,
  linearSelection,
  setInfoMessage,
}: UseLinearEditorActionsArgs) {

  const handleLinearApply =
    useCallback((newValue: string, newColor: string) => {
      const canvas = canvasRef.current?.canvas;
      const object = linearSelection?.object;
      if (!canvas || !object) return;

      const strategy = getGenericObjectEditorStrategy(linearSelection.myType);
      strategy.apply({
        canvas,
        object,
        color: newColor,
        label: newValue,
      });

      canvasRef.current?.saveHistory();
      setInfoMessage(strategy.getInfoMessage());
    }, [canvasRef, linearSelection, setInfoMessage]);

  return {
    handleLinearApply,
  };
}
