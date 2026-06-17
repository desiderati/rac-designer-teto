import {useCallback} from 'react';
import {useHouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-store.ts';
import {
  CanvasGroup,
} from '@/components/rac-editor/@canvas/lib';
import {
  ContraventamentoOrigin,
  ContraventamentoSide,
  createContraventamentoEditorState,
} from '@/shared/types/contraventamento.ts';
import {
  collectOccupiedHorizontalContraventamentoSides,
  collectOccupiedContraventamentoSides,
  ContraventamentoCandidate,
} from '@/components/rac-editor/@canvas/lib/contraventamento-geometry.ts';
import {parsePilotiGridPosition} from '@/shared/types/piloti.ts';
import {
  getAllowedHorizontalContraventamentoSidesForRow,
  getContraventamentoOrientationBySide,
  hasEligiblePilotiForContraventamentoInColumn,
  hasEligiblePilotiForContraventamentoInRow,
  isHouseContraventamentoDestinationEligible,
  isHouseHorizontalContraventamentoDestinationEligible,
} from '@/domain/house/use-cases/house-contraventamento.use-case.ts';

interface UseContraventamentoQueriesArgs {
  contraventamentoFirst: ContraventamentoOrigin | null;
  contraventamentoSide: ContraventamentoSide | null;
  pilotiIdForEditor: string | null;
}

export function useContraventamentoQueries({
  contraventamentoFirst,
  contraventamentoSide,
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

  const getContraventamentoHorizontalSides =
    useCallback((group: CanvasGroup, row: number) => {
      return collectOccupiedHorizontalContraventamentoSides({
        objects: group.getCanvasObjects(),
        row,
        onResolvedSide: (object, side) => {
          (object as ContraventamentoCandidate & { contraventamentoSide?: unknown }).contraventamentoSide = side;
        },
      });
    }, []);

  const isPilotiEligibleAsDestination = useCallback((
    pilotiId: string,
    firstOverride?: { col: number; row: number } | null,
    sideOverride?: ContraventamentoSide | null,
  ): boolean => {
    const first = firstOverride ?? contraventamentoFirst;
    const side = sideOverride ?? contraventamentoSide;
    if (!first) return false;

    const parsed = parsePilotiGridPosition(pilotiId);
    if (!parsed) return false;

    const orientation = getContraventamentoOrientationBySide(side);
    if (orientation === 'vertical') {
      return isHouseContraventamentoDestinationEligible({
        first,
        candidate: parsed,
        pilotis: houseSnapshot?.pilotis ?? {},
      });
    }

    if (orientation === 'horizontal') {
      return isHouseHorizontalContraventamentoDestinationEligible({
        first,
        candidate: parsed,
        side,
        pilotis: houseSnapshot?.pilotis ?? {},
      });
    }

    return false;
  }, [contraventamentoFirst, contraventamentoSide, houseSnapshot]);

  const isPilotiEligibleForContraventamentoColumn = useCallback((pilotiId: string): boolean => {
    const parsed = parsePilotiGridPosition(pilotiId);
    if (!parsed) return false;

    return hasEligiblePilotiForContraventamentoInColumn({
      col: parsed.col,
      pilotis: houseSnapshot?.pilotis ?? {},
    });
  }, [houseSnapshot]);

  const isPilotiEligibleForContraventamentoRow = useCallback((pilotiId: string): boolean => {
    const parsed = parsePilotiGridPosition(pilotiId);
    if (!parsed) return false;

    return hasEligiblePilotiForContraventamentoInRow({
      row: parsed.row,
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
    const occupiedHorizontalSides = getContraventamentoHorizontalSides(topGroup, parsed.row);
    const canReceiveContraventamento = isPilotiEligibleForContraventamentoColumn(pilotiIdForEditor);
    const canReceiveHorizontalContraventamento =
      isPilotiEligibleForContraventamentoRow(pilotiIdForEditor);
    const allowedHorizontalSides = getAllowedHorizontalContraventamentoSidesForRow(parsed.row);

    return createContraventamentoEditorState({
      canReceiveContraventamento,
      occupiedSides,
      canReceiveHorizontalContraventamento,
      occupiedHorizontalSides,
      allowedHorizontalSides,
    });
  }, [
    getContraventamentoColumnSides,
    getContraventamentoHorizontalSides,
    getTopViewGroup,
    isPilotiEligibleForContraventamentoColumn,
    isPilotiEligibleForContraventamentoRow,
    pilotiIdForEditor,
  ]);

  return {
    getTopViewGroup,
    getNonTopViewGroups,
    getContraventamentoColumnSides,
    getContraventamentoHorizontalSides,
    isPilotiEligibleForContraventamentoColumn,
    isPilotiEligibleForContraventamentoRow,
    isPilotiEligibleAsDestination,
    getContraventamentoEditorState,
  };
}
