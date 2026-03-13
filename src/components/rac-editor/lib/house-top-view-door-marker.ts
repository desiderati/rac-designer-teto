import {HouseSide, HouseType, HouseViewInstance, HouseViewType,} from '@/shared/types/house.ts';
import {TopDoorMarkerBodySize, TopDoorMarkerVisualPatch, TopDoorPlacement} from '@/shared/types/house-door.ts';
import {HOUSE_DIMENSIONS} from '@/shared/types/house-dimensions.ts';
import {CanvasGroup, getCanvasGroupObjects} from '@/components/rac-editor/lib/canvas';

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
}): HouseSide | null {
  const sourceViewType = resolveTopDoorSourceViewType({
    houseType: params.houseType,
  });
  if (!sourceViewType) return null;

  return (
    (Object.keys(params.sideMappings) as HouseSide[]).find(
      (side) => params.sideMappings[side] === sourceViewType,
    ) ?? null
  );
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

/**
 * Calcula largura e altura renderizadas do corpo da casa considerando escala.
 *
 * @param params Dimensões base e escalas atuais.
 * @returns Dimensões renderizadas usadas no posicionamento do marcador.
 */
export function calculateTopDoorMarkerBodySize(params: {
  width: number;
  height: number;
  scaleX?: number;
  scaleY?: number;
}): TopDoorMarkerBodySize {
  return {
    bodyWidth: Math.max(params.width * (params.scaleX ?? 1), 1),
    bodyHeight: Math.max(params.height * (params.scaleY ?? 1), 1),
  };
}

/**
 * Cria o patch visual do marcador de porta para aplicar no objeto Fabric.
 *
 * @param params Lado ativo, lado do marcador candidato e coordenadas alvo.
 * @returns Patch com visibilidade e, quando ativo, posição (`left`/`top`).
 */
export function createTopDoorMarkerVisualPatch(params: {
  doorMarkerSide: HouseSide | null;
  markerCandidateSide: HouseSide;
  targetLeft?: number;
  targetTop?: number;
}): TopDoorMarkerVisualPatch {
  const isActive = params.doorMarkerSide !== null && params.markerCandidateSide === params.doorMarkerSide;
  return {
    visible: isActive,
    ...(isActive && params.targetLeft !== undefined ? {left: params.targetLeft} : {}),
    ...(isActive && params.targetTop !== undefined ? {top: params.targetTop} : {}),
  };
}

/**
 * Atualiza os marcadores de porta em todas as vistas de planta informadas.
 *
 * A função resolve o lado da porta pela configuração da casa, calcula
 * posicionamento em cada grupo e aplica o patch visual em cada marcador.
 *
 * @param params Tipo da casa, mapeamentos de lado e instâncias de planta.
 * @returns `true` quando houve mudança visual em pelo menos um marcador.
 */
export function refreshTopDoorMarkersInViews(params: {
  houseType: HouseType;
  sideMappings: Record<HouseSide, HouseViewType | null>;
  topViews: HouseViewInstance<CanvasGroup>[];
}): boolean {
  const doorMarkerSide = resolveTopDoorMarkerSide({
    houseType: params.houseType,
    sideMappings: params.sideMappings,
  });

  let hasChanges = false;
  for (const topInstance of params.topViews) {
    const group = topInstance.group;
    const groupObjects = getCanvasGroupObjects(group);

    const topDoorMarker =
      groupObjects.filter((object) => object.isTopDoorMarker);
    if (topDoorMarker.length === 0) continue;

    const houseBody =
      groupObjects.find((object) => object.isHouseBody);
    const canvasObjectHouseBody = houseBody ?? null;

    const {bodyWidth, bodyHeight} = calculateTopDoorMarkerBodySize({
      width: canvasObjectHouseBody?.width ?? 0,
      height: canvasObjectHouseBody?.height ?? 0,
      scaleX: canvasObjectHouseBody?.scaleX ?? 1,
      scaleY: canvasObjectHouseBody?.scaleY ?? 1,
    });

    const renderedDoorGeometry =
      calculateRenderedDoorGeometryForTopMarker({
        doorMarkerSide,
        bodyWidth,
        bodyHeight,
      });

    const placement = calculateTopDoorPlacement({
      doorMarkerSide,
      doorX: renderedDoorGeometry.doorX,
      doorWidth: renderedDoorGeometry.doorWidth,
      bodyWidth,
      bodyHeight,
    });

    for (const canvasObjectMarker of topDoorMarker) {
      const markerMetadata = canvasObjectMarker as {
        markerSide?: HouseSide;
        doorMarkerSide?: HouseSide;
      };
      const side = markerMetadata.doorMarkerSide ?? markerMetadata.markerSide;
      if (!side) continue;

      canvasObjectMarker.set(
        createTopDoorMarkerVisualPatch({
          doorMarkerSide: placement.doorMarkerSide,
          markerCandidateSide: side,
          targetLeft: placement.targetLeft,
          targetTop: placement.targetTop,
        }),
      );
      canvasObjectMarker.setCoords?.();
      canvasObjectMarker.dirty = true;
      hasChanges = true;
    }

    group.setCoords();
    group.dirty = true;
  }

  return hasChanges;
}
