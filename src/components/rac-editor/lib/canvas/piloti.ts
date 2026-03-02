import {Canvas as FabricCanvas, FabricObject, Line, Pattern, Polygon, Polyline, Rect, Text} from 'fabric';
import {
  PILOTI_BASE_HEIGHT_PX,
  PILOTI_BASE_HEIGHT_PX_WITH_SCALE,
  PILOTI_DEFAULT_NIVEL,
  PILOTI_MASTER_FILL_COLOR,
  PILOTI_MASTER_STROKE_COLOR,
} from './constants.ts';
import {DEFAULT_HOUSE_PILOTI, DEFAULT_HOUSE_PILOTI_HEIGHTS, type HouseSide} from '@/shared/types/house.ts';
import {
  CANVAS_STYLE,
  HOUSE_2D_STYLE,
  HOUSE_DEFAULTS,
  PILOTI_CORNER_ID,
  PILOTI_CORNER_IDS,
  PILOTI_MASTER_STYLE,
  PILOTI_STYLE,
  TERRAIN_SOLIDITY,
  TERRAIN_STYLE
} from '@/shared/config.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';
import {
  CanvasGroup,
  CanvasObject,
  isCanvasGroup,
  toCanvasGroup,
  toCanvasObject
} from '@/components/rac-editor/lib/canvas/canvas.ts'

export const getPilotiIdsForSide =
  (side: HouseSide): string[] => {
    switch (side) {
      case 'top':
        return ['piloti_0_0', 'piloti_1_0', 'piloti_2_0', 'piloti_3_0'];

      case 'bottom':
        return ['piloti_0_2', 'piloti_1_2', 'piloti_2_2', 'piloti_3_2'];

      case 'left':
        return ['piloti_0_0', 'piloti_0_1', 'piloti_0_2'];

      case 'right':
        return ['piloti_3_0', 'piloti_3_1', 'piloti_3_2'];

      default:
        return [];
    }
  };

export function resolveDoorSideCornerIds(
  side: HouseSide
): { leftId: string; rightId: string } {
  if (side === 'top') return {leftId: 'piloti_0_0', rightId: 'piloti_3_0'};
  if (side === 'bottom') return {leftId: 'piloti_0_2', rightId: 'piloti_3_2'};
  if (side === 'left') return {leftId: 'piloti_0_0', rightId: 'piloti_0_2'};
  return {leftId: 'piloti_3_0', rightId: 'piloti_3_2'};
}

export type TerrainSolidityLevel = 1 | 2 | 3 | 4 | 5;

export function parsePilotiGridPosition(pilotiId: string): { col: number; row: number } | null {
  const match = pilotiId.match(/piloti_(\d+)_(\d+)/);
  if (!match) return null;
  return {
    col: parseInt(match[1], 10),
    row: parseInt(match[2], 10),
  };
}

export function isPilotiOutOfProportion(height: number, nivel: number): boolean {
  if (!Number.isFinite(height) || !Number.isFinite(nivel)) return false;
  if (height <= 0 || nivel <= 0) return false;

  // Regra estrutural base: nível = 1/3 da altura total do piloti.
  return height + 0.0001 < (nivel * 3);
}

export function clampNivelByHeight(nivel: number, pilotiHeight: number): number {
  const maxNivel = Math.round((pilotiHeight / 2) * 100) / 100;
  return clampNivel(nivel, PILOTI_DEFAULT_NIVEL, maxNivel);
}

export function clampNivel(nivel: number, minNivel: number = PILOTI_DEFAULT_NIVEL, maxNivel: number = 1.50): number {
  return Math.round(Math.max(minNivel, Math.min(nivel, maxNivel)) * 100) / 100;
}

export function formatPilotiHeight(height: number): string {
  return height.toFixed(1).replace('.', ',');
}

export function formatNivel(nivel: number): string {
  return nivel.toFixed(2).replace('.', ',');
}

export function getRecommendedHeight(nivel: number): number {
  // Nivel = 1/3 Piloti :)
  const minHeight = nivel * 3;
  return DEFAULT_HOUSE_PILOTI_HEIGHTS.find((h) => h >= minHeight) ?? 3.0;
}

// Get piloti name from ID (e.g., "piloti_0_0" -> "A1")
export function getPilotiName(pilotiId: string): string {
  const match = pilotiId.match(/piloti_(\d+)_(\d+)/);
  if (!match) return pilotiId;

  const col = parseInt(match[1], 10);
  const row = parseInt(match[2], 10);

  const rowLetter = String.fromCharCode(65 + row); // 0 -> A, 1 -> B, 2 -> C
  const colNumber = col + 1; // 0 -> 1, 1 -> 2, etc.

  return `${rowLetter}${colNumber}`;
}

// Get ordered list of all piloti IDs
export function getAllPilotiIds(): string[] {
  const ids: string[] = [];
  // Order: A1, A2, A3, A4, B1, B2, B3, B4, C1, C2, C3, C4
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      ids.push(`piloti_${col}_${row}`);
    }
  }
  return ids;
}

// Get piloti IDs that actually exist inside a given house group, ordered like getAllPilotiIds()
export function getPilotiIdsFromGroup(group: CanvasGroup): string[] {
  const present = new Set<string>();
  group.getCanvasObjects().forEach(obj => {
    if ((obj.isPilotiCircle || obj.isPilotiRect) && typeof obj.pilotiId === 'string') {
      present.add(obj.pilotiId);
    }
  });

  return getAllPilotiIds().filter((id) => present.has(id));
}

// Get piloti data from group (works for both circles in top view and rects in front/back/side views)
export function getPilotiFromGroup(
  group: CanvasGroup,
  pilotiId: string,
): {
  circle: CanvasObject;
  height: number;
  isMaster: boolean;
  nivel: number;
} | null {
  const objects = group.getCanvasObjects();

  for (const obj of objects) {
    if (obj.pilotiId === pilotiId && (obj.isPilotiCircle || obj.isPilotiRect)) {
      return {
        circle: obj,
        height: obj.pilotiHeight || DEFAULT_HOUSE_PILOTI.height,
        isMaster: obj.pilotiIsMaster || false,
        nivel: obj.pilotiNivel ?? PILOTI_DEFAULT_NIVEL,
      };
    }
  }

  return null;
}

export function updatePilotiHeight(group: CanvasGroup, pilotiId: string, newHeight: number): void {
  const objects = group.getCanvasObjects();

  // Fabric caching note:
  // Groups can cache to an offscreen canvas; when a child grows, the cached bounds can clip the new geometry.
  // We disable caching + force a refresh to guarantee the new rect is actually redrawn.
  group.objectCaching = false;

  // Track delta to keep the house centered while piloti rect grows downwards.
  // (Rects in front/back/side use originY="top", so growth increases maxY only.)
  let rectHeightDelta = 0;

  objects.forEach(obj => {
    if (obj.pilotiId !== pilotiId) return;

    if (obj.isPilotiCircle) {
      obj.pilotiHeight = newHeight;
      obj.dirty = true;
      return;
    }

    if (obj.isPilotiRect) {
      // Disable caching for the rect itself as well (prevents "corte" after resize)
      obj.objectCaching = false;

      const oldHeight = (obj.getScaledHeight?.() ?? obj.height ?? 0) as number;
      obj.pilotiHeight = newHeight;

      const baseHeight = obj.pilotiBaseHeight ?? PILOTI_BASE_HEIGHT_PX_WITH_SCALE;
      const s = baseHeight / PILOTI_BASE_HEIGHT_PX;
      const newVisualHeight = baseHeight * newHeight;
      rectHeightDelta = newVisualHeight - oldHeight;

      // IMPORTANT: reset scaling so height is the real source of truth
      obj.set({height: newVisualHeight, scaleY: 1});
      obj.setCoords();
      obj.dirty = true;

      // Update size label position using the *same* computed height (no guessing)
      const sizeLabel = objects.find(o => o.pilotiId === pilotiId && o.isPilotiSizeLabel);
      if (sizeLabel) {
        const offset = 8 * s;
        const rectWidth = (obj.width ?? 0) as number;

        sizeLabel.set('left', (obj.left ?? 0) + rectWidth / 2);
        sizeLabel.set('top', (obj.top ?? 0) + newVisualHeight + offset);
        sizeLabel.set('text', formatPilotiHeight(newHeight));
        sizeLabel.setCoords();
        sizeLabel.dirty = true;
      }

      return;
    }

    if (obj.isPilotiStripe) {
      // Update stripe overlay to cover bottom 2/3 of the new piloti height
      const pilotiRect = objects.find(o => o.pilotiId === pilotiId && o.isPilotiRect);
      if (pilotiRect) {
        const newVisualHeight = (pilotiRect.height ?? 0) as number;
        const stripeHeight = (newVisualHeight * 2) / 3;

        obj.set({height: stripeHeight, top: (pilotiRect.top ?? 0) + newVisualHeight / 3});
        obj.set('fill', createDiagonalStripePattern());
        obj.objectCaching = false;

        obj.setCoords();
        obj.dirty = true;
      }
      return;
    }

    if (obj.isPilotiText) {
      obj.set('text', formatPilotiHeight(newHeight));
      obj.dirty = true;
    }

    if (obj.isPilotiSizeLabel) {
      obj.set('text', formatPilotiHeight(newHeight));
      obj.dirty = true;
    }
  });

  // Keep the house centered in the canvas when the piloti grows (avoid bottom cut by viewport).
  if (rectHeightDelta !== 0) {
    group.set('top', (group.top || 0) - rectHeightDelta / 2);
  }

  group.canvas?.requestRenderAll();
}

/**
 * Forces Fabric to rebuild caches/bounds for house groups so resized pilotis are actually redrawn.
 * This also fixes Ctrl+Z restore cases where the group comes back "cortado" due to stale cache.
 * IMPORTANT: We must remove and re-add children to force the group to recalculate its bounding box
 * correctly in Fabric v6.
 */
export function refreshHouseGroupRendering(group: CanvasGroup): void {
  group.objectCaching = false;

  // Keep house interaction constraints stable after JSON restore/undo.
  if (group.myType === 'house') {
    group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});
  }

  const objects = group.getCanvasObjects();
  objects.forEach(obj => {
    obj.objectCaching = false;
    obj.dirty = true;
    obj.setCoords?.();
  });

  // Z-order sort: normal objects (pilotis, walls, roof) -> ground layers -> markers/labels.
  // Ground elements render in front of pilotis to preserve the "enterrado" visual.
  const groundBack =
    objects.filter(o => o.isGroundElement && !o.isNivelMarker && !o.isNivelLabel);

  const groundFront =
    objects.filter(o => o.isNivelMarker || o.isNivelLabel);

  const normal = objects.filter(o => !o.isGroundElement);
  // Pilotis e estrutura devem ficar na frente de brita/rachão.
  const sorted = [...groundBack, ...normal, ...groundFront];

  // Replace _objects array in-place to reorder Z without remove/add coordinate transforms
  const internalObjects = group._objects;
  if (internalObjects && Array.isArray(internalObjects)) {
    internalObjects.length = 0;
    internalObjects.push(...sorted);
  }

  // Polyline/Polygon need pathOffset recalculation
  objects.forEach(obj => {
    if (obj instanceof Polyline || obj instanceof Polygon) {
      obj.setDimensions?.();
    }
  });

  // Recalculate bounds without triggering object coordinate transforms
  group._clearCache?.();
  group._calcBounds?.();
  group.setCoords();
  group.dirty = true;
}

export function refreshHouseGroupsOnCanvas(canvas: FabricCanvas): void {
  canvas.getObjects()
    .filter(o => isCanvasGroup(o) && o.myType === 'house')
    .forEach(group => refreshHouseGroupRendering(toCanvasGroup(group)));
}

export function updatePilotiMaster(
  group: CanvasGroup,
  pilotiId: string,
  isMaster: boolean,
  nivel: number
): void {

  const objects = group.getCanvasObjects();
  if (isMaster) {
    objects.forEach(obj => {
      if (obj.pilotiId !== pilotiId) {
        if ((obj.isPilotiCircle || obj.isPilotiRect) && obj.pilotiIsMaster) {
          obj.pilotiIsMaster = false;
          obj.set('fill', PILOTI_STYLE.fillColor);
          obj.set('stroke', PILOTI_STYLE.strokeColor);
          obj.set('strokeWidth', obj.isPilotiRect ? PILOTI_STYLE.strokeWidth : PILOTI_STYLE.strokeWidthTopView);
        }
        // Keep nivel text visible for corner pilotis even when losing master status
        if (obj.isPilotiNivelText && !PILOTI_CORNER_IDS.includes(obj.pilotiId)) {
          obj.set('text', '');
          obj.set('visible', false);
        }
      }
    });
  }

  // Now update the target piloti
  objects.forEach(obj => {
    if (obj.pilotiId === pilotiId) {
      if (obj.isPilotiCircle || obj.isPilotiRect) {
        obj.pilotiIsMaster = isMaster;
        obj.pilotiNivel = nivel;

        // Update visual style based on isMaster
        if (isMaster) {
          obj.set('fill', PILOTI_MASTER_FILL_COLOR);
          obj.set('stroke', PILOTI_MASTER_STROKE_COLOR);
          obj.set('strokeWidth', obj.isPilotiRect ? PILOTI_MASTER_STYLE.strokeWidth : PILOTI_MASTER_STYLE.strokeWidthTopView);
        } else {
          obj.set('fill', PILOTI_STYLE.fillColor);
          obj.set('stroke', PILOTI_STYLE.strokeColor);
          obj.set('strokeWidth', obj.isPilotiRect ? PILOTI_STYLE.strokeWidth : PILOTI_STYLE.strokeWidthTopView);
        }
      }

      if (obj.isPilotiNivelText) {
        const isCorner = PILOTI_CORNER_IDS.includes(obj.pilotiId);
        if (isCorner) {
          const pilotiCircle = objects.find(o => o.pilotiId === pilotiId && o.isPilotiCircle);
          const centerX = Number(pilotiCircle?.left ?? obj.left ?? 0);
          const centerY = Number(pilotiCircle?.top ?? obj.top ?? 0);
          const radius = Number(pilotiCircle?.radius ?? HOUSE_DEFAULTS.pilotiRadius * HOUSE_DEFAULTS.viewScale);
          const offset = HOUSE_DEFAULTS.pilotiNivelLabelOffset * HOUSE_DEFAULTS.viewScale;
          const isTopCorner = pilotiId === PILOTI_CORNER_ID.topLeft || pilotiId === PILOTI_CORNER_ID.topRight;

          obj.set('text', `Nível = ${formatNivel(nivel)}`);
          obj.set('left', centerX);
          obj.set('top', isTopCorner ? centerY - radius - offset : centerY + radius + offset);
          obj.set('visible', true);
        } else {
          obj.set('text', '');
          obj.set('visible', false);
        }
      }
    }
  });

  group.dirty = true;
}

// Seeded random number generator for deterministic ground line variation
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Generate irregular ground line points with 3 segments:
// 1. leftX -> leftCenterX: flat at leftY
// 2. leftCenterX -> rightCenterX: slope from leftY to rightY
// 3. rightCenterX -> rightX: flat at rightY
function generateGroundLinePoints(
  leftX: number,
  leftY: number,
  rightX: number,
  rightY: number,
  seed: number,
  leftCenterX?: number,
  rightCenterX?: number,
): { x: number; y: number }[] {

  const rng = seededRandom(seed);
  const lcx = leftCenterX ?? leftX;
  const rcx = rightCenterX ?? rightX;

  const addSegment = (
    pts: { x: number; y: number }[],
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    segs: number,
    includeEnd: boolean,
  ) => {
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      const bx = x0 + (x1 - x0) * t;
      const by = y0 + (y1 - y0) * t;
      pts.push({x: bx, y: by + (rng() - 0.5) * 6});
    }
    if (includeEnd) pts.push({x: x1, y: y1});
  };

  const points: { x: number; y: number }[] = [{x: leftX, y: leftY}];

  // Segment 1: flat left (leftX -> leftCenterX)
  const leftLen = lcx - leftX;
  const rightLen = rightX - rcx;
  const totalLen = rightX - leftX;

  const totalSegs = 16;
  const seg1 = Math.max(3, Math.round(totalSegs * (leftLen / totalLen)));
  const seg3 = Math.max(3, Math.round(totalSegs * (rightLen / totalLen)));
  const seg2 = Math.max(3, totalSegs - seg1 - seg3);

  addSegment(points, leftX, leftY, lcx, leftY, seg1, true);
  addSegment(points, lcx, leftY, rcx, rightY, seg2, true);
  addSegment(points, rcx, rightY, rightX, rightY, seg3, false);

  points.push({x: rightX, y: rightY});
  return points;
}

function sampleGroundYAtX(points: { x: number; y: number }[], targetX: number): number {
  if (!points.length) return 0;

  if (targetX <= points[0].x) return points[0].y;
  if (targetX >= points[points.length - 1].x) return points[points.length - 1].y;

  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    if (targetX < minX || targetX > maxX) continue;

    const dx = b.x - a.x;
    if (Math.abs(dx) < 0.0001) return Math.min(a.y, b.y);
    const t = (targetX - a.x) / dx;
    return a.y + (b.y - a.y) * t;
  }

  return points[points.length - 1].y;
}

function getObjectVisualBounds(
  obj: CanvasObject
): { left: number; right: number; top: number; bottom: number } {

  const left = Number(obj?.left ?? 0);
  const top = Number(obj?.top ?? 0);
  const width = Number(obj?.width ?? 0) * Number(obj?.scaleX ?? 1);
  const height = Number(obj?.height ?? 0) * Number(obj?.scaleY ?? 1);
  const strokeWidth = Number(obj?.strokeWidth ?? 0);
  const halfStroke = strokeWidth / 2;

  return {
    left: left - halfStroke,
    right: left + width + halfStroke,
    top: top - halfStroke,
    bottom: top + height + halfStroke,
  };
}

function resolvePilotiVisualEnvelope(
  pilotiRect: CanvasObject,
): { left: number; right: number; bottom: number } {
  // Use somente o envelope visual do retângulo do piloti para evitar micro-deslocamento
  // causado pela faixa hachurada interna.
  const bounds = getObjectVisualBounds(pilotiRect);
  return {left: bounds.left, right: bounds.right, bottom: bounds.bottom};
}

export function createPilotiRect(
  pilotLabels: CanvasObject[],
  colIndex: number,
  rowIndex: number,
  panelHeight: number,
  left: number,
  s: number,
): CanvasObject {

  const defaultHeight = DEFAULT_HOUSE_PILOTI.height;
  const defaultIsMaster = DEFAULT_HOUSE_PILOTI.isMaster;
  const defaultNivel = DEFAULT_HOUSE_PILOTI.nivel;

  const floorH = HOUSE_DIMENSIONS.structure.floorHeight * s;
  const floorBeanH = HOUSE_DIMENSIONS.structure.floorBeamHeight * s;

  const pilotiId = `piloti_${colIndex}_${rowIndex}`;
  const pilotW = HOUSE_DIMENSIONS.piloti.width * s;
  const pilotH = getPilotiVisualHeight(defaultHeight, s);

  const rect = new Rect({
    width: pilotW,
    height: pilotH,
    fill: PILOTI_STYLE.fillColor,
    stroke: PILOTI_STYLE.strokeColor,
    strokeWidth: PILOTI_STYLE.strokeWidth,
    strokeUniform: true,
    left,
    top: panelHeight + floorH + floorBeanH,
    originY: 'top',
    objectCaching: false,
  });

  const rectObj = toCanvasObject(rect);
  rectObj.myType = 'piloti';
  rectObj.pilotiId = pilotiId;
  rectObj.pilotiHeight = defaultHeight;
  rectObj.pilotiIsMaster = defaultIsMaster;
  rectObj.pilotiNivel = defaultNivel;
  rectObj.isPilotiRect = true;
  rectObj.pilotiBaseHeight = PILOTI_BASE_HEIGHT_PX * s;

  // Create size label below piloti
  // const sizeLabel = new Text(formatPilotiHeight(defaultHeight), {
  //   fontSize: PILOTI_STYLE.heightFontSize * s,
  //   fill: PILOTI_STYLE.heightFontColor,
  //   backgroundColor: PILOTI_STYLE.fillColor,
  //   left: left + pilotW / 2,
  //   top: panelHeight + floorH + floorBeanH + pilotH + 8 * s,
  //   originX: 'center',
  //   originY: 'top',
  //   selectable: false,
  //   evented: false,
  // });
  // const sizeLabelObject = toCanvasObject(rect);
  // sizeLabelObject.isPilotiSizeLabel = true;
  // sizeLabelObject.pilotiId = pilotiId;
  // pilotLabels.push(sizeLabelObject);

  return rectObj;
}

export function createPilotis(
  elements: CanvasObject[],
  bodyW: number,
  s: number,
  flipHorizontal: boolean = false
) {

  const bodyH = HOUSE_DIMENSIONS.structure.bodyHeight * s;
  const floorH = HOUSE_DIMENSIONS.structure.floorHeight * s;
  const floorBeanH = HOUSE_DIMENSIONS.structure.floorBeamHeight * s;

  const pilotiDefaultH = DEFAULT_HOUSE_PILOTI.height;
  const pilotW = HOUSE_DIMENSIONS.piloti.width * s;
  const pilots: CanvasObject[] = [];

  const pilotLabels: CanvasObject[] = [];
  const margin = HOUSE_DIMENSIONS.piloti.margin * s;

  const step = (bodyW - 2 * margin - pilotW) / 3;
  // Position determines piloti IDs (not view type):
  // Top position (flipHorizontal=true): pilotis A4, A3, A2, A1 (row 0, reversed)
  // Bottom position (flipHorizontal=false): pilotis C1, C2, C3, C4 (row 2, normal order)

  const rowIndex = flipHorizontal ? 0 : 2;

  for (let i = 0; i < 4; i++) {
    // Top position: reversed order (A4, A3, A2, A1)
    // Bottom position: normal order (C1, C2, C3, C4)
    const colIndex = flipHorizontal ? 3 - i : i;
    const pilotiId = `piloti_${colIndex}_${rowIndex}`;
    const pilotH = getPilotiVisualHeight(pilotiDefaultH, s);
    pilots.push(createPilotiRect(pilotLabels, colIndex, rowIndex, bodyH, margin + i * step, s));

    // Add diagonal stripe overlay for bottom 2/3
    const stripeOverlay =
      createPilotiStripeOverlay(
        pilotiId,
        margin + (PILOTI_STYLE.selectedStrokeWidth / 2) + i * step,
        bodyH + floorH + floorBeanH,
        pilotW,
        pilotH
      );
    pilots.push(toCanvasObject(stripeOverlay));
  }

  elements.push(...pilots);
  elements.push(...pilotLabels);
}

// Calculate piloti visual height based on pilotiHeight value
function getPilotiVisualHeight(pilotiHeight: number, scale: number): number {
  return PILOTI_BASE_HEIGHT_PX * pilotiHeight * scale;
}

// Create a stripe overlay rect for the bottom 2/3 of a piloti rect
export function createPilotiStripeOverlay(
  pilotiId: string,
  left: number,
  top: number,
  width: number,
  fullHeight: number,
): CanvasObject {

  const stripeHeight = (fullHeight * 2) / 3;
  const stripeTop = top + fullHeight / 3;

  const stripe = new Rect({
    width,
    height: stripeHeight,
    fill: createDiagonalStripePattern(),
    left,
    top: stripeTop,
    originY: 'top',
    strokeWidth: 0,
    selectable: false,
    evented: false,
    objectCaching: false,
    opacity: 0.5,
  });

  const stripeObj = toCanvasObject(stripe);
  stripeObj.isPilotiStripe = true;
  stripeObj.pilotiId = pilotiId;
  return stripeObj;
}

// Create a diagonal stripe pattern for piloti fill (bottom 2/3)
export function createDiagonalStripePattern(): Pattern {
  const size = 10; // pattern tile size
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = PILOTI_STYLE.stripeColor;
  ctx.lineWidth = 1.2;

  // Draw diagonal line across the tile
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(size, 0);
  ctx.stroke();

  // Extra line for seamless tiling
  ctx.beginPath();
  ctx.moveTo(-size, size);
  ctx.lineTo(size, -size);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 2 * size);
  ctx.lineTo(2 * size, 0);
  ctx.stroke();

  return new Pattern({
    source: canvas,
    repeat: 'repeat',
  });
}

export function normalizeTerrainSolidityLevel(value: number): TerrainSolidityLevel {
  const numeric = Number(value);
  if (numeric >= 5) return 5;
  if (numeric <= 1) return 1;
  if (numeric === 2 || numeric === 3 || numeric === 4) return numeric;
  return TERRAIN_SOLIDITY.defaultLevel;
}

export function getTerrainRachaoThicknessCm(level: TerrainSolidityLevel): number {
  return TERRAIN_SOLIDITY.levels[level].rachao;
}

export function getGroundTerrainType(group: CanvasGroup): TerrainSolidityLevel {
  return normalizeTerrainSolidityLevel(group.groundTerrainType);
}

function createRachaoPattern(scale: number): Pattern {
  const size = Math.max(14, Math.round(28 * scale));
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8d7559';
  ctx.fillRect(0, 0, size, size);

  const stones = [
    {x: size * 0.18, y: size * 0.25, r: size * 0.14, c: '#6f5942'},
    {x: size * 0.48, y: size * 0.15, r: size * 0.12, c: '#9f8770'},
    {x: size * 0.74, y: size * 0.33, r: size * 0.16, c: '#7a624a'},
    {x: size * 0.34, y: size * 0.62, r: size * 0.15, c: '#b19a82'},
    {x: size * 0.66, y: size * 0.68, r: size * 0.11, c: '#6f5942'},
    {x: size * 0.20, y: size * 0.80, r: size * 0.10, c: '#9f8770'},
    {x: size * 0.86, y: size * 0.80, r: size * 0.12, c: '#b19a82'},
  ];

  stones.forEach((stone) => {
    ctx.beginPath();
    ctx.fillStyle = stone.c;
    ctx.arc(stone.x, stone.y, stone.r, 0, Math.PI * 2);
    ctx.fill();
  });

  return new Pattern({
    source: canvas,
    repeat: 'repeat',
  });
}

// Create all ground visualization elements: X markers, nivel labels, ground polyline, and fill polygon
export function createGroundElements(
  leftX: number,
  leftCenterX: number,
  leftNivelY: number,
  rightX: number,
  rightCenterX: number,
  rightNivelY: number,
  s: number,
  seed: number,
  leftNivelStr: string,
  rightNivelStr: string,
  maxPilotiBottomY: number,
  terrainType: TerrainSolidityLevel,
  pilotiRects: Array<{
    pilotiId: string;
    left: number;
    top: number;
    width: number;
    height: number;
    visualLeft?: number;
    visualRight?: number;
    visualBottom?: number;
  }>,
): CanvasObject[] {

  const elements: CanvasObject[] = [];
  const labelFontSize = PILOTI_STYLE.nivelFontSize * s;
  const xSize = labelFontSize / 2;
  const lineColor = TERRAIN_STYLE.strokeColor;
  const markerWidth = HOUSE_2D_STYLE.outlineStrokeWidth;

  // X marker on left corner piloti
  const xL1 = new Line([leftCenterX - xSize, leftNivelY - xSize, leftCenterX + xSize, leftNivelY + xSize], {
    stroke: lineColor,
    strokeWidth: markerWidth,
    strokeUniform: true,
    selectable: false,
    evented: false,
  });
  const xL1Object = toCanvasObject(xL1);
  xL1Object.isGroundElement = true;
  xL1Object.isNivelMarker = true;

  const xL2 = new Line([leftCenterX - xSize, leftNivelY + xSize, leftCenterX + xSize, leftNivelY - xSize], {
    stroke: lineColor,
    strokeWidth: markerWidth,
    strokeUniform: true,
    selectable: false,
    evented: false,
  });
  const xL2Object = toCanvasObject(xL2);
  xL2Object.isGroundElement = true;
  xL2Object.isNivelMarker = true;

  // X marker on right corner piloti
  const xR1 = new Line([rightCenterX - xSize, rightNivelY - xSize, rightCenterX + xSize, rightNivelY + xSize], {
    stroke: lineColor,
    strokeWidth: markerWidth,
    strokeUniform: true,
    selectable: false,
    evented: false,
  });
  const xR1Object = toCanvasObject(xR1);
  xR1Object.isGroundElement = true;
  xR1Object.isNivelMarker = true;

  const xR2 = new Line([rightCenterX - xSize, rightNivelY + xSize, rightCenterX + xSize, rightNivelY - xSize], {
    stroke: lineColor,
    strokeWidth: markerWidth,
    strokeUniform: true,
    selectable: false,
    evented: false,
  });
  const xR2Object = toCanvasObject(xR2);
  xR2Object.isGroundElement = true;
  xR2Object.isNivelMarker = true;

  // Labels de nível do terreno (devem permanecer visíveis).
  const lLabel = new Text(leftNivelStr, {
    fontSize: labelFontSize,
    fill: lineColor,
    backgroundColor: HOUSE_2D_STYLE.surfaceBackgroundColor,
    fontFamily: CANVAS_STYLE.fontFamily,
    fontWeight: 'bold',
    left: leftCenterX + labelFontSize + labelFontSize / 2,
    top: leftNivelY + xSize + labelFontSize,
    originX: 'right',
    originY: 'center',
    selectable: false,
    evented: false,
  });
  const lLabelObject = toCanvasObject(lLabel);
  lLabelObject.isGroundElement = true;
  lLabelObject.isNivelLabel = true;

  const rLabel = new Text(rightNivelStr, {
    fontSize: labelFontSize,
    fill: lineColor,
    backgroundColor: HOUSE_2D_STYLE.surfaceBackgroundColor,
    fontFamily: CANVAS_STYLE.fontFamily,
    fontWeight: 'bold',
    left: rightCenterX - labelFontSize + labelFontSize / 2,
    top: rightNivelY + xSize + labelFontSize,
    originX: 'left',
    originY: 'center',
    selectable: false,
    evented: false,
  });
  const rLabelObject = toCanvasObject(rLabel);
  rLabelObject.isGroundElement = true;
  rLabelObject.isNivelLabel = true;

  // --- Polyline + Polygon: terreno irregular ---
  const normalizedTerrainType = normalizeTerrainSolidityLevel(terrainType);
  const groundPtsAbs = generateGroundLinePoints(
    leftX,
    leftNivelY,
    rightX,
    rightNivelY,
    seed,
    leftCenterX,
    rightCenterX,
  );

  const gMinX = Math.min(...groundPtsAbs.map((p) => p.x));
  const gMinY = Math.min(...groundPtsAbs.map((p) => p.y));

  const strokeMultiplier = 7;
  const groundLine = new Polyline(groundPtsAbs, {
    left: gMinX - strokeMultiplier,
    top: gMinY - strokeMultiplier,
    fill: 'transparent',
    stroke: lineColor,
    strokeWidth: markerWidth * strokeMultiplier,
    strokeUniform: true,
    selectable: false,
    evented: false,
    objectCaching: false,
  });
  const groundLineObject = toCanvasObject(groundLine);
  groundLineObject.isGroundElement = true;
  groundLineObject.isGroundLine = true;
  groundLineObject.groundSeed = seed;
  groundLineObject.groundTerrainType = normalizedTerrainType;

  // Altura do terreno deve cobrir, no mínimo, o fundo do piloti + cama de rachão.
  const rachaoDepthPx = getTerrainRachaoThicknessCm(normalizedTerrainType) * s;
  const fillBottomY = maxPilotiBottomY + rachaoDepthPx + HOUSE_DEFAULTS.viewPadding * s;
  const fillPtsAbs = [...groundPtsAbs, {x: rightX, y: fillBottomY}, {x: leftX, y: fillBottomY}];

  const fMinX = Math.min(...fillPtsAbs.map((p) => p.x));
  const fMinY = Math.min(...fillPtsAbs.map((p) => p.y));

  const groundFill = new Polygon(fillPtsAbs, {
    left: fMinX,
    top: fMinY,
    fill: TERRAIN_STYLE.fillColor,
    stroke: 'transparent',
    strokeWidth: 0,
    selectable: false,
    evented: false,
    objectCaching: false,
  });
  const groundFillObject = toCanvasObject(groundFill);
  groundFillObject.isGroundElement = true;
  groundFillObject.isGroundFill = true;
  groundFillObject.groundTerrainType = normalizedTerrainType;

  // Camadas de rachão e britas ao redor de cada piloti visível.
  const gravelWidthPx = TERRAIN_SOLIDITY.sideGravelWidth * s;

  const localTerrainElements: CanvasObject[] = [];
  for (const piloti of pilotiRects) {
    const pilotiLeft = Number(piloti.visualLeft ?? piloti.left);
    const pilotiRight = Number(piloti.visualRight ?? (piloti.left + piloti.width));
    const pilotiBottom = Number(piloti.visualBottom ?? (piloti.top + piloti.height));
    const pilotiVisualWidth = Math.max(0, pilotiRight - pilotiLeft);
    const rachaoTopY = pilotiBottom;
    const leftGroundY = sampleGroundYAtX(groundPtsAbs, pilotiLeft);
    const rightGroundY = sampleGroundYAtX(groundPtsAbs, pilotiRight);

    const leftSideHeight = Math.max(0, pilotiBottom - leftGroundY);
    if (leftSideHeight > 0.5) {
      const leftGravel = new Rect({
        left: pilotiLeft - gravelWidthPx,
        top: leftGroundY,
        width: gravelWidthPx,
        height: leftSideHeight,
        fill: '#b9b4ad',
        stroke: '#8f8a84',
        strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
        strokeUniform: true,
        selectable: false,
        evented: false,
        objectCaching: false,
        opacity: 0.9,
      });
      const leftGravelObject = toCanvasObject(leftGravel);
      leftGravelObject.isGroundElement = true;
      leftGravelObject.isGroundFill = true;
      leftGravelObject.isTerrainSideGravel = true;
      leftGravelObject.groundTerrainType = normalizedTerrainType;
      leftGravelObject.pilotiId = piloti.pilotiId;
      localTerrainElements.push(leftGravelObject);
    }

    const rightSideHeight = Math.max(0, pilotiBottom - rightGroundY);
    if (rightSideHeight > 0.5) {
      const rightGravel = new Rect({
        left: pilotiRight + (PILOTI_STYLE.strokeWidth * s),
        top: rightGroundY,
        width: gravelWidthPx,
        height: rightSideHeight,
        fill: '#b9b4ad',
        stroke: '#8f8a84',
        strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth * 2 * s,
        strokeUniform: true,
        selectable: false,
        evented: false,
        objectCaching: false,
        opacity: 0.9,
      });
      const rightGravelObject = toCanvasObject(rightGravel);
      rightGravelObject.isGroundElement = true;
      rightGravelObject.isGroundFill = true;
      rightGravelObject.isTerrainSideGravel = true;
      rightGravelObject.groundTerrainType = normalizedTerrainType;
      rightGravelObject.pilotiId = piloti.pilotiId;
      localTerrainElements.push(rightGravelObject);
    }

    const rachaoLayer = new Rect({
      left: pilotiLeft - gravelWidthPx,
      top: rachaoTopY,
      width: pilotiVisualWidth + (gravelWidthPx * 2) + (PILOTI_STYLE.strokeWidth * s),
      height: rachaoDepthPx,
      fill: createRachaoPattern(s),
      stroke: '#6f5942',
      strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth * 2 * s,
      strokeUniform: true,
      selectable: false,
      evented: false,
      objectCaching: false,
      opacity: 0.95,
    });
    const rachaoLayerObject = toCanvasObject(rachaoLayer);
    rachaoLayerObject.isGroundElement = true;
    rachaoLayerObject.isGroundFill = true;
    rachaoLayerObject.isTerrainRachao = true;
    rachaoLayerObject.groundTerrainType = normalizedTerrainType;
    rachaoLayerObject.pilotiId = piloti.pilotiId;
    localTerrainElements.push(rachaoLayerObject);
  }

  // Alvo transparente para interação de edição de terreno.
  const terrainHitAreaTop = Math.min(leftNivelY, rightNivelY) - 6 * s;
  const terrainHitArea = new Rect({
    left: leftX,
    top: terrainHitAreaTop,
    width: rightX - leftX,
    height: fillBottomY - terrainHitAreaTop,
    fill: 'rgba(0,0,0,0)',
    strokeWidth: 0,
    selectable: false,
    evented: true,
    objectCaching: false,
  });
  const terrainHitAreaObject = toCanvasObject(terrainHitArea);
  terrainHitAreaObject.myType = 'terrain';
  terrainHitAreaObject.isGroundElement = true;
  terrainHitAreaObject.isTerrainEditTarget = true;
  terrainHitAreaObject.groundTerrainType = normalizedTerrainType;

  elements.push(
    groundFillObject,
    ...localTerrainElements,
    groundLineObject,
    terrainHitAreaObject,
    xL1Object,
    xL2Object,
    xR1Object,
    xR2Object,
    lLabelObject,
    rLabelObject,
  );
  return elements;
}

// Get corner piloti IDs for a given elevation view
function getViewCornerPilotiIds(group: CanvasGroup): { leftId: string; rightId: string } | null {
  const houseView = group.houseView;

  if (houseView === 'front' || houseView === 'back') {
    const isFlipped = group.isFlippedHorizontally;
    if (isFlipped) {
      return {leftId: PILOTI_CORNER_ID.topRight, rightId: PILOTI_CORNER_ID.topLeft};
    }
    return {leftId: PILOTI_CORNER_ID.bottomLeft, rightId: PILOTI_CORNER_ID.bottomRight};
  }

  if (houseView === 'side') {
    const isRight = group.isRightSide;
    if (isRight) {
      return {leftId: PILOTI_CORNER_ID.bottomRight, rightId: PILOTI_CORNER_ID.topRight};
    }
    return {leftId: PILOTI_CORNER_ID.topLeft, rightId: PILOTI_CORNER_ID.bottomLeft};
  }

  return null;
}

// Update ground elements in an elevation view group based on corner piloti nivel values
export function updateGroundInGroup(group: CanvasGroup): void {
  const corners = getViewCornerPilotiIds(group);
  if (!corners) return;

  const objects = group.getCanvasObjects();
  const leftRect = objects.find(o => o.pilotiId === corners.leftId && o.isPilotiRect);
  const rightRect = objects.find(o => o.pilotiId === corners.rightId && o.isPilotiRect);
  if (!leftRect || !rightRect) return;

  const leftNivel = leftRect.pilotiNivel ?? PILOTI_DEFAULT_NIVEL;
  const rightNivel = rightRect.pilotiNivel ?? PILOTI_DEFAULT_NIVEL;
  const baseHeight = leftRect.pilotiBaseHeight ?? PILOTI_BASE_HEIGHT_PX_WITH_SCALE;
  const scale = baseHeight / PILOTI_BASE_HEIGHT_PX;
  const terrainType = getGroundTerrainType(group);
  group.groundTerrainType = terrainType;

  // Find seed from existing ground
  const oldSeed = (objects.find(o => o.groundSeed))?.groundSeed ?? 42;

  // Remove all existing ground elements directly from _objects to avoid coordinate transforms
  const groundElements = objects.filter(o => o.isGroundElement);
  if (groundElements.length) {
    const internalObjects = group._objects as FabricObject[];
    if (internalObjects && Array.isArray(internalObjects)) {
      group._objects =
        internalObjects.filter(o => !toCanvasObject(o)?.isGroundElement);
      groundElements.forEach(o => {
        o.group = undefined;
      });
    } else {
      group.remove(...(groundElements));
    }
  }

  // Re-read objects after removal
  const remainingObjects = group.getCanvasObjects();

  // Calculate anchor positions (center of each corner piloti rect)
  const leftRectAfter =
    remainingObjects.find(o => o.pilotiId === corners.leftId && o.isPilotiRect);

  const rightRectAfter =
    remainingObjects.find(o => o.pilotiId === corners.rightId && o.isPilotiRect);

  if (!leftRectAfter || !rightRectAfter) return;

  const leftCenterX =
    (leftRectAfter.left ?? 0) + (leftRectAfter.width ?? HOUSE_DIMENSIONS.piloti.width) / 2;

  const rightCenterX =
    (rightRectAfter.left ?? 0) + (rightRectAfter.width ?? HOUSE_DIMENSIONS.piloti.width) / 2;

  // Derive view limits from structural objects (walls, roof) instead of piloti positions
  const structuralObjs =
    remainingObjects.filter(o => !o.isGroundElement && !o.isPilotiRect);

  let viewLeftX = Infinity;
  let viewRightX = -Infinity;
  for (const o of structuralObjs) {
    const oLeft = o.left ?? 0;
    const oWidth = o.width ?? 0;
    if (oLeft < viewLeftX) viewLeftX = oLeft;
    if (oLeft + oWidth > viewRightX) viewRightX = oLeft + oWidth;
  }

  if (!isFinite(viewLeftX)) viewLeftX = 0;
  if (!isFinite(viewRightX)) viewRightX =
    rightCenterX + (rightRectAfter.width ?? HOUSE_DIMENSIONS.piloti.width) / 2;

  const leftX = viewLeftX - HOUSE_DEFAULTS.viewPadding;
  const rightX = viewRightX + HOUSE_DEFAULTS.viewPadding;
  const leftNivelY = (leftRectAfter.top ?? 0) + leftNivel * 100 * scale;
  const rightNivelY = (rightRectAfter.top ?? 0) + rightNivel * 100 * scale;

  // Find the max bottom Y of all pilotis in this view
  const allPilotis = remainingObjects.filter(o => o.isPilotiRect);
  let maxPilotiBottomY = 0;
  for (const p of allPilotis) {
    const pTop = p.top ?? 0;
    const pH = p.height ?? 0;
    const bottom = pTop + pH;
    if (bottom > maxPilotiBottomY) maxPilotiBottomY = bottom;
  }

  // Create new ground elements (Polyline/Polygon + markers/labels)
  const newElements = createGroundElements(
    leftX,
    leftCenterX,
    leftNivelY,
    rightX,
    rightCenterX,
    rightNivelY,
    scale,
    oldSeed,
    formatNivel(leftNivel),
    formatNivel(rightNivel),
    maxPilotiBottomY,
    terrainType,
    allPilotis.map(piloti => ({
      ...resolvePilotiVisualEnvelope(piloti),
      pilotiId: String(piloti.pilotiId ?? ''),
      left: Number(piloti.left ?? 0),
      top: Number(piloti.top ?? 0),
      width: Number(piloti.width ?? HOUSE_DIMENSIONS.piloti.width),
      height: Number(piloti.height ?? 0),
    })),
  );

  const groundBack =
    newElements.filter(o => o.isGroundFill || o.isGroundLine || o.isTerrainEditTarget);

  const nivelFront =
    newElements.filter(o => o.isNivelMarker || o.isNivelLabel);

  // Add new ground elements directly to _objects to avoid coordinate transforms
  const currentObjects = group._objects as FabricObject[];
  if (currentObjects && Array.isArray(currentObjects)) {
    const allNew = [...groundBack, ...nivelFront];
    allNew.forEach(o => {
      o.group = group;
      o.setCoords?.();
      currentObjects.push(o);
    });
  } else {
    if (groundBack.length) {
      groundBack.forEach(o => o.setCoords?.());
      group.add(...(groundBack));
    }
    if (nivelFront.length) {
      nivelFront.forEach(o => o.setCoords?.());
      group.add(...(nivelFront));
    }
  }

  // Garante bounds atualizados imediatamente após inserir/remover terreno.
  group._clearCache?.();
  group._calcBounds?.();
  group.setCoords();
  group.dirty = true;

  const canvas = group.canvas;
  if (canvas?.getActiveObject() === group) {
    canvas.setActiveObject(group);
  }
  group.canvas?.requestRenderAll();
}

export function updateGroundTerrainType(group: CanvasGroup, terrainType: number): TerrainSolidityLevel {
  const normalized = normalizeTerrainSolidityLevel(terrainType);
  group.groundTerrainType = normalized;
  updateGroundInGroup(group);
  refreshHouseGroupRendering(group);
  group.canvas?.requestRenderAll();
  return normalized;
}
