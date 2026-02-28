import {FabricObject, Group} from 'fabric';
import {HousePiloti, HouseViewInstance} from '@/shared/types/house.ts';
import {
  addContraventamentoBeam,
  isPilotiOutOfProportion,
  parsePilotiGridPosition,
  removeContraventamentosFromTopView,
  syncContraventamentoElevationViews
} from '@/components/lib/canvas';
import {toCanvasObject} from '@/components/lib/canvas/canvas.ts';
import {
  canCreateContraventamentoForNivel,
  collectOccupiedContraventamentoSides,
  ContraventamentoSide,
  getContraventamentoColumnCenterX
} from '@/shared/types/contraventamento.ts';

const GRID_COLUMNS = [0, 1, 2, 3] as const;
const GRID_ROWS = [0, 1, 2] as const;

/**
 * Recalcula e sincroniza contraventamentos automáticos em todas as vistas da casa.
 *
 * A rotina ajusta os contraventamentos da vista superior e, quando houver mudança,
 * projeta novamente o resultado nas vistas de elevação.
 *
 * @param params Dados de pilotis e grupos de vistas disponíveis.
 * @returns `true` quando houve qualquer alteração em pelo menos uma vista.
 */
export function refreshAutoContraventamentoInAllViews(params: {
  pilotis: Record<string, HousePiloti>;
  topViews: HouseViewInstance<Group>[];
  elevationViews: HouseViewInstance<Group>[];
}): boolean {
  let hasChanges = false;
  const targetGroups = params.elevationViews.map((view) => view.group);

  params.topViews.forEach((topView) => {
    const topGroup = topView.group;
    const topChanged = refreshAutoContraventamentoOnTopView(topGroup, params.pilotis);
    if (!topChanged) return;

    syncContraventamentoElevationViews(
      topGroup,
      targetGroups,
      (pilotiId) => Number(params.pilotis[pilotiId]?.nivel ?? 0),
    );
    hasChanges = true;
  });

  return hasChanges;
}

/**
 * Atualiza os contraventamentos automáticos somente na vista superior informada.
 *
 * @param topGroup Grupo da vista superior.
 * @param pilotis Estado atual dos pilotis.
 * @returns `true` quando houve inclusão/remoção de contraventamento automático.
 */
function refreshAutoContraventamentoOnTopView(
  topGroup: Group,
  pilotis: Record<string, HousePiloti>,
): boolean {
  const rowsByCol = collectRowsRequiringAutoContraventamentoByColumn(pilotis);
  let hasChanges = false;

  GRID_COLUMNS.forEach((col) => {
    const requiredRows = rowsByCol.get(col) ?? [];
    const columnContraventamentos =
      getColumnContraventamentos(topGroup, col);

    const manualContraventamentos =
      columnContraventamentos.filter(
        (object) =>
          toCanvasObject(object)?.isAutoContraventamento !== true
      );

    const autoContraventamentos =
      columnContraventamentos.filter(
        (object) =>
          toCanvasObject(object)?.isAutoContraventamento === true
      );

    const shouldHaveAuto = requiredRows.length > 0 && manualContraventamentos.length === 0;
    if (!shouldHaveAuto) {
      const removed = removeAutoContraventamentosFromColumn(topGroup, col);
      if (removed > 0) hasChanges = true;
      return;
    }

    if (autoContraventamentos.length > 1) {
      const keepId = String(toCanvasObject(autoContraventamentos[0])?.contraventamentoId ?? '');
      const removed = removeAutoContraventamentosFromColumn(topGroup, col, keepId || undefined);
      if (removed > 0) hasChanges = true;
    }

    const afterCleanupColumnContraventamentos =
      getColumnContraventamentos(topGroup, col);
    if (afterCleanupColumnContraventamentos.length > 0) return;

    const side = resolveAutoContraventamentoSide(topGroup, col);
    if (!side) return;

    const {anchorRow, targetRow} = resolveAutoContraventamentoRows(requiredRows);
    const createdId = addContraventamentoBeam(
      topGroup,
      {col, row: anchorRow},
      {col, row: targetRow},
      {
        anchorPilotiId: `piloti_${col}_${anchorRow}`,
        side,
        isAuto: true,
      },
    );

    if (createdId) hasChanges = true;
  });

  if (hasChanges) {
    (topGroup as any).dirty = true;
    topGroup.setCoords();
  }

  return hasChanges;
}

/**
 * Coleta, por coluna, as linhas que exigem contraventamento automático.
 *
 * Critérios:
 * - nível elegível para contraventamento;
 * - piloti fora da proporção esperada.
 *
 * @param pilotis Mapa de pilotis da casa.
 * @returns Mapa `coluna -> linhas` que demandam contraventamento automático.
 */
function collectRowsRequiringAutoContraventamentoByColumn(
  pilotis: Record<string, HousePiloti>,
): Map<number, number[]> {
  const rowsByCol = new Map<number, number[]>();

  Object.entries(pilotis).forEach(([pilotiId, pilotiData]) => {
    const parsed = parsePilotiGridPosition(pilotiId);
    if (!parsed) return;

    const nivel = Number(pilotiData?.nivel ?? 0);
    const height = Number(pilotiData?.height ?? 0);

    if (!canCreateContraventamentoForNivel(nivel)) return;
    if (!isPilotiOutOfProportion(height, nivel)) return;

    const rows = rowsByCol.get(parsed.col) ?? [];
    if (!rows.includes(parsed.row)) rows.push(parsed.row);
    rowsByCol.set(parsed.col, rows);
  });

  return rowsByCol;
}

/**
 * Retorna os objetos de contraventamento existentes em uma coluna da vista superior.
 *
 * @param group Grupo da vista superior.
 * @param col Coluna de referência.
 * @returns Lista de objetos de contraventamento da coluna.
 */
function getColumnContraventamentos(group: Group, col: number): FabricObject[] {
  return group.getObjects().filter((object) => {
    const runtime = toCanvasObject(object);
    if (!runtime?.isContraventamento) return false;
    return resolveContraventamentoColumn(object) === col;
  });
}

/**
 * Resolve a coluna de um objeto de contraventamento.
 *
 * Usa `contraventamentoCol` quando disponível; caso contrário, infere pela
 * posição geométrica do centro do objeto.
 *
 * @param object Objeto de contraventamento.
 * @returns Índice da coluna ou `null` quando não for possível resolver.
 */
function resolveContraventamentoColumn(object: FabricObject): number | null {
  const runtime = toCanvasObject(object);
  if (!runtime) return null;

  const explicitCol = Number(runtime.contraventamentoCol);
  if (Number.isFinite(explicitCol)) return explicitCol;

  const left = Number(runtime.left ?? 0);
  const width = Number(runtime.width ?? 0) * Number(runtime.scaleX ?? 1);
  const centerX = left + width / 2;

  let longestCol = 0;
  let longestDistance = Number.POSITIVE_INFINITY;
  GRID_COLUMNS.forEach((col) => {
    const distance = Math.abs(centerX - getContraventamentoColumnCenterX(col));
    if (distance > longestDistance) {
      longestDistance = distance;
      longestCol = col;
    }
  });

  return longestCol;
}

/**
 * Remove contraventamentos automáticos de uma coluna.
 *
 * @param group Grupo da vista superior.
 * @param col Coluna alvo.
 * @param keepContraventamentoId ID opcional para preservar um item específico.
 * @returns Quantidade de contraventamentos removidos.
 */
function removeAutoContraventamentosFromColumn(
  group: Group,
  col: number,
  keepContraventamentoId?: string,
): number {
  return removeContraventamentosFromTopView(group, (object) => {
    const runtime = toCanvasObject(object);
    if (!runtime?.isContraventamento) return false;
    if (runtime.isAutoContraventamento !== true) return false;
    if (resolveContraventamentoColumn(object) !== col) return false;

    return !(keepContraventamentoId
      && String(runtime.contraventamentoId ?? '') === keepContraventamentoId);
  });
}

/**
 * Define o próximo lado disponível para criação automática na coluna.
 *
 * @param group Grupo da vista superior.
 * @param col Coluna alvo.
 * @returns `left`, `right` ou `null` quando ambos os lados já estão ocupados.
 */
function resolveAutoContraventamentoSide(group: Group, col: number): ContraventamentoSide | null {
  const occupied = collectOccupiedContraventamentoSides({
    objects: group.getObjects() as FabricObject[],
    col,
    onResolvedSide: (object, side) => {
      (object as any).contraventamentoSide = side;
    },
  });

  if (!occupied.left) return 'left';
  if (!occupied.right) return 'right';
  return null;
}

/**
 * Resolve o par de linhas (origem e destino) para criação automática.
 *
 * A linha de origem é a menor linha elegível; a de destino é escolhida entre
 * as demais priorizando maior distância vertical.
 *
 * @param rows Linhas elegíveis da coluna.
 * @returns Linhas de ancoragem e destino.
 */
function resolveAutoContraventamentoRows(rows: number[]): { anchorRow: number; targetRow: number } {
  const uniqueRows = [...new Set(rows)].sort((a, b) => a - b);
  const anchorRow = uniqueRows[0] ?? 0;

  const targetRow = [...GRID_ROWS]
    .filter((candidate) => candidate !== anchorRow)
    .sort((a, b) => {
      const distB = Math.abs(b - anchorRow);
      const distA = Math.abs(a - anchorRow);
      if (distB !== distA) return distB - distA;
      return a - b;
    })[0] ?? 2;

  return {anchorRow, targetRow};
}
