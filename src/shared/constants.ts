import {CANVAS_DEFAULTS, CONTRAVENTAMENTO, HOUSE_DEFAULTS, PILOTI_MASTER_STYLE, PILOTI_STYLE} from '@/shared/config.ts';

export const CANVAS_WIDTH = CANVAS_DEFAULTS.width;
export const CANVAS_HEIGHT = CANVAS_DEFAULTS.height;

// Tolerância padrão para comparações numéricas com ponto flutuante.
export const NUMERIC_EPSILON = 1e-4;

export const HOUSE_BASE_WIDTH = HOUSE_DEFAULTS.width;
export const HOUSE_BASE_HEIGHT = HOUSE_DEFAULTS.height;

export const PILOTI_BASE_HEIGHT_PX = HOUSE_DEFAULTS.pilotiBaseHeight * 100;
export const PILOTI_BASE_HEIGHT_PX_WITH_SCALE = PILOTI_BASE_HEIGHT_PX * HOUSE_DEFAULTS.viewScale;

export const PILOTI_DEFAULT_NIVEL = HOUSE_DEFAULTS.pilotiNivel;
export const PILOTI_STROKE_COLOR = PILOTI_STYLE.strokeColor;

// Colors for master piloti (same as door - light brown)
export const PILOTI_MASTER_FILL_COLOR = PILOTI_MASTER_STYLE.fillColor;
export const PILOTI_MASTER_STROKE_COLOR = PILOTI_MASTER_STYLE.strokeColor;

export const CONTRAVENTAMENTO_FILL = CONTRAVENTAMENTO.fillColor;
export const CONTRAVENTAMENTO_STROKE = CONTRAVENTAMENTO.strokeColor;
export const CONTRAVENTAMENTO_STROKE_WIDTH = CONTRAVENTAMENTO.strokeWidth;
