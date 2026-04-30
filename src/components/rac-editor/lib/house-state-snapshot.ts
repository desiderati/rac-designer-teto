import {
  ALL_HOUSE_VIEW_TYPES,
  type HouseState,
  type HouseViews,
} from '@/shared/types/house.ts';

/**
 * Cria uma cópia rasa e estável do estado lógico da casa para portas de leitura.
 */
export function createHouseStateSnapshot(house: HouseState | null): HouseState | null {
  if (!house) return null;

  const views = {} as HouseViews;
  ALL_HOUSE_VIEW_TYPES.forEach((viewType) => {
    views[viewType] = [...house.views[viewType]];
  });

  return {
    ...house,
    pilotis: {...house.pilotis},
    views,
    sideMappings: {...house.sideMappings},
    preAssignedSides: {...house.preAssignedSides},
  };
}
