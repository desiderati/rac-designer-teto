import {RefObject} from 'react';
import type {Canvas as FabricCanvas} from 'fabric';
import type {CanvasHandle} from '@/components/rac-editor/ui/canvas/Canvas.tsx';
import {useRacEditorJsonActions} from '@/components/rac-editor/hooks/useRacEditorJsonActions.ts';
import {useRacEditorPdfExportAction} from '@/components/rac-editor/hooks/useRacEditorPdfExportAction.ts';
import {legacyHouseWritePort} from '@/infra/house/legacy-house-write-adapter.ts';

interface UseRacEditorDocumentActionsArgs {
  canvasRef: RefObject<CanvasHandle | null>;
  getCanvas: () => FabricCanvas | null;
  setInfoMessage: (message: string) => void;
  resetContraventamentoFlow: () => void;
  syncContraventamentoElevations: () => void;
}

/**
 * Compõe ações documentais transitórias do canvas: JSON e PDF.
 */
export function useRacEditorDocumentActions({
  canvasRef,
  getCanvas,
  setInfoMessage,
  resetContraventamentoFlow,
  syncContraventamentoElevations,
}: UseRacEditorDocumentActionsArgs) {
  const {
    handleExportJSON,
    handleImportJSON,
  } = useRacEditorJsonActions({
    canvasRef,
    getCanvas,
    setInfoMessage,
    resetContraventamentoFlow,
    syncContraventamentoElevations,
    houseWritePort: legacyHouseWritePort,
  });

  const {handleSavePDF} = useRacEditorPdfExportAction({
    getCanvas,
  });

  return {
    handleExportJSON,
    handleImportJSON,
    handleSavePDF,
  };
}
