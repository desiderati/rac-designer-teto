import {RefObject, useCallback, useEffect, useRef, useState} from 'react';
import {toast} from 'sonner';
import {jsPDF} from 'jspdf';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import type {CanvasDocumentHandle} from '@/components/rac-editor/@canvas/ports/CanvasDocumentHandle.ts';
import {buildRacPdfReportModel} from '@/components/rac-editor/lib/rac-pdf-report-model.ts';
import {createRacPdfReportDocument} from '@/components/rac-editor/lib/rac-pdf-report-renderer.ts';
import {downloadBlob} from '@/components/rac-editor/lib/rac-pdf-zip-export.ts';
import {TOAST_MESSAGES} from '@/shared/config.ts';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';
import type {House3DPdfSnapshotHandle} from '@/components/rac-editor/@viewer-3d/ports/House3DPdfSnapshotHandle.ts';
import type {ConstructionSiteState} from '@/shared/types/construction-site.ts';
import {
  buildRacPdfExportChecklist,
  formatRacPdfExportChecklistSummary,
  type RacPdfExportChecklist,
} from '@/components/rac-editor/lib/rac-pdf-export-checklist.ts';
import {requestChunkRecovery, recordPdfExportTelemetry} from '@/shared/lib/runtime-resilience.ts';

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

const EXPORT_MEDIA_TIMEOUT_MS = 1_800;

function normalizeExportImageSource(source: string): string {
  const storagePath = /(?:^|https?:\/\/[^/]+)(\/manus-storage\/[^?#]+)/i.exec(source)?.[1];
  return storagePath ?? source;
}

function loadImageDataUrl(source: string | undefined): Promise<string | null> {
  if (!source?.trim()) return Promise.resolve(null);
  if (/^data:image\//i.test(source)) return Promise.resolve(source);

  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    let timeoutId = 0;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      image.onload = null;
      image.onerror = null;
      resolve(value);
    };

    timeoutId = window.setTimeout(() => finish(null), EXPORT_MEDIA_TIMEOUT_MS);
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const raster = document.createElement('canvas');
        raster.width = image.naturalWidth || image.width;
        raster.height = image.naturalHeight || image.height;
        if (!raster.width || !raster.height) {
          finish(null);
          return;
        }
        raster.getContext('2d')?.drawImage(image, 0, 0);
        finish(raster.toDataURL('image/png'));
      } catch {
        finish(null);
      }
    };
    image.onerror = () => finish(null);
    image.src = normalizeExportImageSource(source);
  });
}

function getReportHouseForMedia(constructionSite: ConstructionSiteState) {
  const activeHouseId = constructionSite.constructionSite.activeHouseId;
  return constructionSite.houses.find((house) => house.id === activeHouseId && house.status !== 'archived')
    ?? constructionSite.houses.find((house) => house.status !== 'archived')
    ?? null;
}

async function prepareReportMedia(constructionSite: ConstructionSiteState) {
  const house = getReportHouseForMedia(constructionSite);
  const photos = house?.siteAssessment.terrainPhotos?.slice(0, 4) ?? [];
  const terrainPhotoDataUrls = await Promise.all(photos.map((photo) => loadImageDataUrl(photo.url)));
  const locationQuery = house?.siteAssessment.locationQuery?.trim() ?? '';
  const coordinates = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(locationQuery);
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY;
  const mapSource = coordinates && mapsKey
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates[1]},${coordinates[2]}&zoom=17&size=900x500&maptype=satellite&markers=color:red%7C${coordinates[1]},${coordinates[2]}&key=${mapsKey}`
    : undefined;

  return {
    terrainPhotoDataUrls,
    mapImageDataUrl: await loadImageDataUrl(mapSource),
  };
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

  const runPdfExport = useCallback(async (constructionSite: ConstructionSiteState): Promise<boolean> => {
    const startedAt = Date.now();
    let phase = 'start';
    let dismissProgressToast: (() => void) | null = null;
    lastPdfExportConstructionSiteRef.current = constructionSite;
    recordPdfExportTelemetry('prepare_started');

    try {
      setIsPdfExporting(true);
      const progressToast = typeof toast.loading === 'function'
        ? toast.loading('Preparando exportação da RAC…')
        : null;
      const updateProgress = (message: string) => {
        if (progressToast !== null && typeof toast.loading === 'function') {
          toast.loading(message, {id: progressToast});
        }
      };
      dismissProgressToast = () => {
        if (progressToast !== null && typeof toast.dismiss === 'function') toast.dismiss(progressToast);
      };

      phase = 'capture-canvas';
      updateProgress('Capturando a planta da casa…');
      const canvasPort = canvasRef.current?.createDocumentPort();
      let canvasImageDataUrl: string | null = null;
      if (canvasPort?.exportSafeImageDataUrl) {
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
        dismissProgressToast?.();
        recordPdfExportTelemetry('prepare_failed', {durationMs: Date.now() - startedAt, phase, errorName: 'CanvasUnavailable', errorMessage: message});
        setPdfPreview((current) => current?.url
          ? {...current, errorMessage: message}
          : {fileName: lastPdfPreviewFileNameRef.current, blob: null, url: null, pageCount: lastPdfPreviewPageCountRef.current, errorMessage: message});
        toast.error(message);
        return false;
      }

      phase = 'capture-3d';
      updateProgress('Preparando a vista 3D…');
      const house3DImageDataUrl = await house3DPdfSnapshotRef.current?.captureImageDataUrl() ?? null;
      const house3DImageIsIllustration = house3DPdfSnapshotRef.current?.getLastCaptureKind?.() === 'illustration';
      phase = 'load-report-media';
      updateProgress('Carregando fotos e localização…');
      const reportMedia = await prepareReportMedia(constructionSite);
      phase = 'build-report-model';
      const report = buildRacPdfReportModel({
        constructionSite,
        canvasImageDataUrl,
        canvasImageAspectRatio: CANVAS_WIDTH / CANVAS_HEIGHT,
        house3DImageDataUrl,
        house3DImageAspectRatio: CANVAS_WIDTH / CANVAS_HEIGHT,
        house3DImageIsIllustration,
        ...reportMedia,
      });

      if (!report) {
        const message = 'Nenhuma casa ativa para gerar o PDF.';
        dismissProgressToast?.();
        recordPdfExportTelemetry('prepare_failed', {durationMs: Date.now() - startedAt, phase, errorName: 'ReportUnavailable', errorMessage: message});
        setPdfPreview((current) => current?.url
          ? {...current, errorMessage: message}
          : {fileName: lastPdfPreviewFileNameRef.current, blob: null, url: null, pageCount: lastPdfPreviewPageCountRef.current, errorMessage: message});
        toast.error(message);
        return false;
      }

      phase = 'render-pdf';
      updateProgress('Montando o PDF…');
      const pdf = createRacPdfReportDocument({report, jsPDF});
      phase = 'create-preview-blob';
      const blob = pdf.output('blob') as Blob;
      phase = 'create-preview-data-url';
      const url = await blobToDataUrl(blob);
      const pageCount = Math.max(1, pdf.getNumberOfPages());
      lastPdfPreviewFileNameRef.current = report.fileName;
      lastPdfPreviewPageCountRef.current = pageCount;
      setPdfPreview({fileName: report.fileName, blob, url, pageCount});
      dismissProgressToast?.();
      recordPdfExportTelemetry('prepare_succeeded', {durationMs: Date.now() - startedAt});
      return true;
    } catch (error) {
      dismissProgressToast?.();
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
      toast.error('Falha ao preparar a prévia do PDF.');
      return false;
    } finally {
      setIsPdfExporting(false);
    }
  }, [canvasRef, house3DPdfSnapshotRef]);

  const handleSavePDF = useCallback(async () => {
    recordPdfExportTelemetry('checklist_started');
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
      recordPdfExportTelemetry('prepare_failed', errorDetails(error));
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

  const handleRetryPdfPreview = useCallback(async () => {
    const constructionSite = lastPdfExportConstructionSiteRef.current;
    if (!constructionSite || isPdfExporting) return;

    recordPdfExportTelemetry('retry_requested');
    await runPdfExport(constructionSite);
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
