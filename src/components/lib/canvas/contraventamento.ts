import {FabricObject, Group, Line, Rect} from 'fabric';
import {PILOTI_BASE_HEIGHT_PX, PILOTI_MASTER_FILL_COLOR, PILOTI_MASTER_STROKE_COLOR,} from './constants.ts';
import {HOUSE_DIMENSIONS} from '@/components/lib/house-dimensions.ts';
import {
  CONTRAVENTAMENTO_COLUMN_CENTERS,
  ContraventamentoEditorState,
  ContraventamentoSide,
  ContraventamentoSidesOccupation
} from '@/shared/types/contraventamento.ts';
import {
  CONTRAVENTAMENTO,
  HOUSE_DEFAULTS,
  PILOTI_MASTER_STYLE,
  PILOTI_STYLE,
  PILOTI_VISUAL_FEEDBACK_COLORS
} from '@/shared/config.ts';

export type ContraventamentoStep = 'select-first' | 'select-second';

export interface ContraventamentoOrigin {
  pilotiId?: string;
  col: number;
  row: number;
  group?: Group;
}

/** Constants matching createHouseTop scale. */
const CONTRAV_S = HOUSE_DEFAULTS.viewScale;
const CONTRAV_COLUMN_DISTANCE = HOUSE_DIMENSIONS.piloti.columnSpacing * CONTRAV_S;
const CONTRAV_ROW_DISTANCE = HOUSE_DIMENSIONS.piloti.rowSpacing * CONTRAV_S;
const CONTRAV_RADIUS = HOUSE_DIMENSIONS.piloti.radius * CONTRAV_S;
const CONTRAV_BEAM_WIDTH = HOUSE_DIMENSIONS.contraventamento.topWidth;
const CONTRAV_OFFSET_FROM_GROUND = CONTRAVENTAMENTO.offsetFromGround;
const CONTRAV_FILL = PILOTI_MASTER_FILL_COLOR;
const CONTRAV_STROKE = PILOTI_MASTER_STROKE_COLOR;
const CONTRAV_SELECTED_FILL = PILOTI_MASTER_FILL_COLOR;
const CONTRAV_SELECTED_STROKE = PILOTI_MASTER_STROKE_COLOR;
const CONTRAV_STROKE_WIDTH = CONTRAVENTAMENTO.strokeWidth;
const CONTRAV_ELEVATION_WIDTH = HOUSE_DIMENSIONS.contraventamento.squareWidth / 2;

/** Local-space X of each column (0-3) in the top-view group */
const CONTRAV_COL_X = [
  -1.5 * CONTRAV_COLUMN_DISTANCE, // col 0: -139.5
  -0.5 * CONTRAV_COLUMN_DISTANCE, // col 1:  -46.5
  0.5 * CONTRAV_COLUMN_DISTANCE, // col 2:   46.5
  1.5 * CONTRAV_COLUMN_DISTANCE, // col 3:  139.5
];

/** Local-space Y of each row (0-2) in the top-view group */
const CONTRAV_ROW_Y = [
  -CONTRAV_ROW_DISTANCE, // row 0 (A): -81
  0, // row 1 (B):   0
  CONTRAV_ROW_DISTANCE, // row 2 (C):  81
];

function getOrCreateContraventamentoId(obj: any): string {
  if (obj.contraventamentoId) return String(obj.contraventamentoId);
  const id = `contrav_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  obj.contraventamentoId = id;
  return id;
}

function getNearestContraventamentoCol(x: number): number {
  let idx = 0;
  let minDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < CONTRAV_COL_X.length; i += 1) {
    const centerX = CONTRAV_COL_X[i];
    const dist = Math.abs(x - centerX);
    if (dist < minDist) {
      minDist = dist;
      idx = i;
    }
  }
  return idx;
}

function getNearestContraventamentoRow(y: number): number {
  let idx = 0;
  let minDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < CONTRAV_ROW_Y.length; i += 1) {
    const dist = Math.abs(y - CONTRAV_ROW_Y[i]);
    if (dist < minDist) {
      minDist = dist;
      idx = i;
    }
  }
  return idx;
}

function getContraventamentoMeta(obj: any): {
  id: string;
  col: number;
  startRow: number;
  endRow: number;
  side: ContraventamentoSide;
  anchorPilotiId: string;
} {
  const id = getOrCreateContraventamentoId(obj);

  const left = Number(obj.left ?? 0);
  const top = Number(obj.top ?? 0);
  const width = Number(obj.width ?? CONTRAV_BEAM_WIDTH);
  const height = Number(obj.height ?? 0);
  const centerX = left + width / 2;
  const bottom = top + height;

  const inferredCol = getNearestContraventamentoCol(centerX);
  const inferredStartRow = getNearestContraventamentoRow(top);
  const inferredEndRow = getNearestContraventamentoRow(bottom);
  const col = Number.isFinite(obj.contraventamentoCol) ? Number(obj.contraventamentoCol) : inferredCol;

  const startRowRaw = Number.isFinite(obj.contraventamentoStartRow)
    ? Number(obj.contraventamentoStartRow)
    : inferredStartRow;

  const endRowRaw = Number.isFinite(obj.contraventamentoEndRow)
    ? Number(obj.contraventamentoEndRow)
    : inferredEndRow;

  const startRow = Math.min(startRowRaw, endRowRaw);
  const endRow = Math.max(startRowRaw, endRowRaw);

  const side: ContraventamentoSide =
    obj.contraventamentoSide === 'left' || obj.contraventamentoSide === 'right'
      ? obj.contraventamentoSide
      : centerX < CONTRAV_COL_X[col]
        ? 'left'
        : 'right';

  const anchorPilotiId = String(obj.contraventamentoAnchorPilotiId ?? `piloti_${col}_${startRow}`);

  obj.contraventamentoId = id;
  obj.contraventamentoCol = col;
  obj.contraventamentoStartRow = startRow;
  obj.contraventamentoEndRow = endRow;
  obj.contraventamentoSide = side;
  obj.contraventamentoAnchorPilotiId = anchorPilotiId;

  return {id, col, startRow, endRow, side, anchorPilotiId};
}

/**
 * Add a bracing beam (contraventamento) to a top-view house group.
 * The beam is a thin rectangle connecting the tangent points of two piloti circles
 * that belong to the same column.
 */
export function addContraventamentoBeam(
  group: Group,
  piloti1: { col: number; row: number },
  piloti2: { col: number; row: number },
  options?: { anchorPilotiId?: string; side?: ContraventamentoSide },
): string | null {

  const col = piloti1.col;
  const colX = CONTRAV_COL_X[col];
  if (!Number.isFinite(colX)) return null;

  const y1 = CONTRAV_ROW_Y[piloti1.row];
  const y2 = CONTRAV_ROW_Y[piloti2.row];
  if (!Number.isFinite(y1) || !Number.isFinite(y2)) return null;

  const topY = Math.min(y1, y2);
  const botY = Math.max(y1, y2);
  const beamHeight = botY - topY;
  if (beamHeight <= 0) return null; // pilotis too close / same row

  const side: ContraventamentoSide = options?.side === 'left' ? 'left' : 'right';
  const tangentX = side === 'right' ? colX + CONTRAV_RADIUS : colX - CONTRAV_RADIUS;
  const beamLeft = side === 'right' ? tangentX : tangentX - CONTRAV_BEAM_WIDTH;

  const beam = new Rect({
    width: CONTRAV_BEAM_WIDTH,
    height: beamHeight,

    // Beam edge opposite to the selected side touches the piloti tangent.
    left: beamLeft,
    top: topY,
    fill: CONTRAV_FILL,
    stroke: CONTRAV_STROKE,
    strokeWidth: CONTRAV_STROKE_WIDTH,
    originX: 'left',
    originY: 'top',
    selectable: false,
    evented: true,
    objectCaching: false,
  });

  const beamAny = beam as any;
  beamAny.isContraventamento = true;
  beamAny.contraventamentoId = `contrav_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  beamAny.contraventamentoCol = col;
  beamAny.contraventamentoStartRow = Math.min(piloti1.row, piloti2.row);
  beamAny.contraventamentoEndRow = Math.max(piloti1.row, piloti2.row);
  beamAny.contraventamentoSide = side;
  beamAny.contraventamentoAnchorPilotiId =
    options?.anchorPilotiId ?? `piloti_${col}_${Math.min(piloti1.row, piloti2.row)}`;

  // Insert into the group's internal object list
  const internalObjects = (group as any)._objects as FabricObject[];
  internalObjects.push(beam);
  (beam as any).group = group;

  (group as any).dirty = true;
  group.setCoords();
  group.canvas?.requestRenderAll();
  return beamAny.contraventamentoId as string;
}

export function removeContraventamentosFromGroup(
  group: Group,
  predicate?: (obj: FabricObject) => boolean,
): number {
  const internalObjects = (group as any)._objects as FabricObject[];
  if (!Array.isArray(internalObjects)) return 0;

  const nextObjects: FabricObject[] = [];
  let removed = 0;

  for (const obj of internalObjects) {
    const objAny = obj as any;
    const isContrav = objAny?.isContraventamento === true;
    const shouldRemove = isContrav && (!predicate || predicate(obj));
    if (shouldRemove) {
      removed += 1;
    } else {
      nextObjects.push(obj);
    }
  }

  if (removed > 0) {
    (group as any)._objects = nextObjects;
    (group as any).dirty = true;
    group.setCoords();
    group.canvas?.requestRenderAll();
  }

  return removed;
}

export function removeContraventamentoElevationsFromGroup(
  group: Group,
  contraventamentoId?: string,
): number {
  const internalObjects = (group as any)._objects as FabricObject[];
  if (!Array.isArray(internalObjects)) return 0;

  const nextObjects: FabricObject[] = [];
  let removed = 0;

  for (const obj of internalObjects) {
    const objAny = obj as any;
    const isElevation = objAny?.isContraventamentoElevation === true;
    const matches = !contraventamentoId || String(objAny.contraventamentoId) === contraventamentoId;
    if (isElevation && matches) {
      removed += 1;
    } else {
      nextObjects.push(obj);
    }
  }

  if (removed > 0) {
    (group as any)._objects = nextObjects;
    (group as any).dirty = true;
    group.setCoords();
  }

  return removed;
}

export function setContraventamentoSelection(
  group: Group,
  contraventamentoId: string | null,
): void {

  group.getObjects().forEach((obj: any) => {
    if (!obj.isContraventamento) return;
    const id = getOrCreateContraventamentoId(obj);
    const isSelected = !!contraventamentoId && id === contraventamentoId;
    obj.set({
      fill: isSelected ? CONTRAV_SELECTED_FILL : CONTRAV_FILL,
      stroke: isSelected ? CONTRAV_SELECTED_STROKE : CONTRAV_STROKE,
      strokeWidth: CONTRAV_STROKE_WIDTH,
    });
    obj.dirty = true;
  });

  (group as any).dirty = true;
  group.canvas?.requestRenderAll();
}

export function syncContraventamentoElevationsFromTop(
  topGroup: Group | null,
  targetGroups: Group[],
  getPilotiNivel: (pilotiId: string) => number,
): void {

  targetGroups.forEach((group) => {
    removeContraventamentoElevationsFromGroup(group);
  });

  if (!topGroup) {
    targetGroups[0]?.canvas?.requestRenderAll();
    return;
  }

  const contravs = topGroup
    .getObjects()
    .filter((obj: any) => obj.isContraventamento)
    .map((obj: any) => ({obj, ...getContraventamentoMeta(obj)}));

  if (contravs.length === 0) {
    targetGroups[0]?.canvas?.requestRenderAll();
    return;
  }

  for (const group of targetGroups) {
    const houseView = String((group as any).houseView ?? '');
    // Only project contraventamento on square views (side elevations).
    if (houseView !== 'side') continue;

    const pilotiRects = group.getObjects().filter((obj: any) => obj.isPilotiRect && obj.pilotiId) as any[];
    if (pilotiRects.length === 0) continue;

    const rectByPilotiId = new Map<string, any>();
    pilotiRects.forEach((rect) => rectByPilotiId.set(String(rect.pilotiId), rect));

    const internalObjects = (group as any)._objects as FabricObject[];

    const getPilotiRow = (pilotiId: string): number | null => {
      const match = pilotiId.match(/^piloti_\d+_(\d+)$/);
      return match ? parseInt(match[1], 10) : null;
    };

    const getRectTop =
      (rect: any): number => Number(rect?.top ?? 0);

    const getRectWidth =
      (rect: any): number => Number(rect?.width ?? 0) * Number(rect?.scaleX ?? 1);

    const getRectCenterX =
      (rect: any): number => Number(rect?.left ?? 0) + getRectWidth(rect) / 2;

    const getRectBaseHeight =
      (rect: any): number => Number(rect?.pilotiBaseHeight ?? PILOTI_BASE_HEIGHT_PX * CONTRAV_S);

    // Origem: 20cm acima do terreno local do piloti de origem.
    const getOriginY = (rect: any, originPilotiId: string): number => {
      const top = getRectTop(rect);
      const base = getRectBaseHeight(rect);
      const originNivel = Number(getPilotiNivel(originPilotiId) ?? 0);
      return top + (originNivel - CONTRAV_OFFSET_FROM_GROUND) * base;
    };

    // Destino: 20cm abaixo da viga de piso (na projeção, referência = topo do piloti).
    const getDestinationY = (rect: any): number => {
      const top = getRectTop(rect);
      const base = getRectBaseHeight(rect);
      return top + CONTRAV_OFFSET_FROM_GROUND * base;
    };

    const isRightSideView = (group as any).isRightSide === true;
    const visibleCol = isRightSideView ? 3 : 0;
    const externalSide: ContraventamentoSide = isRightSideView ? 'right' : 'left';
    const oppositeSide: ContraventamentoSide = isRightSideView ? 'left' : 'right';

    for (const contrav of contravs) {
      // For square views:
      // - external side is rendered normally
      // - opposite side is also rendered when present, but behind everything (lower z-index)
      if (contrav.col !== visibleCol) continue;
      const isExternal = contrav.side === externalSide;
      const isOpposite = contrav.side === oppositeSide;
      if (!isExternal && !isOpposite) continue;

      const originPilotiId = String(contrav.anchorPilotiId);
      const originRow = getPilotiRow(originPilotiId);
      const normalizedOriginRow =
        originRow !== null && Number.isFinite(originRow) ? originRow : contrav.startRow;

      const targetRow = normalizedOriginRow === contrav.startRow ? contrav.endRow : contrav.startRow;
      const targetPilotiId = `piloti_${contrav.col}_${targetRow}`;

      const originRect = rectByPilotiId.get(originPilotiId);
      const targetRect = rectByPilotiId.get(targetPilotiId);
      if (!originRect || !targetRect) continue;

      const x1 = getRectCenterX(originRect);
      const y1 = getOriginY(originRect, originPilotiId);
      const x2 = getRectCenterX(targetRect);
      const y2 = getDestinationY(targetRect);

      if (
        !Number.isFinite(x1) ||
        !Number.isFinite(y1) ||
        !Number.isFinite(x2) ||
        !Number.isFinite(y2) ||
        (Math.abs(x2 - x1) < 1 && Math.abs(y2 - y1) < 1)
      ) {
        continue;
      }

      // Border (behind) + fill (front) to keep visible outline on square views.
      const borderLine = new Line([x1, y1, x2, y2], {
        stroke: CONTRAV_STROKE,
        strokeWidth: CONTRAV_ELEVATION_WIDTH + 2,
        strokeUniform: false,
        selectable: false,
        evented: false,
        objectCaching: false,
      });

      const borderAny = borderLine as any;
      borderAny.isContraventamentoElevation = true;
      borderAny.contraventamentoId = contrav.id;
      borderAny.contraventamentoSourcePilotiId = originPilotiId;

      const line = new Line([x1, y1, x2, y2], {
        stroke: CONTRAV_FILL,
        strokeWidth: CONTRAV_ELEVATION_WIDTH,
        strokeUniform: false,
        selectable: false,
        evented: false,
        objectCaching: false,
      });

      const lineAny = line as any;
      lineAny.isContraventamentoElevation = true;
      lineAny.contraventamentoId = contrav.id;
      lineAny.contraventamentoSourcePilotiId = originPilotiId;

      if (isOpposite) {
        // Lowest z-index for opposite-side contraventamento in this square view.
        internalObjects.unshift(line);
        lineAny.group = group;
        internalObjects.unshift(borderLine);
        borderAny.group = group;
      } else {
        internalObjects.push(borderLine);
        borderAny.group = group;
        internalObjects.push(line);
        lineAny.group = group;
      }
    }

    (group as any).dirty = true;
    group.setCoords();
  }

  topGroup.canvas?.requestRenderAll();
}

/**
 * Highlight eligible pilotis in the top-view group based on the provided
 * eligibility callback.
 * Optionally restrict to a single column when firstCol is provided.
 * Optionally skip a specific pilotiId (already selected).
 */
export function highlightContraventamentoPilotis(
  group: Group,
  getIsEligible: (pilotiId: string) => boolean,
  firstCol?: number,
  skipPilotiId?: string,
): void {
  group.getObjects().forEach((obj: any) => {
    if (!obj.isPilotiCircle) return;

    const id: string = obj.pilotiId ?? '';
    const match = id.match(/piloti_(\d+)_(\d+)/);
    if (!match) return;
    const col = parseInt(match[1], 10);

    const eligible = getIsEligible(id);
    const inColumn = firstCol === undefined || col === firstCol;
    const isSkipped = id === skipPilotiId;

    if (eligible && inColumn && !isSkipped) {
      // Available - yellow border highlight (same visual language as top-view selection).
      obj.set({
        stroke: PILOTI_VISUAL_FEEDBACK_COLORS.emphasizedStrokeColor,
        strokeWidth: PILOTI_MASTER_STYLE.strokeWidthTopView,
        fill: PILOTI_MASTER_STYLE.fillColor,
        hoverCursor: 'pointer',
      });
    } else {
      // Dimmed - grey out, including master pilotis while not eligible.
      obj.set({
        stroke: PILOTI_STYLE.strokeColor,
        strokeWidth: PILOTI_STYLE.strokeWidthTopView,
        fill: PILOTI_STYLE.fillColor,
        hoverCursor: 'default',
      });
    }
    (obj as any).dirty = true;
  });

  (group as any).dirty = true;
  group.canvas?.requestRenderAll();
}

/**
 * Reset all piloti visuals in the top-view group back to normal.
 */
export function resetContraventamentoPilotis(group: Group): void {
  group.getObjects().forEach((obj: any) => {
    if (!obj.isPilotiCircle) return;
    if (obj.pilotiIsMaster) {
      obj.set({
        stroke: PILOTI_MASTER_STYLE.strokeColor,
        strokeWidth: PILOTI_MASTER_STYLE.strokeWidth,
        fill: PILOTI_MASTER_STYLE.fillColor,
        hoverCursor: 'default',
      });
    } else {
      obj.set({
        stroke: PILOTI_STYLE.strokeColor,
        strokeWidth: PILOTI_STYLE.strokeWidthTopView,
        fill: PILOTI_STYLE.fillColor,
        hoverCursor: 'default',
      });
    }
    (obj as any).dirty = true;
  });

  (group as any).dirty = true;
  group.canvas?.requestRenderAll();
}

export function parsePilotiGridPosition(pilotiId: string): { col: number; row: number } | null {
  const match = pilotiId.match(/piloti_(\d+)_(\d+)/);
  if (!match) return null;
  return {
    col: parseInt(match[1], 10),
    row: parseInt(match[2], 10),
  };
}

export function canCreateContraventamentoForNivel(nivel: number): boolean {
  return nivel > 0.4;
}

export function getContraventamentoColumnCenterX(col: number): number {
  return CONTRAVENTAMENTO_COLUMN_CENTERS[col] ?? 0;
}

export function inferContraventamentoSideFromBeamGeometry(params: {
  col: number;
  left: number;
  width: number;
  scaleX?: number;
}): ContraventamentoSide {
  const centerX = params.left + params.width * (params.scaleX ?? 1) / 2;
  return centerX < getContraventamentoColumnCenterX(params.col) ? 'left' : 'right';
}

export function isContraventamentoDestinationEligible(params: {
  first: { col: number; row: number } | null;
  candidate: { col: number; row: number };
  nivel: number;
}): boolean {
  if (!params.first) return false;
  if (!canCreateContraventamentoForNivel(params.nivel)) return false;
  return params.candidate.col === params.first.col && params.candidate.row !== params.first.row;
}

export function getContraventamentoSideLabel(side: ContraventamentoSide): string {
  return side === 'left' ? 'esquerdo' : 'direito';
}

export interface ContraventamentoObjectCandidate {
  isContraventamento?: unknown;
  contraventamentoCol?: unknown;
  contraventamentoSide?: unknown;
  left?: unknown;
  width?: unknown;
  scaleX?: unknown;
}

export function collectOccupiedContraventamentoSides(params: {
  objects: ContraventamentoObjectCandidate[];
  col: number;
  onResolvedSide?: (object: ContraventamentoObjectCandidate, side: ContraventamentoSide) => void;
}): ContraventamentoSidesOccupation {
  const occupied: ContraventamentoSidesOccupation = {left: false, right: false};

  params.objects.forEach((object) => {
    if (!object.isContraventamento) return;
    if (Number(object.contraventamentoCol) !== params.col) return;

    let side: ContraventamentoSide;
    if (object.contraventamentoSide === 'left' || object.contraventamentoSide === 'right') {
      side = object.contraventamentoSide;
    } else {
      side = inferContraventamentoSideFromBeamGeometry({
        col: params.col,
        left: Number(object.left ?? 0),
        width: Number(object.width ?? 0),
        scaleX: Number(object.scaleX ?? 1),
      });
      params.onResolvedSide?.(object, side);
    }

    occupied[side] = true;
  });

  return occupied;
}

export function createContraventamentoEditorState(params: {
  canReceiveContraventamento: boolean;
  occupiedSides: ContraventamentoSidesOccupation;
}): ContraventamentoEditorState {
  if (!params.canReceiveContraventamento) {
    return {
      leftDisabled: true,
      rightDisabled: true,
      leftActive: false,
      rightActive: false,
    };
  }

  return {
    leftDisabled: false,
    rightDisabled: false,
    leftActive: params.occupiedSides.left,
    rightActive: params.occupiedSides.right,
  };
}
