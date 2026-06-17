import {FabricObject, Line, Rect} from 'fabric';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';
import {
  type ContraventamentoHorizontalSide,
  type ContraventamentoOrientation,
  type ContraventamentoSide,
  type ContraventamentoVerticalSide,
  isContraventamentoHorizontalSide,
  isContraventamentoVerticalSide,
  resolveContraventamentoOffsetFromNivel
} from '@/shared/types/contraventamento.ts';
import {
  CONTRAVENTAMENTO_COLUMN_X,
  CONTRAVENTAMENTO_ROW_Y,
  getContraventamentoOrientation,
} from '@/components/rac-editor/@canvas/lib/contraventamento-geometry.ts';
import {HOUSE_DEFAULTS,} from '@/shared/config.ts';
import {
  CanvasGroup,
  CanvasObject,
  getCanvasGroupObjects,
  toCanvasObject
} from '@/components/rac-editor/@canvas/lib/canvas.ts';
import {
  CONTRAVENTAMENTO_FILL,
  CONTRAVENTAMENTO_STROKE,
  CONTRAVENTAMENTO_STROKE_WIDTH,
  PILOTI_BASE_HEIGHT_PX
} from '@/shared/constants';
import {resolveHouseElevationAxisContext} from '@/domain/house/use-cases/house-view-orientation.use-case.ts';

const CONTRAVENTAMENTO_S = HOUSE_DEFAULTS.viewScale;
const CONTRAVENTAMENTO_RADIUS = HOUSE_DIMENSIONS.piloti.radius * CONTRAVENTAMENTO_S;
const CONTRAVENTAMENTO_BEAM_WIDTH = HOUSE_DIMENSIONS.contraventamento.topWidth;
const CONTRAVENTAMENTO_ELEVATION_WIDTH = HOUSE_DIMENSIONS.contraventamento.squareWidth / 2;

/**
 * Normaliza e devolve os metadados de um objeto de contraventamento no canvas.
 *
 * @param obj Objeto de canvas com propriedades de contraventamento.
 * @returns Metadados consolidados (id, coluna, linhas, lado e piloti de ancoragem).
 */
export function getContraventamentoCanvasObject(obj: CanvasObject): {
  id: string;
  orientation: ContraventamentoOrientation;
  col: number;
  row: number;
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  side: ContraventamentoSide;
  anchorPilotiId: string;
} {
  const id = getOrCreateContraventamentoId(obj);
  const orientation = getContraventamentoOrientation(obj);

  const left = Number(obj.left ?? 0);
  const top = Number(obj.top ?? 0);
  const width = Number(obj.width ?? HOUSE_DIMENSIONS.contraventamento.topWidth);
  const height = Number(obj.height ?? 0);
  const scaledWidth = width * Number(obj.scaleX ?? 1);
  const scaledHeight = height * Number(obj.scaleY ?? 1);
  const centerX = left + scaledWidth / 2;
  const centerY = top + scaledHeight / 2;
  const right = left + scaledWidth;
  const bottom = top + scaledHeight;

  const inferredCol = getNearestContraventamentoCol(centerX);
  const inferredRow = getNearestContraventamentoRow(centerY);
  const inferredStartRow = getNearestContraventamentoRow(top);
  const inferredEndRow = getNearestContraventamentoRow(bottom);
  const col = Number.isFinite(obj.contraventamentoCol) ? Number(obj.contraventamentoCol) : inferredCol;
  const row = Number.isFinite(obj.contraventamentoRow) ? Number(obj.contraventamentoRow) : inferredRow;

  const startRowRaw = Number.isFinite(obj.contraventamentoStartRow)
    ? Number(obj.contraventamentoStartRow)
    : inferredStartRow;

  const endRowRaw = Number.isFinite(obj.contraventamentoEndRow)
    ? Number(obj.contraventamentoEndRow)
    : inferredEndRow;

  const startRow = Math.min(startRowRaw, endRowRaw);
  const endRow = Math.max(startRowRaw, endRowRaw);

  const startColRaw = Number.isFinite(obj.contraventamentoStartCol)
    ? Number(obj.contraventamentoStartCol)
    : getNearestContraventamentoCol(left);

  const endColRaw = Number.isFinite(obj.contraventamentoEndCol)
    ? Number(obj.contraventamentoEndCol)
    : getNearestContraventamentoCol(right);

  const startCol = Math.min(startColRaw, endColRaw);
  const endCol = Math.max(startColRaw, endColRaw);

  const verticalSide: ContraventamentoVerticalSide =
    isContraventamentoVerticalSide(obj.contraventamentoSide)
      ? obj.contraventamentoSide
      : centerX < CONTRAVENTAMENTO_COLUMN_X[col]
        ? 'left'
        : 'right';

  const horizontalSide: ContraventamentoHorizontalSide =
    isContraventamentoHorizontalSide(obj.contraventamentoSide)
      ? obj.contraventamentoSide
      : centerY < CONTRAVENTAMENTO_ROW_Y[row]
        ? 'top'
        : 'bottom';

  const side: ContraventamentoSide = orientation === 'horizontal' ? horizontalSide : verticalSide;
  const anchorPilotiId = String(
    obj.contraventamentoAnchorPilotiId
    ?? (
      orientation === 'horizontal'
        ? `piloti_${startCol}_${row}`
        : `piloti_${col}_${startRow}`
    )
  );

  obj.contraventamentoId = id;
  obj.contraventamentoOrientation = orientation;
  obj.contraventamentoCol = col;
  obj.contraventamentoRow = row;
  obj.contraventamentoStartRow = startRow;
  obj.contraventamentoEndRow = endRow;
  obj.contraventamentoStartCol = startCol;
  obj.contraventamentoEndCol = endCol;
  obj.contraventamentoSide = side;
  obj.contraventamentoAnchorPilotiId = anchorPilotiId;
  return {id, orientation, col, row, startRow, endRow, startCol, endCol, side, anchorPilotiId};
}

/**
 * Obtém o ID de contraventamento do objeto ou cria um novo ID quando ausente.
 *
 * @param obj Objeto de canvas alvo.
 * @returns ID de contraventamento válido.
 */
export function getOrCreateContraventamentoId(obj: CanvasObject): string {
  if (obj.contraventamentoId) return String(obj.contraventamentoId);

  const id = `contrav_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  obj.contraventamentoId = id;
  return id;
}

/**
 * Retorna o índice da coluna de contraventamento mais próxima para um valor de X.
 *
 * @param x Coordenada X no espaço local do grupo.
 * @returns Índice da coluna (0 a 3).
 */
export function getNearestContraventamentoCol(x: number): number {
  let idx = 0;
  let minDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < CONTRAVENTAMENTO_COLUMN_X.length; i += 1) {
    const dist = Math.abs(x - CONTRAVENTAMENTO_COLUMN_X[i]);
    if (dist < minDist) {
      minDist = dist;
      idx = i;
    }
  }
  return idx;
}

/**
 * Retorna o índice da linha de contraventamento mais próxima para um valor de Y.
 *
 * @param y Coordenada Y no espaço local do grupo.
 * @returns Índice da linha (0 a 2).
 */
export function getNearestContraventamentoRow(y: number): number {
  let idx = 0;
  let minDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < CONTRAVENTAMENTO_ROW_Y.length; i += 1) {
    const dist = Math.abs(y - CONTRAVENTAMENTO_ROW_Y[i]);
    if (dist < minDist) {
      minDist = dist;
      idx = i;
    }
  }
  return idx;
}

/**
 * Adiciona uma viga de contraventamento a um grupo especificado com base nos pilotis e opções fornecidos.
 *
 * @param group - O grupo ao qual a viga de contraventamento será adicionada.
 * @param piloti1 - O primeiro piloti que define a posição da viga.
 * @param piloti2 - O segundo piloti que define a posição da viga.
 * @param options - Configurações opcionais para a viga de contraventamento:
 *        - `anchorPilotiId` (string): ID personalizado para o piloti de ancoragem.
 *        - `side` (ContraventamentoSide): Especifica o lado da viga (`left` ou `right`). Padrão é `right`.
 *        - `isAuto` (boolean): Indica se a viga é gerada automaticamente. Padrão é `false`.
 *
 * @return O ID do contraventamento da viga criada se bem-sucedido, ou `null` se a viga não pôde ser criada.
 */
export function addContraventamentoBeam(
  group: CanvasGroup,
  piloti1: { col: number; row: number },
  piloti2: { col: number; row: number },
  options?: { anchorPilotiId?: string; side?: ContraventamentoVerticalSide; isAuto?: boolean },
): string | null {

  const col = piloti1.col;
  const colX = CONTRAVENTAMENTO_COLUMN_X[col];
  if (!Number.isFinite(colX)) return null;

  const y1 = CONTRAVENTAMENTO_ROW_Y[piloti1.row];
  const y2 = CONTRAVENTAMENTO_ROW_Y[piloti2.row];
  if (!Number.isFinite(y1) || !Number.isFinite(y2)) return null;

  const topY = Math.min(y1, y2);
  const botY = Math.max(y1, y2);
  const beamHeight = botY - topY;
  if (beamHeight <= 0) return null; // Isso é possível?

  const side: ContraventamentoVerticalSide = options?.side === 'left' ? 'left' : 'right';
  const tangentX = side === 'right' ? colX + CONTRAVENTAMENTO_RADIUS : colX - CONTRAVENTAMENTO_RADIUS;
  const beamLeft = side === 'right' ? tangentX : tangentX - CONTRAVENTAMENTO_BEAM_WIDTH;

  const beam = new Rect({
    width: CONTRAVENTAMENTO_BEAM_WIDTH,
    height: beamHeight,
    left: beamLeft,
    top: topY,
    fill: CONTRAVENTAMENTO_FILL,
    stroke: CONTRAVENTAMENTO_STROKE,
    strokeWidth: CONTRAVENTAMENTO_STROKE_WIDTH,
    originX: 'left',
    originY: 'top',
    selectable: false,
    evented: true,
    objectCaching: false,
  });

  const beamCanvasObject = toCanvasObject(beam);
  beamCanvasObject.isContraventamento = true;
  beamCanvasObject.contraventamentoId = getOrCreateContraventamentoId(beamCanvasObject);
  beamCanvasObject.contraventamentoOrientation = 'vertical';
  beamCanvasObject.contraventamentoCol = col;
  beamCanvasObject.contraventamentoStartRow = Math.min(piloti1.row, piloti2.row);
  beamCanvasObject.contraventamentoEndRow = Math.max(piloti1.row, piloti2.row);
  beamCanvasObject.contraventamentoSide = side;
  beamCanvasObject.contraventamentoAnchorPilotiId =
    options?.anchorPilotiId ?? `piloti_${col}_${Math.min(piloti1.row, piloti2.row)}`;
  beamCanvasObject.isAutoContraventamento = options?.isAuto === true;

  const internalObjects = group._objects as FabricObject[];
  internalObjects.push(beam);
  beam.group = group;
  group.dirty = true;

  group.setCoords();
  group.canvas?.requestRenderAll();
  return beamCanvasObject.contraventamentoId as string;
}

/**
 * Adiciona um contraventamento horizontal manual entre dois pilotis da mesma linha.
 */
export function addHorizontalContraventamentoBeam(
  group: CanvasGroup,
  piloti1: { col: number; row: number },
  piloti2: { col: number; row: number },
  options?: { anchorPilotiId?: string; side?: ContraventamentoHorizontalSide; isAuto?: boolean },
): string | null {
  if (piloti1.row !== piloti2.row) return null;

  const row = piloti1.row;
  const rowY = CONTRAVENTAMENTO_ROW_Y[row];
  const startX = CONTRAVENTAMENTO_COLUMN_X[piloti1.col];
  const endX = CONTRAVENTAMENTO_COLUMN_X[piloti2.col];
  if (!Number.isFinite(rowY) || !Number.isFinite(startX) || !Number.isFinite(endX)) return null;

  const left = Math.min(startX, endX);
  const width = Math.abs(endX - startX);
  if (width <= 0) return null;

  const side: ContraventamentoHorizontalSide = options?.side === 'top' ? 'top' : 'bottom';
  const tangentY = side === 'top' ? rowY - CONTRAVENTAMENTO_RADIUS : rowY + CONTRAVENTAMENTO_RADIUS;
  const beamTop = side === 'top' ? tangentY - CONTRAVENTAMENTO_BEAM_WIDTH : tangentY;

  const beam = new Rect({
    width,
    height: CONTRAVENTAMENTO_BEAM_WIDTH,
    left,
    top: beamTop,
    fill: CONTRAVENTAMENTO_FILL,
    stroke: CONTRAVENTAMENTO_STROKE,
    strokeWidth: CONTRAVENTAMENTO_STROKE_WIDTH,
    originX: 'left',
    originY: 'top',
    selectable: false,
    evented: true,
    objectCaching: false,
  });

  const beamCanvasObject = toCanvasObject(beam);
  beamCanvasObject.isContraventamento = true;
  beamCanvasObject.contraventamentoId = getOrCreateContraventamentoId(beamCanvasObject);
  beamCanvasObject.contraventamentoOrientation = 'horizontal';
  beamCanvasObject.contraventamentoRow = row;
  beamCanvasObject.contraventamentoStartCol = Math.min(piloti1.col, piloti2.col);
  beamCanvasObject.contraventamentoEndCol = Math.max(piloti1.col, piloti2.col);
  beamCanvasObject.contraventamentoSide = side;
  beamCanvasObject.contraventamentoAnchorPilotiId =
    options?.anchorPilotiId ?? `piloti_${piloti1.col}_${row}`;
  beamCanvasObject.isAutoContraventamento = options?.isAuto === true;

  const internalObjects = group._objects as FabricObject[];
  internalObjects.push(beam);
  beam.group = group;
  group.dirty = true;

  group.setCoords();
  group.canvas?.requestRenderAll();
  return beamCanvasObject.contraventamentoId as string;
}

/**
 * Remove contraventamentos da vista superior com suporte a filtro opcional.
 *
 * @param group Grupo da vista superior.
 * @param predicate Filtro opcional para remover apenas objetos específicos.
 * @returns Quantidade de objetos removidos.
 */
export function removeContraventamentosFromTopView(
  group: CanvasGroup,
  predicate?: (obj: CanvasObject) => boolean,
): number {

  const internalObjects = group._objects as FabricObject[];
  if (!Array.isArray(internalObjects)) return 0;

  const nextObjects: FabricObject[] = [];
  let removed = 0;

  for (const obj of internalObjects) {
    const canvasObject = toCanvasObject(obj);
    const isContrav = canvasObject?.isContraventamento === true;
    const shouldRemove = isContrav && (!predicate || predicate(obj));
    if (shouldRemove) {
      removed += 1;
    } else {
      nextObjects.push(obj);
    }
  }

  if (removed > 0) {
    group._objects = nextObjects;
    group.dirty = true;
    group.setCoords();
    group.canvas?.requestRenderAll();
  }

  return removed;
}

/**
 * Remove projeções de contraventamento das vistas de elevação.
 *
 * @param group Grupo da elevação alvo.
 * @param contraventamentoId Quando informado, remove apenas projeções desse ID.
 * @returns Quantidade de objetos removidos.
 */
export function removeContraventamentoFromElevationViews(
  group: CanvasGroup,
  contraventamentoId?: string,
): number {

  const internalObjects = group._objects as FabricObject[];
  if (!Array.isArray(internalObjects)) return 0;

  const nextObjects: FabricObject[] = [];
  let removed = 0;

  for (const obj of internalObjects) {
    const canvasObject = toCanvasObject(obj);
    const isElevation = canvasObject?.isContraventamentoElevation === true;
    const matches = !contraventamentoId || String(canvasObject.contraventamentoId) === contraventamentoId;
    if (isElevation && matches) {
      removed += 1;
    } else {
      nextObjects.push(obj);
    }
  }

  if (removed > 0) {
    group._objects = nextObjects;
    group.dirty = true;
    group.setCoords();
  }

  return removed;
}

/**
 * Sincroniza as projeções de contraventamento nas elevações a partir da vista superior.
 *
 * @param topGroup Grupo da vista superior (fonte de contraventamentos).
 * @param targetGroups Grupos de destino (elevações).
 * @param getPilotiNivel Função que retorna o nível de um piloti por ID.
 */
export function syncContraventamentoElevationViews(
  topGroup: CanvasGroup | null,
  targetGroups: CanvasGroup[],
  getPilotiNivel: (pilotiId: string) => number,
): boolean {

  const getPilotiRow = (pilotiId: string): number | null => {
    const match = pilotiId.match(/^piloti_\d+_(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  };

  const getRectTop =
    (rect: CanvasObject): number => Number(rect?.top ?? 0);

  const getRectWidth =
    (rect: CanvasObject): number => Number(rect?.width ?? 0) * Number(rect?.scaleX ?? 1);

  const getRectCenterX =
    (rect: CanvasObject): number => Number(rect?.left ?? 0) + getRectWidth(rect) / 2;

  const getRectBaseHeight =
    (rect: CanvasObject): number => Number(rect?.pilotiBaseHeight ?? PILOTI_BASE_HEIGHT_PX * CONTRAVENTAMENTO_S);

  // Origem: deslocamento dinâmico acima do terreno local do piloti de origem.
  const getOriginY =
    (rect: CanvasObject, originPilotiId: string, offsetFromGround: number): number => {
      const top = getRectTop(rect);
      const base = getRectBaseHeight(rect);
      const originNivel = Number(getPilotiNivel(originPilotiId) ?? 0);
      return top + (originNivel - offsetFromGround) * base;
    };

  // Destino: deslocamento dinâmico abaixo da viga de piso.
  const getDestinationY =
    (rect: CanvasObject, offsetFromBeam: number): number => {
      const top = getRectTop(rect);
      const base = getRectBaseHeight(rect);
      return top + offsetFromBeam * base;
    };

  const addElevationProjection = (
    group: CanvasGroup,
    internalObjects: FabricObject[],
    params: {
      contraventamentoId: string;
      sourcePilotiId: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      behind: boolean;
    },
  ): boolean => {
    if (
      !Number.isFinite(params.x1) ||
      !Number.isFinite(params.y1) ||
      !Number.isFinite(params.x2) ||
      !Number.isFinite(params.y2) ||
      (Math.abs(params.x2 - params.x1) < 1 && Math.abs(params.y2 - params.y1) < 1)
    ) {
      return false;
    }

    // Border (behind) + fill (front) to keep visible outline on elevation views.
    const border = new Line([params.x1, params.y1, params.x2, params.y2], {
      stroke: CONTRAVENTAMENTO_STROKE,
      strokeWidth: CONTRAVENTAMENTO_ELEVATION_WIDTH + 2,
      strokeUniform: false,
      selectable: false,
      evented: false,
      objectCaching: false,
    });

    const borderCanvasObject = toCanvasObject(border);
    borderCanvasObject.isContraventamentoElevation = true;
    borderCanvasObject.contraventamentoId = params.contraventamentoId;
    borderCanvasObject.contraventamentoSourcePilotiId = params.sourcePilotiId;

    const line = new Line([params.x1, params.y1, params.x2, params.y2], {
      stroke: CONTRAVENTAMENTO_FILL,
      strokeWidth: CONTRAVENTAMENTO_ELEVATION_WIDTH,
      strokeUniform: false,
      selectable: false,
      evented: false,
      objectCaching: false,
    });

    const lineCanvasObject = toCanvasObject(line);
    lineCanvasObject.isContraventamentoElevation = true;
    lineCanvasObject.contraventamentoId = params.contraventamentoId;
    lineCanvasObject.contraventamentoSourcePilotiId = params.sourcePilotiId;

    if (params.behind) {
      // Lowest z-index for opposite-side contraventamento in this elevation view.
      internalObjects.unshift(line);
      lineCanvasObject.group = group;
      internalObjects.unshift(border);
      borderCanvasObject.group = group;
    } else {
      internalObjects.push(border);
      borderCanvasObject.group = group;
      internalObjects.push(line);
      lineCanvasObject.group = group;
    }

    return true;
  };

  let hasChanges = false;

  targetGroups.forEach((group) => {
    if (removeContraventamentoFromElevationViews(group) > 0) {
      hasChanges = true;
    }
  });

  if (!topGroup) {
    targetGroups[0]?.canvas?.requestRenderAll();
    return hasChanges;
  }

  const contraventamentos = getCanvasGroupObjects(topGroup)
    .filter(obj => obj.isContraventamento)
    .map(obj => ({obj, ...getContraventamentoCanvasObject(obj)}));

  if (contraventamentos.length === 0) {
    targetGroups[0]?.canvas?.requestRenderAll();
    return hasChanges;
  }

  for (const group of targetGroups) {
    const axisContext = resolveHouseElevationAxisContext(group);
    if (!axisContext) continue;

    const pilotiRects =
      getCanvasGroupObjects(group).filter(obj => obj.isPilotiRect && obj.pilotiId);
    if (pilotiRects.length === 0) continue;

    const rectByPilotiId = new Map<string, CanvasObject>();
    pilotiRects.forEach((rect) => rectByPilotiId.set(String(rect.pilotiId), rect));

    const internalObjects = group._objects as FabricObject[];

    for (const contrav of contraventamentos) {
      if (contrav.orientation === 'vertical') {
        if (axisContext.side !== 'left' && axisContext.side !== 'right') continue;
        if (!isContraventamentoVerticalSide(contrav.side)) continue;

        // For square views:
        // - external side is rendered normally
        // - opposite side is also rendered when present, but behind everything (lower z-index)
        const isRightSideView = axisContext.side === 'right';
        const visibleCol = isRightSideView ? 3 : 0;
        const externalSide: ContraventamentoVerticalSide = isRightSideView ? 'right' : 'left';
        const oppositeSide: ContraventamentoVerticalSide = isRightSideView ? 'left' : 'right';
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

        const originNivel = Number(getPilotiNivel(originPilotiId) ?? 0);
        const targetNivel = Number(getPilotiNivel(targetPilotiId) ?? 0);

        const offsetOrigin = resolveContraventamentoOffsetFromNivel(originNivel, true);
        const offsetTarget = resolveContraventamentoOffsetFromNivel(targetNivel, false);
        const changed = addElevationProjection(group, internalObjects, {
          contraventamentoId: contrav.id,
          sourcePilotiId: originPilotiId,
          x1: getRectCenterX(originRect),
          y1: getOriginY(originRect, originPilotiId, offsetOrigin),
          x2: getRectCenterX(targetRect),
          y2: getDestinationY(targetRect, offsetTarget),
          behind: isOpposite,
        });
        if (changed) hasChanges = true;
        continue;
      }

      if (axisContext.side !== 'top' && axisContext.side !== 'bottom') continue;
      if (!isContraventamentoHorizontalSide(contrav.side)) continue;

      const isTopSideView = axisContext.side === 'top';
      const visibleRow = isTopSideView ? 0 : 2;
      const externalSide: ContraventamentoHorizontalSide = isTopSideView ? 'top' : 'bottom';
      const oppositeSide: ContraventamentoHorizontalSide = isTopSideView ? 'bottom' : 'top';
      if (contrav.row !== visibleRow) continue;

      const isExternal = contrav.side === externalSide;
      const isOpposite = contrav.side === oppositeSide;
      if (!isExternal && !isOpposite) continue;

      const originPilotiId = String(contrav.anchorPilotiId);
      const originColMatch = originPilotiId.match(/^piloti_(\d+)_\d+$/);
      const originCol = originColMatch ? parseInt(originColMatch[1], 10) : contrav.startCol;
      const targetCol = originCol === contrav.startCol ? contrav.endCol : contrav.startCol;
      const targetPilotiId = `piloti_${targetCol}_${contrav.row}`;

      const originRect = rectByPilotiId.get(originPilotiId);
      const targetRect = rectByPilotiId.get(targetPilotiId);
      if (!originRect || !targetRect) continue;

      const originNivel = Number(getPilotiNivel(originPilotiId) ?? 0);
      const targetNivel = Number(getPilotiNivel(targetPilotiId) ?? 0);

      const offsetOrigin = resolveContraventamentoOffsetFromNivel(originNivel, true);
      const offsetTarget = resolveContraventamentoOffsetFromNivel(targetNivel, false);
      const changed = addElevationProjection(group, internalObjects, {
        contraventamentoId: contrav.id,
        sourcePilotiId: originPilotiId,
        x1: getRectCenterX(originRect),
        y1: getOriginY(originRect, originPilotiId, offsetOrigin),
        x2: getRectCenterX(targetRect),
        y2: getDestinationY(targetRect, offsetTarget),
        behind: isOpposite,
      });
      if (changed) hasChanges = true;
    }

    group.dirty = true;
    group.setCoords();
  }

  topGroup.canvas?.requestRenderAll();
  return hasChanges;
}
