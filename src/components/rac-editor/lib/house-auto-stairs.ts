import {FabricObject, Group as FabricGroup, Line, Rect} from 'fabric';
import {HousePiloti, HouseSide, HouseType, HouseViewInstance, HouseViewType} from '@/shared/types/house.ts';
import {CANVAS_ELEMENT_STYLE, HOUSE_2D_STYLE} from '@/shared/config.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';
import {
  calculateRenderedDoorGeometryForTopMarker,
  calculateTopDoorMarkerBodySize,
  calculateTopDoorPlacement,
  resolveTopDoorMarkerSide
} from '@/components/rac-editor/lib/house-top-view-door-marker.ts';
import {
  CanvasGroup,
  CanvasObject,
  getCanvasGroupObjects,
  toCanvasGroup,
  toCanvasObject
} from '@/components/rac-editor/lib/canvas/canvas.ts';
import {resolveDoorSideCornerIds} from '@/shared/types/piloti.ts';
import {NUMERIC_EPSILON, PILOTI_DEFAULT_NIVEL} from '@/shared/constants.ts';

// Largura base da escada.
const AUTO_STAIR_BASE_WIDTH_PX = HOUSE_DIMENSIONS.elements.common.windowWidth

// Tamanho em metros que a escada deve ultrapassar a linha do terreno.
const AUTO_STAIR_HEIGHT_EXTRA_MTS = 0.3;

// Tamanho mínimo permitido (Top View), para o degrau nunca ficar fino demais e sumir.
// Na Top View, usamos DEPTH para representar o comprimento do degrau.
const AUTO_STAIR_STEP_MIN_DEPTH_PX = 10;

// Altura de cada degrau em metros.
const AUTO_STAIR_STEP_HEIGHT_MTS = 0.3;

const AUTO_STAIR_FLOOR_HEIGHT_MTS = HOUSE_DIMENSIONS.structure.floorHeight / 100;
const AUTO_STAIR_BEAM_HEIGHT_MTS = HOUSE_DIMENSIONS.structure.floorBeamHeight / 100;

interface StairMetrics {
  leftNivel: number;
  rightNivel: number;
  stairHeight: number;
  steps: number;
}

interface ElevationViewsAutoStairsResult {
  hasChanges: boolean;
  metricsBySide: Partial<Record<HouseSide, StairMetrics>>;
}

interface DoorSideAxisContext {
  side: HouseSide;
  reverseAxis: boolean;
}

export function refreshAutoStairsInViews(params: {
  houseType: HouseType;
  sideMappings: Record<HouseSide, HouseViewType | null>;
  pilotis: Record<string, HousePiloti>;
  topView: HouseViewInstance<CanvasGroup>[];
  elevationViews: HouseViewInstance<CanvasGroup>[];
  showStairsOnTopView?: boolean;
}): boolean {
  const showStairsOnTopView = params.showStairsOnTopView ?? true;

  const elevationResult = refreshElevationViewsAutoStairs({
    pilotis: params.pilotis,
    elevationViews: params.elevationViews,
  });

  const topViewChanged = showStairsOnTopView
    ? (params.topView[0]
      ? refreshTopViewAutoStairs({
        houseType: params.houseType,
        sideMappings: params.sideMappings,
        pilotis: params.pilotis,
        topView: params.topView[0],
        sharedMetricsBySide: elevationResult.metricsBySide,
      })
      : false)
    : removeAutoStairsFromTopViews(params.topView);

  return topViewChanged || elevationResult.hasChanges;
}

function removeAutoStairsFromTopViews(topViews: HouseViewInstance<CanvasGroup>[]): boolean {
  let changed = false;
  for (const topView of topViews) {
    if (removeAutoStairsFromGroup(topView.group)) {
      topView.group.dirty = true;
      refreshGroupBounds(topView.group);
      changed = true;
    }
  }
  return changed;
}

function refreshElevationViewsAutoStairs(params: {
  pilotis: Record<string, HousePiloti>;
  elevationViews: HouseViewInstance<CanvasGroup>[];
}): ElevationViewsAutoStairsResult {

  let hasChanges = false;
  const metricsBySide: Partial<Record<HouseSide, StairMetrics>> = {};

  for (const viewInstance of params.elevationViews) {
    const group = viewInstance.group;
    const removed = removeAutoStairsFromGroup(group);
    if (removed) hasChanges = true;

    const runtimeDoor = getCanvasGroupObjects(group).find(object => object?.isHouseDoor);
    if (!runtimeDoor) continue;

    const doorLeft = Number(runtimeDoor.left ?? 0);
    const doorTop = Number(runtimeDoor.top ?? 0);
    const doorWidth = Number(runtimeDoor.width ?? 0) * Number(runtimeDoor.scaleX ?? 1);
    const doorHeight = Number(runtimeDoor.height ?? 0) * Number(runtimeDoor.scaleY ?? 1);
    if (doorWidth <= 0 || doorHeight <= 0) continue;
    const axisContext = resolveDoorSideAxisContextFromElevationGroup(group);
    if (!axisContext) continue;

    const scale = doorWidth / HOUSE_DIMENSIONS.elements.common.doorWidth;
    const stairWidth = Math.max(doorWidth, AUTO_STAIR_BASE_WIDTH_PX * scale);
    const metrics = resolveElevationStairMetrics({
      pilotis: params.pilotis,
      group,
      axisContext,
      stairLeftX: doorLeft,
      stairRightX: doorLeft + stairWidth,
    });

    const stairDepth = resolveStairDepthPxFromHeight(metrics.stairHeight, scale);
    const doorStroke = Number(runtimeDoor?.strokeWidth ?? HOUSE_2D_STYLE.outlineStrokeWidth);
    const stairStroke = HOUSE_2D_STYLE.outlineStrokeWidth;
    const strokeOffset = (doorStroke + stairStroke) / 2;

    // Na elevação, a escada é igual à da planta: retângulo com linhas de degrau,
    // posicionada logo abaixo da porta.
    const elevationStair = createStripedTopStair({
      width: stairWidth,
      depth: stairDepth,
      steps: metrics.steps,
      lineOrientation: 'horizontal',
      metrics,
    });
    elevationStair.set({
      originX: 'left',
      left: doorLeft,
      top: doorTop + doorHeight + stairDepth / 2 + strokeOffset,
    });
    addObjectToGroup(group, elevationStair);

    hasChanges = true;
    metricsBySide[axisContext.side] = metrics;

    group.dirty = true;
    refreshGroupBounds(group);
  }

  return {hasChanges, metricsBySide};
}

function refreshTopViewAutoStairs(params: {
  houseType: HouseType;
  sideMappings: Record<HouseSide, HouseViewType | null>;
  pilotis: Record<string, HousePiloti>;
  topView: HouseViewInstance<CanvasGroup>;
  sharedMetricsBySide: Partial<Record<HouseSide, StairMetrics>>;
}): boolean {

  const group = params.topView.group;
  let hasChanges = removeAutoStairsFromGroup(group);

  const doorSide = resolveTopDoorMarkerSide({
    houseType: params.houseType,
    sideMappings: params.sideMappings,
  });
  if (!doorSide) return hasChanges;

  const runtimeBody = getCanvasGroupObjects(group).find(
    (object) => object?.isHouseBody
  );
  if (!runtimeBody) return hasChanges;

  const {bodyWidth, bodyHeight} = calculateTopDoorMarkerBodySize({
    width: runtimeBody.width ?? 0,
    height: runtimeBody.height ?? 0,
    scaleX: runtimeBody.scaleX ?? 1,
    scaleY: runtimeBody.scaleY ?? 1,
  });

  const renderedDoorGeometry =
    calculateRenderedDoorGeometryForTopMarker({
      doorMarkerSide: doorSide,
      bodyWidth,
      bodyHeight,
    });

  const placement = calculateTopDoorPlacement({
    doorMarkerSide: doorSide,
    doorX: renderedDoorGeometry.doorX,
    doorWidth: renderedDoorGeometry.doorWidth,
    bodyWidth,
    bodyHeight,
  });
  if (!placement.doorMarkerSide) return hasChanges;

  const sideScale =
    placement.doorMarkerSide === 'left' || placement.doorMarkerSide === 'right'
      ? bodyHeight / HOUSE_DIMENSIONS.footprint.depth
      : bodyWidth / HOUSE_DIMENSIONS.footprint.width;

  const stairWidth = Math.max(renderedDoorGeometry.doorWidth, AUTO_STAIR_BASE_WIDTH_PX * sideScale);
  const sharedMetrics = params.sharedMetricsBySide[doorSide];

  // Quando não existe vista elevada correspondente no canvas, calculamos
  // as métricas no contexto da planta para manter a escada funcional.
  const metrics = sharedMetrics ?? resolveTopStairMetrics({
    pilotis: params.pilotis,
    doorSide,
    bodyWidth,
    bodyHeight,
    stairSpan: stairWidth,
    stairCenter:
      doorSide === 'left' || doorSide === 'right'
        ? Number(placement.targetTop ?? 0)
        : Number(placement.targetLeft ?? 0),
  });
  const stairDepth = resolveStairDepthPxFromHeight(metrics.stairHeight, sideScale);
  const markerShort = HOUSE_DIMENSIONS.elements.topDoorMarker.shortSize * sideScale;
  const markerOffset = markerShort / 2;

  let stairLeft = placement.targetLeft ?? 0;
  let stairTop = placement.targetTop ?? 0;
  let lineOrientation: 'horizontal' | 'vertical';

  if (placement.doorMarkerSide === 'top') {
    stairTop = -bodyHeight / 2 - markerOffset - stairDepth / 2;
    lineOrientation = 'horizontal';

  } else if (placement.doorMarkerSide === 'bottom') {
    stairTop = bodyHeight / 2 + markerOffset + stairDepth / 2;
    lineOrientation = 'horizontal';

  } else if (placement.doorMarkerSide === 'left') {
    stairLeft = -bodyWidth / 2 - markerOffset - stairDepth / 2;
    lineOrientation = 'vertical';

  } else {
    stairLeft = bodyWidth / 2 + markerOffset + stairDepth / 2;
    lineOrientation = 'vertical';
  }

  const topStair = createStripedTopStair({
    width: placement.doorMarkerSide === 'left' || placement.doorMarkerSide === 'right'
      ? stairDepth : stairWidth,

    depth: placement.doorMarkerSide === 'left' || placement.doorMarkerSide === 'right'
      ? stairWidth : stairDepth,

    steps: metrics.steps,
    lineOrientation,
    metrics,
  });
  topStair.set({left: stairLeft, top: stairTop});
  addObjectToGroup(group, topStair);

  group.dirty = true;
  refreshGroupBounds(group);
  hasChanges = true;
  return hasChanges;
}

function removeAutoStairsFromGroup(group: CanvasGroup): boolean {
  const internalObjects = group._objects as FabricObject[] | undefined;
  if (internalObjects && Array.isArray(internalObjects)) {
    const next =
      internalObjects.filter((object) =>
        toCanvasObject(object)?.isAutoStairs !== true
      );

    if (next.length === internalObjects.length) return false;
    group._objects = next;
    return true;
  }

  const current = getCanvasGroupObjects(group);
  const toRemove =
    current.filter((object) => object?.isAutoStairs === true);
  if (!toRemove.length) return false;

  group.remove(...toRemove);
  return true;
}

function applyStairMetrics(
  canvasGroup: CanvasGroup,
  metrics: StairMetrics,
): void {
  canvasGroup.myType = 'stairs';
  canvasGroup.isAutoStairs = true;
  canvasGroup.stairsStepCount = metrics.steps;
  canvasGroup.stairsHeight = metrics.stairHeight;
  canvasGroup.stairsNivelLeft = metrics.leftNivel;
  canvasGroup.stairsNivelRight = metrics.rightNivel;
}

function resolveDoorSideAxisContextFromElevationGroup(group: CanvasGroup): DoorSideAxisContext | null {
  const houseView = String(group.houseView ?? '');

  if (houseView === 'front' || houseView === 'back') {
    const isFlipped = Boolean(group.isFlippedHorizontally);
    return {side: isFlipped ? 'top' : 'bottom', reverseAxis: isFlipped};
  }

  if (houseView === 'side') {
    const isRight = Boolean(group.isRightSide);
    return {side: isRight ? 'right' : 'left', reverseAxis: isRight};
  }

  return null;
}

function resolveDoorSideMiddleIds(side: HouseSide): string[] {
  if (side === 'top') return ['piloti_1_0', 'piloti_2_0'];
  if (side === 'bottom') return ['piloti_1_2', 'piloti_2_2'];
  if (side === 'left') return ['piloti_0_1'];
  return ['piloti_3_1'];
}

function resolveAxisCornerIds(params: DoorSideAxisContext): { leftId: string; rightId: string } {
  const corners = resolveDoorSideCornerIds(params.side);
  if (!params.reverseAxis) return corners;
  return {leftId: corners.rightId, rightId: corners.leftId};
}

function resolveAxisMiddleIds(params: DoorSideAxisContext): string[] {
  const middleIds = resolveDoorSideMiddleIds(params.side);
  return params.reverseAxis ? [...middleIds].reverse() : middleIds;
}

function resolveTopStairMetrics(params: {
  pilotis: Record<string, HousePiloti>;
  doorSide: HouseSide;
  bodyWidth: number;
  bodyHeight: number;
  stairSpan: number;
  stairCenter: number;
}): StairMetrics {

  const corners = resolveDoorSideCornerIds(params.doorSide);
  const leftCornerNivel = Number(params.pilotis[corners.leftId]?.nivel ?? PILOTI_DEFAULT_NIVEL);
  const rightCornerNivel = Number(params.pilotis[corners.rightId]?.nivel ?? PILOTI_DEFAULT_NIVEL);
  const middleNivel = resolveAverageNivelFromIds({
    pilotis: params.pilotis,
    ids: resolveAxisMiddleIds({side: params.doorSide, reverseAxis: false}),
    fallback: (leftCornerNivel + rightCornerNivel) / 2,
  });

  const axisLeft =
    params.doorSide === 'left' || params.doorSide === 'right'
      ? -params.bodyHeight / 2
      : -params.bodyWidth / 2;
  const axisRight =
    params.doorSide === 'left' || params.doorSide === 'right'
      ? params.bodyHeight / 2
      : params.bodyWidth / 2;

  const leftEdgeNivel = evaluateBinomialQuadraticNivel({
    x: params.stairCenter - params.stairSpan / 2,
    leftX: axisLeft,
    rightX: axisRight,
    leftNivel: leftCornerNivel,
    middleNivel,
    rightNivel: rightCornerNivel,
  });
  const rightEdgeNivel = evaluateBinomialQuadraticNivel({
    x: params.stairCenter + params.stairSpan / 2,
    leftX: axisLeft,
    rightX: axisRight,
    leftNivel: leftCornerNivel,
    middleNivel,
    rightNivel: rightCornerNivel,
  });

  return buildStairMetricsFromGroundNiveis({
    leftGroundNivel: leftEdgeNivel,
    rightGroundNivel: rightEdgeNivel,
    leftCornerNivel,
    rightCornerNivel,
  });
}

function resolveElevationStairMetrics(params: {
  pilotis: Record<string, HousePiloti>;
  group: CanvasGroup;
  axisContext: DoorSideAxisContext;
  stairLeftX: number;
  stairRightX: number;
}): StairMetrics {
  const corners = resolveAxisCornerIds(params.axisContext);

  const leftCornerNivelFallback = Number(params.pilotis[corners.leftId]?.nivel ?? PILOTI_DEFAULT_NIVEL);
  const rightCornerNivelFallback = Number(params.pilotis[corners.rightId]?.nivel ?? PILOTI_DEFAULT_NIVEL);

  const fallback = buildStairMetricsFromGroundNiveis({
    leftGroundNivel: leftCornerNivelFallback,
    rightGroundNivel: rightCornerNivelFallback,
    leftCornerNivel: leftCornerNivelFallback,
    rightCornerNivel: rightCornerNivelFallback,
  });

  const axisLeftX = resolvePilotiCenterX(params.group, corners.leftId);
  const axisRightX = resolvePilotiCenterX(params.group, corners.rightId);
  if (axisLeftX === null || axisRightX === null || Math.abs(axisRightX - axisLeftX) < NUMERIC_EPSILON) {
    return fallback;
  }

  const leftCornerNivel = Number(params.pilotis[corners.leftId]?.nivel ?? fallback.leftNivel);
  const rightCornerNivel = Number(params.pilotis[corners.rightId]?.nivel ?? fallback.rightNivel);
  const middleIds = resolveAxisMiddleIds(params.axisContext);
  const middleNivel = resolveAverageNivelFromIds({
    pilotis: params.pilotis,
    ids: middleIds,
    fallback: (leftCornerNivel + rightCornerNivel) / 2,
  });

  const leftEdgeNivel = evaluateBinomialQuadraticNivel({
    x: params.stairLeftX,
    leftX: axisLeftX,
    rightX: axisRightX,
    leftNivel: leftCornerNivel,
    middleNivel,
    rightNivel: rightCornerNivel,
  });
  const rightEdgeNivel = evaluateBinomialQuadraticNivel({
    x: params.stairRightX,
    leftX: axisLeftX,
    rightX: axisRightX,
    leftNivel: leftCornerNivel,
    middleNivel,
    rightNivel: rightCornerNivel,
  });

  return buildStairMetricsFromGroundNiveis({
    leftGroundNivel: leftEdgeNivel,
    rightGroundNivel: rightEdgeNivel,
    leftCornerNivel: leftCornerNivel,
    rightCornerNivel: rightCornerNivel,
  });
}

function buildStairMetricsFromGroundNiveis(params: {
  leftGroundNivel: number;
  rightGroundNivel: number;
  leftCornerNivel?: number;
  rightCornerNivel?: number;
}): StairMetrics {
  const leftNivel = round2(params.leftGroundNivel);
  const rightNivel = round2(params.rightGroundNivel);
  const referenceGroundLevel = Math.min(leftNivel, rightNivel);

  // Usa os níveis dos cantos do lado (não os interpolados da borda da escada)
  // para decidir se o terreno tem declive suficiente para aplicar o extra.
  const cornerLeft = params.leftCornerNivel ?? leftNivel;
  const cornerRight = params.rightCornerNivel ?? rightNivel;
  const cornerDiff = Math.abs(cornerLeft - cornerRight);
  const heightExtraMts = cornerDiff > AUTO_STAIR_HEIGHT_EXTRA_MTS ? AUTO_STAIR_HEIGHT_EXTRA_MTS : 0;

  const stairHeight = round2(
    referenceGroundLevel
    + heightExtraMts
    + AUTO_STAIR_FLOOR_HEIGHT_MTS
    + AUTO_STAIR_BEAM_HEIGHT_MTS,
  );
  const steps = Math.max(1, Math.round(stairHeight / AUTO_STAIR_STEP_HEIGHT_MTS));

  return {leftNivel, rightNivel, stairHeight, steps};
}

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function resolvePilotiCenterX(group: CanvasGroup, pilotiId: string): number | null {
  const piloti = getCanvasGroupObjects(group).find((object) => {
    return object?.isPilotiRect === true && object?.pilotiId === pilotiId;
  }) ?? null;
  if (!piloti) return null;

  const width = Number(piloti.width ?? 0) * Number(piloti.scaleX ?? 1);
  if (width <= 0) return null;

  const left = Number(piloti.left ?? 0);
  return left + width / 2;
}

function resolveAverageNivelFromIds(params: {
  pilotis: Record<string, HousePiloti>;
  ids: string[] | null;
  fallback: number;
}): number {
  if (!params.ids?.length) return params.fallback;

  const values = params.ids
    .map((id) => params.pilotis[id]?.nivel)
    .filter((value) => Number.isFinite(value));
  if (!values.length) return params.fallback;

  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
}

function evaluateBinomialQuadraticNivel(params: {
  x: number;
  leftX: number;
  rightX: number;
  leftNivel: number;
  middleNivel: number;
  rightNivel: number;
}): number {

  const denominator = params.rightX - params.leftX;
  if (Math.abs(denominator) < NUMERIC_EPSILON) return params.leftNivel;

  const t = clamp01((params.x - params.leftX) / denominator);
  const oneMinusT = 1 - t;

  // Interpolação binomial quadrática (Bernstein) do nível ao longo do eixo da vista.
  return (
    oneMinusT * oneMinusT * params.leftNivel
    + 2 * oneMinusT * t * params.middleNivel
    + t * t * params.rightNivel
  );
}

function addObjectToGroup(group: CanvasGroup, object: CanvasObject): void {
  const internalObjects = group._objects as FabricObject[] | undefined;
  if (internalObjects && Array.isArray(internalObjects)) {
    internalObjects.push(object);
    object.group = group;
    return;
  }
  group.add(object);
}

function refreshGroupBounds(group: CanvasGroup): void {
  // Recalcula bounds antes do setCoords para evitar grupo menor que o desenho.
  group._clearCache?.();
  group._calcBounds?.();
  group.setCoords();
}

function createStripedTopStair(params: {
  width: number;
  depth: number;
  steps: number;
  lineOrientation: 'horizontal' | 'vertical';
  metrics: StairMetrics;
}): CanvasGroup {

  const objects: CanvasObject[] = [];
  const base = new Rect({
    width: params.width,
    height: params.depth,
    fill: CANVAS_ELEMENT_STYLE.fillColor.stairsBody,
    stroke: CANVAS_ELEMENT_STYLE.strokeColor.stairsElement,
    strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
    strokeUniform: true,
    originX: 'center',
    originY: 'center',
    selectable: false,
    evented: false,
    objectCaching: false,
  });
  objects.push(toCanvasObject(base));

  for (let i = 1; i < params.steps; i += 1) {
    if (params.lineOrientation === 'horizontal') {
      const y = -params.depth / 2 + (params.depth / params.steps) * i;
      objects.push(toCanvasObject(new Line(
        [-params.width / 2, y, params.width / 2, y],
        {
          stroke: CANVAS_ELEMENT_STYLE.strokeColor.stairsElement,
          strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
          strokeUniform: true,
          selectable: false,
          evented: false,
        },
      )));
    } else {
      const x = -params.width / 2 + (params.width / params.steps) * i;
      objects.push(toCanvasObject(new Line(
        [x, -params.depth / 2, x, params.depth / 2],
        {
          stroke: CANVAS_ELEMENT_STYLE.strokeColor.stairsElement,
          strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
          strokeUniform: true,
          selectable: false,
          evented: false,
        },
      )));
    }
  }

  const group = new FabricGroup(objects, {
    originX: 'center',
    originY: 'center',
    selectable: false,
    evented: false,
    objectCaching: false,
  });
  const canvasGroup = toCanvasGroup(group);
  applyStairMetrics(canvasGroup, params.metrics);
  return canvasGroup;
}

function resolveStairDepthPxFromHeight(stairHeightMts: number, scale: number): number {
  const stairHeightPx = stairHeightMts * 100 * scale;
  return Math.max(AUTO_STAIR_STEP_MIN_DEPTH_PX * scale, stairHeightPx);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
