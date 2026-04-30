import {RefObject, useCallback} from 'react';
import type {CanvasHandle} from '@/components/rac-editor/@canvas/ports/CanvasInteractionPort.ts';
import {useGenericObjectEditorBindings} from '@/components/rac-editor/@modals/hooks/useGenericObjectEditorBindings.ts';
import {useLinearEditorActions} from '@/components/rac-editor/@modals/hooks/useLinearEditorActions.ts';
import {useWallEditorActions} from '@/components/rac-editor/@modals/hooks/useWallEditorActions.ts';

interface UseRacEditorObjectEditorActionsArgs {
  canvasRef: RefObject<CanvasHandle | null>;
  isPilotiEditorOpen: boolean;
  setInfoMessage: (message: string) => void;
}

/**
 * Compõe os editores modais de objetos genéricos do canvas.
 */
export function useRacEditorObjectEditorActions({
  canvasRef,
  isPilotiEditorOpen,
  setInfoMessage,
}: UseRacEditorObjectEditorActionsArgs) {
  const {
    wallSelection,
    isWallEditorOpen,
    handleWallSelect,
    closeWallEditor,

    linearSelection,
    isLinearEditorOpen,
    handleLinearSelect,
    closeLinearEditor,

    isAnyEditorOpen,
  } = useGenericObjectEditorBindings({isPilotiEditorOpen});

  const {
    handleWallApply,
    resolveWallEditorColor,
  } = useWallEditorActions({
    canvasRef,
    wallSelection,
    setInfoMessage,
  });

  const {handleLinearApply} = useLinearEditorActions({
    canvasRef,
    linearSelection,
    setInfoMessage,
  });

  const onLinearApply = useCallback(
    (newValue: string, newColor: string) => {
      handleLinearApply(newValue, newColor);
    }, [handleLinearApply],
  );

  return {
    wallSelection,
    isWallEditorOpen,
    handleWallSelect,
    closeWallEditor,
    handleWallApply,
    wallEditorColor: resolveWallEditorColor(),

    linearSelection,
    isLinearEditorOpen,
    handleLinearSelect,
    closeLinearEditor,
    onLinearApply,

    isAnyEditorOpen,
  };
}
