import {useCallback} from 'react';
import {jsPDF} from 'jspdf';
import {toast} from 'sonner';
import type {CanvasHandle} from '@/components/rac-editor/canvas/Canvas.tsx';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/components/lib/canvas';
import {TOAST_MESSAGES} from '@/config.ts';

interface UseRacEditorPdfExportActionArgs {
  getCanvas: () => CanvasHandle['canvas'];
}

export function useRacEditorPdfExportAction({getCanvas}: UseRacEditorPdfExportActionArgs) {
  const handleSavePDF = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) return;

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
  }, [getCanvas]);

  return {handleSavePDF};
}
