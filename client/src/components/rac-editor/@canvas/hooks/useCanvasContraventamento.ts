import {Dispatch, RefObject, SetStateAction} from 'react';
import type {
  ContraventamentoCanvasSelection,
  PilotiCanvasSelection,
} from '@/components/rac-editor/@canvas/ports/CanvasSelectionPort.ts';
import type {CanvasHistoryHandle} from '@/components/rac-editor/@canvas/ports/CanvasHistoryHandle.ts';
import type {CanvasRenderHandle} from '@/components/rac-editor/@canvas/ports/CanvasSurfaceHandle.ts';
import {useContraventamentoQueries} from './useCanvasContraventamentoQueries.ts';
import {useContraventamentoCommands} from './useCanvasContraventamentoCommands.ts';
import {useContraventamentoEffects} from './useCanvasContraventamentoEffects.ts';
import {ContraventamentoOrigin, ContraventamentoSide} from '@/shared/types/contraventamento.ts';
import {MenuSubmenu} from '@/components/rac-editor/@menus/lib/menu-types.ts';

interface UseContraventamentoArgs {
  canvasRef: RefObject<(CanvasHistoryHandle & CanvasRenderHandle) | null>;
  houseVersion: number;
  isContraventamentoMode: boolean;
  setIsContraventamentoMode: Dispatch<SetStateAction<boolean>>;
  setInfoMessage: Dispatch<SetStateAction<string>>;
  selectedContraventamento: ContraventamentoCanvasSelection | null;
  setSelectedContraventamento: Dispatch<SetStateAction<ContraventamentoCanvasSelection | null>>;
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

export function useContraventamento({
  canvasRef,
  houseVersion,
  isContraventamentoMode,
  setIsContraventamentoMode,
  selectedContraventamento,
  setSelectedContraventamento,
  contraventamentoFirst,
  setContraventamentoFirst,
  contraventamentoSide,
  setContraventamentoSide,
  resetContraventamentoFlow,
  pilotiSelection,
  setPilotiSelection,
  setIsPilotiEditorOpen,
  setActiveSubmenu,
}: UseContraventamentoArgs) {

  const queries = useContraventamentoQueries({
    contraventamentoFirst: contraventamentoFirst
      ? {col: contraventamentoFirst.col, row: contraventamentoFirst.row}
      : null,
    contraventamentoSide,
    pilotiIdForEditor: pilotiSelection?.pilotiId ?? null,
  });

  const commands = useContraventamentoCommands({
    canvasRef,
    getTopViewGroup: queries.getTopViewGroup,
    getNonTopViewGroups: queries.getNonTopViewGroups,
    getContraventamentoColumnSides: queries.getContraventamentoColumnSides,
    getContraventamentoHorizontalSides: queries.getContraventamentoHorizontalSides,
    isPilotiEligibleForContraventamentoColumn: queries.isPilotiEligibleForContraventamentoColumn,
    isPilotiEligibleForContraventamentoRow: queries.isPilotiEligibleForContraventamentoRow,
    isPilotiEligibleAsDestination: queries.isPilotiEligibleAsDestination,
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
  });

  useContraventamentoEffects({
    houseVersion,
    isContraventamentoMode,
    contraventamentoFirst,
    contraventamentoSide,
    getTopViewGroup: queries.getTopViewGroup,
    isPilotiEligibleAsDestination: queries.isPilotiEligibleAsDestination,
    handleCancelContraventamento: commands.handleCancelContraventamento,
    syncContraventamentoElevations: commands.syncContraventamentoElevations,
  });

  return {
    selectedContraventamento,
    syncContraventamentoElevations: commands.syncContraventamentoElevations,
    handleCancelContraventamento: commands.handleCancelContraventamento,
    handleContraventamentoPilotiClick: commands.handleContraventamentoPilotiClick,
    isPilotiEligibleAsDestination: queries.isPilotiEligibleAsDestination,
    getContraventamentoEditorState: queries.getContraventamentoEditorState,
    handleContraventamentoSelect: commands.handleContraventamentoSelect,
    handleHorizontalContraventamentoSelect: commands.handleHorizontalContraventamentoSelect,
  };
}
