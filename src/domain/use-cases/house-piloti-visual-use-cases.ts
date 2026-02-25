import {CANVAS_STYLE, PILOTI_MASTER_STYLE} from '@/config.ts';

export interface PilotiVisualDataPatch {
  pilotiHeight: number;
  pilotiIsMaster: boolean;
  pilotiNivel: number;
  height?: number;
  scaleY?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export function createPilotiVisualDataPatch(params: {
  height: number;
  isMaster: boolean;
  nivel: number;
  isRect: boolean;
  baseHeight: number;
  masterFill: string;
  masterStroke: string;
}): PilotiVisualDataPatch {
  return {
    pilotiHeight: params.height,
    pilotiIsMaster: params.isMaster,
    pilotiNivel: params.nivel,
    ...(params.isRect ? {height: params.baseHeight * params.height, scaleY: 1} : {}),
    ...(params.isMaster
      ? {
        fill: params.masterFill,
        stroke: params.masterStroke,
        strokeWidth: params.isRect ? PILOTI_MASTER_STYLE.strokeWidth : PILOTI_MASTER_STYLE.strokeWidthTopView,
      }
      : {}),
  };
}

export function createPilotiHeightTextPatch(formattedHeight: string): { text: string } {
  return {text: formattedHeight};
}

export function createPilotiSizeLabelPatch(formattedHeight: string): { text: string; backgroundColor: string } {
  return {
    text: formattedHeight,
    backgroundColor: CANVAS_STYLE.backgroundColor,
  };
}

export function createNivelLabelBackgroundPatch(): { backgroundColor: string } {
  return {
    backgroundColor: CANVAS_STYLE.backgroundColor,
  };
}


