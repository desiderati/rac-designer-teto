import {
  type UseMenuActionsArgs,
} from '@/components/rac-editor/menus/hooks/useRacEditorMenuActions.ts';
import {useRacEditorHouseReadModel} from '@/components/rac-editor/hooks/useRacEditorHouseReadModel.ts';
import {useRacEditorMenuModel} from '@/components/rac-editor/menus/hooks/useRacEditorMenuModel.ts';

interface UseRacEditorMenusControllerArgs {
  houseVersion: number;
  actions: UseMenuActionsArgs;
}

/**
 * Agrega o modelo visual dos menus e as leituras reativas da casa.
 */
export function useRacEditorMenuController({
  houseVersion,
  actions,
}: UseRacEditorMenusControllerArgs) {
  const menusModel = useRacEditorMenuModel(actions);
  const houseReadModel = useRacEditorHouseReadModel(houseVersion);

  return {
    ...menusModel,
    ...houseReadModel,
  };
}
