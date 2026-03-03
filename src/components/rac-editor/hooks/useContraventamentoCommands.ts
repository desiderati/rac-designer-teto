import {Dispatch, RefObject, SetStateAction, useCallback} from 'react';
import {toast} from 'sonner';
import {CanvasHandle, ContraventamentoCanvasSelection,} from '@/components/rac-editor/ui/canvas/Canvas.tsx';
import {
  addContraventamentoBeam,
  CanvasGroup,
  ContraventamentoOrigin,
  PilotiCanvasSelection,
  removeContraventamentosFromTopView,
  syncContraventamentoElevationViews,
} from '@/components/rac-editor/lib/canvas';
import {emitHouseStoreChange} from '@/components/rac-editor/lib/house-store.ts';
import {houseManager} from '@/components/rac-editor/lib/house-manager.ts';
import {refreshAutoStairsInViews} from '@/components/rac-editor/lib/house-auto-stairs.ts';
import {
  ContraventamentoSide,
  getContraventamentoSideLabel,
  inferContraventamentoSide
} from '@/shared/types/contraventamento.ts';
import {ToolbarSubmenu} from '@/components/rac-editor/ui/toolbar/helpers/toolbar-types.ts';
import {TOAST_MESSAGES} from '@/shared/config.ts';
import {
  highlightEligibleContraventamentoPilotis,
  resetHighlightContraventamentoPilotis
} from '@/components/rac-editor/lib/canvas/contraventamento-top-view-highlight.ts';
import {parsePilotiGridPosition} from '@/shared/types/piloti.ts';

interface UseContraventamentoCommandsArgs {
  canvasRef: RefObject<CanvasHandle | null>;
  getTopViewGroup: () => CanvasGroup | null;
  getNonTopViewGroups: () => CanvasGroup[];
  getContraventamentoColumnSides: (group: CanvasGroup, col: number) => {
    left: boolean;
    right: boolean;
  };
  isPilotiEligibleForContraventamentoColumn: (pilotiId: string) => boolean;
  isPilotiEligibleAsDestination: (pilotiId: string) => boolean;
  setSelectedContraventamento: Dispatch<SetStateAction<ContraventamentoCanvasSelection | null>>;
  setIsContraventamentoMode: Dispatch<SetStateAction<boolean>>;
  contraventamentoFirst: ContraventamentoOrigin | null;
  setContraventamentoFirst: Dispatch<SetStateAction<ContraventamentoOrigin | null>>;
  contraventamentoSide: ContraventamentoSide | null;
  setContraventamentoSide: Dispatch<SetStateAction<ContraventamentoSide | null>>;
  resetContraventamentoFlow: () => void;
  pilotiSelection: PilotiCanvasSelection | null;
  setPilotiSelection: Dispatch<SetStateAction<PilotiCanvasSelection | null>>;
  setIsPilotiEditorOpen: Dispatch<SetStateAction<boolean>>;
  setActiveSubmenu: Dispatch<SetStateAction<ToolbarSubmenu>>;
}

export function useContraventamentoCommands({
  canvasRef,
  getTopViewGroup,
  getNonTopViewGroups,
  getContraventamentoColumnSides,
  isPilotiEligibleForContraventamentoColumn,
  isPilotiEligibleAsDestination,
  setSelectedContraventamento,
  setIsContraventamentoMode,
  contraventamentoFirst,
  setContraventamentoFirst,
  contraventamentoSide,
  setContraventamentoSide,
  resetContraventamentoFlow,
  pilotiSelection,
  setPilotiSelection,
  setIsPilotiEditorOpen,
  setActiveSubmenu,
}: UseContraventamentoCommandsArgs) {

  const enterSecondContraventamentoSelection = useCallback((
    first: ContraventamentoOrigin,
    side: ContraventamentoSide
  ) => {
    if (!first.group) {
      toast.error(TOAST_MESSAGES.topViewUnavailableForContraventamento);
      return;
    }

    setContraventamentoFirst(first);
    setContraventamentoSide(side);
    highlightEligibleContraventamentoPilotis(
      first.group,
      (candidatePilotiId) => isPilotiEligibleAsDestination(candidatePilotiId),
      first.col,
      first.pilotiId
    );

    toast.info(TOAST_MESSAGES.contraventamentoSideSelected(getContraventamentoSideLabel(side)));
  }, [isPilotiEligibleAsDestination, setContraventamentoFirst, setContraventamentoSide]);

  const syncContraventamentoElevations = useCallback(() => {
    const topGroup = getTopViewGroup();
    if (!topGroup) return;

    const targets = getNonTopViewGroups();
    syncContraventamentoElevationViews(
      topGroup,
      targets,
      (pilotiId) => houseManager.getPilotiData(pilotiId).nivel
    );

    // Reaplica auto-stairs após o sync do contraventamento para manter
    // a ordem visual correta das camadas nas vistas elevadas.
    const house = houseManager.getHouse();
    if (!house) return;

    refreshAutoStairsInViews({
      houseType: house.houseType,
      sideMappings: house.sideMappings,
      pilotis: house.pilotis,
      topView: house.views.top,
      elevationViews: [
        ...house.views.front,
        ...house.views.back,
        ...house.views.side1,
        ...house.views.side2,
      ],
    });

    topGroup.canvas?.requestRenderAll();
  }, [getNonTopViewGroups, getTopViewGroup]);

  const clearContraventamentoSelection = useCallback((group?: CanvasGroup | null) => {
    if (group) {
      resetHighlightContraventamentoPilotis(group);
    }
    setSelectedContraventamento(null);
  }, [setSelectedContraventamento]);

  const handleCancelContraventamento = useCallback(() => {
    const topGroup = getTopViewGroup();
    if (topGroup) resetHighlightContraventamentoPilotis(topGroup);

    resetContraventamentoFlow();
    toast.error(TOAST_MESSAGES.contraventamentoNotSelected);
  }, [getTopViewGroup, resetContraventamentoFlow]);

  const handleContraventamentoPilotiClick = useCallback((col: number, row: number) => {
    if (col !== contraventamentoFirst.col) {
      toast.warning(TOAST_MESSAGES.contraventamentoSelectSecondPilotiInSameColumn);
      return;
    }

    if (row === contraventamentoFirst.row) {
      toast.warning(TOAST_MESSAGES.contraventamentoSelectDifferentSecondPiloti);
      return;
    }

    const originGroup = contraventamentoFirst.group;
    if (!originGroup) {
      toast.error(TOAST_MESSAGES.topViewUnavailableForContraventamento);
      return;
    }

    const occupiedSides = getContraventamentoColumnSides(originGroup, col);
    if (occupiedSides[contraventamentoSide]) {
      const sideLabel = contraventamentoSide === 'left' ? 'esquerdo' : 'direito';
      toast.warning(TOAST_MESSAGES.contraventamentoColumnSideAlreadyOccupied(sideLabel));

      setContraventamentoFirst(null);
      setContraventamentoSide(null);
      return;
    }

    const createdId = addContraventamentoBeam(
      originGroup,
      {col, row: contraventamentoFirst.row},
      {col, row},
      {anchorPilotiId: contraventamentoFirst.pilotiId, side: contraventamentoSide}
    );

    if (!createdId) {
      toast.error(TOAST_MESSAGES.failedToCreateContraventamento);
      return;
    }

    setIsContraventamentoMode(false);
    setContraventamentoFirst(null);
    setContraventamentoSide(null);
    clearContraventamentoSelection(originGroup);
    syncContraventamentoElevations();

    canvasRef.current?.saveHistory();
    toast.success(TOAST_MESSAGES.contraventamentoAddedSuccessfully);
  }, [
    canvasRef,
    contraventamentoFirst,
    setContraventamentoFirst,
    contraventamentoSide,
    setContraventamentoSide,
    setIsContraventamentoMode,
    getContraventamentoColumnSides,
    clearContraventamentoSelection,
    syncContraventamentoElevations,
  ]);

  const handleContraventamentoSelect =
    useCallback((side: ContraventamentoSide) => {
      if (!pilotiSelection?.pilotiId) return;

      const topGroup = getTopViewGroup();
      if (!topGroup) {
        toast.error(TOAST_MESSAGES.addTopViewBeforeContraventamento);
        return;
      }

      const parsed = parsePilotiGridPosition(pilotiSelection.pilotiId);
      if (!parsed) return;

      const col = parsed.col;
      const row = parsed.row;
      if (!isPilotiEligibleForContraventamentoColumn(pilotiSelection.pilotiId)) {
        toast.warning(TOAST_MESSAGES.contraventamentoRequiresOutOfProportionColumn);
        return;
      }

      const occupiedSides = getContraventamentoColumnSides(topGroup, col);
      if (occupiedSides[side]) {
        const removed =
          removeContraventamentosFromTopView(topGroup, canvasObj => {
            if (!canvasObj) return false;

            if (Number(canvasObj.contraventamentoCol) !== col) return false;
            if (canvasObj.contraventamentoSide === 'left' || canvasObj.contraventamentoSide === 'right') {
              return canvasObj.contraventamentoSide === side;
            }

            const inferredSide = inferContraventamentoSide({
              col,
              left: Number(canvasObj.left ?? 0),
              width: Number(canvasObj.width ?? 0),
              scaleX: Number(canvasObj.scaleX ?? 1),
            });
            return inferredSide === side;
          });

        if (removed > 0) {
          syncContraventamentoElevations();
          canvasRef.current?.saveHistory();

          emitHouseStoreChange();
          toast.success(TOAST_MESSAGES.contraventamentoRemovedFromSide(getContraventamentoSideLabel(side)));
        }
        return;
      }

      const first = {pilotiId: pilotiSelection.pilotiId, col, row, group: topGroup};

      setIsPilotiEditorOpen(false);
      setPilotiSelection(null);
      setActiveSubmenu(null);
      setIsContraventamentoMode(true);
      enterSecondContraventamentoSelection(first, side);
    }, [
      canvasRef,
      enterSecondContraventamentoSelection,
      getTopViewGroup,
      getContraventamentoColumnSides,
      isPilotiEligibleForContraventamentoColumn,
      setActiveSubmenu,
      setIsPilotiEditorOpen,
      pilotiSelection,
      setPilotiSelection,
      setIsContraventamentoMode,
      syncContraventamentoElevations,
    ]);

  return {
    syncContraventamentoElevations,
    handleCancelContraventamento,
    handleContraventamentoPilotiClick,
    handleContraventamentoSelect,
  };
}
