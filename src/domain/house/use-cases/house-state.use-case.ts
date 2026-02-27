import {HousePiloti, HouseSide, HouseViewType} from '@/shared/types/house.ts';

export function createDefaultPilotis(params: {
  pilotiIds: string[];
  defaultPiloti: HousePiloti;
}): Record<string, HousePiloti> {

  const pilotis: Record<string, HousePiloti> = {};
  params.pilotiIds.forEach((id) => {
    pilotis[id] = {...params.defaultPiloti};
  });
  return pilotis;
}

export function createEmptyViews<TInstance>(): Record<HouseViewType, TInstance[]> {
  return {
    top: [],
    front: [],
    back: [],
    side1: [],
    side2: [],
  };
}

export function createEmptySideMappings(): Record<HouseSide, HouseViewType | null> {
  return {
    top: null,
    bottom: null,
    left: null,
    right: null,
  };
}
