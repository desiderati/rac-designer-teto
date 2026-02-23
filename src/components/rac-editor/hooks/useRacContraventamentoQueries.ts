import {useCallback} from 'react';
import {Canvas as FabricCanvas, FabricObject, Group} from 'fabric';
import {
  canCreateContraventamentoForNivel,
  collectOccupiedContraventamentoSides,
  createContraventamentoEditorState,
  isContraventamentoDestinationEligible,
  parsePilotiGridPosition,
} from '@/lib/domain/house-contraventamento-use-cases';
import {findTopViewGroupCandidate} from '@/lib/domain/house-canvas-source-use-cases';
import {ContraventamentoSide} from '@/lib/canvas-utils';
import {houseManager} from '@/lib/house-manager';

type ContraventamentoMetaObject = FabricObject & {
  houseView?: string;
  contraventamentoSide?: ContraventamentoSide;
};

interface ContraventamentoFirstPosition {
  col: number;
  row: number;
}

interface UseRacContraventamentoQueriesArgs {
  getCanvas: () => FabricCanvas | null;
  contraventamentoStep: 'select-first' | 'select-second';
  contraventamentoFirst: ContraventamentoFirstPosition | null;
  pilotiIdForEditor: string | null;
}

export function useRacContraventamentoQueries({
  getCanvas,
  contraventamentoStep,
  contraventamentoFirst,
  pilotiIdForEditor,
}: UseRacContraventamentoQueriesArgs) {
  const getTopViewGroup = useCallback((): Group | null => {
    const canvas = getCanvas();
    if (!canvas) return null;
    return findTopViewGroupCandidate(canvas.getObjects() as FabricObject[]) as Group | null;
  }, [getCanvas]);

  const getNonTopViewGroups = useCallback((): Group[] => {
    return houseManager.getAllGroups().filter((g) => (g as ContraventamentoMetaObject).houseView !== 'top');
  }, []);

  const getContraventamentoColumnSides = useCallback((group: Group, col: number) => {
    return collectOccupiedContraventamentoSides({
      objects: group.getObjects() as FabricObject[],
      col,
      onResolvedSide: (object, side) => {
        (object as ContraventamentoMetaObject).contraventamentoSide = side;
      },
    });
  }, []);

  const isPilotiEligibleAsOrigin = useCallback((pilotiId: string): boolean => {
    const data = houseManager.getPilotiData(pilotiId);
    if (!canCreateContraventamentoForNivel(data?.nivel ?? 0)) return false;

    const parsed = parsePilotiGridPosition(pilotiId);
    if (!parsed) return false;

    const topGroup = getTopViewGroup();
    if (!topGroup) return false;

    const occupiedSides = getContraventamentoColumnSides(topGroup, parsed.col);
    return !(occupiedSides.left && occupiedSides.right);
  }, [getContraventamentoColumnSides, getTopViewGroup]);

  const isPilotiEligibleAsDestination = useCallback((
    pilotiId: string,
    first: ContraventamentoFirstPosition | null
  ): boolean => {
    if (!first) return false;

    const data = houseManager.getPilotiData(pilotiId);
    const parsed = parsePilotiGridPosition(pilotiId);
    if (!parsed) return false;

    return isContraventamentoDestinationEligible({
      first,
      candidate: parsed,
      nivel: data?.nivel ?? 0,
    });
  }, []);

  const isPilotiEligible = useCallback((pilotiId: string): boolean => {
    if (contraventamentoStep === 'select-second') {
      return isPilotiEligibleAsDestination(pilotiId, contraventamentoFirst);
    }
    return isPilotiEligibleAsOrigin(pilotiId);
  }, [contraventamentoFirst, contraventamentoStep, isPilotiEligibleAsDestination, isPilotiEligibleAsOrigin]);

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
    const data = houseManager.getPilotiData(pilotiIdForEditor);
    const canReceiveContraventamento = (data?.nivel ?? 0) > 0.40;

    return createContraventamentoEditorState({
      canReceiveContraventamento,
      occupiedSides,
    });
  }, [getContraventamentoColumnSides, getTopViewGroup, pilotiIdForEditor]);

  return {
    getTopViewGroup,
    getNonTopViewGroups,
    getContraventamentoColumnSides,
    isPilotiEligibleAsOrigin,
    isPilotiEligibleAsDestination,
    isPilotiEligible,
    getContraventamentoEditorState,
  };
}
