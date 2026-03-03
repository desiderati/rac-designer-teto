import {FabricObject, Line, Pattern, Polygon, Polyline, Rect, Text} from 'fabric';
import {
  CANVAS_STYLE,
  HOUSE_2D_STYLE,
  HOUSE_DEFAULTS,
  normalizeTerrainSolidityLevel,
  PILOTI_CORNER_ID,
  PILOTI_STYLE,
  TERRAIN_SOLIDITY,
  TERRAIN_STYLE,
  TerrainSolidityLevel
} from '@/shared/config.ts';
import {CanvasGroup, CanvasObject, toCanvasObject} from '@/components/rac-editor/lib/canvas/canvas.ts'
import {refreshHouseGroupRendering} from '@/components/rac-editor/lib/canvas/piloti.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';
import {PILOTI_BASE_HEIGHT_PX, PILOTI_BASE_HEIGHT_PX_WITH_SCALE, PILOTI_DEFAULT_NIVEL} from '@/shared/constants.ts';
import {formatNivel} from '@/shared/types/piloti.ts';

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

  const groundLine = new Polyline(groundPtsAbs, {
    left: gMinX - 5,
    top: gMinY - 5,
    fill: 'transparent',
    stroke: lineColor,
    strokeWidth: markerWidth * 7, // Multiplicador :)
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

// Seeded random number generator for deterministic ground line variation
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function getTerrainRachaoThicknessCm(level: TerrainSolidityLevel): number {
  return TERRAIN_SOLIDITY.levels[level].rachao;
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

export function getGroundTerrainType(group: CanvasGroup): TerrainSolidityLevel {
  return normalizeTerrainSolidityLevel(group.groundTerrainType);
}

export function updateGroundTerrainType(group: CanvasGroup, terrainType: number): TerrainSolidityLevel {
  const normalized = normalizeTerrainSolidityLevel(terrainType);
  group.groundTerrainType = normalized;
  updateGroundInGroup(group);
  refreshHouseGroupRendering(group);

  group.canvas?.requestRenderAll();
  return normalized;
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

function resolvePilotiVisualEnvelope(
  pilotiRect: CanvasObject,
): { left: number; right: number; bottom: number } {
  // Use somente o envelope visual do retângulo do piloti para evitar micro-deslocamento
  // causado pela faixa hachurada interna.
  const bounds = getPilotiRectVisualBounds(pilotiRect);
  return {left: bounds.left, right: bounds.right, bottom: bounds.bottom};
}

function getPilotiRectVisualBounds(
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
