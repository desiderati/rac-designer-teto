import {Dispatch, RefObject, SetStateAction, useCallback} from 'react';
import {toast} from 'sonner';
import type {
  ContraventamentoCanvasSelection,
  PilotiCanvasSelection,
} from '@/components/rac-editor/@canvas/ports/CanvasSelectionPort.ts';
import type {CanvasHistoryHandle} from '@/components/rac-editor/@canvas/ports/CanvasHistoryHandle.ts';
import type {CanvasRenderHandle} from '@/components/rac-editor/@canvas/ports/CanvasSurfaceHandle.ts';
import {
  addContraventamentoBeam,
  addHorizontalContraventamentoBeam,
  CanvasGroup,
  removeContraventamentosFromTopView,
  syncContraventamentoElevationViews,
} from '@/components/rac-editor/@canvas/lib';
import {useHouseRuntimeSnapshot, useHouseStoreEmitter} from '@/components/rac-editor/lib/house-store.ts';
import {refreshAutoStairsInViews} from '@/components/rac-editor/@canvas/lib/house-auto-stairs.ts';
import type {
  ContraventamentoOrigin,
  ContraventamentoHorizontalSide,
  ContraventamentoSide,
  ContraventamentoVerticalSide,
} from '@/shared/types/contraventamento.ts';
import {
  getContraventamentoSideLabel,
  isContraventamentoHorizontalSide,
  isContraventamentoVerticalSide,
} from '@/shared/types/contraventamento.ts';
import {
  collectOccupiedHorizontalContraventamentoSides,
  getContraventamentoOrientation,
} from '@/components/rac-editor/@canvas/lib/contraventamento-geometry.ts';
import {
  canUseHorizontalContraventamentoSideInRow,
  getContraventamentoOrientationBySide,
} from '@/domain/house/use-cases/house-contraventamento.use-case.ts';
import {MenuSubmenu} from '@/components/rac-editor/@menus/lib/menu-types.ts';
import {TOAST_MESSAGES} from '@/shared/config.ts';
import {
  highlightEligibleContraventamentoPilotis,
  resetHighlightContraventamentoPilotis
} from '@/components/rac-editor/@canvas/lib/contraventamento-top-view-highlight.ts';
import {parsePilotiGridPosition} from '@/shared/types/piloti.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';

interface UseContraventamentoCommandsArgs {
  canvasRef: RefObject<(CanvasHistoryHandle & CanvasRenderHandle) | null>;
  getTopViewGroup: () => CanvasGroup | null;
  getNonTopViewGroups: () => CanvasGroup[];
  getContraventamentoColumnSides: (group: CanvasGroup, col: number) => {
    left: boolean;
    right: boolean;
  };
  getContraventamentoHorizontalSides: (
    group: CanvasGroup,
    row: number,
    target?: { col?: number; startCol?: number; endCol?: number },
  ) => {
    top: boolean;
    bottom: boolean;
  };
  isPilotiEligibleForContraventamentoColumn: (pilotiId: string) => boolean;
  isPilotiEligibleForContraventamentoRow: (pilotiId: string) => boolean;
  isPilotiEligibleAsDestination: (
    pilotiId: string,
    first?: { col: number; row: number } | null,
    side?: ContraventamentoSide | null,
  ) => boolean;
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
  setActiveSubmenu: Dispatch<SetStateAction<MenuSubmenu>>;
}

export function useContraventamentoCommands({
  canvasRef,
  getTopViewGroup,
  getNonTopViewGroups,
  getContraventamentoColumnSides,
  getContraventamentoHorizontalSides,
  isPilotiEligibleForContraventamentoColumn,
  isPilotiEligibleForContraventamentoRow,
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
  const {settingsPort} = useEditorPorts();
  const houseSnapshot = useHouseRuntimeSnapshot<CanvasGroup>();
  const emitHouseStoreChange = useHouseStoreEmitter();

  const enterSecondContraventamentoSelection = useCallback((
    first: ContraventamentoOrigin,
    side: ContraventamentoSide
  ) => {
    const topGroup = getTopViewGroup();
    if (!topGroup) {
      toast.error(TOAST_MESSAGES.topViewUnavailableForContraventamento);
      return;
    }

    setContraventamentoFirst(first);
    setContraventamentoSide(side);
    const orientation = getContraventamentoOrientationBySide(side);
    highlightEligibleContraventamentoPilotis(
      topGroup,
      (candidatePilotiId) => isPilotiEligibleAsDestination(candidatePilotiId, first, side),
      orientation === 'vertical' ? first.col : undefined,
      first.pilotiId,
      orientation === 'horizontal' ? first.row : undefined,
    );

    const sideLabel = getContraventamentoSideLabel(side);
    toast.info(
      orientation === 'horizontal'
        ? TOAST_MESSAGES.horizontalContraventamentoSideSelected(sideLabel)
        : TOAST_MESSAGES.contraventamentoSideSelected(sideLabel)
    );
  }, [getTopViewGroup, isPilotiEligibleAsDestination, setContraventamentoFirst, setContraventamentoSide]);

  const syncContraventamentoElevations = useCallback(() => {
    const topGroup = getTopViewGroup();
    if (!topGroup) return;

    const house = houseSnapshot;
    if (house) {
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
        showStairsOnTopView: settingsPort.getSettings().showStairsOnTopView,
      });
    }

    const targets = getNonTopViewGroups();
    syncContraventamentoElevationViews(
      topGroup,
      targets,
      (pilotiId) => houseSnapshot?.pilotis[pilotiId]?.nivel ?? 0
    );

    canvasRef.current?.renderAll();
  }, [canvasRef, getNonTopViewGroups, getTopViewGroup, houseSnapshot, settingsPort]);

  const clearContraventamentoSelection = useCallback((group?: CanvasGroup | null) => {
    if (group) {
      resetHighlightContraventamentoPilotis(group);
    }
    setSelectedContraventamento(null);
  }, [setSelectedContraventamento]);

  const resetContraventamentoAnchor = useCallback(() => {
    setContraventamentoFirst(null);
    setContraventamentoSide(null);
  }, [setContraventamentoFirst, setContraventamentoSide]);

  const beginContraventamentoInsertion = useCallback((
    first: ContraventamentoOrigin,
    side: ContraventamentoSide,
  ) => {
    setIsPilotiEditorOpen(false);
    setPilotiSelection(null);
    setActiveSubmenu(null);
    setIsContraventamentoMode(true);
    enterSecondContraventamentoSelection(first, side);
  }, [
    enterSecondContraventamentoSelection,
    setActiveSubmenu,
    setIsContraventamentoMode,
    setIsPilotiEditorOpen,
    setPilotiSelection,
  ]);

  const finishContraventamentoInsertion = useCallback((
    originGroup: CanvasGroup,
    successMessage: string,
  ) => {
    setIsContraventamentoMode(false);
    resetContraventamentoAnchor();
    clearContraventamentoSelection(originGroup);
    syncContraventamentoElevations();

    canvasRef.current?.saveHistory();
    toast.success(successMessage);
  }, [
    canvasRef,
    clearContraventamentoSelection,
    resetContraventamentoAnchor,
    setIsContraventamentoMode,
    syncContraventamentoElevations,
  ]);

  const finishContraventamentoRemoval = useCallback((successMessage: string) => {
    syncContraventamentoElevations();
    canvasRef.current?.saveHistory();
    emitHouseStoreChange();
    toast.success(successMessage);
  }, [canvasRef, emitHouseStoreChange, syncContraventamentoElevations]);

  const handleCancelContraventamento = useCallback(() => {
    const topGroup = getTopViewGroup();
    if (topGroup) resetHighlightContraventamentoPilotis(topGroup);

    resetContraventamentoFlow();
    toast.error(TOAST_MESSAGES.contraventamentoNotSelected);
  }, [getTopViewGroup, resetContraventamentoFlow]);

  const handleContraventamentoPilotiClick = useCallback((col: number, row: number) => {
    if (!contraventamentoFirst || !contraventamentoSide) return;

    const orientation = getContraventamentoOrientationBySide(contraventamentoSide);
    if (orientation === 'horizontal') {
      if (!isContraventamentoHorizontalSide(contraventamentoSide)) return;

      if (row !== contraventamentoFirst.row) {
        toast.warning(TOAST_MESSAGES.contraventamentoSelectSecondPilotiInSameRow);
        return;
      }

      if (col === contraventamentoFirst.col) {
        toast.warning(TOAST_MESSAGES.contraventamentoSelectDifferentSecondPiloti);
        return;
      }

      const destinationPilotiId = `piloti_${col}_${row}`;
      if (!isPilotiEligibleAsDestination(destinationPilotiId)) {
        toast.warning(TOAST_MESSAGES.contraventamentoRequiresOutOfProportionRow);
        return;
      }

      const originGroup = getTopViewGroup();
      if (!originGroup) {
        toast.error(TOAST_MESSAGES.topViewUnavailableForContraventamento);
        return;
      }

      const occupiedSides = getContraventamentoHorizontalSides(originGroup, row, {
        startCol: contraventamentoFirst.col,
        endCol: col,
      });
      if (occupiedSides[contraventamentoSide]) {
        toast.warning(
          TOAST_MESSAGES.contraventamentoRowSideAlreadyOccupied(
            getContraventamentoSideLabel(contraventamentoSide)
          )
        );

        resetContraventamentoAnchor();
        return;
      }

      const createdId = addHorizontalContraventamentoBeam(
        originGroup,
        {col: contraventamentoFirst.col, row},
        {col, row},
        {anchorPilotiId: contraventamentoFirst.pilotiId, side: contraventamentoSide},
      );

      if (!createdId) {
        toast.error(TOAST_MESSAGES.failedToCreateContraventamento);
        return;
      }

      finishContraventamentoInsertion(originGroup, TOAST_MESSAGES.contraventamentoHorizontalAdded);
      return;
    }

    if (!isContraventamentoVerticalSide(contraventamentoSide)) return;

    if (col !== contraventamentoFirst.col) {
      toast.warning(TOAST_MESSAGES.contraventamentoSelectSecondPilotiInSameColumn);
      return;
    }

    if (row === contraventamentoFirst.row) {
      toast.warning(TOAST_MESSAGES.contraventamentoSelectDifferentSecondPiloti);
      return;
    }

    const destinationPilotiId = `piloti_${col}_${row}`;
    if (!isPilotiEligibleAsDestination(destinationPilotiId)) {
      toast.warning(TOAST_MESSAGES.contraventamentoRequiresOutOfProportionColumn);
      return;
    }

    const originGroup = getTopViewGroup();
    if (!originGroup) {
      toast.error(TOAST_MESSAGES.topViewUnavailableForContraventamento);
      return;
    }

    const occupiedSides = getContraventamentoColumnSides(originGroup, col);
    if (occupiedSides[contraventamentoSide]) {
      toast.warning(
        TOAST_MESSAGES.contraventamentoColumnSideAlreadyOccupied(
          getContraventamentoSideLabel(contraventamentoSide)
        )
      );

      resetContraventamentoAnchor();
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

    finishContraventamentoInsertion(originGroup, TOAST_MESSAGES.contraventamentoAddedSuccessfully);
  }, [
    contraventamentoFirst,
    contraventamentoSide,
    finishContraventamentoInsertion,
    getContraventamentoColumnSides,
    getContraventamentoHorizontalSides,
    getTopViewGroup,
    isPilotiEligibleAsDestination,
    resetContraventamentoAnchor,
  ]);

  const handleContraventamentoSelect =
    useCallback((side: ContraventamentoVerticalSide, sourcePilotiId?: string) => {
      const selectedPilotiId = sourcePilotiId ?? pilotiSelection?.pilotiId;
      if (!selectedPilotiId) return;

      const topGroup = getTopViewGroup();
      if (!topGroup) {
        toast.error(TOAST_MESSAGES.addTopViewBeforeContraventamento);
        return;
      }

      const parsed = parsePilotiGridPosition(selectedPilotiId);
      if (!parsed) return;

      const col = parsed.col;
      const row = parsed.row;
      const occupiedSides = getContraventamentoColumnSides(topGroup, col);
      if (occupiedSides[side]) {
        const removed =
          removeContraventamentosFromTopView(topGroup, canvasObj => {
            if (!canvasObj) return false;

            if (Number(canvasObj.contraventamentoCol) !== col) return false;
            if (canvasObj.contraventamentoSide === 'left' || canvasObj.contraventamentoSide === 'right') {
              return canvasObj.contraventamentoSide === side;
            }

            return false;
          });

        if (removed > 0) {
          finishContraventamentoRemoval(
            TOAST_MESSAGES.contraventamentoRemovedFromSide(getContraventamentoSideLabel(side))
          );
        }
        return;
      }

      // Sem contraventamento existente no lado: daqui em diante é tentativa de inserção.
      if (!isPilotiEligibleForContraventamentoColumn(selectedPilotiId)) {
        toast.warning(TOAST_MESSAGES.contraventamentoRequiresOutOfProportionColumn);
        return;
      }

      const first = {pilotiId: selectedPilotiId, col, row};

      beginContraventamentoInsertion(first, side);
    }, [
      beginContraventamentoInsertion,
      finishContraventamentoRemoval,
      getTopViewGroup,
      getContraventamentoColumnSides,
      isPilotiEligibleForContraventamentoColumn,
      pilotiSelection,
    ]);

  const handleHorizontalContraventamentoSelect =
    useCallback((side: ContraventamentoHorizontalSide, sourcePilotiId?: string) => {
      const selectedPilotiId = sourcePilotiId ?? pilotiSelection?.pilotiId;
      if (!selectedPilotiId) return;

      const topGroup = getTopViewGroup();
      if (!topGroup) {
        toast.error(TOAST_MESSAGES.addTopViewBeforeContraventamento);
        return;
      }

      const parsed = parsePilotiGridPosition(selectedPilotiId);
      if (!parsed) return;

      const row = parsed.row;
      if (!canUseHorizontalContraventamentoSideInRow({row, side})) {
        toast.warning(TOAST_MESSAGES.contraventamentoRequiresOutOfProportionRow);
        return;
      }

      const occupiedSides = getContraventamentoHorizontalSides(topGroup, row, {col: parsed.col});
      if (occupiedSides[side]) {
        const removed =
          removeContraventamentosFromTopView(topGroup, canvasObj => (
            getContraventamentoOrientation(canvasObj) === 'horizontal'
            && Number(canvasObj.contraventamentoRow) === row
            && canvasObj.contraventamentoSide === side
            && collectOccupiedHorizontalContraventamentoSides({
              objects: [canvasObj],
              row,
              col: parsed.col,
            })[side]
          ));

        if (removed > 0) {
          finishContraventamentoRemoval(TOAST_MESSAGES.contraventamentoHorizontalRemoved);
        }
        return;
      }

      if (!isPilotiEligibleForContraventamentoRow(selectedPilotiId)) {
        toast.warning(TOAST_MESSAGES.contraventamentoRequiresOutOfProportionRow);
        return;
      }

      const first = {pilotiId: selectedPilotiId, col: parsed.col, row};

      beginContraventamentoInsertion(first, side);
    }, [
      beginContraventamentoInsertion,
      finishContraventamentoRemoval,
      getContraventamentoHorizontalSides,
      getTopViewGroup,
      isPilotiEligibleForContraventamentoRow,
      pilotiSelection,
    ]);

  return {
    syncContraventamentoElevations,
    handleCancelContraventamento,
    handleContraventamentoPilotiClick,
    handleContraventamentoSelect,
    handleHorizontalContraventamentoSelect,
  };
}
