import type {jsPDF as JsPDFDocument} from 'jspdf';
import type {
  RacPdfReportField,
  RacPdfReportModel,
  RacPdfReportMonitor,
  RacPdfReportOptionGroup,
  RacPdfReportPilotiTotal,
  RacPdfTerrainRiskLevel,
} from '@/components/rac-editor/lib/rac-pdf-report-model.ts';
import {
  COLORS,
  DEFAULT_FONT,
  PDF_FONT_SIZE_INCREMENT,
  type Rect,
  type RgbColor,
  drawHairline,
  drawPolygon,
  fitImageContain,
  getImageFormat,
  limitText,
  setFill,
  setFontSize,
  setStroke,
  setText,
} from '@/components/rac-editor/lib/rac-pdf-report-renderer-primitives.ts';

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

interface ContinuationPage {
  cursorY: number;
  bottomY: number;
}

interface ChipItem {
  text: string;
  selected: boolean;
}

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
const FIRST_PAGE_BODY_CONTINUATION_HINT = '(continua atrás...)';
const FIRST_PAGE_MUTED_BODY_FONT_SIZE = 6.4;
const FIRST_PAGE_MUTED_BODY_LINE_HEIGHT = 8.6;
const RESIDENT_ACTION_COLUMNS = 2;
const RESIDENT_ACTION_COLUMN_WIDTH = 94;
const RESIDENT_ACTION_COLUMN_GAP = 104;
const RESIDENT_ACTION_TOP_GAP = 9;
const RESIDENT_ACTION_SECTION_BASE_HEIGHT = 10;
const RESIDENT_ACTION_ROW_HEIGHT = 10;
const RESIDENT_ACTION_CHECK_FILL: RgbColor = [37, 99, 235];
const CONTINUATION_MEDIA_GAP = 8;
const CONTINUATION_MEDIA_CARD_RADIUS = 4;
const CONTINUATION_MEDIA_CARD_PADDING = 6;
const CONTINUATION_LEFT_COLUMN_Y = LEFT_COLUMN_Y;
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
  drawMonitoringSection(pdf, report, cursorY);
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
  drawCompactStatefulChipRow(pdf, obstacles, LEFT_COLUMN_X, cursorY + 9, LEFT_COLUMN_WIDTH);
  cursorY += 32;

  const selectedActions = getSelectedTerrainOptions(report, 'Ações do Morador');
  if (selectedActions.length > 0) {
    cursorY += RESIDENT_ACTION_TOP_GAP;
    drawTinyLabel(pdf, 'Ações do Morador', LEFT_COLUMN_X, cursorY);
    drawResidentActionList(pdf, selectedActions, LEFT_COLUMN_X, cursorY + 13);
    cursorY += getResidentActionSectionHeight(selectedActions.length);
  }

  return cursorY;
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
  cursorY += getFirstPageExtraMaterialsFieldHeight(report.extraMaterials.fields.length);

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
  const masterLabel = formatMasterPilotiFooterLabel(report);
  const totals = getFooterTotals(report.pilotis.totals);
  const columnWidth = contentWidth / (totals.length + 1);

  drawFooterCell(pdf, 'PILOTIS MESTRE', masterLabel, PAGE_MARGIN_X, footerRowY, columnWidth, true, 5.2);

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
  valueFontSize = 7.4,
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
  const valueText = fitFooterValueText(pdf, value, width - 10, valueFontSize);
  pdf.text(valueText, x + width / 2, y + 17, {align: 'center'});
}

function fitFooterValueText(pdf: JsPDFDocument, value: string, maxWidth: number, preferredSize: number): string {
  let fontSize = preferredSize;
  setFontSize(pdf, fontSize);

  while (fontSize > 3.8 && pdf.getTextWidth(value) > maxWidth) {
    fontSize = Math.max(3.8, fontSize - 0.2);
    setFontSize(pdf, fontSize);
  }

  return limitText(pdf, value, maxWidth);
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

  let page = createContinuationPage(pdf, report);
  if (notesText) {
    page = drawContinuationTextSection(pdf, report, 'OBSERVAÇÕES', notesText, page);
  }
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
  const rect = getMainCanvasRect(pdf);
  const slots = getContinuationMediaSlots(rect);
  drawContinuationMediaCard(pdf, slots.house3D, {
    label: 'MODELO 3D',
    imageDataUrl: report.house3DImageDataUrl,
    aspectRatio: report.house3DImageAspectRatio,
    placeholderTitle: 'Modelo 3D indisponível',
    placeholderHint: 'A visualização será exibida quando houver captura 3D.',
    prominent: true,
  });
  drawContinuationMediaCard(pdf, slots.familyPhoto, {
    label: 'FOTO FAMÍLIA',
    imageDataUrl: report.familyPhotoImageDataUrl,
    placeholderTitle: 'Foto da família',
    placeholderHint: 'Imagem não informada.',
  });
  drawContinuationMediaCard(pdf, slots.terrainPhoto1, {
    label: 'FOTO TERRENO 1',
    imageDataUrl: report.terrainPhotoImageDataUrls[0] ?? null,
    placeholderTitle: 'Terreno 1',
    placeholderHint: 'Foto não informada.',
  });
  drawContinuationMediaCard(pdf, slots.terrainPhoto4, {
    label: 'FOTO TERRENO 4',
    imageDataUrl: report.terrainPhotoImageDataUrls[3] ?? null,
    placeholderTitle: 'Terreno 4',
    placeholderHint: 'Foto não informada.',
  });
  drawContinuationMediaCard(pdf, slots.terrainPhoto3, {
    label: 'FOTO TERRENO 3',
    imageDataUrl: report.terrainPhotoImageDataUrls[2] ?? null,
    placeholderTitle: 'Terreno 3',
    placeholderHint: 'Foto não informada.',
  });
  drawContinuationMediaCard(pdf, slots.terrainPhoto2, {
    label: 'FOTO TERRENO 2',
    imageDataUrl: report.terrainPhotoImageDataUrls[1] ?? null,
    placeholderTitle: 'Terreno 2',
    placeholderHint: 'Foto não informada.',
  });
}

type ContinuationMediaSlots = {
  house3D: Rect;
  familyPhoto: Rect;
  terrainPhoto1: Rect;
  terrainPhoto2: Rect;
  terrainPhoto3: Rect;
  terrainPhoto4: Rect;
};

type ContinuationMediaCard = {
  label: string;
  imageDataUrl: string | null;
  aspectRatio?: number;
  placeholderTitle: string;
  placeholderHint: string;
  prominent?: boolean;
};

export function getContinuationMediaSlots(rect: Rect): ContinuationMediaSlots {
  const photoWidth = (rect.width - CONTINUATION_MEDIA_GAP * 2) / 3;
  const photoHeight = (rect.height - CONTINUATION_MEDIA_GAP * 2) / 3;
  const columnX = (column: number) => rect.x + column * (photoWidth + CONTINUATION_MEDIA_GAP);
  const rowY = (row: number) => rect.y + row * (photoHeight + CONTINUATION_MEDIA_GAP);

  return {
    house3D: {
      x: columnX(0),
      y: rowY(0),
      width: photoWidth * 2 + CONTINUATION_MEDIA_GAP,
      height: photoHeight * 2 + CONTINUATION_MEDIA_GAP,
    },
    familyPhoto: {
      x: columnX(2),
      y: rowY(0),
      width: photoWidth,
      height: photoHeight,
    },
    terrainPhoto1: {
      x: columnX(2),
      y: rowY(1),
      width: photoWidth,
      height: photoHeight,
    },
    terrainPhoto4: {
      x: columnX(0),
      y: rowY(2),
      width: photoWidth,
      height: photoHeight,
    },
    terrainPhoto3: {
      x: columnX(1),
      y: rowY(2),
      width: photoWidth,
      height: photoHeight,
    },
    terrainPhoto2: {
      x: columnX(2),
      y: rowY(2),
      width: photoWidth,
      height: photoHeight,
    },
  };
}

function drawContinuationMediaCard(
  pdf: JsPDFDocument,
  rect: Rect,
  card: ContinuationMediaCard,
) {
  setFill(pdf, COLORS.brandSoft);
  setStroke(pdf, COLORS.brandLine);
  pdf.setLineWidth(0.35);
  pdf.roundedRect(
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    CONTINUATION_MEDIA_CARD_RADIUS,
    CONTINUATION_MEDIA_CARD_RADIUS,
    'FD',
  );

  drawContinuationMediaLabel(pdf, card.label, rect);

  const imageRect = getContinuationMediaContentRect(rect);
  if (card.imageDataUrl) {
    const fitted = fitImageContain(
      imageRect,
      getContinuationMediaImageAspectRatio(pdf, card.imageDataUrl, card.aspectRatio),
    );
    pdf.addImage(
      card.imageDataUrl,
      getImageFormat(card.imageDataUrl),
      fitted.x,
      fitted.y,
      fitted.width,
      fitted.height,
      undefined,
      'FAST',
    );
    return;
  }

  drawContinuationMediaPlaceholder(pdf, imageRect, card.placeholderTitle, card.placeholderHint, Boolean(card.prominent));
}

function getContinuationMediaImageAspectRatio(
  pdf: JsPDFDocument,
  imageDataUrl: string,
  fallbackAspectRatio = 4 / 3,
): number {
  try {
    const properties = pdf.getImageProperties(imageDataUrl);
    const width = Number(properties.width);
    const height = Number(properties.height);
    if (width > 0 && height > 0) return width / height;
  } catch {
    return fallbackAspectRatio;
  }

  return fallbackAspectRatio;
}

function getContinuationMediaContentRect(rect: Rect): Rect {
  return {
    x: rect.x + CONTINUATION_MEDIA_CARD_PADDING,
    y: rect.y + CONTINUATION_MEDIA_CARD_PADDING + 10,
    width: rect.width - CONTINUATION_MEDIA_CARD_PADDING * 2,
    height: rect.height - CONTINUATION_MEDIA_CARD_PADDING * 2 - 10,
  };
}

function drawContinuationMediaLabel(pdf: JsPDFDocument, label: string, rect: Rect) {
  setText(pdf, COLORS.brand);
  pdf.setFont(DEFAULT_FONT, 'bold');
  setFontSize(pdf, 5.6);
  pdf.text(limitText(pdf, label, rect.width - CONTINUATION_MEDIA_CARD_PADDING * 2), rect.x + CONTINUATION_MEDIA_CARD_PADDING, rect.y + 9);
}

function drawContinuationMediaPlaceholder(
  pdf: JsPDFDocument,
  rect: Rect,
  title: string,
  hint: string,
  prominent: boolean,
) {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const markSize = prominent ? 24 : 15;
  const markY = centerY - (prominent ? 28 : 19);
  drawContinuationMediaPlaceholderMark(pdf, centerX, markY, markSize);

  setText(pdf, COLORS.brand);
  pdf.setFont(DEFAULT_FONT, 'bold');
  setFontSize(pdf, prominent ? 8 : 6.2);
  pdf.text(limitText(pdf, title, rect.width - 20), centerX, centerY + (prominent ? 8 : 2), {align: 'center'});

  setText(pdf, COLORS.muted);
  pdf.setFont(DEFAULT_FONT, 'normal');
  setFontSize(pdf, prominent ? 6 : 4.9);
  pdf.text(limitText(pdf, hint, rect.width - 20), centerX, centerY + (prominent ? 21 : 13), {align: 'center'});
}

function drawContinuationMediaPlaceholderMark(
  pdf: JsPDFDocument,
  centerX: number,
  centerY: number,
  size: number,
) {
  const half = size / 2;
  setStroke(pdf, COLORS.chipSelectedLine);
  pdf.setLineWidth(0.75);
  pdf.roundedRect(centerX - half, centerY - half, size, size, 3, 3, 'S');
  pdf.line(centerX - half + 3, centerY + half - 5, centerX - 2, centerY + 1);
  pdf.line(centerX - 2, centerY + 1, centerX + 4, centerY + half - 5);
  pdf.line(centerX + 1, centerY + half - 6, centerX + half - 3, centerY - 1);
  setFill(pdf, COLORS.chipSelectedLine);
  pdf.circle(centerX + half - 5, centerY - half + 5, 1.8, 'F');
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
  visible[visible.length - 1] = appendFirstPageBodyContinuationHint(pdf, visible.at(-1) ?? '');
  return visible;
}

function appendFirstPageBodyContinuationHint(pdf: JsPDFDocument, line: string): string {
  if (pdf.getTextWidth(FIRST_PAGE_BODY_CONTINUATION_HINT) > LEFT_COLUMN_WIDTH) {
    return limitText(pdf, FIRST_PAGE_BODY_CONTINUATION_HINT, LEFT_COLUMN_WIDTH);
  }

  const suffix = ` ${FIRST_PAGE_BODY_CONTINUATION_HINT}`;
  let prefix = line.trimEnd();
  while (prefix.length > 0 && pdf.getTextWidth(`${prefix}${suffix}`) > LEFT_COLUMN_WIDTH) {
    prefix = removeLastWordForContinuationHint(prefix);
  }

  return prefix ? `${prefix}${suffix}` : FIRST_PAGE_BODY_CONTINUATION_HINT;
}

function removeLastWordForContinuationHint(text: string): string {
  const withoutLastWord = text.replace(/\s+\S+$/, '').trimEnd();
  return withoutLastWord && withoutLastWord !== text ? withoutLastWord : text.slice(0, -1).trimEnd();
}

function drawFirstPageBodyLines(pdf: JsPDFDocument, lines: string[], x: number, y: number) {
  if (lines.length === 0) return;

  pdf.text(lines, x, y, {
    lineHeightFactor: FIRST_PAGE_MUTED_BODY_LINE_HEIGHT / getFirstPageMutedBodyFontSize(),
  });
}

function getResidentActionSectionHeight(actionCount: number): number {
  if (actionCount <= 0) return 0;
  return RESIDENT_ACTION_SECTION_BASE_HEIGHT
    + Math.ceil(actionCount / RESIDENT_ACTION_COLUMNS) * RESIDENT_ACTION_ROW_HEIGHT;
}

function getFirstPageExtraMaterialsFieldHeight(fieldCount: number): number {
  return Math.ceil(fieldCount / 2) * 26 + 4;
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

function drawResidentActionList(pdf: JsPDFDocument, actions: string[], x: number, y: number) {
  pdf.setFont(DEFAULT_FONT, 'bold');
  setFontSize(pdf, 6.5);
  setText(pdf, COLORS.ink);

  actions.forEach((action, index) => {
    const column = index % RESIDENT_ACTION_COLUMNS;
    const row = Math.floor(index / RESIDENT_ACTION_COLUMNS);
    const itemX = x + column * RESIDENT_ACTION_COLUMN_GAP;
    const baselineY = y + row * RESIDENT_ACTION_ROW_HEIGHT;

    drawResidentActionCheck(pdf, itemX, baselineY);
    pdf.text(limitText(pdf, action, RESIDENT_ACTION_COLUMN_WIDTH - 13), itemX + 13, baselineY);
  });
}

function drawResidentActionCheck(pdf: JsPDFDocument, x: number, baselineY: number) {
  const centerX = x + 4.6;
  const centerY = baselineY - 3.4;

  setFill(pdf, RESIDENT_ACTION_CHECK_FILL);
  pdf.circle(centerX, centerY, 4.4, 'F');

  setStroke(pdf, COLORS.white);
  pdf.setLineWidth(0.8);
  pdf.line(centerX - 2.1, centerY, centerX - 0.5, centerY + 1.6);
  pdf.line(centerX - 0.5, centerY + 1.6, centerX + 2.5, centerY - 2);
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

function drawCompactStatefulChipRow(pdf: JsPDFDocument, values: ChipItem[], x: number, y: number, width: number) {
  const availableWidth = Math.max(0, width);
  if (availableWidth <= 0 || values.length === 0) return;

  const gap = 4;
  const chipWidth = Math.max(0, (availableWidth - gap * (values.length - 1)) / values.length);
  if (chipWidth < 22) return;

  pdf.setFont(DEFAULT_FONT, 'normal');
  setFontSize(pdf, 5.1);

  values.forEach((value, index) => {
    const cursorX = x + index * (chipWidth + gap);
    setFill(pdf, value.selected ? COLORS.chipSelectedFill : COLORS.chipMutedFill);
    setStroke(pdf, value.selected ? COLORS.chipSelectedLine : COLORS.chipMutedLine);
    pdf.roundedRect(cursorX, y, chipWidth, 13, 2, 2, 'FD');
    setText(pdf, value.selected ? COLORS.brand : COLORS.chipMutedText);
    pdf.text(limitText(pdf, value.text, chipWidth - 5), cursorX + chipWidth / 2, y + 8.6, {align: 'center'});
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

function getFooterTotals(totals: RacPdfReportPilotiTotal[]): RacPdfReportPilotiTotal[] {
  const countByLabel = new Map(totals.map((total) => [total.heightLabel, total.count]));
  const labels = [...new Set([
    ...FOOTER_LABELS,
    ...totals.map((total) => total.heightLabel),
  ])].sort((left, right) => parseFloat(left.replace(',', '.')) - parseFloat(right.replace(',', '.')));
  return labels.map((heightLabel) => ({
    heightLabel,
    count: countByLabel.get(heightLabel) ?? 0,
  }));
}

function getSelectedTerrainValues(report: RacPdfReportModel, groupLabel: string): string[] {
  return getTerrainOptionGroup(report, groupLabel)?.selected ?? [];
}

function getSelectedTerrainOptions(report: RacPdfReportModel, groupLabel: string): string[] {
  const group = getTerrainOptionGroup(report, groupLabel);
  const selectedOptions = new Set(group?.selected ?? []);
  return (group?.options ?? []).filter((option) => selectedOptions.has(option));
}

function getTerrainOptionGroup(report: RacPdfReportModel, groupLabel: string): RacPdfReportOptionGroup | null {
  return report.terrain.optionGroups.find((group) => group.label === groupLabel) ?? null;
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

function getFirstPageMutedBodyFontSize(): number {
  return FIRST_PAGE_MUTED_BODY_FONT_SIZE + PDF_FONT_SIZE_INCREMENT;
}
