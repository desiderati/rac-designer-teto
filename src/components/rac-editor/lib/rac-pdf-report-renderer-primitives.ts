import type {jsPDF as JsPDFDocument} from 'jspdf';

export type RgbColor = [number, number, number];

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const COLORS = {
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

export const DEFAULT_FONT = 'helvetica';
export const PDF_FONT_SIZE_INCREMENT = 1;

export function drawPolygon(pdf: JsPDFDocument, points: [number, number][], color: RgbColor) {
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

export function drawHairline(pdf: JsPDFDocument, x1: number, y1: number, x2: number, y2: number) {
  setStroke(pdf, COLORS.line);
  pdf.setLineWidth(0.35);
  pdf.line(x1, y1, x2, y2);
}

export function fitImageContain(rect: Rect, aspectRatio: number): Rect {
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

export function getImageFormat(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' {
  if (/^data:image\/jpe?g/i.test(dataUrl)) return 'JPEG';
  if (/^data:image\/webp/i.test(dataUrl)) return 'WEBP';
  return 'PNG';
}

export function limitText(pdf: JsPDFDocument, text: string, maxWidth: number): string {
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

export function setFill(pdf: JsPDFDocument, color: RgbColor) {
  pdf.setFillColor(color[0], color[1], color[2]);
}

export function setStroke(pdf: JsPDFDocument, color: RgbColor) {
  pdf.setDrawColor(color[0], color[1], color[2]);
}

export function setText(pdf: JsPDFDocument, color: RgbColor) {
  pdf.setTextColor(color[0], color[1], color[2]);
}

export function setFontSize(pdf: JsPDFDocument, size: number) {
  pdf.setFontSize(size + PDF_FONT_SIZE_INCREMENT);
}
