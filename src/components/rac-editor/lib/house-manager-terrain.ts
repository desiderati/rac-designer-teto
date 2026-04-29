import type {Canvas as FabricCanvas} from 'fabric';
import type {
  HouseState,
  HouseViewInstance,
} from '@/shared/types/house.ts';
import {
  CanvasGroup,
  toCanvasGroup,
} from '@/components/rac-editor/lib/canvas';
import {updateGroundTerrainType} from '@/components/rac-editor/lib/canvas/terrain.ts';
import {normalizeTerrainSolidityLevel} from '@/shared/config.ts';

/**
 * Coleta apenas vistas de elevação, excluindo a planta.
 */
export function collectElevationViewInstances<TGroup>(
  house: Pick<HouseState<TGroup>, 'views'> | null | undefined,
): HouseViewInstance<TGroup>[] {
  if (!house) return [];

  return [
    ...house.views.front,
    ...house.views.back,
    ...house.views.side1,
    ...house.views.side2,
  ];
}

/**
 * Aplica o tipo de terreno vigente a todas as vistas elevadas registradas.
 */
export function applyTerrainTypeToElevationViews(
  house: Pick<HouseState<CanvasGroup>, 'views'> | null | undefined,
  terrainType: number,
): void {
  collectElevationViewInstances(house).forEach((instance) => {
    updateGroundTerrainType(instance.group, terrainType);
  });
}

/**
 * Recupera o tipo de terreno a partir do canvas em fluxos de rebuild/import.
 */
export function resolveTerrainTypeFromCanvasFallback(params: {
  canvas: FabricCanvas | null;
  fallbackTerrainType: number;
}): number {
  const fromCanvas = params.canvas?.getObjects()
    .find((object): object is CanvasGroup => {
      const runtime = toCanvasGroup(object);
      return (
        runtime?.myType === 'house'
        && runtime.houseView !== 'top'
        && Number.isFinite(Number(runtime.groundTerrainType))
      );
    });

  const terrainFromCanvas = Number(fromCanvas?.groundTerrainType);
  if (Number.isFinite(terrainFromCanvas)) {
    return normalizeTerrainSolidityLevel(terrainFromCanvas);
  }

  return params.fallbackTerrainType;
}
