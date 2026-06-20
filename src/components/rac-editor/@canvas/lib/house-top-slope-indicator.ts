import {Polygon, Text} from 'fabric';
import {CANVAS_STYLE, HOUSE_2D_STYLE, HOUSE_DEFAULTS} from '@/shared/config.ts';
import {CanvasGroup, CanvasObject, getCanvasGroupObjects, insertCanvasGroupObjects, removeCanvasGroupObjectsWhere, toCanvasObject} from '@/components/rac-editor/@canvas/lib/canvas.ts';
import {formatNivel} from '@/shared/types/piloti.ts';

const SLOPE_INDICATOR_COLOR = '#b7791f';
const SLOPE_INDICATOR_OPACITY = 0.07;
const MIN_VISIBLE_DESNIVEL = 0.01;
const SLOPE_ARROW_LENGTH_FACTOR = 0.75;
const SLOPE_ARROW_WIDTH_FACTOR = 0.051;
const SLOPE_ARROW_HEAD_LENGTH_WIDTH_RATIO = 1.95;
const SLOPE_ARROW_HEAD_WIDTH_FACTOR = 2.625;

interface TopSlopePoint {
  x: number;
  y: number;
  nivel: number;
}

interface TopSlopeIndicatorGeometry {
  angle: number;
  length: number;
  width: number;
  desnivel: number;
}

interface TopSlopeIndicatorBounds {
  width: number;
  height: number;
}

export function createTopSlopeIndicatorObjects(
  geometry: TopSlopeIndicatorGeometry,
): CanvasObject[] {
  const arrow = new Polygon(createArrowPoints(geometry.length, geometry.width), {
    left: 0,
    top: 0,
    originX: 'center',
    originY: 'center',
    angle: geometry.angle,
    fill: SLOPE_INDICATOR_COLOR,
    stroke: undefined,
    strokeWidth: 0,
    opacity: SLOPE_INDICATOR_OPACITY,
    selectable: false,
    evented: false,
    objectCaching: false,
  });

  const arrowObject = toCanvasObject(arrow);
  arrowObject.isTopSlopeIndicator = true;

  const label = new Text(`Desnível ${formatNivel(geometry.desnivel)} m`, {
    left: 0,
    top: 0,
    originX: 'center',
    originY: 'center',
    angle: normalizeSlopeLabelAngle(geometry.angle),
    fontFamily: CANVAS_STYLE.fontFamily,
    fontSize: Math.max(10, CANVAS_STYLE.fontSize * HOUSE_DEFAULTS.viewScale),
    fontWeight: 'bold',
    fill: SLOPE_INDICATOR_COLOR,
    opacity: SLOPE_INDICATOR_OPACITY,
    selectable: false,
    evented: false,
    objectCaching: false,
  });

  const labelObject = toCanvasObject(label);
  labelObject.isTopSlopeIndicator = true;
  labelObject.isTopSlopeIndicatorText = true;

  return [arrowObject, labelObject];
}

export function refreshTopSlopeIndicator(group: CanvasGroup): boolean {
  if (!isTopViewGroup(group)) return false;

  const removed = removeCanvasGroupObjectsWhere(
    group,
    (object) => Boolean(object.isTopSlopeIndicator),
    {refresh: false},
  );
  const geometry = calculateTopSlopeIndicatorGeometry(group);
  if (!geometry) return removed > 0;

  const insertIndex = getSlopeIndicatorInsertIndex(group);
  insertCanvasGroupObjects(group, insertIndex, createTopSlopeIndicatorObjects(geometry), {refresh: false});
  return true;
}

export function calculateTopSlopeIndicatorGeometry(
  group: CanvasGroup,
): TopSlopeIndicatorGeometry | null {
  const objects = getCanvasGroupObjects(group);
  const points = collectTopSlopePoints(objects);
  const desnivel = calculateDesnivel(points);
  if (points.length < 3 || desnivel < MIN_VISIBLE_DESNIVEL) return null;

  const direction = calculateNivelGradient(points);
  if (!direction) return null;

  const bounds = resolveTopViewBounds(objects, points);
  const maxSpan = calculateCenteredSpan(bounds, direction);
  const length = maxSpan * SLOPE_ARROW_LENGTH_FACTOR;
  const width = Math.min(bounds.width, bounds.height) * SLOPE_ARROW_WIDTH_FACTOR;

  return {
    angle: Math.atan2(direction.y, direction.x) * 180 / Math.PI,
    length,
    width,
    desnivel,
  };
}

function isTopViewGroup(group: CanvasGroup): boolean {
  return (group.houseViewType ?? group.houseView) === 'top';
}

function collectTopSlopePoints(objects: CanvasObject[]): TopSlopePoint[] {
  return objects
    .filter((object) => object.isPilotiCircle && typeof object.pilotiId === 'string')
    .map((object) => ({
      x: Number(object.left ?? 0),
      y: Number(object.top ?? 0),
      nivel: Number(object.pilotiNivel ?? 0),
    }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.nivel));
}

function calculateDesnivel(points: TopSlopePoint[]): number {
  if (points.length === 0) return 0;

  const niveis = points.map((point) => point.nivel);
  return Math.max(...niveis) - Math.min(...niveis);
}

function calculateNivelGradient(points: TopSlopePoint[]): { x: number; y: number } | null {
  const center = points.reduce(
    (acc, point) => ({
      x: acc.x + point.x / points.length,
      y: acc.y + point.y / points.length,
      nivel: acc.nivel + point.nivel / points.length,
    }),
    {x: 0, y: 0, nivel: 0},
  );

  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  let sxz = 0;
  let syz = 0;

  points.forEach((point) => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const dz = point.nivel - center.nivel;

    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
    sxz += dx * dz;
    syz += dy * dz;
  });

  const determinant = sxx * syy - sxy * sxy;
  if (Math.abs(determinant) < Number.EPSILON) return null;

  const x = (syy * sxz - sxy * syz) / determinant;
  const y = (sxx * syz - sxy * sxz) / determinant;
  const magnitude = Math.hypot(x, y);
  if (magnitude < Number.EPSILON) return null;

  return {
    x: x / magnitude,
    y: y / magnitude,
  };
}

function resolveTopViewBounds(objects: CanvasObject[], points: TopSlopePoint[]): TopSlopeIndicatorBounds {
  const houseBody = objects.find((object) => object.isHouseBody);
  const width = Number(houseBody?.width ?? 0);
  const height = Number(houseBody?.height ?? 0);
  if (width > 0 && height > 0) return {width, height};

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

function calculateCenteredSpan(bounds: TopSlopeIndicatorBounds, direction: { x: number; y: number }): number {
  const halfWidth = bounds.width / 2;
  const halfHeight = bounds.height / 2;
  const xSpan = Math.abs(direction.x) > Number.EPSILON
    ? halfWidth / Math.abs(direction.x)
    : Number.POSITIVE_INFINITY;
  const ySpan = Math.abs(direction.y) > Number.EPSILON
    ? halfHeight / Math.abs(direction.y)
    : Number.POSITIVE_INFINITY;

  return Math.min(xSpan, ySpan) * 2;
}

export function normalizeSlopeLabelAngle(angle: number): number {
  const normalized = normalizeAngle(angle);
  if (normalized > 90 || normalized < -90) {
    return normalizeAngle(normalized + 180);
  }
  return normalized;
}

function normalizeAngle(angle: number): number {
  return ((angle + 180) % 360 + 360) % 360 - 180;
}

function createArrowPoints(length: number, width: number): Array<{ x: number; y: number }> {
  const halfLength = length / 2;
  const shaftHalfWidth = width / 2;
  const headLength = Math.min(length * 0.45, width * SLOPE_ARROW_HEAD_LENGTH_WIDTH_RATIO);
  const headHalfWidth = shaftHalfWidth * SLOPE_ARROW_HEAD_WIDTH_FACTOR;
  const headBaseX = halfLength - headLength;

  return [
    {x: -halfLength, y: -shaftHalfWidth},
    {x: headBaseX, y: -shaftHalfWidth},
    {x: headBaseX, y: -headHalfWidth},
    {x: halfLength, y: 0},
    {x: headBaseX, y: headHalfWidth},
    {x: headBaseX, y: shaftHalfWidth},
    {x: -halfLength, y: shaftHalfWidth},
  ];
}

function getSlopeIndicatorInsertIndex(group: CanvasGroup): number {
  const objects = getCanvasGroupObjects(group);
  const houseBodyIndex = objects.findIndex((object) => object.isHouseBody);
  if (houseBodyIndex < 0) return 0;
  return houseBodyIndex + 1;
}
