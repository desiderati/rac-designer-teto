import {useMemo} from 'react';
import {useRacInlineEditors} from './useRacInlineEditors.ts';

interface UseRacInlineEditorBindingsArgs {
  isPilotiEditorOpen: boolean;
}

export function useRacInlineEditorBindings({
  isPilotiEditorOpen,
}: UseRacInlineEditorBindingsArgs) {
  const inlineEditors = useRacInlineEditors();

  const isEditorOpen = useMemo(() => {
    return (
      isPilotiEditorOpen ||
      inlineEditors.isObjectEditorOpen ||
      inlineEditors.isLineArrowDistanceEditorOpen
    );
  }, [
    isPilotiEditorOpen,
    inlineEditors.isObjectEditorOpen,
    inlineEditors.isLineArrowDistanceEditorOpen,
  ]);

  return {
    ...inlineEditors,
    isEditorOpen,
    canvasSelectionBindings: {
      onObjectSelect: inlineEditors.handleObjectSelect,
      onLineArrowDistanceSelect: inlineEditors.handleLineArrowDistanceSelect,
    },
  };
}
