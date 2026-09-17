import {RefObject, useCallback, useRef, useState} from 'react';
import {toast} from 'sonner';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import type {CanvasDocumentHandle} from '@/components/rac-editor/@canvas/ports/CanvasDocumentHandle.ts';
import {buildRacPdfReportModel} from '@/components/rac-editor/lib/rac-pdf-report-model.ts';
import {createRacPdfReportDocument} from '@/components/rac-editor/lib/rac-pdf-report-renderer.ts';
import {TOAST_MESSAGES} from '@/shared/config.ts';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';
import type {House3DPdfSnapshotHandle} from '@/components/rac-editor/@viewer-3d/ports/House3DPdfSnapshotHandle.ts';
import type {ConstructionSiteState} from '@/shared/types/construction-site.ts';
import {
  buildRacPdfExportChecklist,
  formatRacPdfExportChecklistSummary,
  type RacPdfExportChecklist,
} from '@/components/rac-editor/lib/rac-pdf-export-checklist.ts';

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
  const [pdfExportChecklist, setPdfExportChecklist] = useState<RacPdfExportChecklist | null>(null);
  const [isPdfExportChecklistOpen, setIsPdfExportChecklistOpen] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const preparedConstructionSiteRef = useRef<ConstructionSiteState | null>(null);

  const runPdfExport = useCallback(async (constructionSite: ConstructionSiteState) => {
    try {
      setIsPdfExporting(true);

      const canvasImageDataUrl = canvasRef.current?.createDocumentPort()?.exportImageDataUrl();
      if (!canvasImageDataUrl) {
        toast.error('Falha ao capturar o canvas para o PDF.');
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
    } finally {
      setIsPdfExporting(false);
    }
  }, [
    canvasRef,
    constructionSiteManagementPort,
    house3DPdfSnapshotRef,
    onAfterExportPdf,
  ]);

  const handleSavePDF = useCallback(async () => {
    try {
      await onBeforeExportPdf?.();

      const constructionSite = constructionSiteManagementPort.getConstructionSiteSnapshot();
      const checklist = buildRacPdfExportChecklist(constructionSite);

      if (canExportPdf && !canExportPdf() && !checklist.missingRequiredItems.some((item) => item.id === 'any-view')) {
        const runtimeChecklistItem = {
          id: 'canvas-view-runtime',
          label: 'Vista no canvas',
          description: TOAST_MESSAGES.addHouseBeforePdfExport,
          severity: 'required' as const,
          status: 'missing' as const,
        };
        checklist.items.push(runtimeChecklistItem);
        checklist.missingRequiredItems.push(runtimeChecklistItem);
        checklist.hasBlockingItems = true;
      }

      preparedConstructionSiteRef.current = constructionSite;
      setPdfExportChecklist(checklist);
      setIsPdfExportChecklistOpen(true);

      if (checklist.hasBlockingItems) return;

      const summary = formatRacPdfExportChecklistSummary(checklist);
      if (summary !== 'Checklist sem pendências.') {
        toast.warning(`Checklist da RAC: ${summary}`);
      }
    } catch (error) {
      console.error('[useRacEditorPdfExportAction] Failed to prepare PDF checklist:', error);
      toast.error('Falha ao preparar checklist do PDF.');
    }
  }, [canExportPdf, constructionSiteManagementPort, onBeforeExportPdf]);

  const handleCancelPdfExport = useCallback(() => {
    if (isPdfExporting) return;

    setIsPdfExportChecklistOpen(false);
    setPdfExportChecklist(null);
    preparedConstructionSiteRef.current = null;
  }, [isPdfExporting]);

  const handleConfirmPdfExport = useCallback(async () => {
    if (isPdfExporting || pdfExportChecklist?.hasBlockingItems) return;

    const constructionSite = preparedConstructionSiteRef.current;
    if (!constructionSite) {
      toast.error('Nenhuma construção ativa para gerar o PDF.');
      return;
    }

    await runPdfExport(constructionSite);
    setIsPdfExportChecklistOpen(false);
    setPdfExportChecklist(null);
    preparedConstructionSiteRef.current = null;
  }, [isPdfExporting, pdfExportChecklist?.hasBlockingItems, runPdfExport]);

  return {
    handleSavePDF,
    pdfExportChecklist,
    isPdfExportChecklistOpen,
    isPdfExporting,
    handleConfirmPdfExport,
    handleCancelPdfExport,
  };
}
