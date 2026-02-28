import {FabricObject, Group} from 'fabric';
import {HousePiloti, HouseViewInstance} from '@/shared/types/house.ts';
import {
  addContraventamentoBeam,
  isPilotiOutOfProportion,
  parsePilotiGridPosition,
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
const AUTO_CONTRAVENTAMENTO_INITIALIZED_KEY = '__autoContraventamentoInitialized';

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
  const runtimeTopGroup = topGroup as any;
  if (runtimeTopGroup[AUTO_CONTRAVENTAMENTO_INITIALIZED_KEY] === true) {
    return false;
  }

  // If this top view already has any contraventamento (manual/imported),
  // do not auto-manage it anymore.
  if (topGroup.getObjects().some((object) => toCanvasObject(object)?.isContraventamento === true)) {
    runtimeTopGroup[AUTO_CONTRAVENTAMENTO_INITIALIZED_KEY] = true;
    return false;
  }

  const rowsByCol = collectRowsRequiringAutoContraventamentoByColumn(pilotis);
  let hasChanges = false;

  GRID_COLUMNS.forEach((col) => {
    const requiredRows = rowsByCol.get(col) ?? [];
    if (requiredRows.length === 0) return;

    const existingInColumn = getColumnContraventamentos(topGroup, col);
    if (existingInColumn.length > 0) return;

    const side = resolveAutoContraventamentoSide(topGroup, col);
    if (!side) return;

    const {anchorRow, targetRow} = resolveAutoContraventamentoRows({
      col,
      pilotis,
      requiredRows,
    });
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

  runtimeTopGroup[AUTO_CONTRAVENTAMENTO_INITIALIZED_KEY] = true;
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

  let closestCol = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  GRID_COLUMNS.forEach((col) => {
    const distance = Math.abs(centerX - getContraventamentoColumnCenterX(col));
    if (distance < closestDistance) {
      closestDistance = distance;
      closestCol = col;
    }
  });

  return closestCol;
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
 * Regras:
 * - origem: menor nível da coluna;
 * - destino: maior nível da coluna;
 * - em empate, escolhe o par com maior distância vertical possível.
 *
 * @param params Coluna, estado dos pilotis e linhas elegíveis da coluna.
 * @returns Linhas de ancoragem e destino.
 */
function resolveAutoContraventamentoRows(params: {
  col: number;
  pilotis: Record<string, HousePiloti>;
  requiredRows: number[];
}): { anchorRow: number; targetRow: number } {

  const rowsWithNivel = GRID_ROWS
    .map((row) => ({
      row,
      nivel: Number(params.pilotis[`piloti_${params.col}_${row}`]?.nivel),
    }))
    .filter((item) => Number.isFinite(item.nivel));

  const uniqueRequiredRows =
    [...new Set(params.requiredRows)].sort((a, b) => a - b);

  const fallbackAnchor = uniqueRequiredRows[0] ?? 0;
  const fallbackTarget = [...GRID_ROWS]
    .filter((row) => row !== fallbackAnchor)
    .sort((a, b) => Math.abs(b - fallbackAnchor) - Math.abs(a - fallbackAnchor))[0] ?? 2;

  if (rowsWithNivel.length < 2) {
    return {anchorRow: fallbackAnchor, targetRow: fallbackTarget};
  }

  // Regra de distância máxima: sempre usar os pilotis de ponta a ponta na coluna.
  const extremeRows = rowsWithNivel
    .map((item) => item.row)
    .sort((a, b) => a - b);

  const firstExtremeRow = extremeRows[0] ?? fallbackAnchor;
  const lastExtremeRow = extremeRows[extremeRows.length - 1] ?? fallbackTarget;
  if (firstExtremeRow !== lastExtremeRow) {
    const firstExtremeNivel =
      Number(params.pilotis[`piloti_${params.col}_${firstExtremeRow}`]?.nivel ?? 0);

    const lastExtremeNivel =
      Number(params.pilotis[`piloti_${params.col}_${lastExtremeRow}`]?.nivel ?? 0);

    // Entre os extremos, a origem deve ser o menor nível.
    if (firstExtremeNivel <= lastExtremeNivel) {
      return {anchorRow: firstExtremeRow, targetRow: lastExtremeRow};
    }
    return {anchorRow: lastExtremeRow, targetRow: firstExtremeRow};
  }

  return {anchorRow: fallbackAnchor, targetRow: fallbackTarget};
}
