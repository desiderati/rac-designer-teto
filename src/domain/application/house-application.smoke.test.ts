import {describe, expect, it} from 'vitest';
import type {HouseRepository} from '@/domain/repository/house-repository.ts';
import {
  applyPilotiUpdate,
  canAddView,
  getMaxViewCount,
  recalculateRecommendedPilotiData,
} from '@/domain/application/house-application.ts';
import {HousePiloti} from '@/shared/types/house.ts';

function createRepository(seed?: {
  houseType?: 'tipo6' | 'tipo3' | null;
  viewCounts?: Partial<Record<'top' | 'front' | 'back' | 'side1' | 'side2', number>>;
  pilotis?: Record<string, { height: number; isMaster: boolean; nivel: number }>;
}): HouseRepository {
  const houseType = seed?.houseType ?? 'tipo6';
  const viewCounts = {
    top: 0,
    front: 0,
    back: 0,
    side1: 0,
    side2: 0,
    ...(seed?.viewCounts ?? {}),
  };
  let pilotis: Record<string, HousePiloti> = {
    piloti_0_0: {height: 1.0, isMaster: false, nivel: 0.2},
    piloti_3_0: {height: 1.0, isMaster: false, nivel: 0.2},
    piloti_0_2: {height: 1.0, isMaster: false, nivel: 0.2},
    piloti_3_2: {height: 1.0, isMaster: false, nivel: 0.2},
    ...(seed?.pilotis ?? {}),
  };

  return {
    getHouseType: () => houseType,
    getViewCount: (viewType) => viewCounts[viewType],
    getPilotis: () => pilotis,
    setPilotis: (nextPilotis) => {
      pilotis = nextPilotis;
    },
  };
}

describe('house application services', () => {
  it('gets max view count from repository house type', () => {
    const repo = createRepository({houseType: 'tipo3'});
    expect(getMaxViewCount(repo, 'front')).toBe(0);
    expect(getMaxViewCount(repo, 'back')).toBe(2);
  });

  it('checks if a view can be added using repository state', () => {
    const repo = createRepository({houseType: 'tipo6', viewCounts: {front: 1}});
    expect(canAddView(repo, 'front')).toBe(false);
    expect(canAddView(repo, 'back')).toBe(true);
  });

  it('applies piloti update and enforces single master', () => {
    const repo = createRepository({
      pilotis: {
        piloti_0_0: {height: 1.0, isMaster: true, nivel: 0.3},
        piloti_3_2: {height: 1.5, isMaster: false, nivel: 0.6},
      },
    });

    const result = applyPilotiUpdate(repo, 'piloti_3_2', {isMaster: true}, {height: 1, isMaster: false, nivel: 0.2});
    const pilotis = repo.getPilotis();

    expect(result.clearedMasters).toEqual(['piloti_0_0']);
    expect(pilotis.piloti_0_0.isMaster).toBe(false);
    expect(pilotis.piloti_3_2.isMaster).toBe(true);
  });

  it('recalculates recommended piloti data through repository', () => {
    const repo = createRepository({
      pilotis: {
        piloti_0_0: {height: 1.0, isMaster: false, nivel: 0.2},
        piloti_3_0: {height: 1.0, isMaster: false, nivel: 0.4},
        piloti_0_2: {height: 1.0, isMaster: false, nivel: 0.6},
        piloti_3_2: {height: 1.0, isMaster: false, nivel: 0.8},
      },
    });

    recalculateRecommendedPilotiData(repo, {height: 1, isMaster: false, nivel: 0.2});
    const pilotis = repo.getPilotis();

    expect(pilotis.piloti_1_1.nivel).toBe(0.47);
    expect(pilotis.piloti_1_1.height).toBe(1.5);
  });
});
