import {RefObject, useCallback} from 'react';
import type {
  GenericCanvasObjectEditorType,
  LinearCanvasSelection,
} from '@/components/rac-editor/@canvas/ports/CanvasSelectionPort.ts';
import type {CanvasEditorVisualHandle} from '@/components/rac-editor/@canvas/ports/CanvasEditorVisualHandle.ts';

export type LinearEditorType = 'wall' | 'line' | 'arrow' | 'distance';

interface UseLinearEditorActionsArgs {
  canvasRef: RefObject<CanvasEditorVisualHandle | null>;
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
      const objectId = linearSelection?.objectId;
      if (!objectId) return;

      const infoMessage = canvasRef.current?.applyGenericObjectEdit({
        kind: linearSelection.myType as GenericCanvasObjectEditorType,
        objectId,
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
