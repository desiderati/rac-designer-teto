import type {HouseSide, HouseType, HouseViewType, HousePreAssignedSides} from '@/shared/types/house.ts';
import type {TopDoorPlacement} from '@/shared/types/house-door.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';

/**
 * Resolve qual tipo de vista define a posição da porta na planta,
 * de acordo com o tipo da casa.
 *
 * @param params Parâmetros de resolução com o tipo da casa.
 * @returns Tipo de vista fonte (`front`/`side2`) ou `null`.
 */
export function resolveTopDoorSourceViewType(params: {
  houseType: HouseType;
}): HouseViewType | null {
  if (params.houseType === 'tipo6') return 'front';
  if (params.houseType === 'tipo3') return 'side2';
  return null;
}

/**
 * Resolve em qual lado da planta o marcador de porta deve aparecer.
 *
 * @param params Tipo da casa e mapeamento de lados para vistas.
 * @returns Lado da planta (`top`, `bottom`, `left`, `right`) ou `null`.
 */
export function resolveTopDoorMarkerSide(params: {
  houseType: HouseType;
  sideMappings: Record<HouseSide, HouseViewType | null>;
  preAssignedSides?: HousePreAssignedSides;
}): HouseSide | null {
  const sourceViewType = resolveTopDoorSourceViewType({
    houseType: params.houseType,
  });
  if (!sourceViewType) return null;

  return (Object.keys(params.sideMappings) as HouseSide[]).find(
    (side) => params.sideMappings[side] === sourceViewType,
  ) ?? params.preAssignedSides?.[sourceViewType] ?? null;
}

/**
 * Calcula a posição final do marcador de porta na planta.
 *
 * @param params Dados do lado alvo, geometria da porta e dimensões do corpo da casa.
 * @returns Estrutura com lado e coordenadas alvo do marcador.
 */
export function calculateTopDoorPlacement(params: {
  doorMarkerSide: HouseSide | null;
  doorX: number;
  doorWidth: number;
  bodyWidth: number;
  bodyHeight: number;
}): TopDoorPlacement {
  if (!params.doorMarkerSide) {
    return {doorMarkerSide: null};
  }

  const axisLength =
    params.doorMarkerSide === 'top' || params.doorMarkerSide === 'bottom'
      ? params.bodyWidth
      : params.bodyHeight;

  const rawDoorCenter = params.doorX + params.doorWidth / 2;
  const doorCenter = Math.max(0, Math.min(axisLength, rawDoorCenter));

  if (params.doorMarkerSide === 'top') {
    return {
      doorMarkerSide: 'top',
      targetLeft: params.bodyWidth / 2 - doorCenter,
      targetTop: -params.bodyHeight / 2,
    };
  }
  if (params.doorMarkerSide === 'bottom') {
    return {
      doorMarkerSide: 'bottom',
      targetLeft: -params.bodyWidth / 2 + doorCenter,
      targetTop: params.bodyHeight / 2,
    };
  }
  if (params.doorMarkerSide === 'left') {
    return {
      doorMarkerSide: 'left',
      targetLeft: -params.bodyWidth / 2,
      targetTop: -params.bodyHeight / 2 + doorCenter,
    };
  }

  return {
    doorMarkerSide: 'right',
    targetLeft: params.bodyWidth / 2,
    targetTop: params.bodyHeight / 2 - doorCenter,
  };
}

/**
 * Calcula a geometria da porta já renderizada na escala atual da planta.
 *
 * @param params Lado do marcador e dimensões atuais do corpo da casa.
 * @returns Posição inicial da porta no eixo e largura renderizada.
 */
export function calculateRenderedDoorGeometryForTopMarker(params: {
  doorMarkerSide: HouseSide | null;
  bodyWidth: number;
  bodyHeight: number;
}): { doorX: number; doorWidth: number } {
  if (!params.doorMarkerSide) {
    return {doorX: 0, doorWidth: 0};
  }

  const isFrontBack = params.doorMarkerSide === 'top' || params.doorMarkerSide === 'bottom';
  if (isFrontBack) {
    const axisLength = params.bodyWidth;
    const scale = axisLength / HOUSE_DIMENSIONS.footprint.width;
    const doorWidth = HOUSE_DIMENSIONS.elements.common.doorWidth * scale;
    const windowWidth = HOUSE_DIMENSIONS.elements.common.windowWidth * scale;
    const windowShiftX = HOUSE_DIMENSIONS.elements.frontBack.windowShiftX * scale;
    const doorShiftX = HOUSE_DIMENSIONS.elements.frontBack.doorShiftX * scale;
    const doorX = axisLength - windowWidth - windowShiftX - doorWidth - doorShiftX;
    return {doorX, doorWidth};
  }

  const axisLength = params.bodyHeight;
  const scale = axisLength / HOUSE_DIMENSIONS.footprint.depth;
  const doorWidth = HOUSE_DIMENSIONS.elements.common.doorWidth * scale;
  const doorShiftX = HOUSE_DIMENSIONS.elements.side.doorShiftX * scale;
  const doorX = axisLength - doorWidth - doorShiftX;
  return {doorX, doorWidth};
}
