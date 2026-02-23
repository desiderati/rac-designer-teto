import {useCallback} from 'react';
import {jsPDF} from 'jspdf';
import {toast} from 'sonner';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/lib/canvas-utils';
import type {CanvasHandle} from '@/components/rac-editor/Canvas';

interface UseRacPdfExportActionArgs {
  getCanvas: () => CanvasHandle['canvas'];
}

export function useRacPdfExportAction({getCanvas}: UseRacPdfExportActionArgs) {
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
    toast.success('PDF salvo com sucesso!');
  }, [getCanvas]);

  return {handleSavePDF};
}
