import type {DomainHouseType, DomainPilotiData, DomainViewType} from "./house-use-cases";
import type {DomainHouseSide} from "./house-view-layout-use-cases";
import {createDefaultPilotis, createEmptySideAssignments, createEmptyViews} from "./house-state-use-cases";

export interface DomainHouseStateSnapshot<TElement, TViewInstance> {
  id: string;
  houseType: DomainHouseType | null;
  pilotis: Record<string, DomainPilotiData>;
  elements: TElement[];
  views: Record<DomainViewType, TViewInstance[]>;
  sideAssignments: Record<DomainHouseSide, DomainViewType | null>;
  preAssignedSlots: Record<string, DomainHouseSide>;
}

export function createInitialHouseState<TElement, TViewInstance>(params: {
  id: string;
  pilotiIds: string[];
  defaultPiloti: DomainPilotiData;
}): DomainHouseStateSnapshot<TElement, TViewInstance> {
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
    preAssignedSlots: {},
  };
}
