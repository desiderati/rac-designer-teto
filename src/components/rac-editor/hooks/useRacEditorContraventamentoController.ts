import type {Dispatch, RefObject, SetStateAction} from 'react';
import type {CanvasHandle} from '@/components/rac-editor/ui/canvas/Canvas.tsx';
import type {PilotiCanvasSelection} from '@/components/rac-editor/lib/canvas';
import type {ToolbarSubmenu} from '@/components/rac-editor/ui/toolbar/helpers/toolbar-types.ts';
import {useContraventamentoFlow} from '@/components/rac-editor/hooks/useContraventamentoFlow.ts';
import {useContraventamento} from '@/components/rac-editor/hooks/useContraventamento.ts';

interface UseRacEditorContraventamentoControllerArgs {
  canvasRef: RefObject<CanvasHandle | null>;
  houseVersion: number;
  pilotiSelection: PilotiCanvasSelection | null;
  setPilotiSelection: Dispatch<SetStateAction<PilotiCanvasSelection | null>>;
  setIsPilotiEditorOpen: Dispatch<SetStateAction<boolean>>;
  setActiveSubmenu: Dispatch<SetStateAction<ToolbarSubmenu>>;
  setInfoMessage: Dispatch<SetStateAction<string>>;
}

/**
 * Encapsula o fluxo de contraventamento e entrega apenas handlers para o editor.
 */
export function useRacEditorContraventamentoController({
  canvasRef,
  houseVersion,
  pilotiSelection,
  setPilotiSelection,
  setIsPilotiEditorOpen,
  setActiveSubmenu,
  setInfoMessage,
}: UseRacEditorContraventamentoControllerArgs) {
  const {
    isContraventamentoMode,
    setIsContraventamentoMode,
    selectedContraventamento,
    setSelectedContraventamento,
    contraventamentoFirst,
    setContraventamentoFirst,
    contraventamentoSide,
    setContraventamentoSide,
    resetContraventamentoFlow,
  } = useContraventamentoFlow();

  const {
    syncContraventamentoElevations,
    handleCancelContraventamento,
    handleContraventamentoPilotiClick,
    isPilotiEligibleAsDestination,
    getContraventamentoEditorState,
    handleContraventamentoSelect,
  } = useContraventamento({
    canvasRef,
    houseVersion,
    isContraventamentoMode,
    setIsContraventamentoMode,
    setInfoMessage,
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
  });

  return {
    isContraventamentoMode,
    syncContraventamentoElevations,
    handleCancelContraventamento,
    handleContraventamentoPilotiClick,
    isPilotiEligibleAsDestination,
    contraventamentoEditorState: getContraventamentoEditorState(),
    handleContraventamentoSelect,
    resetContraventamentoFlow,
  };
}
