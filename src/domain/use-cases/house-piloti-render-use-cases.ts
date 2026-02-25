export function calculateCornerNivelLabelTop(params: {
  centerY: number;
  radius: number;
  offset: number;
  isTopCorner: boolean;
}): number {
  return params.isTopCorner ? params.centerY - params.radius - params.offset : params.centerY + params.radius + params.offset;
}

export interface PilotiNivelTextPatch {
  text: string;
  visible: boolean;
  left?: number;
  top?: number;
}

export function createPilotiNivelTextPatch(params: {
  isCorner: boolean;
  formattedNivel: string;
  centerX: number;
  centerY: number;
  radius: number;
  offset: number;
  isTopCorner: boolean;
}): PilotiNivelTextPatch {
  if (!params.isCorner) {
    return {
      text: "",
      visible: false,
    };
  }

  return {
    text: `Nível = ${params.formattedNivel}`,
    left: params.centerX,
    top: calculateCornerNivelLabelTop({
      centerY: params.centerY,
      radius: params.radius,
      offset: params.offset,
      isTopCorner: params.isTopCorner,
    }),
    visible: true,
  };
}

export function calculatePilotiSizeLabelPosition(params: {
  rectLeft: number;
  rectTop: number;
  rectWidth: number;
  rectHeight: number;
  baseHeight: number;
  basePilotiHeightPx: number;
}): { left: number; top: number } {
  const s = params.baseHeight / params.basePilotiHeightPx;
  const offset = 8 * s;
  return {
    left: params.rectLeft + params.rectWidth / 2,
    top: params.rectTop + params.rectHeight + offset,
  };
}

export function calculatePilotiStripeGeometry(params: {
  rectTop: number;
  rectHeight: number;
}): { top: number; height: number } {
  return {
    height: (params.rectHeight * 2) / 3,
    top: params.rectTop + params.rectHeight / 3,
  };
}
