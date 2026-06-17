import {HOUSE_DEFAULTS} from '@/shared/config.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';
import {
  isContraventamentoHorizontalSide,
  isContraventamentoVerticalSide,
} from '@/shared/types/contraventamento.ts';
import type {
  ContraventamentoOrientation,
  ContraventamentoHorizontalSide,
  ContraventamentoHorizontalSidesOccupation,
  ContraventamentoSidesOccupation,
  ContraventamentoVerticalSide,
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
  contraventamentoOrientation?: unknown;
  contraventamentoCol?: unknown;
  contraventamentoRow?: unknown;
  contraventamentoSide?: unknown;
  left?: unknown;
  top?: unknown;
  width?: unknown;
  height?: unknown;
  scaleX?: unknown;
  scaleY?: unknown;
}

export function getContraventamentoOrientation(
  object: Pick<ContraventamentoCandidate, 'contraventamentoOrientation'>,
): ContraventamentoOrientation {
  return object.contraventamentoOrientation === 'horizontal'
    ? 'horizontal'
    : 'vertical';
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
}): ContraventamentoVerticalSide {
  const centerX = params.left + params.width * (params.scaleX ?? 1) / 2;
  return centerX < getContraventamentoColumnCenterX(params.col) ? 'left' : 'right';
}

/**
 * Infere o lado (`top`/`bottom`) do contraventamento horizontal pela geometria.
 *
 * @param params Parâmetros geométricos do objeto.
 * @returns Lado inferido.
 */
export function inferHorizontalContraventamentoSide(params: {
  row: number;
  top: number;
  height: number;
  scaleY?: number;
}): ContraventamentoHorizontalSide {
  const centerY = params.top + params.height * (params.scaleY ?? 1) / 2;
  return centerY < getContraventamentoRowCenterY(params.row) ? 'top' : 'bottom';
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
 * Retorna a coordenada Y do centro da linha de contraventamento.
 *
 * @param row Índice da linha.
 * @returns Coordenada Y da linha ou 0 quando inválida.
 */
export function getContraventamentoRowCenterY(row: number): number {
  return CONTRAVENTAMENTO_ROW_Y[row] ?? 0;
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
  onResolvedSide?: (object: ContraventamentoCandidate, side: ContraventamentoVerticalSide) => void;
}): ContraventamentoSidesOccupation {
  const occupied: ContraventamentoSidesOccupation = {left: false, right: false};

  params.objects.forEach((object) => {
    if (!object.isContraventamento) return;
    if (getContraventamentoOrientation(object) !== 'vertical') return;
    if (Number(object.contraventamentoCol) !== params.col) return;

    let side: ContraventamentoVerticalSide;
    if (isContraventamentoVerticalSide(object.contraventamentoSide)) {
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

/**
 * Coleta os lados ocupados por contraventamentos horizontais em uma linha.
 *
 * @param params Lista de objetos e linha alvo.
 * @returns Mapa booleano de ocupação (`top`/`bottom`).
 */
export function collectOccupiedHorizontalContraventamentoSides(params: {
  objects: ContraventamentoCandidate[];
  row: number;
  onResolvedSide?: (object: ContraventamentoCandidate, side: ContraventamentoHorizontalSide) => void;
}): ContraventamentoHorizontalSidesOccupation {
  const occupied: ContraventamentoHorizontalSidesOccupation = {top: false, bottom: false};

  params.objects.forEach((object) => {
    if (!object.isContraventamento) return;
    if (getContraventamentoOrientation(object) !== 'horizontal') return;
    if (Number(object.contraventamentoRow) !== params.row) return;

    let side: ContraventamentoHorizontalSide;
    if (isContraventamentoHorizontalSide(object.contraventamentoSide)) {
      side = object.contraventamentoSide;
    } else {
      side = inferHorizontalContraventamentoSide({
        row: params.row,
        top: Number(object.top ?? 0),
        height: Number(object.height ?? 0),
        scaleY: Number(object.scaleY ?? 1),
      });
      params.onResolvedSide?.(object, side);
    }

    occupied[side] = true;
  });

  return occupied;
}
