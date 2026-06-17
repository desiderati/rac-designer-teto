import type {Dispatch, RefObject, SetStateAction} from 'react';
import type {CanvasHistoryHandle} from '@/components/rac-editor/@canvas/ports/CanvasHistoryHandle.ts';
import type {CanvasRenderHandle} from '@/components/rac-editor/@canvas/ports/CanvasSurfaceHandle.ts';
import type {PilotiCanvasSelection} from '@/components/rac-editor/@canvas/ports/CanvasSelectionPort.ts';
import type {MenuSubmenu} from '@/components/rac-editor/@menus/lib/menu-types.ts';
import {useRacEditorContraventamentoFlow} from '@/components/rac-editor/hooks/useRacEditorContraventamentoFlow.ts';
import {useContraventamento} from '@/components/rac-editor/@canvas/hooks/useCanvasContraventamento.ts';

interface UseRacEditorContraventamentoControllerArgs {
  canvasRef: RefObject<(CanvasHistoryHandle & CanvasRenderHandle) | null>;
  houseVersion: number;
  pilotiSelection: PilotiCanvasSelection | null;
  setPilotiSelection: Dispatch<SetStateAction<PilotiCanvasSelection | null>>;
  setIsPilotiEditorOpen: Dispatch<SetStateAction<boolean>>;
  setActiveSubmenu: Dispatch<SetStateAction<MenuSubmenu>>;
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
  } = useRacEditorContraventamentoFlow();

  const {
    syncContraventamentoElevations,
    handleCancelContraventamento,
    handleContraventamentoPilotiClick,
    isPilotiEligibleAsDestination,
    getContraventamentoEditorState,
    handleContraventamentoSelect,
    handleHorizontalContraventamentoSelect,
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
    handleHorizontalContraventamentoSelect,
    resetContraventamentoFlow,
  };
}
