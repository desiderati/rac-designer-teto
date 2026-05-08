import {HOUSE_DEFAULTS} from '@/shared/config.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';
import type {
  ContraventamentoSide,
  ContraventamentoSidesOccupation,
} from '@/shared/types/contraventamento.ts';

export const CONTRAVENTAMENTO_COLUMN_SPACING =
  HOUSE_DIMENSIONS.piloti.columnSpacing * HOUSE_DEFAULTS.viewScale;

export const CONTRAVENTAMENTO_ROW_SPACING =
  HOUSE_DIMENSIONS.piloti.rowSpacing * HOUSE_DEFAULTS.viewScale;

/** Coordenada X local de cada coluna (0-3) na vista superior. */
export const CONTRAVENTAMENTO_COLUMN_X = [
  -1.5 * CONTRAVENTAMENTO_COLUMN_SPACING,
  -0.5 * CONTRAVENTAMENTO_COLUMN_SPACING,
  0.5 * CONTRAVENTAMENTO_COLUMN_SPACING,
  1.5 * CONTRAVENTAMENTO_COLUMN_SPACING,
];

/** Coordenada Y local de cada linha (0-2) na vista superior. */
export const CONTRAVENTAMENTO_ROW_Y = [-CONTRAVENTAMENTO_ROW_SPACING, 0, CONTRAVENTAMENTO_ROW_SPACING];

export interface ContraventamentoCandidate {
  isContraventamento?: boolean;
  contraventamentoCol?: unknown;
  contraventamentoSide?: unknown;
  left?: unknown;
  width?: unknown;
  scaleX?: unknown;
}

/**
 * Infere o lado (`left`/`right`) do contraventamento pela geometria da viga.
 *
 * @param params Parâmetros geométricos do objeto.
 * @returns Lado inferido.
 */
export function inferContraventamentoSide(params: {
  col: number;
  left: number;
  width: number;
  scaleX?: number;
}): ContraventamentoSide {
  const centerX = params.left + params.width * (params.scaleX ?? 1) / 2;
  return centerX < getContraventamentoColumnCenterX(params.col) ? 'left' : 'right';
}

/**
 * Retorna a coordenada X do centro da coluna de contraventamento.
 *
 * @param col Índice da coluna.
 * @returns Coordenada X da coluna ou 0 quando inválida.
 */
export function getContraventamentoColumnCenterX(col: number): number {
  return CONTRAVENTAMENTO_COLUMN_X[col] ?? 0;
}

/**
 * Coleta os lados ocupados por contraventamentos em uma coluna.
 *
 * @param params Lista de objetos e coluna alvo.
 * @returns Mapa booleano de ocupação (`left`/`right`).
 */
export function collectOccupiedContraventamentoSides(params: {
  objects: ContraventamentoCandidate[];
  col: number;
  onResolvedSide?: (object: ContraventamentoCandidate, side: ContraventamentoSide) => void;
}): ContraventamentoSidesOccupation {
  const occupied: ContraventamentoSidesOccupation = {left: false, right: false};

  params.objects.forEach((object) => {
    if (!object.isContraventamento) return;
    if (Number(object.contraventamentoCol) !== params.col) return;

    let side: ContraventamentoSide;
    if (object.contraventamentoSide === 'left' || object.contraventamentoSide === 'right') {
      side = object.contraventamentoSide;
    } else {
      side = inferContraventamentoSide({
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
