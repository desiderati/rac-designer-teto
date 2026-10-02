import {createElement, RefObject, useCallback, useEffect, useRef, useState} from 'react';
import {toast} from '@/components/ui/sonner.tsx';
import {jsPDF} from 'jspdf';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import type {CanvasDocumentHandle} from '@/components/rac-editor/@canvas/ports/CanvasDocumentHandle.ts';
import {buildRacPdfReportModel} from '@/components/rac-editor/lib/rac-pdf-report-model.ts';
import {prepareRacPdfReportPhotos} from '@/components/rac-editor/lib/rac-pdf-report-photos.ts';
import {createRacPdfReportDocument} from '@/components/rac-editor/lib/rac-pdf-report-renderer.ts';
import {downloadBlob} from '@/components/rac-editor/lib/rac-pdf-zip-export.ts';
import {TOAST_MESSAGES} from '@/shared/config.ts';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';
import type {House3DPdfSnapshotHandle} from '@/components/rac-editor/@viewer-3d/ports/House3DPdfSnapshotHandle.ts';
import type {ConstructionSiteState} from '@/shared/types/construction-site.ts';
import {
  buildRacPdfExportChecklist,
  type RacPdfExportChecklist,
} from '@/components/rac-editor/lib/rac-pdf-export-checklist.ts';
import {requestChunkRecovery, recordPdfExportTelemetry} from '@/shared/lib/runtime-resilience.ts';
import {cacheRacPdf, getCachedRacPdf, getRacPdfFingerprint} from '@/components/rac-editor/lib/rac-pdf-cache.ts';
import {
  RAC_PDF_EXPORT_STEPS,
  RacPdfExportProgress,
  createInitialRacPdfExportStatuses,
  type RacPdfExportStepId,
} from '@/components/rac-editor/@modals/ui/RacPdfExportProgress.tsx';

interface UseRacEditorPdfExportActionArgs {
  canvasRef: RefObject<CanvasDocumentHandle | null>;
  house3DPdfSnapshotRef: RefObject<House3DPdfSnapshotHandle | null>;
  canExportPdf?: () => boolean;
  onBeforeExportPdf?: () => Promise<unknown>;
  onAfterExportPdf?: () => void;
}

export interface RacPdfPreviewArtifact {
  fileName: string;
  blob: Blob | null;
  url: string | null;
  pageCount: number;
  errorMessage?: string;
}

function errorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message.slice(0, 240),
    };
  }

  return {
    errorName: 'UnknownError',
    errorMessage: String(error).slice(0, 240),
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Não foi possível preparar a prévia do PDF.'));
    reader.readAsDataURL(blob);
  });
}

function blobToPreviewUrl(blob: Blob): Promise<string> {
  if (typeof URL.createObjectURL === 'function') {
    return Promise.resolve(URL.createObjectURL(blob));
  }
  return blobToDataUrl(blob);
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
  const [pdfPreview, setPdfPreview] = useState<RacPdfPreviewArtifact | null>(null);
  const preparedConstructionSiteRef = useRef<ConstructionSiteState | null>(null);
  const lastPdfExportConstructionSiteRef = useRef<ConstructionSiteState | null>(null);
  const lastPdfPreviewFileNameRef = useRef('RAC-preview.pdf');
  const lastPdfPreviewPageCountRef = useRef(1);

  const buildCurrentChecklist = useCallback((constructionSite: ConstructionSiteState | null) => {
    const checklist = buildRacPdfExportChecklist(constructionSite);
    if (canExportPdf && !canExportPdf() && !checklist.missingRequiredItems.some((item) => item.id === 'top-view')) {
      const runtimeItem = {
        id: 'canvas-view-runtime',
        label: 'Vista planta no Canvas',
        description: TOAST_MESSAGES.addHouseBeforePdfExport,
        severity: 'required' as const,
        status: 'missing' as const,
      };
      checklist.items.push(runtimeItem);
      checklist.missingRequiredItems.push(runtimeItem);
      checklist.hasBlockingItems = true;
    }
    return checklist;
  }, [canExportPdf]);

  const runPdfExport = useCallback(async (constructionSite: ConstructionSiteState, force = false): Promise<boolean> => {
    // Revalidar antes do cache, das capturas e da prévia: o Canvas pode ter mudado
    // desde a abertura do checklist ou desde a tentativa anterior.
    const current = constructionSiteManagementPort.getConstructionSiteSnapshot();
    const checklist = buildCurrentChecklist(current);
    const changedHouse = current?.constructionSite.id !== constructionSite.constructionSite.id
      || current?.constructionSite.activeHouseId !== constructionSite.constructionSite.activeHouseId;
    if (!current || checklist.hasBlockingItems || changedHouse) {
      preparedConstructionSiteRef.current = current;
      setPdfExportChecklist(checklist);
      setIsPdfExportChecklistOpen(true);
      setPdfPreview(null);
      if (changedHouse && current) toast.warning('A casa ativa mudou. Revise o checklist antes de gerar o PDF.');
      return false;
    }
    constructionSite = current;
    const startedAt = Date.now();
    let phase: RacPdfExportStepId = 'capture-canvas';
    const progressToastId = `rac-pdf-export-${startedAt}`;
    let progressDismissed = false;
    const progressToastOptions = {id: progressToastId, onDismiss: () => { progressDismissed = true; }};
    let statuses = createInitialRacPdfExportStatuses();
    const updateProgressToast = (nextPhase: RacPdfExportStepId) => {
      phase = nextPhase;
      const activeIndex = RAC_PDF_EXPORT_STEPS.findIndex((step) => step.id === nextPhase);
      statuses = Object.fromEntries(RAC_PDF_EXPORT_STEPS.map(({id}, index) => [
        id,
        index < activeIndex ? 'success' : index === activeIndex ? 'active' : 'pending',
      ])) as typeof statuses;
      if (!progressDismissed) {
        const content = createElement(RacPdfExportProgress, {statuses});
        toast.loading(() => content, progressToastOptions);
      }
    };
    const finishProgressToast = () => {
      statuses = Object.fromEntries(RAC_PDF_EXPORT_STEPS.map(({id}) => [id, 'success'])) as typeof statuses;
      if (!progressDismissed) {
        const content = createElement(RacPdfExportProgress, {statuses});
        toast.success(() => content, progressToastOptions);
      }
    };
    const failProgressToast = () => {
      statuses = {...statuses, [phase]: 'error'};
      if (!progressDismissed) {
        const content = createElement(RacPdfExportProgress, {statuses});
          toast.error(() => content, progressToastOptions);
      }
    };

    lastPdfExportConstructionSiteRef.current = constructionSite;
    recordPdfExportTelemetry('prepare_started');
    updateProgressToast('capture-canvas');

    try {
      setIsPdfExporting(true);
      const house = constructionSite.houses.find((entry) => (
        entry.id === constructionSite.constructionSite.activeHouseId && entry.status !== 'archived'
      )) ?? constructionSite.houses.find((entry) => entry.status !== 'archived');
      const fingerprint = house ? getRacPdfFingerprint(constructionSite, house.id) : null;
      const cached = !force && house && fingerprint
        ? getCachedRacPdf(constructionSite, house.id, fingerprint)
        : null;
      if (cached) {
        updateProgressToast('create-preview');
        const url = await blobToPreviewUrl(cached.blob);
        lastPdfPreviewFileNameRef.current = cached.fileName;
        lastPdfPreviewPageCountRef.current = cached.pageCount;
        setPdfPreview({fileName: cached.fileName, blob: cached.blob, url, pageCount: cached.pageCount});
        recordPdfExportTelemetry('prepare_succeeded', {durationMs: Date.now() - startedAt});
        finishProgressToast();
        return true;
      }

      updateProgressToast('capture-canvas');
      const canvasPort = canvasRef.current?.createDocumentPort();
      let canvasImageDataUrl: string | null = null;
      let hasOmittedRasterSources = false;
      if (canvasPort?.exportSafeImageDataUrlWithStatus) {
        const capture = await canvasPort.exportSafeImageDataUrlWithStatus();
        canvasImageDataUrl = capture.imageDataUrl;
        hasOmittedRasterSources = capture.hasOmittedRasterSources;
      } else if (canvasPort?.exportSafeImageDataUrl) {
        canvasImageDataUrl = await canvasPort.exportSafeImageDataUrl();
      } else {
        // Compatibilidade com portas antigas e doubles de teste. O adapter
        // Fabric atual sempre segue o caminho isolado acima.
        const restoreCanvasImages = await canvasPort?.prepareImageAssetsForExport?.();
        try {
          canvasImageDataUrl = canvasPort?.exportImageDataUrl() ?? null;
        } finally {
          restoreCanvasImages?.();
        }
      }
      if (!canvasImageDataUrl) {
        const message = 'Falha ao capturar o canvas para o PDF.';
        recordPdfExportTelemetry('prepare_failed', {durationMs: Date.now() - startedAt, phase, errorName: 'CanvasUnavailable', errorMessage: message});
        setPdfPreview((current) => current?.url
          ? {...current, errorMessage: message}
          : {fileName: lastPdfPreviewFileNameRef.current, blob: null, url: null, pageCount: lastPdfPreviewPageCountRef.current, errorMessage: message});
        failProgressToast();
        return false;
      }

      updateProgressToast('capture-3d');
      const house3DImageDataUrl = await house3DPdfSnapshotRef.current?.captureImageDataUrl() ?? null;
      if (!house3DImageDataUrl) throw new Error('Não foi possível capturar a visualização 3D da casa.');
      updateProgressToast('prepare-photos');
      const photos = await prepareRacPdfReportPhotos(constructionSite);
      updateProgressToast('build-report-model');
      const report = buildRacPdfReportModel({
        constructionSite,
        canvasImageDataUrl,
        canvasImageAspectRatio: CANVAS_WIDTH / CANVAS_HEIGHT,
        house3DImageDataUrl,
        house3DImageAspectRatio: CANVAS_WIDTH / CANVAS_HEIGHT,
        ...photos,
      });

      if (!report) {
        const message = 'Nenhuma casa ativa para gerar o PDF.';
        recordPdfExportTelemetry('prepare_failed', {durationMs: Date.now() - startedAt, phase, errorName: 'ReportUnavailable', errorMessage: message});
        setPdfPreview((current) => current?.url
          ? {...current, errorMessage: message}
          : {fileName: lastPdfPreviewFileNameRef.current, blob: null, url: null, pageCount: lastPdfPreviewPageCountRef.current, errorMessage: message});
        failProgressToast();
        return false;
      }

      updateProgressToast('render-pdf');
      const pdf = createRacPdfReportDocument({report, jsPDF});
      const blob = pdf.output('blob') as Blob;
      updateProgressToast('create-preview');
      const url = await blobToPreviewUrl(blob);
      const pageCount = Math.max(1, pdf.getNumberOfPages());
      if (house && fingerprint && !photos.hasUnresolvedPhotoSources && !hasOmittedRasterSources) cacheRacPdf(constructionSite, house.id, {
        fingerprint,
        blob,
        fileName: report.fileName,
        pageCount,
      });
      lastPdfPreviewFileNameRef.current = report.fileName;
      lastPdfPreviewPageCountRef.current = pageCount;
      setPdfPreview({fileName: report.fileName, blob, url, pageCount});
      recordPdfExportTelemetry('prepare_succeeded', {durationMs: Date.now() - startedAt});
      finishProgressToast();
      return true;
    } catch (error) {
      const details = errorDetails(error);
      recordPdfExportTelemetry('prepare_failed', {durationMs: Date.now() - startedAt, phase, ...details});
      console.error(`[useRacEditorPdfExportAction] PDF preparation failed during ${phase}:`, error);
      const recovered = requestChunkRecovery(error);
      const message = recovered
        ? 'A aplicação será atualizada para corrigir o carregamento do PDF. Tente novamente em instantes.'
        : 'Falha ao preparar a prévia do PDF. Você pode tentar novamente.';
      setPdfPreview((current) => current?.url
        ? {...current, errorMessage: message}
        : {fileName: lastPdfPreviewFileNameRef.current, blob: null, url: null, pageCount: lastPdfPreviewPageCountRef.current, errorMessage: message});
      failProgressToast();
      return false;
    } finally {
      setIsPdfExporting(false);
    }
  }, [buildCurrentChecklist, canvasRef, constructionSiteManagementPort, house3DPdfSnapshotRef]);

  const handleSavePDF = useCallback(async () => {
    recordPdfExportTelemetry('checklist_started');
    try {
      await onBeforeExportPdf?.();

      const constructionSite = constructionSiteManagementPort.getConstructionSiteSnapshot();
      const checklist = buildCurrentChecklist(constructionSite);

      preparedConstructionSiteRef.current = constructionSite;
      setPdfExportChecklist(checklist);
      setIsPdfExportChecklistOpen(true);

      if (checklist.hasBlockingItems) return;
    } catch (error) {
      recordPdfExportTelemetry('prepare_failed', errorDetails(error));
      console.error('[useRacEditorPdfExportAction] Failed to prepare PDF checklist:', error);
      toast.error('Falha ao preparar checklist do PDF.');
    }
  }, [buildCurrentChecklist, constructionSiteManagementPort, onBeforeExportPdf]);

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

    setIsPdfExportChecklistOpen(false);
    setPdfExportChecklist(null);
    preparedConstructionSiteRef.current = null;
    await runPdfExport(constructionSite);
  }, [isPdfExporting, pdfExportChecklist?.hasBlockingItems, runPdfExport]);

  const handleRetryPdfPreview = useCallback(async () => {
    const constructionSite = lastPdfExportConstructionSiteRef.current;
    if (!constructionSite || isPdfExporting) return;

    recordPdfExportTelemetry('retry_requested');
    await runPdfExport(constructionSite, true);
  }, [isPdfExporting, runPdfExport]);

  useEffect(() => () => {
    if (pdfPreview?.url?.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(pdfPreview.url);
    }
  }, [pdfPreview?.url]);

  const handleClosePdfPreview = useCallback(() => {
    if (isPdfExporting) return;
    setPdfPreview(null);
    lastPdfExportConstructionSiteRef.current = null;
  }, [isPdfExporting]);

  const handleDownloadPdfPreview = useCallback(() => {
    if (!pdfPreview?.blob) return;

    try {
      downloadBlob(pdfPreview.blob, pdfPreview.fileName);
      recordPdfExportTelemetry('download_succeeded');
      toast.success(TOAST_MESSAGES.pdfSavedSuccessfully);

      try {
        constructionSiteManagementPort.markActiveHouseRacPrinted();
        onAfterExportPdf?.();
      } catch (error) {
        recordPdfExportTelemetry('status_sync_failed', errorDetails(error));
        console.error('[useRacEditorPdfExportAction] PDF salvo, mas não foi possível atualizar o status da RAC:', error);
        toast.warning('PDF salvo, mas o status da RAC não pôde ser sincronizado agora.');
      }
    } catch (error) {
      recordPdfExportTelemetry('download_failed', errorDetails(error));
      console.error('[useRacEditorPdfExportAction] Failed to download PDF:', error);
      toast.error('Falha ao baixar PDF.');
      return;
    }

    setPdfPreview(null);
    lastPdfExportConstructionSiteRef.current = null;
  }, [constructionSiteManagementPort, onAfterExportPdf, pdfPreview]);

  return {
    handleSavePDF,
    pdfExportChecklist,
    isPdfExportChecklistOpen,
    isPdfExporting,
    isPdfPreviewOpen: Boolean(pdfPreview),
    pdfPreviewFileName: pdfPreview?.fileName ?? null,
    pdfPreviewUrl: pdfPreview?.url ?? null,
    pdfPreviewPageCount: pdfPreview?.pageCount ?? 1,
    pdfPreviewError: pdfPreview?.errorMessage ?? null,
    handleConfirmPdfExport,
    handleCancelPdfExport,
    handleRetryPdfPreview,
    handleDownloadPdfPreview,
    handleClosePdfPreview,
  };
}
