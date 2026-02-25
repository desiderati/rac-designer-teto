import {useMemo} from 'react';
import {useGenericObjectEditors} from './useGenericObjectEditors.ts';

interface UseGenericObjectEditorBindingsArgs {
  isPilotiEditorOpen: boolean;
}

export function useGenericObjectEditorBindings({
  isPilotiEditorOpen,
}: UseGenericObjectEditorBindingsArgs) {
  const genericObjectEditors = useGenericObjectEditors();

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
