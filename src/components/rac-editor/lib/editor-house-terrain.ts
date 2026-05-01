import type {
  HouseRuntimeViews,
  HouseRuntimeViewInstance,
} from '@/shared/types/house.ts';

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
