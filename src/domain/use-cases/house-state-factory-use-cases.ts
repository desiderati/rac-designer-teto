import {createDefaultPilotis, createEmptySideAssignments, createEmptyViews} from "./house-state-use-cases.ts";
import {HousePiloti, HouseState} from "@/shared/types/house.ts";

export function createInitialHouseState<TGroup = unknown>(params: {
  id: string;
  pilotiIds: string[];
  defaultPiloti: HousePiloti;
}): HouseState<TGroup> {
  return {
    id: params.id,
    houseType: null,
    pilotis: createDefaultPilotis({
      pilotiIds: params.pilotiIds,
      defaultPiloti: params.defaultPiloti,
    }),
    elements: [],
    views: createEmptyViews(),
    sideAssignments: createEmptySideAssignments(),
    preAssignedSides: {},
  };
}
