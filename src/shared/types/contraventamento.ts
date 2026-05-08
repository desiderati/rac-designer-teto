/**
 * Contratos e helpers compartilhados do contraventamento.
 *
 * Regras puras de elegibilidade/seleção pertencem a
 * `src/domain/house/use-cases/house-contraventamento.use-case.ts`.
 * Geometria local de canvas pertence ao slice `@canvas`.
 */

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

export interface ContraventamentoOrigin {
  pilotiId?: string;
  col: number;
  row: number;
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
      // Coluna inelegível para inserção: mantém habilitado somente o lado ocupado,
      // para permitir remoção de contraventamento já existente.
      leftDisabled: !params.occupiedSides.left,
      rightDisabled: !params.occupiedSides.right,
      leftActive: params.occupiedSides.left,
      rightActive: params.occupiedSides.right,
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
 * Resolve os offsets verticais de desenho do contraventamento a partir do nível.
 *
 * @param nivel Nível do piloti de origem.
 * @param isOrigin Indica se o piloti é a origem.
 * @returns Offsets para inserção do contraventamento a partir do chão.
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

  return (nivel >= 0.4) ? nivel / 1.5 : nivel;
}
