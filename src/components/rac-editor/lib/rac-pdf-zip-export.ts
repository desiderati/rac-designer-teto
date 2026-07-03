import type JSZip from 'jszip';
import type {jsPDF as JsPDFDocument} from 'jspdf';
import type {ConstructionSiteState, PersistedHouseRecord} from '@/shared/types/construction-site.ts';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';
import {buildRacPdfReportModel} from '@/components/rac-editor/lib/rac-pdf-report-model.ts';
import {createRacPdfReportDocument} from '@/components/rac-editor/lib/rac-pdf-report-renderer.ts';

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

export type RacPdfZipCanvasRenderer = (house: PersistedHouseRecord) => Promise<string>;

interface BuildRacPdfZipExportArgs {
  constructionSite: ConstructionSiteState;
  JSZip: new () => JSZip;
  jsPDF: JsPdfConstructor;
  renderCanvasImageDataUrl: RacPdfZipCanvasRenderer;
  generatedAt?: Date;
}

const ZIP_FAILURE_REPORT_FILE_NAME = 'ERROS_EXPORTACAO_RACS.txt';

export async function buildRacPdfZipExport({
  constructionSite,
  JSZip,
  jsPDF,
  generatedAt = new Date(),
  renderCanvasImageDataUrl,
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
      const canvasImageDataUrl = await renderCanvasImageDataUrl(house);
      const report = buildRacPdfReportModel({
        constructionSite,
        houseId: house.id,
        canvasImageDataUrl,
        canvasImageAspectRatio: CANVAS_WIDTH / CANVAS_HEIGHT,
        house3DImageDataUrl: null,
        house3DImageAspectRatio: CANVAS_WIDTH / CANVAS_HEIGHT,
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
