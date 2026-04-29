import {useCallback} from 'react';
import {useHouseSnapshot} from '@/components/rac-editor/lib/house-store.ts';
import {
  CanvasGroup,
  ContraventamentoOrigin,
} from '@/components/rac-editor/lib/canvas';
import {
  collectOccupiedContraventamentoSides,
  ContraventamentoCandidate,
  createContraventamentoEditorState,
  hasEligiblePilotiInContraventamentoColumn,
} from '@/shared/types/contraventamento.ts';
import {isPilotiOutOfProportion, parsePilotiGridPosition} from '@/shared/types/piloti.ts';

interface UseContraventamentoQueriesArgs {
  contraventamentoFirst: ContraventamentoOrigin | null;
  pilotiIdForEditor: string | null;
}

export function useContraventamentoQueries({
  contraventamentoFirst,
  pilotiIdForEditor,
}: UseContraventamentoQueriesArgs) {
  const houseSnapshot = useHouseSnapshot();

  const getTopViewGroup = useCallback((): CanvasGroup | null => {
    return houseSnapshot?.views.top[0]?.group ?? null;
  }, [houseSnapshot]);

  const getNonTopViewGroups = useCallback((): CanvasGroup[] => {
    if (!houseSnapshot) return [];

    return [
      ...houseSnapshot.views.front,
      ...houseSnapshot.views.back,
      ...houseSnapshot.views.side1,
      ...houseSnapshot.views.side2,
    ].map((view) => view.group);
  }, [houseSnapshot]);

  const getContraventamentoColumnSides =
    useCallback((group: CanvasGroup, col: number) => {
      return collectOccupiedContraventamentoSides({
        objects: group.getCanvasObjects(),
        col,
        onResolvedSide: (object, side) => {
          (object as ContraventamentoCandidate & { contraventamentoSide?: unknown }).contraventamentoSide = side;
        },
      });
    }, []);

  const isPilotiEligibleAsDestination = useCallback((pilotiId: string): boolean => {
    if (!contraventamentoFirst) return false;

    const parsed = parsePilotiGridPosition(pilotiId);
    if (!parsed) return false;

    const columnEnabled = hasEligiblePilotiInContraventamentoColumn({
      col: parsed.col,
      isPilotiEligible: (columnPilotiId) => {
        const data = houseSnapshot?.pilotis[columnPilotiId];
        return isPilotiOutOfProportion(
          Number(data?.height ?? 0),
          Number(data?.nivel ?? 0),
        );
      },
    });
    if (!columnEnabled) return false;

    return parsed.col === contraventamentoFirst.col
      && parsed.row !== contraventamentoFirst.row;
  }, [contraventamentoFirst, houseSnapshot]);

  const isPilotiEligibleForContraventamentoColumn = useCallback((pilotiId: string): boolean => {
    const parsed = parsePilotiGridPosition(pilotiId);
    if (!parsed) return false;

    return hasEligiblePilotiInContraventamentoColumn({
      col: parsed.col,
      isPilotiEligible: (columnPilotiId) => {
        const data = houseSnapshot?.pilotis[columnPilotiId];
        return isPilotiOutOfProportion(
          Number(data?.height ?? 0),
          Number(data?.nivel ?? 0),
        );
      },
    });
  }, [houseSnapshot]);

  const getContraventamentoEditorState = useCallback(() => {
    const disabled = createContraventamentoEditorState({
      canReceiveContraventamento: false,
      occupiedSides: {left: false, right: false},
    });

    if (!pilotiIdForEditor) return disabled;

    const topGroup = getTopViewGroup();
    if (!topGroup) return disabled;

    const parsed = parsePilotiGridPosition(pilotiIdForEditor);
    if (!parsed) return disabled;

    const occupiedSides = getContraventamentoColumnSides(topGroup, parsed.col);
    const canReceiveContraventamento = isPilotiEligibleForContraventamentoColumn(pilotiIdForEditor);

    return createContraventamentoEditorState({
      canReceiveContraventamento,
      occupiedSides,
    });
  }, [
    getContraventamentoColumnSides,
    getTopViewGroup,
    isPilotiEligibleForContraventamentoColumn,
    pilotiIdForEditor,
  ]);

  return {
    getTopViewGroup,
    getNonTopViewGroups,
    getContraventamentoColumnSides,
    isPilotiEligibleForContraventamentoColumn,
    isPilotiEligibleAsDestination,
    getContraventamentoEditorState,
  };
}
