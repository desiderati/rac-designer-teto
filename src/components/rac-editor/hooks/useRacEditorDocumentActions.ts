import {RefObject} from 'react';
import type {CanvasDocumentHandle} from '@/components/rac-editor/@canvas/ports/CanvasDocumentHandle.ts';
import type {CanvasHistoryHandle} from '@/components/rac-editor/@canvas/ports/CanvasHistoryHandle.ts';
import {useRacEditorJsonActions} from '@/components/rac-editor/hooks/useRacEditorJsonActions.ts';
import {useRacEditorPdfExportAction} from '@/components/rac-editor/hooks/useRacEditorPdfExportAction.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';

interface UseRacEditorDocumentActionsArgs {
  canvasRef: RefObject<(CanvasDocumentHandle & CanvasHistoryHandle) | null>;
  setInfoMessage: (message: string) => void;
  resetContraventamentoFlow: () => void;
  syncContraventamentoElevations: () => void;
}

/**
 * Compõe ações documentais transitórias do canvas: JSON e PDF.
 */
export function useRacEditorDocumentActions({
  canvasRef,
  setInfoMessage,
  resetContraventamentoFlow,
  syncContraventamentoElevations,
}: UseRacEditorDocumentActionsArgs) {
  const {houseWritePort} = useEditorPorts();

  const {
    handleExportJSON,
    handleImportJSON,
  } = useRacEditorJsonActions({
    canvasRef,
    setInfoMessage,
    resetContraventamentoFlow,
    syncContraventamentoElevations,
    houseWritePort,
  });

  const {handleSavePDF} = useRacEditorPdfExportAction({
    canvasRef,
  });

  return {
    handleExportJSON,
    handleImportJSON,
    handleSavePDF,
  };
}
