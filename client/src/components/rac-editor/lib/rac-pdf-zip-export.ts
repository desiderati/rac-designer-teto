import type JSZip from 'jszip';
import type {jsPDF as JsPDFDocument} from 'jspdf';
import type {ConstructionSiteState, PersistedHouseRecord} from '@/shared/types/construction-site.ts';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';
import {buildRacPdfReportModel} from '@/components/rac-editor/lib/rac-pdf-report-model.ts';
import {prepareRacPdfReportPhotos} from '@/components/rac-editor/lib/rac-pdf-report-photos.ts';
import {createRacPdfReportDocument} from '@/components/rac-editor/lib/rac-pdf-report-renderer.ts';
import {cacheRacPdf, getCachedRacPdf, getRacPdfFingerprint} from '@/components/rac-editor/lib/rac-pdf-cache.ts';
import {buildRacPdfExportChecklist} from '@/components/rac-editor/lib/rac-pdf-export-checklist.ts';

type JsPdfConstructor = new (options: {
  orientation: 'landscape';
  unit: 'pt';
  format: 'a4';
  compress?: boolean;
}) => JsPDFDocument;

export interface RacPdfZipExportFailure {
  houseId: string;
  houseLabel: string;
  message: string;
}

export interface RacPdfZipExportResult {
  fileName: string;
  blob: Blob;
  exportedHouseIds: string[];
  failures: RacPdfZipExportFailure[];
}

export interface RacPdfHouseExportResult {
  fileName: string;
  blob: Blob;
  exportedHouseId: string;
  pageCount?: number;
}

export type RacPdfZipCanvasRenderer = (house: PersistedHouseRecord) => Promise<string | {
  imageDataUrl: string;
  hasOmittedRasterSources: boolean;
}>;
export type RacPdfHouse3DRenderer = (house: PersistedHouseRecord) => Promise<string | null>;

interface BuildRacPdfZipExportArgs {
  constructionSite: ConstructionSiteState;
  JSZip: new () => JSZip;
  jsPDF: JsPdfConstructor;
  renderCanvasImageDataUrl: RacPdfZipCanvasRenderer;
  renderHouse3DImageDataUrl: RacPdfHouse3DRenderer;
  generatedAt?: Date;
}

interface BuildRacPdfHouseExportArgs {
  constructionSite: ConstructionSiteState;
  houseId: string;
  jsPDF: JsPdfConstructor;
  renderCanvasImageDataUrl: RacPdfZipCanvasRenderer;
  renderHouse3DImageDataUrl: RacPdfHouse3DRenderer;
  generatedAt?: Date;
}

const ZIP_FAILURE_REPORT_FILE_NAME = 'ERROS_EXPORTACAO_RACS.txt';

function assertHouseReadyForPdf(constructionSite: ConstructionSiteState, houseId: string): void {
  const checklist = buildRacPdfExportChecklist(constructionSite, houseId);
  if (checklist.hasBlockingItems) {
    const topView = checklist.missingRequiredItems.find((item) => item.id === 'top-view');
    throw new Error(topView?.description
      ?? `Checklist da RAC possui pendências obrigatórias: ${checklist.missingRequiredItems.map((item) => item.label).join(', ')}.`);
  }
}

export async function buildRacPdfHouseExport({
  constructionSite,
  houseId,
  jsPDF,
  generatedAt = new Date(),
  renderCanvasImageDataUrl,
  renderHouse3DImageDataUrl,
}: BuildRacPdfHouseExportArgs): Promise<RacPdfHouseExportResult> {
  const house = constructionSite.houses.find((entry) => entry.id === houseId && entry.status !== 'archived');
  if (!house) {
    throw new Error('Casa não arquivada não encontrada para exportar.');
  }

  assertHouseReadyForPdf(constructionSite, house.id);
  const fingerprint = getRacPdfFingerprint(constructionSite, house.id);
  const cached = fingerprint && getCachedRacPdf(constructionSite, house.id, fingerprint);
  if (cached) {
    return {fileName: cached.fileName, blob: cached.blob, exportedHouseId: house.id, pageCount: cached.pageCount};
  }

  const canvasCapture = await renderCanvasImageDataUrl(house);
  const canvasImageDataUrl = typeof canvasCapture === 'string' ? canvasCapture : canvasCapture.imageDataUrl;
  const hasOmittedRasterSources = typeof canvasCapture !== 'string' && canvasCapture.hasOmittedRasterSources;
  const house3DImageDataUrl = await renderHouse3DImageDataUrl(house);
  if (!house3DImageDataUrl) throw new Error('Não foi possível capturar a visualização 3D da casa.');
  const photos = await prepareRacPdfReportPhotos(constructionSite, house.id);
  const report = buildRacPdfReportModel({
    constructionSite,
    houseId: house.id,
    canvasImageDataUrl,
    canvasImageAspectRatio: CANVAS_WIDTH / CANVAS_HEIGHT,
    house3DImageDataUrl,
    house3DImageAspectRatio: CANVAS_WIDTH / CANVAS_HEIGHT,
    ...photos,
    generatedAt,
  });

  if (!report) {
    throw new Error('Não foi possível montar o modelo do PDF.');
  }

  const pdf = createRacPdfReportDocument({
    report,
    jsPDF,
  });
  const pdfData = pdf.output('arraybuffer') as ArrayBuffer;
  const pageCount = typeof pdf.getNumberOfPages === 'function'
    ? Math.max(1, pdf.getNumberOfPages())
    : 1;

  const result = {
    fileName: report.fileName,
    blob: new Blob([pdfData], {type: 'application/pdf'}),
    exportedHouseId: house.id,
    pageCount,
  };
  if (fingerprint && !photos.hasUnresolvedPhotoSources && !hasOmittedRasterSources) {
    cacheRacPdf(constructionSite, house.id, {...result, fingerprint});
  }
  return result;
}

export async function buildRacPdfZipExport({
  constructionSite,
  JSZip,
  jsPDF,
  generatedAt = new Date(),
  renderCanvasImageDataUrl,
  renderHouse3DImageDataUrl,
}: BuildRacPdfZipExportArgs): Promise<RacPdfZipExportResult> {
  const houses = constructionSite.houses.filter((house) => house.status !== 'archived');
  if (houses.length === 0) {
    throw new Error('Nenhuma casa não arquivada disponível para exportar.');
  }

  const zip = new JSZip();
  const exportedHouseIds: string[] = [];
  const failures: RacPdfZipExportFailure[] = [];
  const usedFileNames = new Set<string>();

  for (const house of houses) {
    try {
      assertHouseReadyForPdf(constructionSite, house.id);
      const fingerprint = getRacPdfFingerprint(constructionSite, house.id);
      const cached = fingerprint && getCachedRacPdf(constructionSite, house.id, fingerprint);
      if (cached) {
        zip.file(toUniqueZipFileName(cached.fileName, usedFileNames), cached.blob);
        exportedHouseIds.push(house.id);
        continue;
      }

      const canvasCapture = await renderCanvasImageDataUrl(house);
      const canvasImageDataUrl = typeof canvasCapture === 'string' ? canvasCapture : canvasCapture.imageDataUrl;
      const hasOmittedRasterSources = typeof canvasCapture !== 'string' && canvasCapture.hasOmittedRasterSources;
      const house3DImageDataUrl = await renderHouse3DImageDataUrl(house);
      if (!house3DImageDataUrl) throw new Error('Não foi possível capturar a visualização 3D da casa.');
      const photos = await prepareRacPdfReportPhotos(constructionSite, house.id);
      const report = buildRacPdfReportModel({
        constructionSite,
        houseId: house.id,
        canvasImageDataUrl,
        canvasImageAspectRatio: CANVAS_WIDTH / CANVAS_HEIGHT,
        house3DImageDataUrl,
        house3DImageAspectRatio: CANVAS_WIDTH / CANVAS_HEIGHT,
        ...photos,
        generatedAt,
      });

      if (!report) {
        throw new Error('Não foi possível montar o modelo do PDF.');
      }

      const pdf = createRacPdfReportDocument({
        report,
        jsPDF,
      });
      const pdfData = pdf.output('arraybuffer') as ArrayBuffer;
      const blob = new Blob([pdfData], {type: 'application/pdf'});
      const pageCount = typeof pdf.getNumberOfPages === 'function' ? Math.max(1, pdf.getNumberOfPages()) : 1;
      if (fingerprint && !photos.hasUnresolvedPhotoSources && !hasOmittedRasterSources) cacheRacPdf(constructionSite, house.id, {
        fingerprint,
        blob,
        fileName: report.fileName,
        pageCount,
      });
      zip.file(toUniqueZipFileName(report.fileName, usedFileNames), pdfData);
      exportedHouseIds.push(house.id);
    } catch (error) {
      failures.push({
        houseId: house.id,
        houseLabel: getHouseLabel(constructionSite, house),
        message: toErrorMessage(error),
      });
    }
  }

  if (failures.length > 0 && exportedHouseIds.length > 0) {
    zip.file(ZIP_FAILURE_REPORT_FILE_NAME, formatZipFailureReport(constructionSite, failures));
  }

  if (exportedHouseIds.length === 0) {
    throw new Error('Não foi possível gerar PDF para nenhuma casa da construção.');
  }

  const blob = await zip.generateAsync({type: 'blob'});
  return {
    fileName: buildZipFileName(constructionSite),
    blob,
    exportedHouseIds,
    failures,
  };
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);

  try {
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}

function formatZipFailureReport(
  constructionSite: ConstructionSiteState,
  failures: RacPdfZipExportFailure[],
): string {
  return [
    'Falhas na exportação de RACs',
    `Construção: ${constructionSite.constructionSite.externalCode || constructionSite.constructionSite.id}`,
    `Total de falhas: ${failures.length}`,
    '',
    ...failures.map((failure, index) => [
      `${index + 1}. ${failure.houseLabel}`,
      `   ID: ${failure.houseId}`,
      `   Erro: ${failure.message}`,
    ].join('\n')),
    '',
  ].join('\n');
}

function buildZipFileName(constructionSite: ConstructionSiteState): string {
  return `RACS-${toFileSlug(constructionSite.constructionSite.externalCode || constructionSite.constructionSite.id)}.zip`;
}

function toUniqueZipFileName(fileName: string, usedFileNames: Set<string>): string {
  if (!usedFileNames.has(fileName)) {
    usedFileNames.add(fileName);
    return fileName;
  }

  const extensionMatch = /(\.[^.]+)$/.exec(fileName);
  const extension = extensionMatch?.[1] ?? '';
  const baseName = extension ? fileName.slice(0, -extension.length) : fileName;
  let nextIndex = 2;
  let candidate = `${baseName}-${nextIndex}${extension}`;
  while (usedFileNames.has(candidate)) {
    nextIndex += 1;
    candidate = `${baseName}-${nextIndex}${extension}`;
  }
  usedFileNames.add(candidate);
  return candidate;
}

function getHouseLabel(constructionSite: ConstructionSiteState, house: PersistedHouseRecord): string {
  const familyName = constructionSite.families.find((family) => family.id === house.familyId)?.name?.trim();
  return familyName || house.id;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error && error.message.trim()
    ? error.message.trim()
    : 'Erro desconhecido.';
}

function toFileSlug(value: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase();

  return slug || 'TETO';
}
