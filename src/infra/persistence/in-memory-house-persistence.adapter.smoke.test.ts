import {describe, expect, it} from 'vitest';
import {InMemoryHousePersistenceAdapter} from '@/infra/persistence/in-memory-house-persistence.adapter.ts';
import type {HouseState} from '@/shared/types/house.ts';

describe('in-memory-house-persistence.adapter.ts', () => {
  it('stores and loads the current house state in memory', () => {
    const persistence = new InMemoryHousePersistenceAdapter<unknown>();
    const state: HouseState<unknown> = {
      id: 'house_1',
      houseType: 'tipo6',
      pilotis: {},
      terrainType: 1,
      views: {top: [], front: [], back: [], side1: [], side2: []},
      sideMappings: {top: null, bottom: null, left: null, right: null},
      preAssignedSides: {},
    };

    expect(persistence.load()).toBeNull();

    persistence.save(state);
    expect(persistence.load()).toBe(state);

    persistence.save(null);
    expect(persistence.load()).toBeNull();
  });
});

