import {
  type UseToolbarActionsArgs,
} from '@/components/rac-editor/hooks/toolbar/useToolbarActions.ts';
import {useRacEditorHouseReadModel} from '@/components/rac-editor/hooks/useRacEditorHouseReadModel.ts';
import {useRacEditorToolbarModel} from '@/components/rac-editor/hooks/toolbar/useRacEditorToolbarModel.ts';

interface UseRacEditorToolbarControllerArgs {
  houseVersion: number;
  actions: UseToolbarActionsArgs;
}

/**
 * Agrega o modelo visual da toolbar e as leituras reativas da casa.
 */
export function useRacEditorToolbarController({
  houseVersion,
  actions,
}: UseRacEditorToolbarControllerArgs) {
  const toolbarModel = useRacEditorToolbarModel(actions);
  const houseReadModel = useRacEditorHouseReadModel(houseVersion);

  return {
    ...toolbarModel,
    ...houseReadModel,
  };
}
