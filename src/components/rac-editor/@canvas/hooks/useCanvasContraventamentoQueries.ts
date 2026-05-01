import {useCallback} from 'react';
import {useHouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-store.ts';
import {
  CanvasGroup,
} from '@/components/rac-editor/@canvas/lib';
import {
  collectOccupiedContraventamentoSides,
  ContraventamentoCandidate,
  ContraventamentoOrigin,
  createContraventamentoEditorState,
} from '@/shared/types/contraventamento.ts';
import {parsePilotiGridPosition} from '@/shared/types/piloti.ts';
import {
  hasEligiblePilotiForContraventamentoInColumn,
  isHouseContraventamentoDestinationEligible,
} from '@/domain/house/use-cases/house-contraventamento.use-case.ts';

interface UseContraventamentoQueriesArgs {
  contraventamentoFirst: ContraventamentoOrigin | null;
  pilotiIdForEditor: string | null;
}

export function useContraventamentoQueries({
  contraventamentoFirst,
  pilotiIdForEditor,
}: UseContraventamentoQueriesArgs) {
  const houseSnapshot = useHouseRuntimeSnapshot<CanvasGroup>();

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

    return isHouseContraventamentoDestinationEligible({
      first: contraventamentoFirst,
      candidate: parsed,
      pilotis: houseSnapshot?.pilotis ?? {},
    });
  }, [contraventamentoFirst, houseSnapshot]);

  const isPilotiEligibleForContraventamentoColumn = useCallback((pilotiId: string): boolean => {
    const parsed = parsePilotiGridPosition(pilotiId);
    if (!parsed) return false;

    return hasEligiblePilotiForContraventamentoInColumn({
      col: parsed.col,
      pilotis: houseSnapshot?.pilotis ?? {},
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
