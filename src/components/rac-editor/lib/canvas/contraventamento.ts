import {FabricObject, Line, Rect} from 'fabric';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';
import {
  CONTRAVENTAMENTO_COLUMN_X,
  CONTRAVENTAMENTO_ROW_Y,
  ContraventamentoSide,
  resolveContraventamentoOffsetFromNivel
} from '@/shared/types/contraventamento.ts';
import {HOUSE_DEFAULTS,} from '@/shared/config.ts';
import {
  CanvasGroup,
  CanvasObject,
  getCanvasGroupObjects,
  toCanvasObject
} from '@/components/rac-editor/lib/canvas/canvas.ts';
import {
  CONTRAVENTAMENTO_FILL,
  CONTRAVENTAMENTO_STROKE,
  CONTRAVENTAMENTO_STROKE_WIDTH,
  PILOTI_BASE_HEIGHT_PX
} from "@/shared/constants";

export interface ContraventamentoOrigin {
  pilotiId?: string;
  col: number;
  row: number;
  group?: CanvasGroup;
}

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
  col: number;
  startRow: number;
  endRow: number;
  side: ContraventamentoSide;
  anchorPilotiId: string;
} {
  const id = getOrCreateContraventamentoId(obj);

  const left = Number(obj.left ?? 0);
  const top = Number(obj.top ?? 0);
  const width = Number(obj.width ?? HOUSE_DIMENSIONS.contraventamento.topWidth);
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
      : centerX < CONTRAVENTAMENTO_COLUMN_X[col]
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
  options?: { anchorPilotiId?: string; side?: ContraventamentoSide; isAuto?: boolean },
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

  const side: ContraventamentoSide = options?.side === 'left' ? 'left' : 'right';
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
): void {

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

  targetGroups.forEach((group) => {
    removeContraventamentoFromElevationViews(group);
  });

  if (!topGroup) {
    targetGroups[0]?.canvas?.requestRenderAll();
    return;
  }

  const contraventamentos = getCanvasGroupObjects(topGroup)
    .filter(obj => obj.isContraventamento)
    .map(obj => ({obj, ...getContraventamentoCanvasObject(obj)}));

  if (contraventamentos.length === 0) {
    targetGroups[0]?.canvas?.requestRenderAll();
    return;
  }

  for (const group of targetGroups) {
    const houseView = String(group.houseView ?? '');
    if (houseView !== 'side') continue;

    const pilotiRects =
      getCanvasGroupObjects(group).filter(obj => obj.isPilotiRect && obj.pilotiId);
    if (pilotiRects.length === 0) continue;

    const rectByPilotiId = new Map<string, CanvasObject>();
    pilotiRects.forEach((rect) => rectByPilotiId.set(String(rect.pilotiId), rect));

    const internalObjects = group._objects as FabricObject[];

    const isRightSideView = group.isRightSide === true;
    const visibleCol = isRightSideView ? 3 : 0;
    const externalSide: ContraventamentoSide = isRightSideView ? 'right' : 'left';
    const oppositeSide: ContraventamentoSide = isRightSideView ? 'left' : 'right';

    for (const contrav of contraventamentos) {
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

      const originNivel = Number(getPilotiNivel(originPilotiId) ?? 0);
      const targetNivel = Number(getPilotiNivel(targetPilotiId) ?? 0);

      const offsetOrigin = resolveContraventamentoOffsetFromNivel(originNivel, true);
      const offsetTarget = resolveContraventamentoOffsetFromNivel(targetNivel, false);
      const x1 = getRectCenterX(originRect);
      const y1 = getOriginY(originRect, originPilotiId, offsetOrigin);
      const x2 = getRectCenterX(targetRect);
      const y2 = getDestinationY(targetRect, offsetTarget);

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
      const border = new Line([x1, y1, x2, y2], {
        stroke: CONTRAVENTAMENTO_STROKE,
        strokeWidth: CONTRAVENTAMENTO_ELEVATION_WIDTH + 2,
        strokeUniform: false,
        selectable: false,
        evented: false,
        objectCaching: false,
      });

      const borderCanvasObject = toCanvasObject(border);
      borderCanvasObject.isContraventamentoElevation = true;
      borderCanvasObject.contraventamentoId = contrav.id;
      borderCanvasObject.contraventamentoSourcePilotiId = originPilotiId;

      const line = new Line([x1, y1, x2, y2], {
        stroke: CONTRAVENTAMENTO_FILL,
        strokeWidth: CONTRAVENTAMENTO_ELEVATION_WIDTH,
        strokeUniform: false,
        selectable: false,
        evented: false,
        objectCaching: false,
      });

      const lineCanvasObject = toCanvasObject(line);
      lineCanvasObject.isContraventamentoElevation = true;
      lineCanvasObject.contraventamentoId = contrav.id;
      lineCanvasObject.contraventamentoSourcePilotiId = originPilotiId;

      if (isOpposite) {
        // Lowest z-index for opposite-side contraventamento in this square view.
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
    }

    group.dirty = true;
    group.setCoords();
  }

  topGroup.canvas?.requestRenderAll();
}
