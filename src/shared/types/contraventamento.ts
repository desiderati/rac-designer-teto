import {HOUSE_DEFAULTS} from '@/config.ts';
import {HOUSE_DIMENSIONS} from '@/components/lib/house-dimensions.ts';

export const CONTRAVENTAMENTO_COLUMN_SPACING = HOUSE_DIMENSIONS.piloti.columnSpacing * HOUSE_DEFAULTS.viewScale;

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
