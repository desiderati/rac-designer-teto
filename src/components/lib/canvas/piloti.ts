import {Canvas as FabricCanvas, FabricObject, Group, Line, Pattern, Polygon, Polyline, Text} from 'fabric';
import {
  BASE_PILOTI_HEIGHT_PX,
  CORNER_PILOTI_IDS,
  MASTER_PILOTI_FILL,
  MASTER_PILOTI_STROKE_COLOR,
} from './constants.ts';
import {HOUSE_PILOTI_STANDARD_HEIGHTS} from '@/shared/types/house.ts';

export const PILOTI_DEFAULT_NIVEL = 0.2;

export const PILOTI_STROKE_COLOR = '#222';

export function clampNivelByHeight(nivel: number, pilotiHeight: number): number {
  const maxNivel = Math.round((pilotiHeight / 2) * 100) / 100;
  return clampNivel(nivel,  0.2, maxNivel);
}

export function clampNivel(nivel: number, minNivel: number = 0.2, maxNivel: number = 1.50): number {
  return Math.round(Math.max(minNivel, Math.min(nivel, maxNivel)) * 100) / 100;
}

export function formatPilotiHeight(height: number): string {
  return height.toFixed(1).replace('.', ',');
}

export function formatNivel(nivel: number): string {
  return nivel.toFixed(2).replace('.', ',');
}

export function getRecommendedHeight(nivel: number): number {
  const minHeight = nivel * 3;
  return HOUSE_PILOTI_STANDARD_HEIGHTS.find((h) => h >= minHeight) ?? 3.0;
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
export function getPilotiIdsFromGroup(group: Group): string[] {
  const present = new Set<string>();
  group.getObjects().forEach((obj: any) => {
    if ((obj.isPilotiCircle || obj.isPilotiRect) && typeof obj.pilotiId === 'string') {
      present.add(obj.pilotiId);
    }
  });

  return getAllPilotiIds().filter((id) => present.has(id));
}

// Get next/previous piloti ID
export function getAdjacentPilotiId(currentId: string, direction: 'next' | 'prev'): string | null {
  const allIds = getAllPilotiIds();
  const currentIndex = allIds.indexOf(currentId);
  if (currentIndex === -1) return null;

  if (direction === 'next' && currentIndex < allIds.length - 1) {
    return allIds[currentIndex + 1];
  }

  if (direction === 'prev' && currentIndex > 0) {
    return allIds[currentIndex - 1];
  }

  return null;
}

// Get piloti data from group (works for both circles in top view and rects in front/back/side views)
export function getPilotiFromGroup(
  group: Group,
  pilotiId: string,
): {
  circle: FabricObject;
  height: number;
  isMaster: boolean;
  nivel: number;
} | null {
  const objects = group.getObjects();

  for (const obj of objects) {
    if ((obj as any).pilotiId === pilotiId && ((obj as any).isPilotiCircle || (obj as any).isPilotiRect)) {
      return {
        circle: obj,
        height: (obj as any).pilotiHeight || 1.0,
        isMaster: (obj as any).pilotiIsMaster || false,
        nivel: (obj as any).pilotiNivel ?? 0.2,
      };
    }
  }

  return null;
}

export function updatePilotiHeight(group: Group, pilotiId: string, newHeight: number): void {
  const objects = group.getObjects();

  // Fabric caching note:
  // Groups can cache to an offscreen canvas; when a child grows, the cached bounds can clip the new geometry.
  // We disable caching + force a refresh to guarantee the new rect is actually redrawn.
  (group as any).objectCaching = false;

  // Track delta to keep the house centered while piloti rect grows downwards.
  // (Rects in front/back/side use originY="top", so growth increases maxY only.)
  let rectHeightDelta = 0;

  objects.forEach((obj: any) => {
    if (obj.pilotiId !== pilotiId) return;

    if (obj.isPilotiCircle) {
      obj.pilotiHeight = newHeight;
      (obj as any).dirty = true;
      return;
    }

    if (obj.isPilotiRect) {
      // Disable caching for the rect itself as well (prevents "corte" after resize)
      obj.objectCaching = false;

      const oldHeight = (obj.getScaledHeight?.() ?? obj.height ?? 0) as number;
      obj.pilotiHeight = newHeight;

      const baseHeight = obj.pilotiBaseHeight || 60; // fallback
      const s = baseHeight / BASE_PILOTI_HEIGHT_PX;
      const newVisualHeight = baseHeight * newHeight;
      rectHeightDelta = newVisualHeight - oldHeight;

      // IMPORTANT: reset scaling so height is the real source of truth
      obj.set({height: newVisualHeight, scaleY: 1});
      obj.setCoords();
      (obj as any).dirty = true;

      // Update size label position using the *same* computed height (no guessing)
      const sizeLabel = objects.find((o: any) => o.pilotiId === pilotiId && o.isPilotiSizeLabel) as any;
      if (sizeLabel) {
        const offset = 8 * s;
        const rectWidth = (obj.width ?? 0) as number;
        sizeLabel.set('left', (obj.left ?? 0) + rectWidth / 2);
        sizeLabel.set('top', (obj.top ?? 0) + newVisualHeight + offset);
        sizeLabel.set('text', formatPilotiHeight(newHeight));
        sizeLabel.setCoords();
        (sizeLabel as any).dirty = true;
      }

      return;
    }

    if (obj.isPilotiStripe) {
      // Update stripe overlay to cover bottom 2/3 of the new piloti height
      const pilotiRect = objects.find((o: any) => o.pilotiId === pilotiId && o.isPilotiRect) as any;
      if (pilotiRect) {
        const newVisualHeight = (pilotiRect.height ?? 0) as number;
        const stripeHeight = (newVisualHeight * 2) / 3;
        obj.set({height: stripeHeight, top: (pilotiRect.top ?? 0) + newVisualHeight / 3});
        obj.set('fill', createDiagonalStripePattern());
        obj.objectCaching = false;
        obj.setCoords();
        (obj as any).dirty = true;
      }
      return;
    }

    if (obj.isPilotiText) {
      obj.set('text', formatPilotiHeight(newHeight));
      (obj as any).dirty = true;
    }

    if (obj.isPilotiSizeLabel) {
      obj.set('text', formatPilotiHeight(newHeight));
      (obj as any).dirty = true;
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
export function refreshHouseGroupRendering(group: Group): void {
  (group as any).objectCaching = false;

  // Keep house interaction constraints stable after JSON restore/undo.
  if ((group as any).myType === 'house') {
    group.setControlsVisibility({mt: false, mb: false, ml: false, mr: false});
  }

  const objects = group.getObjects();
  objects.forEach((obj: any) => {
    obj.objectCaching = false;
    (obj as any).dirty = true;
    obj.setCoords?.();
  });

  // Z-order sort: normal objects (pilotis, walls, roof) -> ground fill/line -> markers/labels
  // Ground elements render IN FRONT of pilotis
  const groundBack =
    objects.filter((o: any) => o.isGroundFill || o.isGroundLine);

  const groundFront =
    objects.filter((o: any) => o.isNivelMarker || o.isNivelLabel);

  const normal = objects.filter((o: any) => !o.isGroundElement);
  const sorted = [...normal, ...groundBack, ...groundFront];

  // Replace _objects array in-place to reorder Z without remove/add coordinate transforms
  const internalObjects = (group as any)._objects;
  if (internalObjects && Array.isArray(internalObjects)) {
    internalObjects.length = 0;
    internalObjects.push(...sorted);
  }

  // Polyline/Polygon need pathOffset recalculation
  objects.forEach((obj: any) => {
    if (obj instanceof Polyline || obj instanceof Polygon) {
      obj.setDimensions?.();
    }
  });

  // Recalculate bounds without triggering object coordinate transforms
  (group as any)._clearCache?.();
  (group as any)._calcBounds?.();
  group.setCoords();
  (group as any).dirty = true;
}

export function refreshHouseGroupsOnCanvas(canvas: FabricCanvas): void {
  canvas.getObjects().forEach((obj: any) => {
    if (obj?.type === 'group' && obj?.myType === 'house') {
      refreshHouseGroupRendering(obj as Group);
    }
  });
}

export function updatePilotiMaster(group: Group, pilotiId: string, isMaster: boolean, nivel: number): void {
  const objects = group.getObjects();

  if (isMaster) {
    objects.forEach((obj: any) => {
      if (obj.pilotiId !== pilotiId) {
        if ((obj.isPilotiCircle || obj.isPilotiRect) && obj.pilotiIsMaster) {
          obj.pilotiIsMaster = false;
          obj.set('fill', obj.isPilotiRect ? '#fff' : 'white');
          obj.set('stroke', obj.isPilotiRect ? '#333' : 'black');
          obj.set('strokeWidth', obj.isPilotiRect ? 2 : 1.5 * 0.6);
        }
        // Keep nivel text visible for corner pilotis even when losing master status
        if (obj.isPilotiNivelText && !CORNER_PILOTI_IDS.includes(obj.pilotiId)) {
          obj.set('text', '');
          obj.set('visible', false);
        }
      }
    });
  }

  // Now update the target piloti
  objects.forEach((obj: any) => {
    if (obj.pilotiId === pilotiId) {
      if (obj.isPilotiCircle || obj.isPilotiRect) {
        obj.pilotiIsMaster = isMaster;
        obj.pilotiNivel = nivel;

        // Update visual style based on isMaster
        if (isMaster) {
          obj.set('fill', MASTER_PILOTI_FILL);
          obj.set('stroke', MASTER_PILOTI_STROKE_COLOR);
          obj.set('strokeWidth', obj.isPilotiRect ? 3 : 2);
        } else {
          obj.set('fill', obj.isPilotiRect ? '#fff' : 'white');
          obj.set('stroke', obj.isPilotiRect ? '#333' : 'black');
          obj.set('strokeWidth', obj.isPilotiRect ? 2 : 1.5 * 0.6);
        }
      }
      if (obj.isPilotiNivelText) {
        const isCorner = CORNER_PILOTI_IDS.includes(pilotiId);
        if (isCorner) {
          const pilotiCircle = objects.find((o: any) => o.pilotiId === pilotiId && o.isPilotiCircle) as any;
          const centerX = Number(pilotiCircle?.left ?? obj.left ?? 0);
          const centerY = Number(pilotiCircle?.top ?? obj.top ?? 0);
          const radius = Number(pilotiCircle?.radius ?? 15 * 0.6);
          const offset = 12 * 0.6;
          const isTopCorner = pilotiId === 'piloti_0_0' || pilotiId === 'piloti_3_0';

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

// Create a diagonal stripe pattern for piloti fill (bottom 2/3)
export function createDiagonalStripePattern(): Pattern {
  const size = 10; // pattern tile size
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = '#333';
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

// Calculate piloti visual height based on pilotiHeight value
export function getPilotiVisualHeight(pilotiHeight: number, scale: number): number {
  return BASE_PILOTI_HEIGHT_PX * pilotiHeight * scale;
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
  const centerLen = rcx - lcx;
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
): FabricObject[] {
  const elements: FabricObject[] = [];
  const xSize = 5 * s;
  const lineColor = '#8B6914';
  const markerWidth = 1.5;

  // X marker on left corner piloti
  const xL1 = new Line([leftCenterX - xSize, leftNivelY - xSize, leftCenterX + xSize, leftNivelY + xSize], {
    stroke: lineColor,
    strokeWidth: markerWidth,
    strokeUniform: true,
    selectable: false,
    evented: false,
  });
  (xL1 as any).isGroundElement = true;
  (xL1 as any).isNivelMarker = true;

  const xL2 = new Line([leftCenterX - xSize, leftNivelY + xSize, leftCenterX + xSize, leftNivelY - xSize], {
    stroke: lineColor,
    strokeWidth: markerWidth,
    strokeUniform: true,
    selectable: false,
    evented: false,
  });
  (xL2 as any).isGroundElement = true;
  (xL2 as any).isNivelMarker = true;

  // X marker on right corner piloti
  const xR1 = new Line([rightCenterX - xSize, rightNivelY - xSize, rightCenterX + xSize, rightNivelY + xSize], {
    stroke: lineColor,
    strokeWidth: markerWidth,
    strokeUniform: true,
    selectable: false,
    evented: false,
  });
  (xR1 as any).isGroundElement = true;
  (xR1 as any).isNivelMarker = true;

  const xR2 = new Line([rightCenterX - xSize, rightNivelY + xSize, rightCenterX + xSize, rightNivelY - xSize], {
    stroke: lineColor,
    strokeWidth: markerWidth,
    strokeUniform: true,
    selectable: false,
    evented: false,
  });
  (xR2 as any).isGroundElement = true;
  (xR2 as any).isNivelMarker = true;

  // Nivel labels next to the X markers
  const labelFontSize = 10 * s;
  const lLabel = new Text(leftNivelStr, {
    fontSize: labelFontSize,
    fill: lineColor,
    backgroundColor: '#ffffff',
    fontFamily: 'Arial',
    fontWeight: 'bold',
    left: leftCenterX + xSize + 5,
    top: leftNivelY + xSize + 10 * s,
    originX: 'right',
    originY: 'center',
    selectable: false,
    evented: false,
  });
  (lLabel as any).isGroundElement = true;
  (lLabel as any).isNivelLabel = true;

  const rLabel = new Text(rightNivelStr, {
    fontSize: labelFontSize,
    fill: lineColor,
    backgroundColor: '#ffffff',
    fontFamily: 'Arial',
    fontWeight: 'bold',
    left: rightCenterX - xSize - 3,
    top: rightNivelY + xSize + 10 * s,
    originX: 'left',
    originY: 'center',
    selectable: false,
    evented: false,
  });
  (rLabel as any).isGroundElement = true;
  (rLabel as any).isNivelLabel = true;

  // --- Polyline + Polygon: terreno irregular ---
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

  const groundLine = new Polyline(groundPtsAbs, {
    left: gMinX,
    top: gMinY,
    fill: 'transparent',
    stroke: lineColor,
    strokeWidth: 2.5,
    strokeUniform: true,
    selectable: false,
    evented: false,
    objectCaching: false,
  });
  (groundLine as any).isGroundElement = true;
  (groundLine as any).isGroundLine = true;
  (groundLine as any).groundSeed = seed;

  const fillBottomY = maxPilotiBottomY + 50 * s;
  const fillPtsAbs = [...groundPtsAbs, {x: rightX, y: fillBottomY}, {x: leftX, y: fillBottomY}];

  const fMinX = Math.min(...fillPtsAbs.map((p) => p.x));
  const fMinY = Math.min(...fillPtsAbs.map((p) => p.y));

  const groundFill = new Polygon(fillPtsAbs, {
    left: fMinX,
    top: fMinY,
    fill: 'rgba(139, 105, 20, 0.10)',
    stroke: 'transparent',
    strokeWidth: 0,
    selectable: false,
    evented: false,
    objectCaching: false,
  });
  (groundFill as any).isGroundElement = true;
  (groundFill as any).isGroundFill = true;

  elements.push(groundFill, groundLine, xL1, xL2, xR1, xR2, lLabel, rLabel);
  return elements;
}

// Get corner piloti IDs for a given elevation view
function getViewCornerPilotiIds(group: Group): { leftId: string; rightId: string } | null {
  const houseView = (group as any).houseView;

  if (houseView === 'front' || houseView === 'back') {
    const isFlipped = (group as any).isFlippedHorizontally;
    if (isFlipped) {
      return {leftId: 'piloti_3_0', rightId: 'piloti_0_0'};
    }
    return {leftId: 'piloti_0_2', rightId: 'piloti_3_2'};
  }

  if (houseView === 'side') {
    const isRight = (group as any).isRightSide;
    if (isRight) {
      return {leftId: 'piloti_3_2', rightId: 'piloti_3_0'};
    }
    return {leftId: 'piloti_0_0', rightId: 'piloti_0_2'};
  }

  return null;
}

// Update ground elements in an elevation view group based on corner piloti nivel values
export function updateGroundInGroup(group: Group): void {
  const corners = getViewCornerPilotiIds(group);
  if (!corners) return;

  const objects = group.getObjects();
  const leftRect = objects.find((o: any) => o.pilotiId === corners.leftId && o.isPilotiRect) as any;
  const rightRect = objects.find((o: any) => o.pilotiId === corners.rightId && o.isPilotiRect) as any;
  if (!leftRect || !rightRect) return;

  const leftNivel = leftRect.pilotiNivel ?? 0.2;
  const rightNivel = rightRect.pilotiNivel ?? 0.2;
  const baseHeight = leftRect.pilotiBaseHeight || 60;
  const scale = baseHeight / BASE_PILOTI_HEIGHT_PX;

  // Find seed from existing ground
  const oldSeed = (objects.find((o: any) => o.groundSeed) as any)?.groundSeed ?? 42;

  // Remove all existing ground elements directly from _objects to avoid coordinate transforms
  const groundElements = objects.filter((o: any) => o.isGroundElement);
  if (groundElements.length) {
    const internalObjects = (group as any)._objects as any[];
    if (internalObjects && Array.isArray(internalObjects)) {
      (group as any)._objects = internalObjects.filter((o: any) => !o.isGroundElement);
      groundElements.forEach((o: any) => {
        o.group = undefined;
      });
    } else {
      group.remove(...(groundElements as any));
    }
  }

  // Re-read objects after removal
  const remainingObjects = group.getObjects();

  // Calculate anchor positions (center of each corner piloti rect)
  const leftRectAfter =
    remainingObjects.find((o: any) => o.pilotiId === corners.leftId && o.isPilotiRect) as any;

  const rightRectAfter =
    remainingObjects.find((o: any) => o.pilotiId === corners.rightId && o.isPilotiRect) as any;

  if (!leftRectAfter || !rightRectAfter) return;

  const leftCenterX = (leftRectAfter.left ?? 0) + (leftRectAfter.width ?? 30) / 2;
  const rightCenterX = (rightRectAfter.left ?? 0) + (rightRectAfter.width ?? 30) / 2;

  // Derive view limits from structural objects (walls, roof) instead of piloti positions
  const structuralObjs =
    remainingObjects.filter((o: any) => !o.isGroundElement && !o.isPilotiRect && !o.isPilotiLabel);

  let viewLeftX = Infinity;
  let viewRightX = -Infinity;
  for (const o of structuralObjs) {
    const oLeft = (o as any).left ?? 0;
    const oWidth = (o as any).width ?? 0;
    if (oLeft < viewLeftX) viewLeftX = oLeft;
    if (oLeft + oWidth > viewRightX) viewRightX = oLeft + oWidth;
  }

  if (!isFinite(viewLeftX)) viewLeftX = 0;
  if (!isFinite(viewRightX)) viewRightX = rightCenterX + (rightRectAfter.width ?? 30) / 2;

  const leftX = viewLeftX - 50;
  const rightX = viewRightX + 50;
  const leftNivelY = (leftRectAfter.top ?? 0) + leftNivel * 100 * scale;
  const rightNivelY = (rightRectAfter.top ?? 0) + rightNivel * 100 * scale;

  // Find the max bottom Y of all pilotis in this view
  const allPilotis = remainingObjects.filter((o: any) => o.isPilotiRect);
  let maxPilotiBottomY = 0;
  for (const p of allPilotis) {
    const pTop = (p as any).top ?? 0;
    const pH = (p as any).height ?? 0;
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
  );

  const groundBack =
    newElements.filter((o: any) => o.isGroundFill || o.isGroundLine);

  const groundFront =
    newElements.filter((o: any) => o.isNivelMarker || o.isNivelLabel);

  // Add new ground elements directly to _objects to avoid coordinate transforms
  const currentObjects = (group as any)._objects as any[];
  if (currentObjects && Array.isArray(currentObjects)) {
    const allNew = [...groundBack, ...groundFront];
    allNew.forEach((o: any) => {
      o.group = group;
      currentObjects.push(o);
    });
  } else {
    if (groundBack.length) group.add(...(groundBack as any));
    if (groundFront.length) group.add(...(groundFront as any));
  }
}
