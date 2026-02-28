/**
 * Inserir neste arquivo apenas regras de negócio NÃO relativas ao Canvas!
 */
import {CONTRAVENTAMENTO, HOUSE_DEFAULTS} from '@/shared/config.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';

export const CONTRAVENTAMENTO_COLUMN_SPACING =
  HOUSE_DIMENSIONS.piloti.columnSpacing * HOUSE_DEFAULTS.viewScale;

export const CONTRAVENTAMENTO_ROW_SPACING =
  HOUSE_DIMENSIONS.piloti.rowSpacing * HOUSE_DEFAULTS.viewScale;

/** Local-space X of each column (0-3) in the top-view group */
export const CONTRAVENTAMENTO_COLUMN_X = [
  -1.5 * CONTRAVENTAMENTO_COLUMN_SPACING,
  -0.5 * CONTRAVENTAMENTO_COLUMN_SPACING,
  0.5 * CONTRAVENTAMENTO_COLUMN_SPACING,
  1.5 * CONTRAVENTAMENTO_COLUMN_SPACING,
];

/** Local-space Y of each row (0-2) in the top-view group */
export const CONTRAVENTAMENTO_ROW_Y = [-CONTRAVENTAMENTO_ROW_SPACING, 0, CONTRAVENTAMENTO_ROW_SPACING];

export interface ContraventamentoCandidate {
  isContraventamento?: boolean;
  contraventamentoCol?: unknown;
  contraventamentoSide?: unknown;
  left?: unknown;
  width?: unknown;
  scaleX?: unknown;
}

export type ContraventamentoSide = 'left' | 'right';

export interface ContraventamentoSidesOccupation {
  left: boolean;
  right: boolean;
}

export interface ContraventamentoEditorState {
  leftDisabled: boolean;
  rightDisabled: boolean;
  leftActive: boolean;
  rightActive: boolean;
}

/**
 * Cria o estado visual/funcional dos botões de lado do editor de contraventamento.
 *
 * @param params Parâmetros de disponibilidade e ocupação por lado.
 * @returns Estado pronto para consumo na UI.
 */
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

/**
 * Retorna o rótulo em português do lado de contraventamento.
 *
 * @param side Lado lógico (`left` ou `right`).
 * @returns Rótulo de exibição.
 */
export function getContraventamentoSideLabel(side: ContraventamentoSide): string {
  return side === 'left' ? 'esquerdo' : 'direito';
}

/**
 * Verifica se um piloti pode receber contraventamento com base no nível.
 *
 * @param nivel Nível atual do piloti.
 * @returns `true` quando atende ao mínimo configurado.
 */
export function canCreateContraventamentoForNivel(nivel: number): boolean {
  return nivel >= HOUSE_DEFAULTS.pilotiNivel;
}

/**
 * Resolve os offsets verticais de desenho do contraventamento a partir do nível.
 *
 * @param nivel Nível do piloti de origem.
 * @param isOrigin Valida se é o piloti de origem.
 * @returns Offsets para inserção do piloti a partir do chão.
 */
export function resolveContraventamentoOffsetFromNivel(
  nivel: number,
  isOrigin: boolean,
): number {

  if (nivel >= 0.6) {
    return nivel / 3;
  }

  if (!isOrigin) {
    return (nivel >= 0.4) ? nivel - (nivel / 1.5) : 0;
  }

  return (nivel >= 0.4) ? nivel / 1.5 : 0;
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
 * @returns Coordenada X da coluna (ou 0 quando inválida).
 */
export function getContraventamentoColumnCenterX(col: number): number {
  return CONTRAVENTAMENTO_COLUMN_X[col] ?? 0;
}

/**
 * Valida se um piloti candidato pode ser destino no fluxo de seleção.
 *
 * @param params Estado da seleção atual e dados do candidato.
 * @returns `true` quando está na mesma coluna, em linha diferente e com nível válido.
 */
export function isContraventamentoDestinationEligible(params: {
  first: { col: number; row: number } | null;
  candidate: { col: number; row: number };
  nivel: number;
}): boolean {
  if (!params.first) return false;
  if (!canCreateContraventamentoForNivel(params.nivel)) return false;
  return params.candidate.col === params.first.col && params.candidate.row !== params.first.row;
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

