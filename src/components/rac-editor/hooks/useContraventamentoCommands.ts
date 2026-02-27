import {Dispatch, RefObject, SetStateAction, useCallback} from 'react';
import {Group} from 'fabric';
import {toast} from 'sonner';
import {
  CanvasHandle,
  ContraventamentoCanvasSelection,
  PilotiCanvasSelection
} from '@/components/rac-editor/canvas/Canvas.tsx';
import {
  canCreateContraventamentoForNivel,
  getContraventamentoSideLabel,
  inferContraventamentoSideFromBeamGeometry,
  parsePilotiGridPosition,
} from '@/components/lib/helpers/house-contraventamento.ts';
import {
  addContraventamentoBeam,
  ContraventamentoOrigin,
  ContraventamentoStep,
  highlightContraventamentoPilotis,
  removeContraventamentosFromGroup,
  resetContraventamentoPilotis,
  setContraventamentoSelection,
  syncContraventamentoElevationsFromTop,
  toCanvasObject,
} from '@/components/lib/canvas';
import {emitHouseStoreChange} from '@/components/lib/house-store.ts';
import {houseManager} from '@/components/lib/house-manager.ts';
import {ContraventamentoSide} from '@/shared/types/contraventamento.ts';
import {ToolbarSubmenu} from '@/components/rac-editor/toolbar/helpers/toolbar-types.ts';
import {TOAST_MESSAGES} from '@/shared/config.ts';

interface UseContraventamentoCommandsArgs {
  canvasRef: RefObject<CanvasHandle | null>;
  getTopViewGroup: () => Group | null;
  getNonTopViewGroups: () => Group[];
  getContraventamentoColumnSides: (group: Group, col: number) => {
    left: boolean;
    right: boolean;
  };
  isPilotiEligibleAsOrigin: (pilotiId: string) => boolean;
  isPilotiEligibleAsDestination: (pilotiId: string, first: { col: number; row: number } | null) => boolean;
  setInfoMessage: Dispatch<SetStateAction<string>>;
  setSelectedContraventamento: Dispatch<SetStateAction<ContraventamentoCanvasSelection | null>>;
  setIsContraventamentoMode: Dispatch<SetStateAction<boolean>>;
  contraventamentoStep: ContraventamentoStep;
  setContraventamentoStep: Dispatch<SetStateAction<ContraventamentoStep>>;
  contraventamentoFirst: ContraventamentoOrigin | null;
  setContraventamentoFirst: Dispatch<SetStateAction<ContraventamentoOrigin | null>>;
  contraventamentoSide: ContraventamentoSide | null;
  setContraventamentoSide: Dispatch<SetStateAction<ContraventamentoSide | null>>;
  resetContraventamentoFlow: () => void;
  pilotiSelection: PilotiCanvasSelection | null;
  setPilotiSelection: Dispatch<SetStateAction<PilotiCanvasSelection | null>>;
  setIsPilotiEditorOpen: Dispatch<SetStateAction<boolean>>;
  setActiveSubmenu: Dispatch<SetStateAction<ToolbarSubmenu>>;
  isContraventamentoMode: boolean;
}

export function useContraventamentoCommands({
  canvasRef,
  getTopViewGroup,
  getNonTopViewGroups,
  getContraventamentoColumnSides,
  isPilotiEligibleAsOrigin,
  isPilotiEligibleAsDestination,
  setInfoMessage,
  setSelectedContraventamento,
  setIsContraventamentoMode,
  contraventamentoStep,
  setContraventamentoStep,
  contraventamentoFirst,
  setContraventamentoFirst,
  contraventamentoSide,
  setContraventamentoSide,
  resetContraventamentoFlow,
  pilotiSelection,
  setPilotiSelection,
  setIsPilotiEditorOpen,
  setActiveSubmenu,
  isContraventamentoMode,
}: UseContraventamentoCommandsArgs) {
  const enterContraventamentoSecondStep = useCallback((
    first: ContraventamentoOrigin,
    side: ContraventamentoSide
  ) => {
    if (!first.group) {
      toast.error(TOAST_MESSAGES.topViewUnavailableForContraventamento);
      return;
    }

    setContraventamentoFirst(first);
    setContraventamentoSide(side);
    setContraventamentoStep('select-second');
    highlightContraventamentoPilotis(
      first.group,
      (candidatePilotiId) => isPilotiEligibleAsDestination(candidatePilotiId, first),
      first.col,
      first.pilotiId
    );

    toast.info(TOAST_MESSAGES.contraventamentoSideSelected(getContraventamentoSideLabel(side)));
  }, [isPilotiEligibleAsDestination, setContraventamentoFirst, setContraventamentoSide, setContraventamentoStep]);

  const syncContraventamentoElevations = useCallback(() => {
    const topGroup = getTopViewGroup();
    if (!topGroup) return;
    const targets = getNonTopViewGroups();
    syncContraventamentoElevationsFromTop(
      topGroup,
      targets,
      (pilotiId) => houseManager.getPilotiData(pilotiId).nivel
    );
  }, [getNonTopViewGroups, getTopViewGroup]);

  const clearContraventamentoSelection = useCallback((group?: Group | null) => {
    if (group) {
      setContraventamentoSelection(group, null);
    }
    setSelectedContraventamento(null);
  }, [setSelectedContraventamento]);

  const handleCancelContraventamento = useCallback(() => {
    const topGroup = getTopViewGroup();
    if (topGroup) resetContraventamentoPilotis(topGroup);
    resetContraventamentoFlow();
  }, [getTopViewGroup, resetContraventamentoFlow]);

  const handleContraventamentoPilotiClick = useCallback((
    pilotiId: string, col: number, row: number, group: Group
  ) => {
    if (contraventamentoStep === 'select-first') {
      const occupiedSides = getContraventamentoColumnSides(group, col);
      if (occupiedSides.left && occupiedSides.right) {
        toast.warning(TOAST_MESSAGES.contraventamentoColumnAlreadyUsesBothSides);
        return;
      }

      const first = {pilotiId, col, row, group};
      setContraventamentoFirst(first);

      const side: ContraventamentoSide = occupiedSides.left ? 'right' : 'left';
      enterContraventamentoSecondStep(first, side);
      return;
    }

    if (!contraventamentoFirst || !contraventamentoSide) {
      toast.warning(TOAST_MESSAGES.contraventamentoSelectFirstPiloti);
      setContraventamentoStep('select-first');
      setContraventamentoFirst(null);
      setContraventamentoSide(null);
      highlightContraventamentoPilotis(group, isPilotiEligibleAsOrigin);
      return;
    }

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
      setContraventamentoStep('select-first');
      setContraventamentoFirst(null);
      setContraventamentoSide(null);
      highlightContraventamentoPilotis(originGroup, isPilotiEligibleAsOrigin);
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

    resetContraventamentoPilotis(originGroup);
    clearContraventamentoSelection(originGroup);
    setIsContraventamentoMode(false);
    setContraventamentoStep('select-first');
    setContraventamentoFirst(null);
    setContraventamentoSide(null);
    syncContraventamentoElevations();
    canvasRef.current?.saveHistory();
    toast.success(TOAST_MESSAGES.contraventamentoAddedSuccessfully);
  }, [
    canvasRef,
    clearContraventamentoSelection,
    contraventamentoFirst,
    contraventamentoSide,
    contraventamentoStep,
    enterContraventamentoSecondStep,
    getContraventamentoColumnSides,
    isPilotiEligibleAsOrigin,
    setContraventamentoFirst,
    setContraventamentoSide,
    setContraventamentoStep,
    setIsContraventamentoMode,
    syncContraventamentoElevations,
  ]);

  const handleContraventamentoSelect =
    useCallback((selection: ContraventamentoCanvasSelection | null) => {
      const topGroup = getTopViewGroup();
      if (!topGroup) {
        setSelectedContraventamento(null);
        return;
      }

      setContraventamentoSelection(topGroup, selection?.contraventamentoId ?? null);
      setSelectedContraventamento(selection);
      if (selection) {
        setInfoMessage('Contraventamento selecionado. Use Excluir para remover.');
      }
    }, [getTopViewGroup, setInfoMessage, setSelectedContraventamento]);

  const handleContraventamentoFromPilotiSide =
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
      const data = houseManager.getPilotiData(pilotiSelection.pilotiId);
      if (!canCreateContraventamentoForNivel(data?.nivel ?? 0)) {
        toast.warning(TOAST_MESSAGES.contraventamentoRequiresNivelAboveFortyCentimeters);
        return;
      }

      const occupiedSides = getContraventamentoColumnSides(topGroup, col);
      if (occupiedSides[side]) {
        const removed =
          removeContraventamentosFromGroup(topGroup, (obj) => {
            const anyObj = toCanvasObject(obj);
            if (!anyObj) return false;
            if (Number(anyObj.contraventamentoCol) !== col) return false;

            if (anyObj.contraventamentoSide === 'left' || anyObj.contraventamentoSide === 'right') {
              return anyObj.contraventamentoSide === side;
            }

            const inferredSide = inferContraventamentoSideFromBeamGeometry({
              col,
              left: Number(anyObj.left ?? 0),
              width: Number(anyObj.width ?? 0),
              scaleX: Number(anyObj.scaleX ?? 1),
            });
            return inferredSide === side;
          });

        if (removed > 0) {
          if (isContraventamentoMode) handleCancelContraventamento();
          clearContraventamentoSelection(topGroup);
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
      clearContraventamentoSelection(topGroup);
      setActiveSubmenu(null);
      setIsContraventamentoMode(true);
      enterContraventamentoSecondStep(first, side);
    }, [
      canvasRef,
      clearContraventamentoSelection,
      enterContraventamentoSecondStep,
      getContraventamentoColumnSides,
      getTopViewGroup,
      handleCancelContraventamento,
      isContraventamentoMode,
      pilotiSelection,
      setActiveSubmenu,
      setIsContraventamentoMode,
      setIsPilotiEditorOpen,
      setPilotiSelection,
      syncContraventamentoElevations,
    ]);

  return {
    clearContraventamentoSelection,
    syncContraventamentoElevations,
    handleCancelContraventamento,
    handleContraventamentoPilotiClick,
    handleContraventamentoSelect,
    handleContraventamentoFromPilotiSide,
  };
}
