import type {SideSelectorMode} from "../hooks/useHouseTypeFlow";

export function shouldTransitionToNivelDefinition(params: {
  sideSelectorMode: SideSelectorMode;
  hasPreAssignedSlots: boolean;
}): boolean {
  return params.sideSelectorMode === "position" && !params.hasPreAssignedSlots;
}

export function shouldResetHouseTypeOnSideSelectorCancel(params: {
  sideSelectorMode: SideSelectorMode;
  hasPreAssignedSlots: boolean;
}): boolean {
  return params.sideSelectorMode === "position" && !params.hasPreAssignedSlots;
}
