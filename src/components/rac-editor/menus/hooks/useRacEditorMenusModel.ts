import {
  useMenuActions,
  type UseMenuActionsArgs,
} from '@/components/rac-editor/menus/hooks/useMenuActions.ts';
import {useMenuHouseViewCounts} from '@/components/rac-editor/menus/hooks/useMenuHouseViewCounts.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';

/**
 * Monta o modelo consumido pelos menus do editor RAC.
 */
export function useRacEditorMenusModel(actions: UseMenuActionsArgs) {
  const {houseReadPort} = useEditorPorts();
  const {
    currentHouseType,
    frontViewCount,
    backViewCount,
    side1ViewCount,
    side2ViewCount,
  } = useMenuHouseViewCounts(houseReadPort);

  return {
    menuActions: useMenuActions(actions),
    currentHouseType,
    frontViewCount,
    backViewCount,
    side1ViewCount,
    side2ViewCount,
  };
}
