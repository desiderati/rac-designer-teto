import {useCallback} from 'react';
import {Canvas as FabricCanvas, FabricObject, Group} from 'fabric';
import {findTopViewGroupCandidate} from '@/components/rac-editor/lib/canvas/canvas-rebuild.ts';
import {houseManager} from '@/components/rac-editor/lib/house-manager.ts';
import {CanvasObject, ContraventamentoOrigin, parsePilotiGridPosition, toCanvasObject} from '@/components/rac-editor/lib/canvas';
import {
  canCreateContraventamentoForNivel,
  collectOccupiedContraventamentoSides,
  ContraventamentoCandidate,
  createContraventamentoEditorState,
  isContraventamentoDestinationEligible
} from '@/shared/types/contraventamento.ts';

interface UseContraventamentoQueriesArgs {
  getCanvas: () => FabricCanvas | null;
  contraventamentoFirst: ContraventamentoOrigin | null;
  pilotiIdForEditor: string | null;
}

export function useContraventamentoQueries({
  getCanvas,
  contraventamentoFirst,
  pilotiIdForEditor,
}: UseContraventamentoQueriesArgs) {

  const getTopViewGroup = useCallback((): Group | null => {
    const canvas = getCanvas();
    if (!canvas) return null;

    return findTopViewGroupCandidate(canvas.getObjects() as CanvasObject[]) as Group | null;
  }, [getCanvas]);

  const getNonTopViewGroups = useCallback((): Group[] => {
    return houseManager.getAllGroups().filter(
      (g) => toCanvasObject(g)?.houseView !== 'top'
    );
  }, []);

  const getContraventamentoColumnSides =
    useCallback((group: Group, col: number) => {
      return collectOccupiedContraventamentoSides({
        objects: group.getObjects() as FabricObject[],
        col,
        onResolvedSide: (object, side) => {
          (object as ContraventamentoCandidate & { contraventamentoSide?: unknown }).contraventamentoSide = side;
        },
      });
    }, []);

  const isPilotiEligibleAsDestination = useCallback((pilotiId: string): boolean => {
    if (!contraventamentoFirst) return false;

    const data = houseManager.getPilotiData(pilotiId);
    const parsed = parsePilotiGridPosition(pilotiId);
    if (!parsed) return false;

    return isContraventamentoDestinationEligible({
      first: contraventamentoFirst,
      candidate: parsed,
      nivel: data?.nivel ?? 0,
    });
  }, [contraventamentoFirst]);

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
    const canReceiveContraventamento = canCreateContraventamentoForNivel(data?.nivel ?? 0);

    return createContraventamentoEditorState({
      canReceiveContraventamento,
      occupiedSides,
    });
  }, [getContraventamentoColumnSides, getTopViewGroup, pilotiIdForEditor]);

  return {
    getTopViewGroup,
    getNonTopViewGroups,
    getContraventamentoColumnSides,
    isPilotiEligibleAsDestination,
    getContraventamentoEditorState,
  };
}
