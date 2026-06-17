import {RefObject} from 'react';
import type {CanvasDocumentHandle} from '@/components/rac-editor/@canvas/ports/CanvasDocumentHandle.ts';
import type {CanvasHistoryHandle} from '@/components/rac-editor/@canvas/ports/CanvasHistoryHandle.ts';
import {useRacEditorPdfExportAction} from '@/components/rac-editor/hooks/useRacEditorPdfExportAction.ts';
import type {House3DPdfSnapshotHandle} from '@/components/rac-editor/@viewer-3d/ports/House3DPdfSnapshotHandle.ts';

interface UseRacEditorDocumentActionsArgs {
  canvasRef: RefObject<(CanvasDocumentHandle & CanvasHistoryHandle) | null>;
  house3DPdfSnapshotRef: RefObject<House3DPdfSnapshotHandle | null>;
  canExportPdf?: () => boolean;
  onBeforeExportPdf?: () => Promise<unknown>;
}

/**
 * Compõe ações documentais do editor que continuam expostas na UI.
 */
export function useRacEditorDocumentActions({
  canvasRef,
  house3DPdfSnapshotRef,
  canExportPdf,
  onBeforeExportPdf,
}: UseRacEditorDocumentActionsArgs) {
  const {handleSavePDF} = useRacEditorPdfExportAction({
    canvasRef,
    house3DPdfSnapshotRef,
    canExportPdf,
    onBeforeExportPdf,
  });

  return {
    handleSavePDF,
  };
}
