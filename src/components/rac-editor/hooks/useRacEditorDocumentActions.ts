import {RefObject} from 'react';
import type {CanvasDocumentHandle} from '@/components/rac-editor/@canvas/ports/CanvasDocumentHandle.ts';
import type {CanvasHistoryHandle} from '@/components/rac-editor/@canvas/ports/CanvasHistoryHandle.ts';
import {useHouseDrawingDocumentActions} from '@/components/rac-editor/hooks/useHouseDrawingDocumentActions.ts';
import {useRacEditorPdfExportAction} from '@/components/rac-editor/hooks/useRacEditorPdfExportAction.ts';

interface UseRacEditorDocumentActionsArgs {
  canvasRef: RefObject<(CanvasDocumentHandle & CanvasHistoryHandle) | null>;
  setInfoMessage: (message: string) => void;
  resetContraventamentoFlow: () => void;
  syncContraventamentoElevations: () => void;
}

/**
 * Compõe ações documentais do editor: documento RAC e PDF.
 */
export function useRacEditorDocumentActions({
  canvasRef,
  setInfoMessage,
  resetContraventamentoFlow,
  syncContraventamentoElevations,
}: UseRacEditorDocumentActionsArgs) {
  const {
    handleExportHouseDrawingDocument,
    handleImportHouseDrawingDocument,
  } = useHouseDrawingDocumentActions({
    canvasRef,
    setInfoMessage,
    resetContraventamentoFlow,
    syncContraventamentoElevations,
  });

  const {handleSavePDF} = useRacEditorPdfExportAction({
    canvasRef,
  });

  return {
    handleExportJSON: handleExportHouseDrawingDocument,
    handleImportJSON: handleImportHouseDrawingDocument,
    handleSavePDF,
  };
}
