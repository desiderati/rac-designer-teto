import {useMemo} from 'react';
import {useGenericObjectEditor} from './useGenericObjectEditor.ts';

interface UseGenericObjectEditorBindingsArgs {
  isPilotiEditorOpen: boolean;
}

export function useGenericObjectEditorBindings({
  isPilotiEditorOpen,
}: UseGenericObjectEditorBindingsArgs) {
  const genericObjectEditors = useGenericObjectEditor();

  const isAnyEditorOpen = useMemo(() => {
    return (
      isPilotiEditorOpen ||
      genericObjectEditors.isWallEditorOpen ||
      genericObjectEditors.isLinearEditorOpen
    );
  }, [
    isPilotiEditorOpen,
    genericObjectEditors.isWallEditorOpen,
    genericObjectEditors.isLinearEditorOpen,
  ]);

  return {
    isAnyEditorOpen,
    ...genericObjectEditors,
  };
}
