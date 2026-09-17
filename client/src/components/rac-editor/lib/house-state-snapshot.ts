import {
  ALL_HOUSE_VIEW_TYPES,
  type HousePiloti,
  type HouseState,
  type HouseViews,
} from '@/shared/types/house.ts';

export function cloneHousePilotis(pilotis: Record<string, HousePiloti>): Record<string, HousePiloti> {
  return Object.fromEntries(
    Object.entries(pilotis).map(([pilotiId, piloti]) => [pilotiId, {...piloti}]),
  );
}

export function cloneHouseViews(views: HouseViews): HouseViews {
  const clonedViews = {} as HouseViews;
  ALL_HOUSE_VIEW_TYPES.forEach((viewType) => {
    clonedViews[viewType] = views[viewType].map((view) => ({...view}));
  });
  return clonedViews;
}

/**
 * Cria uma cópia estável do estado lógico da casa para portas de leitura.
 */
export function createHouseStateSnapshot(house: HouseState | null): HouseState | null {
  if (!house) return null;

  return {
    ...house,
    pilotis: cloneHousePilotis(house.pilotis),
    views: cloneHouseViews(house.views),
    sideMappings: {...house.sideMappings},
    preAssignedSides: {...house.preAssignedSides},
  };
}
