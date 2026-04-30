import type {
  HouseRuntimeViews,
  HouseRuntimeViewInstance,
} from '@/shared/types/house.ts';
import {
  CanvasGroup,
} from '@/components/rac-editor/@canvas/lib';
import {updateGroundTerrainType} from '@/components/rac-editor/@canvas/lib/terrain.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';

/**
 * Coleta apenas vistas de elevação, excluindo a planta.
 */
export function collectElevationViewInstances<TGroup>(
  house: { views: HouseRuntimeViews<TGroup> } | null | undefined,
): HouseRuntimeViewInstance<TGroup>[] {
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
  house: Pick<HouseRuntimeSnapshot<CanvasGroup>, 'views'> | null | undefined,
  terrainType: number,
): void {
  collectElevationViewInstances(house).forEach((instance) => {
    updateGroundTerrainType(instance.group, terrainType);
  });
}
