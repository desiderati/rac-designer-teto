/**
 * Contratos e helpers compartilhados do contraventamento.
 *
 * Regras puras de elegibilidade/seleção pertencem a
 * `src/domain/house/use-cases/house-contraventamento.use-case.ts`.
 * Geometria local de canvas pertence ao slice `@canvas`.
 */

export type ContraventamentoVerticalSide = 'left' | 'right';

export type ContraventamentoHorizontalSide = 'top' | 'bottom';

export type ContraventamentoSide = ContraventamentoVerticalSide | ContraventamentoHorizontalSide;

export type ContraventamentoOrientation = 'vertical' | 'horizontal';

export interface ContraventamentoSidesOccupation {
  left: boolean;
  right: boolean;
}

export interface ContraventamentoHorizontalSidesOccupation {
  top: boolean;
  bottom: boolean;
}

export interface ContraventamentoEditorState {
  leftDisabled: boolean;
  rightDisabled: boolean;
  leftActive: boolean;
  rightActive: boolean;
  topDisabled: boolean;
  bottomDisabled: boolean;
  topActive: boolean;
  bottomActive: boolean;
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
  canReceiveHorizontalContraventamento?: boolean;
  occupiedHorizontalSides?: ContraventamentoHorizontalSidesOccupation;
  allowedHorizontalSides?: readonly ContraventamentoHorizontalSide[];
}): ContraventamentoEditorState {
  const allowedHorizontalSides = params.allowedHorizontalSides ?? [];
  const topActive = params.occupiedHorizontalSides?.top === true;
  const bottomActive = params.occupiedHorizontalSides?.bottom === true;
  const canReceiveHorizontal = params.canReceiveHorizontalContraventamento === true;
  const topDisabled = !topActive && (!canReceiveHorizontal || !allowedHorizontalSides.includes('top'));
  const bottomDisabled = !bottomActive && (!canReceiveHorizontal || !allowedHorizontalSides.includes('bottom'));

  if (!params.canReceiveContraventamento) {
    return {
      // Coluna inelegível para inserção: mantém habilitado somente o lado ocupado,
      // para permitir remoção de contraventamento já existente.
      leftDisabled: !params.occupiedSides.left,
      rightDisabled: !params.occupiedSides.right,
      leftActive: params.occupiedSides.left,
      rightActive: params.occupiedSides.right,
      topDisabled,
      bottomDisabled,
      topActive,
      bottomActive,
    };
  }

  return {
    leftDisabled: false,
    rightDisabled: false,
    leftActive: params.occupiedSides.left,
    rightActive: params.occupiedSides.right,
    topDisabled,
    bottomDisabled,
    topActive,
    bottomActive,
  };
}

export function isContraventamentoVerticalSide(side: unknown): side is ContraventamentoVerticalSide {
  return side === 'left' || side === 'right';
}

export function isContraventamentoHorizontalSide(side: unknown): side is ContraventamentoHorizontalSide {
  return side === 'top' || side === 'bottom';
}

/**
 * Retorna o rótulo em português do lado de contraventamento.
 *
 * @param side Lado lógico.
 * @returns Rótulo de exibição.
 */
export function getContraventamentoSideLabel(side: ContraventamentoSide): string {
  switch (side) {
    case 'left':
      return 'esquerdo';
    case 'right':
      return 'direito';
    case 'top':
      return 'superior';
    case 'bottom':
      return 'inferior';
  }
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
