import type {DomainPilotiData, DomainViewType} from "./house-use-cases";
import type {DomainHouseSide} from "./house-view-layout-use-cases";

export function createDefaultPilotis(params: {
  pilotiIds: string[];
  defaultPiloti: DomainPilotiData;
}): Record<string, DomainPilotiData> {
  const pilotis: Record<string, DomainPilotiData> = {};
  params.pilotiIds.forEach((id) => {
    pilotis[id] = {...params.defaultPiloti};
  });
  return pilotis;
}

export function createEmptyViews<TInstance>(): Record<DomainViewType, TInstance[]> {
  return {
    top: [],
    front: [],
    back: [],
    side1: [],
    side2: [],
  };
}

export function createEmptySideAssignments(): Record<DomainHouseSide, DomainViewType | null> {
  return {
    top: null,
    bottom: null,
    left: null,
    right: null,
  };
}
