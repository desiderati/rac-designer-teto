import {FabricObject, Group, Line, Rect} from 'fabric';
import {HousePiloti, HouseSide, HouseType, HouseViewInstance, HouseViewType} from '@/shared/types/house.ts';
import {CANVAS_ELEMENT_STYLE, HOUSE_2D_STYLE} from '@/shared/config.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';
import {
  calculateRenderedDoorGeometryForTopMarker,
  calculateTopDoorMarkerBodySize,
  calculateTopDoorPlacement,
  resolveTopDoorMarkerSide
} from '@/components/lib/house-top-view-door-marker.ts';
import {toCanvasObject} from '@/components/lib/canvas/canvas.ts';

// Tamanho em metros que a escada deve ultrapassar a linha do terreno.
const AUTO_STAIR_EXTRA_CONTACT_METERS = 0.1;

// Altura de cada degrau em metros.
const AUTO_STAIR_BASE_STEP_HEIGHT_METERS = 0.1;
const AUTO_STAIR_STEP_HEIGHT_METERS = 0.3;

const AUTO_STAIR_TREAD_DEPTH_BASE_PX = 100;
const AUTO_STAIR_MIN_DEPTH_PX = 80;

const AUTO_STAIR_WIDTH_PX = 20;
const AUTO_STAIR_FLOOR_HEIGHT_METERS = HOUSE_DIMENSIONS.structure.floorHeight / 100;
const AUTO_STAIR_BEAM_HEIGHT_METERS = HOUSE_DIMENSIONS.structure.floorBeamHeight / 100;
const AUTO_STAIR_DOOR_MARKER_CLEARANCE_STROKE_PX = HOUSE_2D_STYLE.outlineStrokeWidth;

interface StairMetrics {
  leftNivel: number;
  rightNivel: number;
  stairHeight: number;
  steps: number;
}

export function refreshAutoStairsInViews(params: {
  houseType: HouseType;
  sideMappings: Record<HouseSide, HouseViewType | null>;
  pilotis: Record<string, HousePiloti>;
  topView: HouseViewInstance<Group>[];
  elevationViews: HouseViewInstance<Group>[];
}): boolean {

  const topViewChanged = refreshTopViewAutoStairs({
    houseType: params.houseType,
    sideMappings: params.sideMappings,
    pilotis: params.pilotis,
    topView: params.topView,
  });

  const elevationViewsChanged = refreshElevationViewsAutoStairs({
    pilotis: params.pilotis,
    elevationViews: params.elevationViews,
  });

  return topViewChanged || elevationViewsChanged;
}

function refreshTopViewAutoStairs(params: {
  houseType: HouseType;
  sideMappings: Record<HouseSide, HouseViewType | null>;
  pilotis: Record<string, HousePiloti>;
  topView: HouseViewInstance<Group>[];
}): boolean {

  const doorSide = resolveTopDoorMarkerSide({
    houseType: params.houseType,
    sideMappings: params.sideMappings,
  });

  let hasChanges = false;
  for (const topInstance of params.topView) {
    const group = topInstance.group;
    const removed = removeAutoStairsFromGroup(group);
    if (removed) hasChanges = true;

    if (!doorSide) continue;
    const corners = resolveDoorSideCornerIds(doorSide);
    const metrics = resolveStairMetrics({
      pilotis: params.pilotis,
      leftId: corners.leftId,
      rightId: corners.rightId,
    });

    const body = group
      .getObjects()
      .find((object) =>
        toCanvasObject(object)?.isHouseBody
      ) as FabricObject | undefined;

    const runtimeBody = body ? toCanvasObject(body) : null;
    if (!runtimeBody) continue;

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

    if (!placement.doorMarkerSide) continue;

    const sideScale =
      placement.doorMarkerSide === 'left' || placement.doorMarkerSide === 'right'
        ? bodyHeight / HOUSE_DIMENSIONS.footprint.depth
        : bodyWidth / HOUSE_DIMENSIONS.footprint.width;

    const stepDepthPx = resolveStepDepthPx(sideScale);
    const stairDepth = Math.max(stepDepthPx * metrics.steps, AUTO_STAIR_MIN_DEPTH_PX * sideScale);
    const stairWidth = Math.max(renderedDoorGeometry.doorWidth, AUTO_STAIR_WIDTH_PX * sideScale);
    const markerShort = HOUSE_DIMENSIONS.openings.topDoorMarker.shortSize * sideScale;
    const markerOffset = markerShort / 2 + AUTO_STAIR_DOOR_MARKER_CLEARANCE_STROKE_PX;

    let stairLeft = placement.targetLeft ?? 0;
    let stairTop = placement.targetTop ?? 0;
    let lineOrientation: 'horizontal' | 'vertical' = 'horizontal';

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
    hasChanges = true;

    (group as any).dirty = true;
    refreshGroupBounds(group);
  }

  return hasChanges;
}

function refreshElevationViewsAutoStairs(params: {
  pilotis: Record<string, HousePiloti>;
  elevationViews: HouseViewInstance<Group>[];
}): boolean {
  let hasChanges = false;

  for (const viewInstance of params.elevationViews) {
    const group = viewInstance.group;
    const removed = removeAutoStairsFromGroup(group);
    if (removed) hasChanges = true;

    const door = group
      .getObjects()
      .find((object) => toCanvasObject(object)?.isHouseDoor) as FabricObject | undefined;
    if (!door) continue;

    const corners = resolveElevationCornerIds(group);
    if (!corners) continue;

    const runtimeDoor = toCanvasObject(door);
    const doorLeft = Number(runtimeDoor?.left ?? 0);
    const doorTop = Number(runtimeDoor?.top ?? 0);
    const doorWidth = Number(runtimeDoor?.width ?? 0) * Number(runtimeDoor?.scaleX ?? 1);
    const doorHeight = Number(runtimeDoor?.height ?? 0) * Number(runtimeDoor?.scaleY ?? 1);
    if (doorWidth <= 0 || doorHeight <= 0) continue;

    const scale = doorWidth / HOUSE_DIMENSIONS.openings.common.doorWidth;
    const stairWidth = Math.max(doorWidth, AUTO_STAIR_WIDTH_PX * scale);
    const metrics = resolveElevationStairMetrics({
      pilotis: params.pilotis,
      group,
      corners,
      stairLeftX: doorLeft,
      stairRightX: doorLeft + stairWidth,
    });
    const stepDepthPx = resolveStepDepthPx(scale);
    const stairDepth = Math.max(stepDepthPx * metrics.steps, AUTO_STAIR_MIN_DEPTH_PX * scale);
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

    (group as any).dirty = true;
    refreshGroupBounds(group);
  }

  return hasChanges;
}

function removeAutoStairsFromGroup(group: Group): boolean {
  const internalObjects = (group as any)._objects as FabricObject[] | undefined;
  if (internalObjects && Array.isArray(internalObjects)) {
    const next = internalObjects.filter((object: any) => object?.isAutoStairs !== true);
    if (next.length === internalObjects.length) return false;
    (group as any)._objects = next;
    return true;
  }

  const current = group.getObjects();
  const toRemove = current.filter((object: any) => object?.isAutoStairs === true);
  if (!toRemove.length) return false;
  group.remove(...toRemove);
  return true;
}

function applyStairMetrics(
  object: FabricObject,
  metrics: StairMetrics,
): void {
  const runtime = toCanvasObject(object)!;
  runtime.myType = 'stairs';
  runtime.isAutoStairs = true;
  runtime.stairsStepCount = metrics.steps;
  runtime.stairsHeight = metrics.stairHeight;
  runtime.stairsNivelLeft = metrics.leftNivel;
  runtime.stairsNivelRight = metrics.rightNivel;
}

function resolveDoorSideCornerIds(side: HouseSide): { leftId: string; rightId: string } {
  if (side === 'top') return {leftId: 'piloti_0_0', rightId: 'piloti_3_0'};
  if (side === 'bottom') return {leftId: 'piloti_0_2', rightId: 'piloti_3_2'};
  if (side === 'left') return {leftId: 'piloti_0_0', rightId: 'piloti_0_2'};
  return {leftId: 'piloti_3_0', rightId: 'piloti_3_2'};
}

function resolveElevationCornerIds(group: Group): { leftId: string; rightId: string } | null {
  const houseView = String((group as any).houseView ?? '');

  if (houseView === 'front' || houseView === 'back') {
    const isFlipped = Boolean((group as any).isFlippedHorizontally);
    if (isFlipped) {
      return {leftId: 'piloti_3_0', rightId: 'piloti_0_0'};
    }
    return {leftId: 'piloti_0_2', rightId: 'piloti_3_2'};
  }

  if (houseView === 'side') {
    const isRight = Boolean((group as any).isRightSide);
    if (isRight) {
      return {leftId: 'piloti_3_2', rightId: 'piloti_3_0'};
    }
    return {leftId: 'piloti_0_0', rightId: 'piloti_0_2'};
  }

  return null;
}

function resolveStairMetrics(params: {
  pilotis: Record<string, HousePiloti>;
  leftId: string;
  rightId: string;
}): StairMetrics {
  const leftNivel = Number(params.pilotis[params.leftId]?.nivel ?? 0.2);
  const rightNivel = Number(params.pilotis[params.rightId]?.nivel ?? 0.2);
  const referenceGroundLevel = Math.min(leftNivel, rightNivel);

  // Altura mínima para a escada encostar no terreno:
  // nível baixo + 10 cm de contato + piso + viga.
  const stairHeight = round2(
    referenceGroundLevel
    + AUTO_STAIR_EXTRA_CONTACT_METERS
    + AUTO_STAIR_FLOOR_HEIGHT_METERS
    + AUTO_STAIR_BEAM_HEIGHT_METERS,
  );

  const steps = Math.max(1, Math.ceil(stairHeight / AUTO_STAIR_STEP_HEIGHT_METERS));
  return {
    leftNivel: round2(leftNivel),
    rightNivel: round2(rightNivel),
    stairHeight,
    steps,
  };
}

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function resolveElevationMiddleIds(group: Group): string[] | null {
  const houseView = String((group as any).houseView ?? '');

  if (houseView === 'front' || houseView === 'back') {
    const isFlipped = Boolean((group as any).isFlippedHorizontally);
    if (isFlipped) {
      return ['piloti_2_0', 'piloti_1_0'];
    }
    return ['piloti_1_2', 'piloti_2_2'];
  }

  if (houseView === 'side') {
    const isRight = Boolean((group as any).isRightSide);
    if (isRight) {
      return ['piloti_3_1'];
    }
    return ['piloti_0_1'];
  }

  return null;
}

function resolvePilotiCenterX(group: Group, pilotiId: string): number | null {
  const piloti = group
    .getObjects()
    .find((object) => {
      const runtime = toCanvasObject(object);
      return runtime?.isPilotiRect === true && runtime?.pilotiId === pilotiId;
    }) as FabricObject | undefined;
  if (!piloti) return null;

  const runtime = toCanvasObject(piloti);
  const left = Number(runtime?.left ?? 0);
  const width = Number(runtime?.width ?? 0) * Number(runtime?.scaleX ?? 1);
  if (width <= 0) return null;
  return left + width / 2;
}

function resolveAverageNivelFromIds(params: {
  pilotis: Record<string, HousePiloti>;
  ids: string[] | null;
  fallback: number;
}): number {
  if (!params.ids?.length) return params.fallback;
  const values = params.ids
    .map((id) => Number(params.pilotis[id]?.nivel))
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
  if (Math.abs(denominator) < 0.0001) return params.leftNivel;

  const t = clamp01((params.x - params.leftX) / denominator);
  const oneMinusT = 1 - t;
  // Interpolação binomial quadrática (Bernstein) do nível ao longo do eixo da vista.
  return (
    oneMinusT * oneMinusT * params.leftNivel
    + 2 * oneMinusT * t * params.middleNivel
    + t * t * params.rightNivel
  );
}

function resolveElevationStairMetrics(params: {
  pilotis: Record<string, HousePiloti>;
  group: Group;
  corners: { leftId: string; rightId: string };
  stairLeftX: number;
  stairRightX: number;
}): StairMetrics {
  const fallback = resolveStairMetrics({
    pilotis: params.pilotis,
    leftId: params.corners.leftId,
    rightId: params.corners.rightId,
  });

  const axisLeftX = resolvePilotiCenterX(params.group, params.corners.leftId);
  const axisRightX = resolvePilotiCenterX(params.group, params.corners.rightId);
  if (axisLeftX === null || axisRightX === null || Math.abs(axisRightX - axisLeftX) < 0.0001) {
    return fallback;
  }

  const leftCornerNivel = Number(params.pilotis[params.corners.leftId]?.nivel ?? fallback.leftNivel);
  const rightCornerNivel = Number(params.pilotis[params.corners.rightId]?.nivel ?? fallback.rightNivel);
  const middleIds = resolveElevationMiddleIds(params.group);
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

  const referenceGroundLevel = Math.min(leftEdgeNivel, rightEdgeNivel);
  const stairHeight = round2(
    referenceGroundLevel
    + AUTO_STAIR_EXTRA_CONTACT_METERS
    + AUTO_STAIR_FLOOR_HEIGHT_METERS
    + AUTO_STAIR_BEAM_HEIGHT_METERS,
  );
  const steps = Math.max(1, Math.ceil(stairHeight / AUTO_STAIR_STEP_HEIGHT_METERS));

  return {
    leftNivel: round2(leftEdgeNivel),
    rightNivel: round2(rightEdgeNivel),
    stairHeight,
    steps,
  };
}

function addObjectToGroup(group: Group, object: FabricObject): void {
  const internalObjects = (group as any)._objects as FabricObject[] | undefined;
  if (internalObjects && Array.isArray(internalObjects)) {
    internalObjects.push(object);
    (object as any).group = group;
    return;
  }
  group.add(object);
}

function refreshGroupBounds(group: Group): void {
  // Recalcula bounds antes do setCoords para evitar grupo menor que o desenho.
  (group as any)._clearCache?.();
  (group as any)._calcBounds?.();
  group.setCoords();
}

function createStripedTopStair(params: {
  width: number;
  depth: number;
  steps: number;
  lineOrientation: 'horizontal' | 'vertical';
  metrics: StairMetrics;
}): Group {

  const objects: FabricObject[] = [];
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
  objects.push(base);

  for (let i = 1; i < params.steps; i += 1) {
    if (params.lineOrientation === 'horizontal') {
      const y = -params.depth / 2 + (params.depth / params.steps) * i;
      objects.push(new Line(
        [-params.width / 2, y, params.width / 2, y],
        {
          stroke: CANVAS_ELEMENT_STYLE.strokeColor.stairsElement,
          strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
          strokeUniform: true,
          selectable: false,
          evented: false,
        },
      ));
    } else {
      const x = -params.width / 2 + (params.width / params.steps) * i;
      objects.push(new Line(
        [x, -params.depth / 2, x, params.depth / 2],
        {
          stroke: CANVAS_ELEMENT_STYLE.strokeColor.stairsElement,
          strokeWidth: HOUSE_2D_STYLE.outlineStrokeWidth,
          strokeUniform: true,
          selectable: false,
          evented: false,
        },
      ));
    }
  }

  const group = new Group(objects, {
    originX: 'center',
    originY: 'center',
    selectable: false,
    evented: false,
    objectCaching: false,
  });
  applyStairMetrics(group, params.metrics);
  return group;
}

function resolveStepDepthPx(scale: number): number {
  const stepScaleFactor = AUTO_STAIR_STEP_HEIGHT_METERS / AUTO_STAIR_BASE_STEP_HEIGHT_METERS;
  return Math.max(AUTO_STAIR_MIN_DEPTH_PX * scale, AUTO_STAIR_TREAD_DEPTH_BASE_PX * scale * stepScaleFactor);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
