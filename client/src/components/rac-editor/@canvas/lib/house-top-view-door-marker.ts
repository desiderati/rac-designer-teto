import {HouseRuntimeViewInstance, HouseSide, HouseType, HouseViewType, type HousePreAssignedSides} from '@/shared/types/house.ts';
import {TopDoorMarkerBodySize, TopDoorMarkerVisualPatch} from '@/shared/types/house-door.ts';
import {calculateRenderedDoorGeometryForTopMarker, calculateTopDoorPlacement, resolveTopDoorMarkerSide} from '@/shared/lib/house-door-geometry.ts';
export {calculateRenderedDoorGeometryForTopMarker, calculateTopDoorPlacement, resolveTopDoorMarkerSide, resolveTopDoorSourceViewType} from '@/shared/lib/house-door-geometry.ts';
import {CanvasGroup, getCanvasGroupObjects} from '@/components/rac-editor/@canvas/lib';

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
  preAssignedSides?: HousePreAssignedSides;
  topViews: HouseRuntimeViewInstance<CanvasGroup>[];
  /** Recalcula a posição longitudinal; false a preserva e apenas centraliza na borda. */
  reposition?: boolean;
}): boolean {
  const doorMarkerSide = resolveTopDoorMarkerSide({
    houseType: params.houseType,
    sideMappings: params.sideMappings,
    preAssignedSides: params.preAssignedSides,
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

    // O layout do Fabric recentraliza os filhos ao acrescentar setas/legendas.
    // As medidas da planta partem do corpo, não da origem variável do grupo.
    const bodyCenter = canvasObjectHouseBody?.getRelativeCenterPoint?.()
      ?? {x: canvasObjectHouseBody?.left ?? 0, y: canvasObjectHouseBody?.top ?? 0};
    const targetLeft = placement.targetLeft === undefined ? undefined : bodyCenter.x + placement.targetLeft;
    const targetTop = placement.targetTop === undefined ? undefined : bodyCenter.y + placement.targetTop;

    for (const canvasObjectMarker of topDoorMarker) {
      const markerMetadata = canvasObjectMarker as {
        markerSide?: HouseSide;
        doorMarkerSide?: HouseSide;
      };
      const side = markerMetadata.doorMarkerSide ?? markerMetadata.markerSide;
      if (!side) continue;

      canvasObjectMarker.set(createTopDoorMarkerVisualPatch({
        doorMarkerSide: placement.doorMarkerSide,
        markerCandidateSide: side,
        ...(params.reposition === false
          ? (side === 'top' || side === 'bottom'
            ? {targetTop}
            : {targetLeft})
          : {targetLeft, targetTop}),
      }));
      canvasObjectMarker.setCoords?.();
      canvasObjectMarker.dirty = true;
      hasChanges = true;
    }

    group.setCoords();
    group.dirty = true;
  }

  return hasChanges;
}
