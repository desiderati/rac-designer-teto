import {HouseSideSelectorMode} from '@/components/rac-editor/ui/modals/selectors/HouseSideSelector.tsx';

export function shouldTransitionToNivelDefinition(params: {
  sideSelectorMode: HouseSideSelectorMode;
  hasPreAssignedSides: boolean;
}): boolean {
  return params.sideSelectorMode === 'position' && !params.hasPreAssignedSides;
}

export function shouldResetHouseTypeOnSideSelectorCancel(params: {
  sideSelectorMode: HouseSideSelectorMode;
  hasPreAssignedSides: boolean;
}): boolean {
  return params.sideSelectorMode === 'position' && !params.hasPreAssignedSides;
}
