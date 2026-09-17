import {
  useRacEditorMenuActions,
  type UseMenuActionsArgs,
} from '@/components/rac-editor/@menus/hooks/useRacEditorMenuActions.ts';
import {useRacEditorMenuHouseViewCounts} from '@/components/rac-editor/@menus/hooks/useRacEditorMenuHouseViewCounts.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';

/**
 * Monta o modelo consumido pelos menus do editor RAC.
 */
export function useRacEditorMenuModel(actions: UseMenuActionsArgs) {
  const {houseReadPort} = useEditorPorts();
  const {
    currentHouseType,
    frontViewCount,
    backViewCount,
    side1ViewCount,
    side2ViewCount,
  } = useRacEditorMenuHouseViewCounts(houseReadPort);

  return {
    menuActions: useRacEditorMenuActions(actions),
    currentHouseType,
    frontViewCount,
    backViewCount,
    side1ViewCount,
    side2ViewCount,
  };
}
