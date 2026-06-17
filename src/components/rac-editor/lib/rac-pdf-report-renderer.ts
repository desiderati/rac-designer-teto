import type {jsPDF as JsPDFDocument} from 'jspdf';
import type {
  RacPdfReportField,
  RacPdfReportModel,
  RacPdfReportMonitor,
  RacPdfReportOptionGroup,
  RacPdfReportPilotiTotal,
  RacPdfTerrainRiskLevel,
} from '@/components/rac-editor/lib/rac-pdf-report-model.ts';

type RgbColor = [number, number, number];

type JsPdfConstructor = new (options: {
  orientation: 'landscape';
  unit: 'pt';
  format: 'a4';
  compress?: boolean;
}) => JsPDFDocument;

interface CreateRacPdfReportDocumentArgs {
  report: RacPdfReportModel;
  jsPDF: JsPdfConstructor;
  compress?: boolean;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ContinuationPage {
  cursorY: number;
  bottomY: number;
}

interface ChipItem {
  text: string;
  selected: boolean;
}

const COLORS = {
  ink: [17, 24, 39],
  muted: [107, 114, 128],
  faint: [156, 163, 175],
  line: [229, 231, 235],
  surface: [249, 250, 251],
  surfaceStrong: [243, 244, 246],
  brand: [0, 51, 102],
  brandSoft: [239, 246, 255],
  brandLine: [219, 234, 254],
  chipSelectedFill: [226, 239, 255],
  chipSelectedLine: [147, 197, 253],
  chipMutedFill: [250, 251, 252],
  chipMutedLine: [241, 245, 249],
  chipMutedText: [148, 163, 184],
  riskLow: [34, 197, 94],
  riskMedium: [132, 204, 22],
  riskHigh: [245, 158, 11],
  riskCritical: [220, 38, 38],
  white: [255, 255, 255],
} satisfies Record<string, RgbColor>;

const DEFAULT_FONT = 'helvetica';
const PAGE_MARGIN_X = 20;
const PAGE_TOP = 20;
const LEFT_COLUMN_X = PAGE_MARGIN_X;
const LEFT_COLUMN_Y = 66;
const LEFT_COLUMN_WIDTH = 198;
const LEFT_SECTION_GAP = 12;
const MAIN_CANVAS_GAP = 20;
const MAIN_CANVAS_Y = 58;
const MAIN_CANVAS_FOOTER_GAP = 20;
const FOOTER_CELL_HEIGHT = 42;
const FOOTER_CELL_TOP_OFFSET = 14;
const FOOTER_CELL_BORDER_WIDTH = 0.35;
const FOOTER_LABELS = ['1,0 m', '1,2 m', '1,5 m', '2,0 m', '2,5 m', '3,0 m'];
const FIRST_PAGE_MONITOR_LIMIT = 4;
const FIRST_PAGE_MONITOR_COLUMNS = 2;
const FIRST_PAGE_MONITOR_COLUMN_WIDTH = 108;
const FIRST_PAGE_MONITOR_ROW_HEIGHT = 30;
const FIRST_PAGE_MONITOR_SUMMARY_WIDTH = 90;
const FIRST_PAGE_EXTRA_MATERIALS_JUSTIFICATION_LINE_LIMIT = 3;
const FIRST_PAGE_NOTES_LINE_LIMIT = 5;
const FIRST_PAGE_MUTED_BODY_FONT_SIZE = 6.4;
const FIRST_PAGE_MUTED_BODY_LINE_HEIGHT = 8.6;
const CONTINUATION_LEFT_COLUMN_Y = LEFT_COLUMN_Y;
const PDF_FONT_SIZE_INCREMENT = 1;
const HEADER_RISK_GAUGE_X = PAGE_MARGIN_X;
const HEADER_RISK_GAUGE_Y = PAGE_TOP + 4;
const HEADER_RISK_GAUGE_WIDTH = 42;
const HEADER_RISK_GAUGE_HEIGHT = 28;
const HEADER_RISK_GAUGE_TO_TITLE_GAP = 8;
const HEADER_FIELD_X = 476;
const HEADER_FIELD_Y = PAGE_TOP + 8;
const HEADER_FIELD_WIDTH = 88;
const HEADER_FIELD_HEIGHT = 28;
const HEADER_FIELD_COUNT = 3;
const HEADER_FIELD_VALUE_Y_OFFSET = 12;
const HEADER_FIELD_VISUAL_TOP_OFFSET = -4.8;
const HEADER_FIELD_VISUAL_BOTTOM_OFFSET = HEADER_FIELD_VALUE_Y_OFFSET + 4.2;
const HEADER_TITLE_TO_LEADERS_GAP = 8;
const HEADER_LEADERS_TO_METADATA_GAP = 18;
const HEADER_MIN_LEADERS_WIDTH = 90;
const TETO_OFFICIAL_LOGO_WIDTH = 58;
const TETO_OFFICIAL_LOGO_ASPECT_RATIO = 300 / 127;
const TETO_OFFICIAL_LOGO_HEIGHT = TETO_OFFICIAL_LOGO_WIDTH / TETO_OFFICIAL_LOGO_ASPECT_RATIO;
const TETO_TECHO_TEXT_TOP_RATIO = 104 / 127;
const TETO_TECHO_TEXT_HEIGHT_RATIO = 22 / 127;
const TETO_COUNTRY_MARK_E_START_RATIO = 74 / 300;
const TETO_COUNTRY_MARK_X_OFFSET = TETO_OFFICIAL_LOGO_WIDTH * TETO_COUNTRY_MARK_E_START_RATIO;
const TETO_COUNTRY_MARK_HEIGHT = 5.8;
const TETO_COUNTRY_MARK_Y_OFFSET = TETO_OFFICIAL_LOGO_HEIGHT * TETO_TECHO_TEXT_TOP_RATIO
  + (TETO_OFFICIAL_LOGO_HEIGHT * TETO_TECHO_TEXT_HEIGHT_RATIO - TETO_COUNTRY_MARK_HEIGHT) / 2;
const TETO_COUNTRY_FLAG_WIDTH = 7.6;
const TETO_COUNTRY_FLAG_ASPECT_RATIO = 23 / 17;
const TETO_COUNTRY_TEXT_GAP = 2.2;
const TETO_COUNTRY_TEXT_FONT_SIZE = 4.8;
const TETO_COUNTRY_TEXT_CAP_HEIGHT_FACTOR = 0.72;
const TETO_OFFICIAL_LOGO_DATA_URL = 'data:image/png;base64,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';

export function createRacPdfReportDocument({
  report,
  jsPDF,
  compress = true,
}: CreateRacPdfReportDocumentArgs): JsPDFDocument {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
    compress,
  });

  pdf.setProperties({
    title: report.title,
    subject: 'Relatório de acompanhamento construtivo',
    creator: 'RAC Designer TETO',
  });

  drawPageBackground(pdf);
  drawHeader(pdf, report);
  drawLeftColumn(pdf, report);
  drawMainCanvas(pdf, report);
  drawFooter(pdf, report);
  drawContinuationPages(pdf, report);

  return pdf;
}

function drawPageBackground(pdf: JsPDFDocument) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  setFill(pdf, COLORS.white);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
}

function drawHeader(pdf: JsPDFDocument, report: RacPdfReportModel) {
  const headerBaselineY = PAGE_MARGIN_X + 22;
  const familyNameX = HEADER_RISK_GAUGE_X
    + HEADER_RISK_GAUGE_WIDTH
    + HEADER_RISK_GAUGE_TO_TITLE_GAP;

  drawTerrainRiskGauge(
    pdf,
    report.terrain.riskIndicator.score,
    report.terrain.riskIndicator.level,
    HEADER_RISK_GAUGE_X,
    HEADER_RISK_GAUGE_Y,
  );

  setText(pdf, COLORS.ink);
  pdf.setFont(DEFAULT_FONT, 'normal');
  setFontSize(pdf, 18);
  const textRightX = getHeaderMetadataLeftX() - HEADER_LEADERS_TO_METADATA_GAP;
  const shouldDrawLeaders = Boolean(report.leaders);
  const leadersReservedWidth = shouldDrawLeaders
    ? Math.min(HEADER_MIN_LEADERS_WIDTH, Math.max(0, textRightX - familyNameX - HEADER_TITLE_TO_LEADERS_GAP))
    : 0;
  const familyNameToLeadersGap = shouldDrawLeaders ? HEADER_TITLE_TO_LEADERS_GAP : 0;
  const familyNameMaxWidth = textRightX - familyNameX - leadersReservedWidth - familyNameToLeadersGap;
  const familyName = limitText(pdf, report.familyName, familyNameMaxWidth);
  pdf.text(familyName, familyNameX, headerBaselineY);

  if (shouldDrawLeaders) {
    const leadersX = familyNameX + pdf.getTextWidth(familyName) + HEADER_TITLE_TO_LEADERS_GAP;
    const leadersWidth = textRightX - leadersX;
    setText(pdf, COLORS.faint);
    setFontSize(pdf, 7);
    if (leadersWidth > 0) {
      pdf.text(limitText(pdf, report.leaders, leadersWidth), leadersX, headerBaselineY);
    }
  }

  drawHeaderFields(pdf, report.headerFields);
  drawOfficialTetoLogo(pdf, getHeaderLogoX(pdf), getHeaderLogoY());
}

function drawHeaderFields(pdf: JsPDFDocument, fields: RacPdfReportField[]) {
  const headerRects: Rect[] = Array.from({length: HEADER_FIELD_COUNT}, (_, index) => ({
    x: HEADER_FIELD_X + HEADER_FIELD_WIDTH * index,
    y: HEADER_FIELD_Y,
    width: HEADER_FIELD_WIDTH,
    height: HEADER_FIELD_HEIGHT,
  }));

  fields.slice(0, headerRects.length).forEach((field, index) => {
    const rect = headerRects[index];
    const centerX = rect.x + rect.width / 2;
    setText(pdf, COLORS.muted);
    pdf.setFont(DEFAULT_FONT, 'bold');
    setFontSize(pdf, 5);
    pdf.text(limitText(pdf, field.label.toUpperCase(), rect.width), centerX, rect.y, {align: 'center'});

    setText(pdf, COLORS.ink);
    pdf.setFont(DEFAULT_FONT, 'bold');
    setFontSize(pdf, 6.8);
    pdf.text(limitText(pdf, field.value, rect.width), centerX, rect.y + HEADER_FIELD_VALUE_Y_OFFSET, {
      align: 'center',
    });
  });
}

function drawTerrainRiskGauge(
  pdf: JsPDFDocument,
  score: number,
  level: RacPdfTerrainRiskLevel,
  x: number,
  y: number,
) {
  const centerX = x + HEADER_RISK_GAUGE_WIDTH / 2;
  const centerY = y + 20;
  const outerRadius = 18;
  const innerRadius = 10.5;
  const segmentGap = 2;
  const segments: Array<{start: number; end: number; color: RgbColor}> = [
    {start: 180, end: 135 + segmentGap, color: COLORS.riskLow},
    {start: 135 - segmentGap, end: 90 + segmentGap, color: COLORS.riskMedium},
    {start: 90 - segmentGap, end: 45 + segmentGap, color: COLORS.riskHigh},
    {start: 45 - segmentGap, end: 0, color: COLORS.riskCritical},
  ];

  segments.forEach((segment) => {
    drawGaugeSegment(pdf, centerX, centerY, outerRadius, segment.start, segment.end, segment.color);
  });

  setFill(pdf, COLORS.white);
  pdf.circle(centerX, centerY, innerRadius, 'F');

  const pointerAngle = 180 - Math.min(100, Math.max(0, score)) * 1.8;
  const pointerEnd = polarPoint(centerX, centerY, outerRadius - 4, pointerAngle);
  setStroke(pdf, COLORS.ink);
  pdf.setLineWidth(1.35);
  pdf.line(centerX, centerY, pointerEnd[0], pointerEnd[1]);
  setFill(pdf, COLORS.ink);
  pdf.circle(centerX, centerY, 1.9, 'F');

  setText(pdf, getTerrainRiskTextColor(level));
  pdf.setFont(DEFAULT_FONT, 'bold');
  setFontSize(pdf, 5.3);
  pdf.text(String(score), centerX, y + HEADER_RISK_GAUGE_HEIGHT - 0.6, {align: 'center'});
}

function drawGaugeSegment(
  pdf: JsPDFDocument,
  centerX: number,
  centerY: number,
  radius: number,
  startDegrees: number,
  endDegrees: number,
  color: RgbColor,
) {
  const steps = Math.max(3, Math.ceil(Math.abs(startDegrees - endDegrees) / 6));
  const points: [number, number][] = [[centerX, centerY]];
  for (let index = 0; index <= steps; index += 1) {
    const angle = startDegrees + ((endDegrees - startDegrees) * index) / steps;
    points.push(polarPoint(centerX, centerY, radius, angle));
  }
  drawPolygon(pdf, points, color);
}

function polarPoint(centerX: number, centerY: number, radius: number, degrees: number): [number, number] {
  const radians = (degrees * Math.PI) / 180;
  return [
    centerX + Math.cos(radians) * radius,
    centerY - Math.sin(radians) * radius,
  ];
}

function getTerrainRiskTextColor(level: RacPdfTerrainRiskLevel): RgbColor {
  if (level === 'critical') return COLORS.riskCritical;
  if (level === 'high') return COLORS.riskHigh;
  if (level === 'medium') return COLORS.riskMedium;
  return COLORS.riskLow;
}

function getHeaderMetadataLeftX(): number {
  return HEADER_FIELD_X;
}

function getHeaderLogoY(): number {
  const headerFieldsVisualCenterY = HEADER_FIELD_Y
    + (HEADER_FIELD_VISUAL_TOP_OFFSET + HEADER_FIELD_VISUAL_BOTTOM_OFFSET) / 2;

  return headerFieldsVisualCenterY - getTetoOfficialLogoVisualHeight() / 2;
}

function getHeaderLogoX(pdf: JsPDFDocument): number {
  const mainCanvasRect = getMainCanvasRect(pdf);
  return mainCanvasRect.x + mainCanvasRect.width - TETO_OFFICIAL_LOGO_WIDTH;
}

function getTetoOfficialLogoVisualHeight(): number {
  return Math.max(
    TETO_OFFICIAL_LOGO_HEIGHT,
    TETO_COUNTRY_MARK_Y_OFFSET + TETO_COUNTRY_MARK_HEIGHT,
  );
}

function drawLeftColumn(pdf: JsPDFDocument, report: RacPdfReportModel) {
  let cursorY = LEFT_COLUMN_Y;

  cursorY = drawHouseSection(pdf, report, cursorY);
  cursorY += LEFT_SECTION_GAP;
  cursorY = drawTerrainSection(pdf, report, cursorY);
  cursorY += LEFT_SECTION_GAP;
  cursorY = drawExtraMaterialsSection(pdf, report, cursorY);
  cursorY += LEFT_SECTION_GAP;
  cursorY = drawMonitoringSection(pdf, report, cursorY);

  if (report.notes.trim()) {
    cursorY += LEFT_SECTION_GAP;
    drawNotesSection(pdf, report, cursorY, getFirstPageNotesLineLimit(pdf, report, cursorY));
  }
}

function drawHouseSection(pdf: JsPDFDocument, report: RacPdfReportModel, y: number): number {
  const cursorY = drawSectionTitle(pdf, 'CASA', LEFT_COLUMN_X, y, LEFT_COLUMN_WIDTH);
  drawLabelValue(pdf, 'Tamanho', report.house.selectedSize ?? 'Não informado', LEFT_COLUMN_X, cursorY, 86);
  drawLabelValue(pdf, 'Tipo', report.house.selectedType ?? 'Não informado', LEFT_COLUMN_X + 104, cursorY, 86);
  return cursorY + 32;
}

function drawTerrainSection(pdf: JsPDFDocument, report: RacPdfReportModel, y: number): number {
  let cursorY = drawSectionTitle(pdf, 'TERRENO', LEFT_COLUMN_X, y, LEFT_COLUMN_WIDTH);
  drawLabelValue(pdf, 'Desnível', formatDesnivel(report.terrain.desnivelCm), LEFT_COLUMN_X, cursorY, 86);
  drawLabelValue(pdf, 'Solo', getSelectedTerrainValues(report, 'Solo')[0] ?? 'Não informado', LEFT_COLUMN_X + 104, cursorY, 100);
  cursorY += 34;

  drawTinyLabel(pdf, 'Obstáculos', LEFT_COLUMN_X, cursorY);
  const obstacleGroup = getTerrainOptionGroup(report, 'Obstáculos');
  const selectedObstacles = new Set(obstacleGroup?.selected ?? []);
  const obstacles = (obstacleGroup?.options ?? []).map((option) => ({
    text: option,
    selected: selectedObstacles.has(option),
  }));
  drawStatefulChipRow(pdf, obstacles, LEFT_COLUMN_X, cursorY + 9, LEFT_COLUMN_WIDTH);
  return cursorY + 30;
}

function drawExtraMaterialsSection(pdf: JsPDFDocument, report: RacPdfReportModel, y: number): number {
  let cursorY = drawSectionTitle(pdf, 'MATERIAL EXTRA', LEFT_COLUMN_X, y, LEFT_COLUMN_WIDTH);
  report.extraMaterials.fields.forEach((field, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    drawLabelValue(
      pdf,
      field.label,
      field.value,
      LEFT_COLUMN_X + column * 104,
      cursorY + row * 26,
      column === 0 ? 92 : 100,
    );
  });
  cursorY += 56;

  drawTinyLabel(pdf, 'Outros / Justificativa', LEFT_COLUMN_X, cursorY);
  setText(pdf, COLORS.muted);
  pdf.setFont(DEFAULT_FONT, 'italic');
  setFontSize(pdf, FIRST_PAGE_MUTED_BODY_FONT_SIZE);
  const lines = splitFirstPageBodyTextToFit(
    pdf,
    report.extraMaterials.justification,
    FIRST_PAGE_EXTRA_MATERIALS_JUSTIFICATION_LINE_LIMIT,
  );
  drawFirstPageBodyLines(pdf, lines, LEFT_COLUMN_X, cursorY + 13);
  return cursorY + getFirstPageBodyPreviewHeight(FIRST_PAGE_EXTRA_MATERIALS_JUSTIFICATION_LINE_LIMIT);
}

function drawMonitoringSection(pdf: JsPDFDocument, report: RacPdfReportModel, y: number): number {
  const cursorY = drawSectionTitle(pdf, 'MONITORIA', LEFT_COLUMN_X, y, LEFT_COLUMN_WIDTH);

  const visibleMonitors = report.monitors.slice(0, FIRST_PAGE_MONITOR_LIMIT);
  if (visibleMonitors.length === 0) {
    drawMutedValue(pdf, 'Nenhum monitor ativo informado.', LEFT_COLUMN_X, cursorY + 2, LEFT_COLUMN_WIDTH);
    return cursorY + 18;
  }

  visibleMonitors.forEach((monitor, index) => {
    const column = index % FIRST_PAGE_MONITOR_COLUMNS;
    const row = Math.floor(index / FIRST_PAGE_MONITOR_COLUMNS);
    drawMonitorSummary(
      pdf,
      monitor,
      LEFT_COLUMN_X + column * FIRST_PAGE_MONITOR_COLUMN_WIDTH,
      cursorY + row * FIRST_PAGE_MONITOR_ROW_HEIGHT,
      FIRST_PAGE_MONITOR_SUMMARY_WIDTH,
    );
  });

  if (report.monitors.length > visibleMonitors.length) {
    setText(pdf, COLORS.faint);
    pdf.setFont(DEFAULT_FONT, 'bold');
    setFontSize(pdf, 5.8);
    pdf.text(`+${report.monitors.length - visibleMonitors.length} monitor(es)`, LEFT_COLUMN_X + LEFT_COLUMN_WIDTH, y, {
      align: 'right',
    });
  }

  return cursorY + Math.ceil(visibleMonitors.length / FIRST_PAGE_MONITOR_COLUMNS) * FIRST_PAGE_MONITOR_ROW_HEIGHT + 12;
}

function drawNotesSection(pdf: JsPDFDocument, report: RacPdfReportModel, y: number, maxLines: number) {
  const cursorY = drawSectionTitle(pdf, 'OBSERVAÇÕES', LEFT_COLUMN_X, y, LEFT_COLUMN_WIDTH);
  if (maxLines <= 0) return;

  setText(pdf, COLORS.muted);
  pdf.setFont(DEFAULT_FONT, 'italic');
  setFontSize(pdf, FIRST_PAGE_MUTED_BODY_FONT_SIZE);
  const lines = splitFirstPageBodyTextToFit(pdf, report.notes, maxLines);
  drawFirstPageBodyLines(pdf, lines, LEFT_COLUMN_X, cursorY + 2);
}

function getMainCanvasRect(pdf: JsPDFDocument): Rect {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const canvasX = LEFT_COLUMN_X + LEFT_COLUMN_WIDTH + MAIN_CANVAS_GAP;
  const footerTopY = getFooterRowY(pdf) - FOOTER_CELL_TOP_OFFSET;

  return {
    x: canvasX,
    y: MAIN_CANVAS_Y,
    width: pageWidth - PAGE_MARGIN_X - canvasX,
    height: footerTopY - MAIN_CANVAS_FOOTER_GAP - MAIN_CANVAS_Y,
  };
}

function drawMainCanvas(pdf: JsPDFDocument, report: RacPdfReportModel) {
  const mainCanvasRect = getMainCanvasRect(pdf);
  setFill(pdf, COLORS.surface);
  pdf.roundedRect(
    mainCanvasRect.x,
    mainCanvasRect.y,
    mainCanvasRect.width,
    mainCanvasRect.height,
    5,
    5,
    'F',
  );

  const fitted = getMainCanvasImageRect(pdf, report);

  pdf.addImage(
    report.canvasImageDataUrl,
    getImageFormat(report.canvasImageDataUrl),
    fitted.x,
    fitted.y,
    fitted.width,
    fitted.height,
    undefined,
    'FAST',
  );
}

function getMainCanvasImageRect(pdf: JsPDFDocument, report: RacPdfReportModel): Rect {
  return fitImageContain(getMainCanvasRect(pdf), report.canvasImageAspectRatio);
}

function getFooterRowY(pdf: JsPDFDocument): number {
  const footerCellBottomOffset = FOOTER_CELL_HEIGHT - FOOTER_CELL_TOP_OFFSET;
  return pdf.internal.pageSize.getHeight() - PAGE_MARGIN_X - footerCellBottomOffset;
}

function drawFooter(pdf: JsPDFDocument, report: RacPdfReportModel) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const footerRowY = getFooterRowY(pdf);
  const contentWidth = pageWidth - PAGE_MARGIN_X * 2;
  const columnWidth = contentWidth / 7;
  const masterLabel = formatMasterPilotiFooterLabel(report);

  drawFooterCell(pdf, 'PILOTIS MESTRE', masterLabel, PAGE_MARGIN_X, footerRowY, columnWidth, true);

  const totals = getFooterTotals(report.pilotis.totals);
  totals.forEach((total, index) => {
    drawFooterCell(
      pdf,
      `PILOTIS ${total.heightLabel.toUpperCase()}`,
      String(total.count),
      PAGE_MARGIN_X + columnWidth * (index + 1),
      footerRowY,
      columnWidth,
      total.count > 0,
    );
  });
}

function formatMasterPilotiFooterLabel(report: RacPdfReportModel): string {
  if (!report.pilotis.master) return 'Não informado';

  return [
    report.pilotis.master.code,
    report.pilotis.master.heightLabel,
    `Nível = ${report.pilotis.master.nivelLabel}`,
  ].join(' / ');
}

function drawFooterCell(
  pdf: JsPDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  highlighted: boolean,
) {
  pdf.setLineWidth(FOOTER_CELL_BORDER_WIDTH);
  if (highlighted) {
    setFill(pdf, COLORS.surfaceStrong);
    setStroke(pdf, COLORS.line);
    pdf.roundedRect(x + 2, y - FOOTER_CELL_TOP_OFFSET, width - 4, FOOTER_CELL_HEIGHT, 3, 3, 'FD');
  } else {
    setStroke(pdf, COLORS.line);
    pdf.roundedRect(x + 2, y - FOOTER_CELL_TOP_OFFSET, width - 4, FOOTER_CELL_HEIGHT, 3, 3, 'S');
  }

  setText(pdf, highlighted ? COLORS.muted : COLORS.faint);
  pdf.setFont(DEFAULT_FONT, 'bold');
  setFontSize(pdf, 5.2);
  pdf.text(limitText(pdf, label, width - 10), x + width / 2, y, {align: 'center'});

  setText(pdf, highlighted ? COLORS.ink : COLORS.faint);
  pdf.setFont(DEFAULT_FONT, 'bold');
  setFontSize(pdf, 7.4);
  pdf.text(limitText(pdf, value, width - 10), x + width / 2, y + 17, {align: 'center'});
}

function drawContinuationPages(pdf: JsPDFDocument, report: RacPdfReportModel) {
  const hiddenMonitors = report.monitors.slice(FIRST_PAGE_MONITOR_LIMIT);
  const extraJustificationText = report.extraMaterials.justification.trim();
  const extraJustificationLines = extraJustificationText
    ? splitFirstPageBodyText(pdf, extraJustificationText)
    : [];
  const hasExtraMaterialsContinuation = (
    extraJustificationLines.length > FIRST_PAGE_EXTRA_MATERIALS_JUSTIFICATION_LINE_LIMIT
  );
  const notesText = report.notes.trim();
  const noteLines = notesText ? splitFirstPageBodyText(pdf, notesText) : [];
  const notesLineLimit = getFirstPageNotesLineLimit(
    pdf,
    report,
    getFirstPageNotesSectionY(report),
  );
  const hasNotesContinuation = noteLines.length > notesLineLimit;
  const hasHouse3DContinuation = Boolean(report.house3DImageDataUrl);

  if (
    hiddenMonitors.length === 0
    && !hasExtraMaterialsContinuation
    && !hasNotesContinuation
    && !hasHouse3DContinuation
  ) return;

  let page = createContinuationPage(pdf, report);
  page = drawContinuationMonitors(pdf, report, hiddenMonitors, page);

  if (hasExtraMaterialsContinuation) {
    page = drawContinuationTextSection(
      pdf,
      report,
      'OUTROS / JUSTIFICATIVAS MATERIAIS EXTRAS',
      extraJustificationText,
      page,
    );
  }

  if (hasNotesContinuation) {
    drawContinuationTextSection(pdf, report, 'OBSERVAÇÕES COMPLETAS', notesText, page);
  }
}

function createContinuationPage(pdf: JsPDFDocument, report: RacPdfReportModel): ContinuationPage {
  pdf.addPage('a4', 'landscape');
  drawPageBackground(pdf);
  drawHeader(pdf, report);

  drawContinuationHouse3DView(pdf, report);
  drawFooter(pdf, report);

  const mainCanvasRect = getMainCanvasRect(pdf);
  return {
    cursorY: CONTINUATION_LEFT_COLUMN_Y,
    bottomY: mainCanvasRect.y + mainCanvasRect.height,
  };
}

function drawContinuationHouse3DView(pdf: JsPDFDocument, report: RacPdfReportModel) {
  if (!report.house3DImageDataUrl) return;

  const rect = getMainCanvasRect(pdf);
  setFill(pdf, COLORS.surface);
  pdf.roundedRect(rect.x, rect.y, rect.width, rect.height, 5, 5, 'F');

  const fitted = fitImageContain(rect, report.house3DImageAspectRatio);
  pdf.addImage(
    report.house3DImageDataUrl,
    getImageFormat(report.house3DImageDataUrl),
    fitted.x,
    fitted.y,
    fitted.width,
    fitted.height,
    undefined,
    'FAST',
  );
}

function drawContinuationMonitors(
  pdf: JsPDFDocument,
  report: RacPdfReportModel,
  monitors: RacPdfReportMonitor[],
  page: ContinuationPage,
): ContinuationPage {
  if (monitors.length === 0) return page;

  let nextPage = page;
  let monitorIndex = 0;

  while (monitorIndex < monitors.length) {
    const contentStartY = nextPage.cursorY + 22;
    const availableRows = Math.floor((nextPage.bottomY - contentStartY) / FIRST_PAGE_MONITOR_ROW_HEIGHT);
    if (availableRows <= 0) {
      nextPage = createContinuationPage(pdf, report);
      continue;
    }

    const visibleCount = Math.min(monitors.length - monitorIndex, availableRows * FIRST_PAGE_MONITOR_COLUMNS);
    const visibleMonitors = monitors.slice(monitorIndex, monitorIndex + visibleCount);
    const sectionContentY = drawSectionTitle(
      pdf,
      'MONITORIA (CONTINUAÇÃO)',
      LEFT_COLUMN_X,
      nextPage.cursorY,
      LEFT_COLUMN_WIDTH,
    );
    visibleMonitors.forEach((monitor, index) => {
      const column = index % FIRST_PAGE_MONITOR_COLUMNS;
      const row = Math.floor(index / FIRST_PAGE_MONITOR_COLUMNS);
      drawMonitorSummary(
        pdf,
        monitor,
        LEFT_COLUMN_X + column * FIRST_PAGE_MONITOR_COLUMN_WIDTH,
        sectionContentY + row * FIRST_PAGE_MONITOR_ROW_HEIGHT,
        FIRST_PAGE_MONITOR_SUMMARY_WIDTH,
      );
    });

    monitorIndex += visibleCount;
    nextPage = {
      ...nextPage,
      cursorY: sectionContentY
        + Math.ceil(visibleMonitors.length / FIRST_PAGE_MONITOR_COLUMNS) * FIRST_PAGE_MONITOR_ROW_HEIGHT
        + LEFT_SECTION_GAP,
    };
  }

  return nextPage;
}

function drawContinuationTextSection(
  pdf: JsPDFDocument,
  report: RacPdfReportModel,
  title: string,
  text: string,
  page: ContinuationPage,
): ContinuationPage {
  const lines = splitContinuationText(pdf, text);
  let nextPage = page;
  let lineIndex = 0;

  while (lineIndex < lines.length) {
    const contentStartY = nextPage.cursorY + 22;
    const availableLines = Math.floor((nextPage.bottomY - contentStartY) / FIRST_PAGE_MUTED_BODY_LINE_HEIGHT);
    if (availableLines <= 0) {
      nextPage = createContinuationPage(pdf, report);
      continue;
    }

    const visibleLines = lines.slice(lineIndex, lineIndex + availableLines);
    const cursorY = drawSectionTitle(
      pdf,
      lineIndex === 0 ? title : `${title} (CONTINUAÇÃO)`,
      LEFT_COLUMN_X,
      nextPage.cursorY,
      LEFT_COLUMN_WIDTH,
    );

    setText(pdf, COLORS.ink);
    pdf.setFont(DEFAULT_FONT, 'normal');
    setFontSize(pdf, FIRST_PAGE_MUTED_BODY_FONT_SIZE);
    drawWrappedContinuationLines(
      pdf,
      visibleLines,
      LEFT_COLUMN_X,
      cursorY,
      FIRST_PAGE_MUTED_BODY_LINE_HEIGHT,
    );

    lineIndex += visibleLines.length;
    nextPage = {
      ...nextPage,
      cursorY: cursorY + visibleLines.length * FIRST_PAGE_MUTED_BODY_LINE_HEIGHT + LEFT_SECTION_GAP,
    };
  }

  return nextPage;
}

function splitContinuationText(pdf: JsPDFDocument, text: string): string[] {
  pdf.setFont(DEFAULT_FONT, 'normal');
  setFontSize(pdf, FIRST_PAGE_MUTED_BODY_FONT_SIZE);
  return splitTextByWordsToWidth(pdf, text, LEFT_COLUMN_WIDTH);
}

function drawWrappedContinuationLines(
  pdf: JsPDFDocument,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
) {
  lines.forEach((line, index) => {
    pdf.text(line, x, y + index * lineHeight);
  });
}

function splitTextByWordsToWidth(pdf: JsPDFDocument, text: string, maxWidth: number): string[] {
  return text
    .split(/\r?\n/)
    .flatMap((paragraph) => wrapParagraphByWordsToWidth(pdf, paragraph, maxWidth));
}

function wrapParagraphByWordsToWidth(pdf: JsPDFDocument, paragraph: string, maxWidth: number): string[] {
  const words = paragraph.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (pdf.getTextWidth(candidate) <= maxWidth) {
      currentLine = candidate;
      return;
    }

    if (currentLine) lines.push(currentLine);
    currentLine = word;

    while (pdf.getTextWidth(currentLine) > maxWidth && currentLine.length > 1) {
      const fitted = limitText(pdf, currentLine, maxWidth);
      lines.push(fitted);
      currentLine = currentLine.slice(fitted.replace(/\.\.\.$/, '').length).trimStart();
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
}

function splitFirstPageBodyText(pdf: JsPDFDocument, text: string): string[] {
  pdf.setFont(DEFAULT_FONT, 'italic');
  setFontSize(pdf, FIRST_PAGE_MUTED_BODY_FONT_SIZE);
  return pdf.splitTextToSize(text, LEFT_COLUMN_WIDTH);
}

function splitFirstPageBodyTextToFit(pdf: JsPDFDocument, text: string, maxLines: number): string[] {
  if (maxLines <= 0) return [];

  const lines = splitFirstPageBodyText(pdf, text);
  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  visible[visible.length - 1] = limitText(pdf, `${visible.at(-1) ?? ''}...`, LEFT_COLUMN_WIDTH);
  return visible;
}

function drawFirstPageBodyLines(pdf: JsPDFDocument, lines: string[], x: number, y: number) {
  if (lines.length === 0) return;

  pdf.text(lines, x, y, {
    lineHeightFactor: FIRST_PAGE_MUTED_BODY_LINE_HEIGHT / getFirstPageMutedBodyFontSize(),
  });
}

function getFirstPageNotesLineLimit(
  pdf: JsPDFDocument,
  report: RacPdfReportModel,
  sectionY: number,
): number {
  const firstLineY = sectionY + 24;
  const canvasImageRect = getMainCanvasImageRect(pdf, report);
  const bottomY = canvasImageRect.y + canvasImageRect.height - 3;
  if (firstLineY > bottomY) return 0;

  return Math.min(
    FIRST_PAGE_NOTES_LINE_LIMIT,
    Math.floor((bottomY - firstLineY) / FIRST_PAGE_MUTED_BODY_LINE_HEIGHT) + 1,
  );
}

function getFirstPageNotesSectionY(report: RacPdfReportModel): number {
  const visibleMonitors = Math.min(report.monitors.length, FIRST_PAGE_MONITOR_LIMIT);
  const monitoringHeight = visibleMonitors === 0
    ? 40
    : 34 + Math.ceil(visibleMonitors / FIRST_PAGE_MONITOR_COLUMNS) * FIRST_PAGE_MONITOR_ROW_HEIGHT;

  return LEFT_COLUMN_Y
    + 54
    + LEFT_SECTION_GAP
    + 86
    + LEFT_SECTION_GAP
    + getFirstPageExtraMaterialsSectionHeight()
    + LEFT_SECTION_GAP
    + monitoringHeight
    + LEFT_SECTION_GAP;
}

function getFirstPageExtraMaterialsSectionHeight(): number {
  return 22
    + 56
    + getFirstPageBodyPreviewHeight(FIRST_PAGE_EXTRA_MATERIALS_JUSTIFICATION_LINE_LIMIT);
}

function getFirstPageBodyPreviewHeight(lineLimit: number): number {
  return 13 + Math.max(0, lineLimit - 1) * FIRST_PAGE_MUTED_BODY_LINE_HEIGHT + 7;
}

function drawSectionTitle(pdf: JsPDFDocument, title: string, x: number, y: number, width: number): number {
  setText(pdf, COLORS.ink);
  pdf.setFont(DEFAULT_FONT, 'bold');
  setFontSize(pdf, 6.4);
  pdf.text(limitText(pdf, title, width), x, y);
  drawHairline(pdf, x, y + 8, x + width, y + 8);
  return y + 22;
}

function drawLabelValue(pdf: JsPDFDocument, label: string, value: string, x: number, y: number, width: number) {
  drawTinyLabel(pdf, label, x, y);
  setText(pdf, COLORS.ink);
  pdf.setFont(DEFAULT_FONT, 'bold');
  setFontSize(pdf, 7.5);
  pdf.text(limitText(pdf, value, width), x, y + 13);
}

function drawTinyLabel(pdf: JsPDFDocument, label: string, x: number, y: number) {
  setText(pdf, COLORS.muted);
  pdf.setFont(DEFAULT_FONT, 'bold');
  setFontSize(pdf, 5.5);
  pdf.text(limitText(pdf, label.toUpperCase(), 110), x, y);
}

function drawMutedValue(pdf: JsPDFDocument, value: string, x: number, y: number, width: number) {
  setText(pdf, COLORS.muted);
  pdf.setFont(DEFAULT_FONT, 'normal');
  setFontSize(pdf, 6.5);
  pdf.text(limitText(pdf, value, width), x, y);
}

function drawChipRow(pdf: JsPDFDocument, values: string[], x: number, y: number, width: number) {
  drawStatefulChipRow(
    pdf,
    values.map((value) => ({text: value, selected: true})),
    x,
    y,
    width,
  );
}

function drawStatefulChipRow(pdf: JsPDFDocument, values: ChipItem[], x: number, y: number, width: number) {
  const availableWidth = Math.max(0, width);
  if (availableWidth <= 0) return;

  pdf.setFont(DEFAULT_FONT, 'normal');
  setFontSize(pdf, 5.5);
  const visibleValues = values.slice(0, 3).map((value, index) => {
    const remaining = values.length - index;
    return {
      ...value,
      text: index === 2 && remaining > 1 ? `+${remaining}` : value.text,
    };
  });
  const chipWidths = visibleValues.map((value) => Math.min(Math.max(pdf.getTextWidth(value.text) + 16, 58), availableWidth));
  const totalChipWidth = chipWidths.reduce((total, chipWidth) => total + chipWidth, 0);
  const gap = visibleValues.length > 1
    ? Math.max(4, (availableWidth - totalChipWidth) / (visibleValues.length - 1))
    : 0;

  let cursorX = x;
  visibleValues.forEach((value, index) => {
    const available = x + availableWidth - cursorX;
    if (available < 22) return;

    const chipWidth = Math.min(chipWidths[index], available);
    setFill(pdf, value.selected ? COLORS.chipSelectedFill : COLORS.chipMutedFill);
    setStroke(pdf, value.selected ? COLORS.chipSelectedLine : COLORS.chipMutedLine);
    pdf.roundedRect(cursorX, y, chipWidth, 13, 2, 2, 'FD');
    setText(pdf, value.selected ? COLORS.brand : COLORS.chipMutedText);
    pdf.text(limitText(pdf, value.text, chipWidth - 8), cursorX + chipWidth / 2, y + 8.6, {align: 'center'});
    cursorX += chipWidth + gap;
  });
}

function drawMonitorSummary(
  pdf: JsPDFDocument,
  monitor: RacPdfReportMonitor,
  x: number,
  y: number,
  width: number,
) {
  setFill(pdf, COLORS.surfaceStrong);
  pdf.circle(x + 10, y + 10, 9, 'F');
  setText(pdf, COLORS.muted);
  pdf.setFont(DEFAULT_FONT, 'bold');
  setFontSize(pdf, 6);
  pdf.text(getInitials(monitor.name), x + 10, y + 12, {align: 'center'});

  setText(pdf, COLORS.ink);
  pdf.setFont(DEFAULT_FONT, 'bold');
  setFontSize(pdf, 7);
  pdf.text(limitText(pdf, monitor.name, width - 26), x + 24, y + 7);

  setText(pdf, COLORS.muted);
  pdf.setFont(DEFAULT_FONT, 'normal');
  setFontSize(pdf, 5.5);
  pdf.text(limitText(pdf, monitor.phone, width - 26), x + 24, y + 16);
}

function drawOfficialTetoLogo(pdf: JsPDFDocument, x: number, y: number) {
  pdf.addImage(
    TETO_OFFICIAL_LOGO_DATA_URL,
    'PNG',
    x,
    y,
    TETO_OFFICIAL_LOGO_WIDTH,
    TETO_OFFICIAL_LOGO_HEIGHT,
    undefined,
    'FAST',
  );

  drawTetoCountryMark(
    pdf,
    x + TETO_COUNTRY_MARK_X_OFFSET,
    y + TETO_COUNTRY_MARK_Y_OFFSET,
  );
}

function drawTetoCountryMark(pdf: JsPDFDocument, x: number, y: number) {
  const flagHeight = TETO_COUNTRY_FLAG_WIDTH / TETO_COUNTRY_FLAG_ASPECT_RATIO;
  const flagY = y + (TETO_COUNTRY_MARK_HEIGHT - flagHeight) / 2;
  drawBrazilFlagIcon(pdf, x, flagY, TETO_COUNTRY_FLAG_WIDTH);

  const textFontSize = TETO_COUNTRY_TEXT_FONT_SIZE + PDF_FONT_SIZE_INCREMENT;
  const textBaselineY = y
    + (TETO_COUNTRY_MARK_HEIGHT + textFontSize * TETO_COUNTRY_TEXT_CAP_HEIGHT_FACTOR) / 2;
  setText(pdf, COLORS.muted);
  pdf.setFont(DEFAULT_FONT, 'bold');
  setFontSize(pdf, TETO_COUNTRY_TEXT_FONT_SIZE);
  pdf.text('BR', x + TETO_COUNTRY_FLAG_WIDTH + TETO_COUNTRY_TEXT_GAP, textBaselineY);
}

function drawBrazilFlagIcon(pdf: JsPDFDocument, x: number, y: number, width: number) {
  const height = width / TETO_COUNTRY_FLAG_ASPECT_RATIO;
  const scale = width / 23;
  const point = (sourceX: number, sourceY: number): [number, number] => [
    x + sourceX * scale,
    y + sourceY * scale,
  ];

  setFill(pdf, [0, 155, 58]);
  pdf.roundedRect(x, y, width, height, 0.8, 0.8, 'F');

  drawPolygon(pdf, [
    point(20.1404, 8.5),
    point(11.0771, 15.3455),
    point(2.0137, 8.5),
    point(11.0771, 1.6539),
  ], [254, 223, 1]);

  setFill(pdf, [0, 39, 118]);
  pdf.circle(x + 11.062 * scale, y + 8.4532 * scale, 3.9742 * scale, 'F');

  drawPolygon(pdf, [
    point(7.1426, 7.8292),
    point(7.5561, 6.5843),
    point(14.913, 9.4237),
    point(14.3697, 10.6569),
  ], [203, 233, 212]);
}

function drawPolygon(pdf: JsPDFDocument, points: [number, number][], color: RgbColor) {
  if (points.length < 3) return;

  setFill(pdf, color);
  const [firstPoint, ...remainingPoints] = points;
  let previousPoint = firstPoint;
  const relativeLines = remainingPoints.map((currentPoint) => {
    const line = [
      currentPoint[0] - previousPoint[0],
      currentPoint[1] - previousPoint[1],
    ];
    previousPoint = currentPoint;
    return line;
  });

  pdf.lines(relativeLines, firstPoint[0], firstPoint[1], [1, 1], 'F', true);
}

function drawHairline(pdf: JsPDFDocument, x1: number, y1: number, x2: number, y2: number) {
  setStroke(pdf, COLORS.line);
  pdf.setLineWidth(0.35);
  pdf.line(x1, y1, x2, y2);
}

function fitImageContain(rect: Rect, aspectRatio: number): Rect {
  const boxRatio = rect.width / rect.height;

  if (boxRatio > aspectRatio) {
    const width = rect.height * aspectRatio;
    return {
      x: rect.x + (rect.width - width) / 2,
      y: rect.y,
      width,
      height: rect.height,
    };
  }

  const height = rect.width / aspectRatio;
  return {
    x: rect.x,
    y: rect.y + (rect.height - height) / 2,
    width: rect.width,
    height,
  };
}

function getFooterTotals(totals: RacPdfReportPilotiTotal[]): RacPdfReportPilotiTotal[] {
  const countByLabel = new Map(totals.map((total) => [total.heightLabel, total.count]));
  return FOOTER_LABELS.map((heightLabel) => ({
    heightLabel,
    count: countByLabel.get(heightLabel) ?? 0,
  }));
}

function getSelectedTerrainValues(report: RacPdfReportModel, groupLabel: string): string[] {
  return getTerrainOptionGroup(report, groupLabel)?.selected ?? [];
}

function getTerrainOptionGroup(report: RacPdfReportModel, groupLabel: string): RacPdfReportOptionGroup | null {
  return report.terrain.optionGroups.find((group) => group.label === groupLabel) ?? null;
}

function getImageFormat(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' {
  if (/^data:image\/jpe?g/i.test(dataUrl)) return 'JPEG';
  if (/^data:image\/webp/i.test(dataUrl)) return 'WEBP';
  return 'PNG';
}

function formatDesnivel(value: number | null) {
  if (value === null) return 'Não informado';
  return `${value} cm`;
}

function getInitials(value: string): string {
  const initials = value
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
  return initials || 'M';
}

function limitText(pdf: JsPDFDocument, text: string, maxWidth: number): string {
  if (maxWidth <= 0) return '';
  if (pdf.getTextWidth(text) <= maxWidth) return text;

  const ellipsis = '...';
  if (pdf.getTextWidth(ellipsis) > maxWidth) return '';

  let next = text;
  while (next.length > 0 && pdf.getTextWidth(`${next}${ellipsis}`) > maxWidth) {
    next = next.slice(0, -1);
  }
  return `${next.trimEnd()}${ellipsis}`;
}

function setFill(pdf: JsPDFDocument, color: RgbColor) {
  pdf.setFillColor(color[0], color[1], color[2]);
}

function setStroke(pdf: JsPDFDocument, color: RgbColor) {
  pdf.setDrawColor(color[0], color[1], color[2]);
}

function setText(pdf: JsPDFDocument, color: RgbColor) {
  pdf.setTextColor(color[0], color[1], color[2]);
}

function setFontSize(pdf: JsPDFDocument, size: number) {
  pdf.setFontSize(size + PDF_FONT_SIZE_INCREMENT);
}

function getFirstPageMutedBodyFontSize(): number {
  return FIRST_PAGE_MUTED_BODY_FONT_SIZE + PDF_FONT_SIZE_INCREMENT;
}
