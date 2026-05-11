import {HousePiloti, HouseRuntimeViewInstance} from '@/shared/types/house.ts';
import {
  addContraventamentoBeam,
  CanvasGroup,
  CanvasObject,
  getCanvasGroupObjects,
  removeContraventamentosFromTopView,
  syncContraventamentoElevationViews
} from '@/components/rac-editor/@canvas/lib';
import {
  type ContraventamentoSide,
} from '@/shared/types/contraventamento.ts';
import {
  collectAutoContraventamentoRowsByColumn,
  HOUSE_CONTRAVENTAMENTO_COLUMNS,
  resolveAutoContraventamentoRows,
  resolveNextContraventamentoSide,
} from '@/domain/house/use-cases/house-contraventamento.use-case.ts';
import {
  collectOccupiedContraventamentoSides,
  getContraventamentoColumnCenterX,
} from '@/components/rac-editor/@canvas/lib/contraventamento-geometry.ts';

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
  topViews: HouseRuntimeViewInstance<CanvasGroup>[];
  elevationViews: HouseRuntimeViewInstance<CanvasGroup>[];
}): boolean {
  let hasChanges = false;
  const targetGroups =
    params.elevationViews.map((view) => view.group);

  params.topViews.forEach((topView) => {
    const topGroup = topView.group;
    const topChanged = refreshAutoContraventamentoOnTopView(topGroup, params.pilotis);

    const elevationsChanged = syncContraventamentoElevationViews(
      topGroup,
      targetGroups,
      (pilotiId) => Number(params.pilotis[pilotiId]?.nivel ?? 0),
    );
    if (topChanged || elevationsChanged) hasChanges = true;
  });

  return hasChanges;
}

/**
 * Atualiza os contraventamentos automáticos somente na vista superior informada.
 *
 * @param runtimeTopGroup Grupo da vista superior.
 * @param pilotis Estado atual dos pilotis.
 * @returns `true` quando houve inclusão/remoção de contraventamento automático.
 */
function refreshAutoContraventamentoOnTopView(
  runtimeTopGroup: CanvasGroup,
  pilotis: Record<string, HousePiloti>,
): boolean {
  const rowsByCol = collectAutoContraventamentoRowsByColumn(pilotis);
  let hasChanges = false;

  HOUSE_CONTRAVENTAMENTO_COLUMNS.forEach((col) => {
    const requiredRows = rowsByCol.get(col) ?? [];
    const existingInColumn = getColumnContraventamentos(runtimeTopGroup, col);

    if (requiredRows.length === 0) {
      if (existingInColumn.length === 0) return;
      const removed = removeContraventamentosFromTopView(
        runtimeTopGroup,
        (object) => resolveContraventamentoColumn(object) === col,
      );

      if (removed > 0) hasChanges = true;
      return;
    }
    if (existingInColumn.length > 0) return;

    const side = resolveAutoContraventamentoSide(runtimeTopGroup, col);
    if (!side) return;

    const {anchorRow, targetRow} = resolveAutoContraventamentoRows({
      col,
      pilotis,
      requiredRows,
    });

    const createdId = addContraventamentoBeam(
      runtimeTopGroup,
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
    runtimeTopGroup.dirty = true;
    runtimeTopGroup.setCoords();
  }

  return hasChanges;
}

/**
 * Retorna os objetos de contraventamento existentes em uma coluna da vista superior.
 *
 * @param group Grupo da vista superior.
 * @param col Coluna de referência.
 * @returns Lista de objetos de contraventamento da coluna.
 */
function getColumnContraventamentos(group: CanvasGroup, col: number): CanvasObject[] {
  return getCanvasGroupObjects(group).filter(object => {
    if (!object?.isContraventamento) return false;
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
function resolveContraventamentoColumn(object: CanvasObject): number | null {
  if (!object) return null;

  const explicitCol = Number(object.contraventamentoCol);
  if (Number.isFinite(explicitCol)) return explicitCol;

  const left = Number(object.left ?? 0);
  const width = Number(object.width ?? 0) * Number(object.scaleX ?? 1);
  const centerX = left + width / 2;

  let closestCol = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  HOUSE_CONTRAVENTAMENTO_COLUMNS.forEach((col) => {
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
function resolveAutoContraventamentoSide(group: CanvasGroup, col: number): ContraventamentoSide | null {
  const occupied = collectOccupiedContraventamentoSides({
    objects: getCanvasGroupObjects(group),
    col,
    onResolvedSide: (object, side) => {
      object.contraventamentoSide = side;
    },
  });

  return resolveNextContraventamentoSide(occupied);
}
