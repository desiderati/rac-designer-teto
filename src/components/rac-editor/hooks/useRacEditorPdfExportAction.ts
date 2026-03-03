import {useCallback} from 'react';
import {toast} from 'sonner';
import type {CanvasHandle} from '@/components/rac-editor/ui/canvas/Canvas.tsx';
import {TOAST_MESSAGES} from '@/shared/config.ts';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from "@/shared/constants.ts";

interface UseRacEditorPdfExportActionArgs {
  getCanvas: () => CanvasHandle['canvas'];
}

export function useRacEditorPdfExportAction({getCanvas}: UseRacEditorPdfExportActionArgs) {

  const handleSavePDF = useCallback(async () => {
    const canvas = getCanvas();
    if (!canvas) return;

    try {
      const {jsPDF} = await import('jspdf');
      canvas.discardActiveObject();
      canvas.renderAll();
      const imgData = canvas.toDataURL();

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
  }, [getCanvas]);

  return {handleSavePDF};
}
