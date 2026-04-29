import type {
  HouseState,
  HouseViewInstance,
} from '@/shared/types/house.ts';
import {
  CanvasGroup,
} from '@/components/rac-editor/canvas/lib';
import {updateGroundTerrainType} from '@/components/rac-editor/canvas/lib/terrain.ts';

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
