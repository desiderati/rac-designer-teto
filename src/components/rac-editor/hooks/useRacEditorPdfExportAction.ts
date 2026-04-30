import {RefObject, useCallback} from 'react';
import {toast} from 'sonner';
import type {CanvasHandle} from '@/components/rac-editor/@canvas/ports/CanvasInteractionPort.ts';
import {TOAST_MESSAGES} from '@/shared/config.ts';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';

interface UseRacEditorPdfExportActionArgs {
  canvasRef: RefObject<CanvasHandle | null>;
}

export function useRacEditorPdfExportAction({canvasRef}: UseRacEditorPdfExportActionArgs) {

  const handleSavePDF = useCallback(async () => {
    const imgData = canvasRef.current?.createDocumentPort()?.exportImageDataUrl();
    if (!imgData) return;

    try {
      const {jsPDF} = await import('jspdf');

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [CANVAS_WIDTH, CANVAS_HEIGHT],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      pdf.save('RAC-TETO.pdf');
      toast.success(TOAST_MESSAGES.pdfSavedSuccessfully);

    } catch (error) {
      console.error('[useRacEditorPdfExportAction] Failed to export PDF:', error);
      toast.error('Falha ao salvar PDF.');
    }
  }, [canvasRef]);

  return {handleSavePDF};
}
