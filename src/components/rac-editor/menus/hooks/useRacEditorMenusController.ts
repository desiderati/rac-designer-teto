import {
  type UseMenuActionsArgs,
} from '@/components/rac-editor/menus/hooks/useMenuActions.ts';
import {useRacEditorHouseReadModel} from '@/components/rac-editor/hooks/useRacEditorHouseReadModel.ts';
import {useRacEditorMenusModel} from '@/components/rac-editor/menus/hooks/useRacEditorMenusModel.ts';

interface UseRacEditorMenusControllerArgs {
  houseVersion: number;
  actions: UseMenuActionsArgs;
}

/**
 * Agrega o modelo visual dos menus e as leituras reativas da casa.
 */
export function useRacEditorMenusController({
  houseVersion,
  actions,
}: UseRacEditorMenusControllerArgs) {
  const menusModel = useRacEditorMenusModel(actions);
  const houseReadModel = useRacEditorHouseReadModel(houseVersion);

  return {
    ...menusModel,
    ...houseReadModel,
  };
}
