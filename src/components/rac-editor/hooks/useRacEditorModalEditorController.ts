import {usePilotiEditorActions} from '@/components/rac-editor/@modals/hooks/usePilotiEditorActions.ts';
import {useRacEditorObjectEditorActions} from '@/components/rac-editor/hooks/useRacEditorObjectEditorActions.ts';

type PilotiEditorArgs = Parameters<typeof usePilotiEditorActions>[0];
type ObjectEditorArgs = Parameters<typeof useRacEditorObjectEditorActions>[0];

type UseRacEditorModalEditorControllerArgs = PilotiEditorArgs & ObjectEditorArgs;

/**
 * Agrupa os editores modais acionados a partir de seleção no canvas.
 */
export function useRacEditorModalEditorController(args: UseRacEditorModalEditorControllerArgs) {
  const pilotiActions = usePilotiEditorActions(args);
  const objectActions = useRacEditorObjectEditorActions(args);

  return {
    ...pilotiActions,
    ...objectActions,
  };
}
