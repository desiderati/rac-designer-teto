import {Dispatch, RefObject, SetStateAction} from 'react';
import {Canvas as FabricCanvas} from 'fabric';
import type {CanvasHandle, ContraventamentoCanvasSelection,} from '@/components/rac-editor/canvas/Canvas.tsx';
import {useContraventamentoQueries} from './useContraventamentoQueries.ts';
import {useContraventamentoCommands} from './useContraventamentoCommands.ts';
import {useContraventamentoEffects} from './useContraventamentoEffects.ts';
import {ContraventamentoSide} from '@/shared/types/contraventamento.ts';
import {ContraventamentoOrigin, PilotiCanvasSelection} from '@/components/lib/canvas';
import {ToolbarSubmenu} from '@/components/rac-editor/toolbar/helpers/toolbar-types.ts';

interface UseContraventamentoArgs {
  canvasRef: RefObject<CanvasHandle | null>;
  getCanvas: () => FabricCanvas | null;
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
  setActiveSubmenu: Dispatch<SetStateAction<ToolbarSubmenu>>;
}

export function useContraventamento({
  canvasRef,
  getCanvas,
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
    getCanvas,
    contraventamentoFirst: contraventamentoFirst
      ? {col: contraventamentoFirst.col, row: contraventamentoFirst.row}
      : null,
    pilotiIdForEditor: pilotiSelection?.pilotiId ?? null,
  });

  const commands = useContraventamentoCommands({
    canvasRef,
    getTopViewGroup: queries.getTopViewGroup,
    getNonTopViewGroups: queries.getNonTopViewGroups,
    getContraventamentoColumnSides: queries.getContraventamentoColumnSides,
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
    isContraventamentoMode,
  });

  useContraventamentoEffects({
    houseVersion,
    isContraventamentoMode,
    contraventamentoFirst,
    getTopViewGroup: queries.getTopViewGroup,
    isPilotiEligibleAsDestination: queries.isPilotiEligibleAsDestination,
    handleCancelContraventamento: commands.handleCancelContraventamento,
    syncContraventamentoElevations: commands.syncContraventamentoElevations,
  });

  return {
    selectedContraventamento,
    getTopViewGroup: queries.getTopViewGroup,
    clearContraventamentoSelection: commands.clearContraventamentoSelection,
    syncContraventamentoElevations: commands.syncContraventamentoElevations,
    handleCancelContraventamento: commands.handleCancelContraventamento,
    handleContraventamentoPilotiClick: commands.handleContraventamentoPilotiClick,
    isPilotiEligibleAsDestination: queries.isPilotiEligibleAsDestination,
    getContraventamentoEditorState: queries.getContraventamentoEditorState,
    handleContraventamentoSelect: commands.handleContraventamentoSelect,
  };
}
