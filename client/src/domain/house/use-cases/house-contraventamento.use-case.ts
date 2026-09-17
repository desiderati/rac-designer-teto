import type {HousePiloti} from '@/shared/types/house.ts';
import {HOUSE_DEFAULTS} from '@/shared/config.ts';
import {
  type ContraventamentoHorizontalSide,
  type ContraventamentoSide,
  type ContraventamentoSidesOccupation,
  type ContraventamentoVerticalSide,
  isContraventamentoHorizontalSide,
  isContraventamentoVerticalSide,
} from '@/shared/types/contraventamento.ts';
import {isPilotiOutOfProportion, parsePilotiGridPosition} from '@/shared/types/piloti.ts';

export const HOUSE_CONTRAVENTAMENTO_COLUMNS = [0, 1, 2, 3] as const;
export const HOUSE_CONTRAVENTAMENTO_ROWS = [0, 1, 2] as const;
const HOUSE_HORIZONTAL_CONTRAVENTAMENTO_SIDES_BY_ROW = {
  0: ['bottom'],
  1: ['top', 'bottom'],
  2: ['top'],
} as const satisfies Record<number, readonly ContraventamentoHorizontalSide[]>;

export interface HouseContraventamentoGridPoint {
  col: number;
  row: number;
}

type HouseContraventamentoPilotiInput =
  Pick<HousePiloti, 'height' | 'nivel'> | null | undefined;

/**
 * Verifica se o nível do piloti permite contraventamento no modelo da casa.
 */
export function canCreateContraventamentoForNivel(nivel: number): boolean {
  return nivel >= HOUSE_DEFAULTS.pilotiNivel;
}

/**
 * Valida a regra lógica de elegibilidade de um piloti para contraventamento.
 *
 * Um piloti só participa da regra quando tem nível mínimo configurado e altura
 * abaixo da proporção recomendada para esse nível.
 */
export function isHousePilotiEligibleForContraventamento(
  piloti: HouseContraventamentoPilotiInput,
): boolean {
  const nivel = Number(piloti?.nivel ?? 0);
  const height = Number(piloti?.height ?? 0);

  return canCreateContraventamentoForNivel(nivel)
    && isPilotiOutOfProportion(height, nivel);
}

/**
 * Verifica se uma coluna tem ao menos um piloti que exige contraventamento.
 *
 * A coluna fica habilitada como um todo porque o usuário pode escolher outro
 * piloti da mesma coluna como destino visual da ligação.
 */
export function hasEligiblePilotiForContraventamentoInColumn(params: {
  col: number;
  pilotis: Record<string, HouseContraventamentoPilotiInput>;
}): boolean {
  return HOUSE_CONTRAVENTAMENTO_ROWS.some((row) =>
    isHousePilotiEligibleForContraventamento(params.pilotis[`piloti_${params.col}_${row}`]),
  );
}

/**
 * Verifica se uma linha tem ao menos um piloti que exige contraventamento.
 *
 * O contraventamento horizontal usa a mesma regra de elegibilidade do vertical,
 * mas a ação manual cobre a faixa dos quatro pilotis da linha.
 */
export function hasEligiblePilotiForContraventamentoInRow(params: {
  row: number;
  pilotis: Record<string, HouseContraventamentoPilotiInput>;
}): boolean {
  return HOUSE_CONTRAVENTAMENTO_COLUMNS.some((col) =>
    isHousePilotiEligibleForContraventamento(params.pilotis[`piloti_${col}_${params.row}`]),
  );
}

/**
 * Retorna os lados horizontais permitidos para uma linha de pilotis.
 *
 * Linha A (0) recebe apenas inferior, linha B (1) recebe superior e inferior,
 * e linha C (2) recebe apenas superior.
 */
export function getAllowedHorizontalContraventamentoSidesForRow(
  row: number,
): readonly ContraventamentoHorizontalSide[] {
  return HOUSE_HORIZONTAL_CONTRAVENTAMENTO_SIDES_BY_ROW[row] ?? [];
}

export function canUseHorizontalContraventamentoSideInRow(params: {
  row: number;
  side: ContraventamentoSide | null | undefined;
}): params is { row: number; side: ContraventamentoHorizontalSide } {
  return isContraventamentoHorizontalSide(params.side)
    && getAllowedHorizontalContraventamentoSidesForRow(params.row).includes(params.side);
}

/**
 * Decide se o piloti candidato pode ser destino no fluxo manual de seleção.
 */
export function isHouseContraventamentoDestinationEligible(params: {
  first: HouseContraventamentoGridPoint | null;
  candidate: HouseContraventamentoGridPoint;
  pilotis: Record<string, HouseContraventamentoPilotiInput>;
}): boolean {
  if (!params.first) return false;
  if (params.candidate.col !== params.first.col) return false;
  if (params.candidate.row === params.first.row) return false;

  return hasEligiblePilotiForContraventamentoInColumn({
    col: params.candidate.col,
    pilotis: params.pilotis,
  });
}

/**
 * Decide se o piloti candidato pode ser destino no fluxo manual horizontal.
 */
export function isHouseHorizontalContraventamentoDestinationEligible(params: {
  first: HouseContraventamentoGridPoint | null;
  candidate: HouseContraventamentoGridPoint;
  side: ContraventamentoSide | null | undefined;
  pilotis: Record<string, HouseContraventamentoPilotiInput>;
}): boolean {
  if (!params.first) return false;
  if (!canUseHorizontalContraventamentoSideInRow({row: params.first.row, side: params.side})) {
    return false;
  }
  if (params.candidate.row !== params.first.row) return false;
  if (params.candidate.col === params.first.col) return false;

  return hasEligiblePilotiForContraventamentoInRow({
    row: params.candidate.row,
    pilotis: params.pilotis,
  });
}

export function getContraventamentoOrientationBySide(
  side: ContraventamentoSide | null | undefined,
): 'vertical' | 'horizontal' | null {
  if (isContraventamentoVerticalSide(side)) return 'vertical';
  if (isContraventamentoHorizontalSide(side)) return 'horizontal';
  return null;
}

/**
 * Coleta as linhas que exigem contraventamento automático, agrupadas por coluna.
 */
export function collectAutoContraventamentoRowsByColumn(
  pilotis: Record<string, HouseContraventamentoPilotiInput>,
): Map<number, number[]> {
  const rowsByCol = new Map<number, number[]>();

  Object.entries(pilotis).forEach(([pilotiId, pilotiData]) => {
    const parsed = parsePilotiGridPosition(pilotiId);
    if (!parsed) return;
    if (!isHousePilotiEligibleForContraventamento(pilotiData)) return;

    const rows = rowsByCol.get(parsed.col) ?? [];
    if (!rows.includes(parsed.row)) rows.push(parsed.row);
    rowsByCol.set(parsed.col, rows);
  });

  return rowsByCol;
}

/**
 * Resolve o próximo lado disponível para inserir um contraventamento na coluna.
 */
export function resolveNextContraventamentoSide(
  occupied: ContraventamentoSidesOccupation,
): ContraventamentoVerticalSide | null {
  if (!occupied.left) return 'left';
  if (!occupied.right) return 'right';
  return null;
}

/**
 * Resolve o par de linhas usado na criação automática de contraventamento.
 *
 * A ligação usa os extremos da coluna e ancora no extremo de menor nível. Se a
 * coluna não tiver dados suficientes, usa a linha elegível como origem e o
 * extremo mais distante como destino.
 */
export function resolveAutoContraventamentoRows(params: {
  col: number;
  pilotis: Record<string, HouseContraventamentoPilotiInput>;
  requiredRows: readonly number[];
}): { anchorRow: number; targetRow: number } {

  const rowsWithNivel = HOUSE_CONTRAVENTAMENTO_ROWS
    .map((row) => ({
      row,
      nivel: Number(params.pilotis[`piloti_${params.col}_${row}`]?.nivel),
    }))
    .filter((item) => Number.isFinite(item.nivel));

  const uniqueRequiredRows =
    [...new Set(params.requiredRows)].sort((a, b) => a - b);

  const fallbackAnchor = uniqueRequiredRows[0] ?? 0;
  const fallbackTarget = [...HOUSE_CONTRAVENTAMENTO_ROWS]
    .filter((row) => row !== fallbackAnchor)
    .sort((a, b) => Math.abs(b - fallbackAnchor) - Math.abs(a - fallbackAnchor))[0] ?? 2;

  if (rowsWithNivel.length < 2) {
    return {anchorRow: fallbackAnchor, targetRow: fallbackTarget};
  }

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

    if (firstExtremeNivel <= lastExtremeNivel) {
      return {anchorRow: firstExtremeRow, targetRow: lastExtremeRow};
    }
    return {anchorRow: lastExtremeRow, targetRow: firstExtremeRow};
  }

  return {anchorRow: fallbackAnchor, targetRow: fallbackTarget};
}
