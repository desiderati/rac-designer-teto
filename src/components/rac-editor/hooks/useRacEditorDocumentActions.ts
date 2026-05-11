import {RefObject} from 'react';
import type {CanvasDocumentHandle} from '@/components/rac-editor/@canvas/ports/CanvasDocumentHandle.ts';
import type {CanvasHistoryHandle} from '@/components/rac-editor/@canvas/ports/CanvasHistoryHandle.ts';
import {useRacEditorPdfExportAction} from '@/components/rac-editor/hooks/useRacEditorPdfExportAction.ts';

interface UseRacEditorDocumentActionsArgs {
  canvasRef: RefObject<(CanvasDocumentHandle & CanvasHistoryHandle) | null>;
}

/**
 * Compõe ações documentais do editor que continuam expostas na UI.
 */
export function useRacEditorDocumentActions({
  canvasRef,
}: UseRacEditorDocumentActionsArgs) {
  const {handleSavePDF} = useRacEditorPdfExportAction({
    canvasRef,
  });

  return {
    handleSavePDF,
  };
}
