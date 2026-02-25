import {HouseSideSelectorMode} from '@/components/rac-editor/modals/selectors/HouseSideSelector.tsx';

export function shouldTransitionToNivelDefinition(params: {
  sideSelectorMode: HouseSideSelectorMode;
  hasPreAssignedSlots: boolean;
}): boolean {
  return params.sideSelectorMode === 'position' && !params.hasPreAssignedSlots;
}

export function shouldResetHouseTypeOnSideSelectorCancel(params: {
  sideSelectorMode: HouseSideSelectorMode;
  hasPreAssignedSlots: boolean;
}): boolean {
  return params.sideSelectorMode === 'position' && !params.hasPreAssignedSlots;
}
