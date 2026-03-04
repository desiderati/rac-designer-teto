import {describe, expect, it} from 'vitest';
import {shouldResetHouseTypeOnSideSelectorCancel, shouldTransitionToNivelDefinition} from './house-side.ts';

describe('house-side.ts', () => {
  it('transitions to nivel definition only on initial positioning without slots', () => {
    expect(shouldTransitionToNivelDefinition({sideSelectorMode: 'position', hasPreAssignedSides: false})).toBe(true);
    expect(shouldTransitionToNivelDefinition({sideSelectorMode: 'position', hasPreAssignedSides: true})).toBe(false);
    expect(shouldTransitionToNivelDefinition({
      sideSelectorMode: 'choose-instance',
      hasPreAssignedSides: false
    })).toBe(false);
  });

  it('resets house type only on initial positioning without slots', () => {
    expect(shouldResetHouseTypeOnSideSelectorCancel({
      sideSelectorMode: 'position',
      hasPreAssignedSides: false
    })).toBe(true);
    expect(shouldResetHouseTypeOnSideSelectorCancel({
      sideSelectorMode: 'position',
      hasPreAssignedSides: true
    })).toBe(false);
    expect(shouldResetHouseTypeOnSideSelectorCancel({
      sideSelectorMode: 'choose-instance',
      hasPreAssignedSides: false
    })).toBe(false);
  });
});

