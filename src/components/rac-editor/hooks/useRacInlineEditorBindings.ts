import {useMemo} from 'react';
import {useRacInlineEditors} from './useRacInlineEditors';

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
      inlineEditors.isDistanceEditorOpen ||
      inlineEditors.isObjectNameEditorOpen ||
      inlineEditors.isLineArrowEditorOpen
    );
  }, [
    isPilotiEditorOpen,
    inlineEditors.isDistanceEditorOpen,
    inlineEditors.isObjectNameEditorOpen,
    inlineEditors.isLineArrowEditorOpen,
  ]);

  return {
    ...inlineEditors,
    isEditorOpen,
    canvasSelectionBindings: {
      onDistanceSelect: inlineEditors.handleDistanceSelect,
      onObjectNameSelect: inlineEditors.handleObjectNameSelect,
      onLineArrowSelect: inlineEditors.handleLineArrowSelect,
    },
  };
}
