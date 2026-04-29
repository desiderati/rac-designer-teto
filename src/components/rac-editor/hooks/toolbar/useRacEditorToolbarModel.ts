import {
  useToolbarActions,
  type UseToolbarActionsArgs,
} from '@/components/rac-editor/hooks/toolbar/useToolbarActions.ts';
import {useToolbarHouseViewCounts} from '@/components/rac-editor/hooks/toolbar/useToolbarHouseViewCounts.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';

/**
 * Monta o modelo consumido pela toolbar do editor RAC.
 */
export function useRacEditorToolbarModel(actions: UseToolbarActionsArgs) {
  const {houseReadPort} = useEditorPorts();
  const {
    currentHouseType,
    frontViewCount,
    backViewCount,
    side1ViewCount,
    side2ViewCount,
  } = useToolbarHouseViewCounts(houseReadPort);

  return {
    toolbarActions: useToolbarActions(actions),
    currentHouseType,
    frontViewCount,
    backViewCount,
    side1ViewCount,
    side2ViewCount,
  };
}
