import {
  useToolbarActions,
  type UseToolbarActionsArgs,
} from '@/components/rac-editor/hooks/toolbar/useToolbarActions.ts';
import {useToolbarHouseViewCounts} from '@/components/rac-editor/hooks/toolbar/useToolbarHouseViewCounts.ts';

/**
 * Monta o modelo consumido pela toolbar do editor RAC.
 */
export function useRacEditorToolbarModel(actions: UseToolbarActionsArgs) {
  const {
    currentHouseType,
    frontViewCount,
    backViewCount,
    side1ViewCount,
    side2ViewCount,
  } = useToolbarHouseViewCounts();

  return {
    toolbarActions: useToolbarActions(actions),
    currentHouseType,
    frontViewCount,
    backViewCount,
    side1ViewCount,
    side2ViewCount,
  };
}
