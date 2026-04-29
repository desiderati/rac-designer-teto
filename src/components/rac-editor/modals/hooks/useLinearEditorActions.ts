import {RefObject, useCallback} from 'react';
import type {LinearCanvasSelection} from '@/components/rac-editor/canvas/store/CanvasSelectionPort.ts';
import type {CanvasHandle} from '@/components/rac-editor/canvas/store/CanvasInteractionPort.ts';
import {
  GenericObjectEditorType
} from '@/components/rac-editor/canvas/lib/generic-object-editor-strategy.ts';

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
      const object = linearSelection?.object;
      if (!object) return;

      const infoMessage = canvasRef.current?.applyGenericObjectEdit({
        kind: linearSelection.myType as GenericObjectEditorType,
        object,
        color: newColor,
        label: newValue,
      });
      if (!infoMessage) return;

      setInfoMessage(infoMessage);
    }, [canvasRef, linearSelection, setInfoMessage]);

  return {
    handleLinearApply,
  };
}
