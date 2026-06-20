import {RefObject, useCallback} from 'react';
import {toast} from 'sonner';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import type {CanvasDocumentHandle} from '@/components/rac-editor/@canvas/ports/CanvasDocumentHandle.ts';
import {buildRacPdfReportModel} from '@/components/rac-editor/lib/rac-pdf-report-model.ts';
import {createRacPdfReportDocument} from '@/components/rac-editor/lib/rac-pdf-report-renderer.ts';
import {TOAST_MESSAGES} from '@/shared/config.ts';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';
import type {House3DPdfSnapshotHandle} from '@/components/rac-editor/@viewer-3d/ports/House3DPdfSnapshotHandle.ts';

interface UseRacEditorPdfExportActionArgs {
  canvasRef: RefObject<CanvasDocumentHandle | null>;
  house3DPdfSnapshotRef: RefObject<House3DPdfSnapshotHandle | null>;
  canExportPdf?: () => boolean;
  onBeforeExportPdf?: () => Promise<unknown>;
  onAfterExportPdf?: () => void;
}

export function useRacEditorPdfExportAction({
  canvasRef,
  house3DPdfSnapshotRef,
  canExportPdf,
  onBeforeExportPdf,
  onAfterExportPdf,
}: UseRacEditorPdfExportActionArgs) {
  const {constructionSiteManagementPort} = useEditorPorts();

  const handleSavePDF = useCallback(async () => {
    try {
      if (canExportPdf && !canExportPdf()) {
        toast.error(TOAST_MESSAGES.addHouseBeforePdfExport);
        return;
      }

      await onBeforeExportPdf?.();

      const canvasImageDataUrl = canvasRef.current?.createDocumentPort()?.exportImageDataUrl();
      if (!canvasImageDataUrl) {
        toast.error('Falha ao capturar o canvas para o PDF.');
        return;
      }

      const constructionSite = constructionSiteManagementPort.getConstructionSiteSnapshot();
      if (!constructionSite) {
        toast.error('Nenhuma construção ativa para gerar o PDF.');
        return;
      }

      const house3DImageDataUrl = await house3DPdfSnapshotRef.current?.captureImageDataUrl() ?? null;
      const report = buildRacPdfReportModel({
        constructionSite,
        canvasImageDataUrl,
        canvasImageAspectRatio: CANVAS_WIDTH / CANVAS_HEIGHT,
        house3DImageDataUrl,
        house3DImageAspectRatio: CANVAS_WIDTH / CANVAS_HEIGHT,
      });

      if (!report) {
        toast.error('Nenhuma casa ativa para gerar o PDF.');
        return;
      }

      const {jsPDF} = await import('jspdf');

      const pdf = createRacPdfReportDocument({
        report,
        jsPDF,
      });
      pdf.save(report.fileName);
      constructionSiteManagementPort.markActiveHouseRacPrinted();
      onAfterExportPdf?.();
      toast.success(TOAST_MESSAGES.pdfSavedSuccessfully);

    } catch (error) {
      console.error('[useRacEditorPdfExportAction] Failed to export PDF:', error);
      toast.error('Falha ao salvar PDF.');
    }
  }, [
    canExportPdf,
    canvasRef,
    constructionSiteManagementPort,
    house3DPdfSnapshotRef,
    onAfterExportPdf,
    onBeforeExportPdf,
  ]);

  return {handleSavePDF};
}
