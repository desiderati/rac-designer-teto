import {Dispatch, RefObject, SetStateAction} from 'react';
import {Canvas as FabricCanvas} from 'fabric';
import type {
  CanvasHandle,
  ContraventamentoCanvasSelection,
  PilotiSelection,
} from '@/components/rac-editor/Canvas';
import type {RacSubmenu} from '@/components/rac-editor/hooks/useRacModalState';
import {ContraventamentoSide} from '@/lib/canvas-utils';
import {useRacContraventamentoQueries} from './useRacContraventamentoQueries';
import {useRacContraventamentoCommands} from './useRacContraventamentoCommands';
import {useRacContraventamentoEffects} from './useRacContraventamentoEffects';
import {ContraventamentoOrigin, ContraventamentoStep} from './useRacContraventamento.types';

interface UseRacContraventamentoArgs {
  canvasRef: RefObject<CanvasHandle | null>;
  getCanvas: () => FabricCanvas | null;
  houseVersion: number;
  isContraventamentoMode: boolean;
  setIsContraventamentoMode: Dispatch<SetStateAction<boolean>>;
  setInfoMessage: Dispatch<SetStateAction<string>>;
  selectedContraventamento: ContraventamentoCanvasSelection | null;
  setSelectedContraventamento: Dispatch<SetStateAction<ContraventamentoCanvasSelection | null>>;
  contraventamentoStep: ContraventamentoStep;
  setContraventamentoStep: Dispatch<SetStateAction<ContraventamentoStep>>;
  contraventamentoFirst: ContraventamentoOrigin | null;
  setContraventamentoFirst: Dispatch<SetStateAction<ContraventamentoOrigin | null>>;
  contraventamentoSide: ContraventamentoSide | null;
  setContraventamentoSide: Dispatch<SetStateAction<ContraventamentoSide | null>>;
  resetContraventamentoFlow: () => void;
  pilotiSelection: PilotiSelection | null;
  setPilotiSelection: Dispatch<SetStateAction<PilotiSelection | null>>;
  setIsPilotiEditorOpen: Dispatch<SetStateAction<boolean>>;
  setActiveSubmenu: Dispatch<SetStateAction<RacSubmenu>>;
}

export function useRacContraventamento({
  canvasRef,
  getCanvas,
  houseVersion,
  isContraventamentoMode,
  setIsContraventamentoMode,
  setInfoMessage,
  selectedContraventamento,
  setSelectedContraventamento,
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
}: UseRacContraventamentoArgs) {
  const queries = useRacContraventamentoQueries({
    getCanvas,
    contraventamentoStep,
    contraventamentoFirst: contraventamentoFirst
      ? {col: contraventamentoFirst.col, row: contraventamentoFirst.row}
      : null,
    pilotiIdForEditor: pilotiSelection?.pilotiId ?? null,
  });

  const commands = useRacContraventamentoCommands({
    canvasRef,
    getTopViewGroup: queries.getTopViewGroup,
    getNonTopViewGroups: queries.getNonTopViewGroups,
    getContraventamentoColumnSides: queries.getContraventamentoColumnSides,
    isPilotiEligibleAsOrigin: queries.isPilotiEligibleAsOrigin,
    isPilotiEligibleAsDestination: queries.isPilotiEligibleAsDestination,
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
  });

  useRacContraventamentoEffects({
    houseVersion,
    isContraventamentoMode,
    contraventamentoStep,
    contraventamentoFirst,
    getTopViewGroup: queries.getTopViewGroup,
    isPilotiEligibleAsOrigin: queries.isPilotiEligibleAsOrigin,
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
    handleContraventamentoSelect: commands.handleContraventamentoSelect,
    isPilotiEligible: queries.isPilotiEligible,
    getContraventamentoEditorState: queries.getContraventamentoEditorState,
    handleContraventamentoFromPilotiSide: commands.handleContraventamentoFromPilotiSide,
  };
}
