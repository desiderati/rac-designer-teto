import {describe, expect, it} from 'vitest';
import {
  applyPilotiUpdateWithSingleMasterRule,
  calculateRecommendedPilotiData,
  canAddViewForType,
  getAvailableViewsByCounts,
  getMaxViewCountForType,
  isViewAtLimitForType,
} from '@/domain/use-cases/house-use-cases.ts';
import {ALL_HOUSE_VIEW_TYPES} from '@/shared/types/house.ts';

const defaultPiloti = {
  height: 1.0,
  isMaster: false,
  nivel: 0.2,
};

describe('house domain use cases', () => {
  it('exposes the full ordered list of view types', () => {
    expect(ALL_HOUSE_VIEW_TYPES).toEqual(['top', 'front', 'back', 'side1', 'side2']);
  });

  it('resolves view limits by house type', () => {
    expect(getMaxViewCountForType('tipo6', 'front')).toBe(1);
    expect(getMaxViewCountForType('tipo6', 'side2')).toBe(0);
    expect(getMaxViewCountForType('tipo3', 'front')).toBe(0);
    expect(getMaxViewCountForType('tipo3', 'back')).toBe(2);
    expect(getMaxViewCountForType(null, 'top')).toBe(0);
  });

  it('determines if a view can be added', () => {
    expect(canAddViewForType('tipo6', 'front', 0)).toBe(true);
    expect(canAddViewForType('tipo6', 'front', 1)).toBe(false);
    expect(canAddViewForType('tipo3', 'side2', 0)).toBe(true);
    expect(canAddViewForType('tipo3', 'side2', 1)).toBe(false);
    expect(canAddViewForType(null, 'top', 0)).toBe(false);
  });

  it('determines if a view is at limit and resolves globally available views', () => {
    expect(isViewAtLimitForType('tipo6', 'front', 0)).toBe(false);
    expect(isViewAtLimitForType('tipo6', 'front', 1)).toBe(true);
    expect(isViewAtLimitForType(null, 'top', 0)).toBe(true);

    expect(
      getAvailableViewsByCounts({
        houseType: 'tipo6',
        counts: {
          top: 1,
          front: 1,
          back: 0,
          side1: 1,
          side2: 0,
        },
      }),
    ).toEqual(['back', 'side1']);
  });

  it('applies the single-master rule when updating pilotis', () => {
    const pilotis = {
      piloti_0_0: {height: 1.2, isMaster: true, nivel: 0.4},
      piloti_3_2: {height: 1.5, isMaster: false, nivel: 0.5},
    };

    const updated = applyPilotiUpdateWithSingleMasterRule({
      pilotis,
      pilotiId: 'piloti_3_2',
      patch: {isMaster: true, nivel: 0.7},
      defaultPiloti,
    });

    expect(updated.clearedMasters).toEqual(['piloti_0_0']);
    expect(updated.pilotis.piloti_0_0.isMaster).toBe(false);
    expect(updated.pilotis.piloti_3_2.isMaster).toBe(true);
    expect(updated.pilotis.piloti_3_2.nivel).toBe(0.7);
  });

  it('calculates recommended piloti heights from corner levels', () => {
    const pilotis = {
      piloti_0_0: {height: 1.0, isMaster: false, nivel: 0.2},
      piloti_3_0: {height: 1.0, isMaster: false, nivel: 0.4},
      piloti_0_2: {height: 1.0, isMaster: false, nivel: 0.6},
      piloti_3_2: {height: 1.0, isMaster: false, nivel: 0.8},
    };

    const updated = calculateRecommendedPilotiData({
      pilotis,
      defaultPiloti,
    });

    expect(updated.piloti_0_0.nivel).toBe(0.2);
    expect(updated.piloti_3_2.nivel).toBe(0.8);
    expect(updated.piloti_1_1.nivel).toBe(0.47);
    expect(updated.piloti_1_1.height).toBe(1.5);
  });
});
