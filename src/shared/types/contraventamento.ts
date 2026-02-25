export const CONTRAVENTAMENTO_COLUMN_SPACING = 155 * 0.6;

export const CONTRAVENTAMENTO_COLUMN_CENTERS = [
  -1.5 * CONTRAVENTAMENTO_COLUMN_SPACING,
  -0.5 * CONTRAVENTAMENTO_COLUMN_SPACING,
  0.5 * CONTRAVENTAMENTO_COLUMN_SPACING,
  1.5 * CONTRAVENTAMENTO_COLUMN_SPACING,
];

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
