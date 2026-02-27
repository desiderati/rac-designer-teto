import {describe, expect, it} from 'vitest';
import type {HousePersistencePort} from './house-persistence-port.ts';
import type {HouseState} from '@/shared/types/house.ts';

class MemoryHousePersistence implements HousePersistencePort<string> {
  private state: HouseState<string> | null = null;

  load(): HouseState<string> | null {
    return this.state;
  }

  save(state: HouseState<string> | null): void {
    this.state = state;
  }
}

describe('house persistence port', () => {
  it('supports load/save contract in a minimal implementation', () => {
    const persistence = new MemoryHousePersistence();
    const state: HouseState<string> = {
      id: 'house-1',
      houseType: 'tipo6',
      pilotis: {},
      views: {
        top: [],
        front: [],
        back: [],
        side1: [],
        side2: [],
      },
      sideMappings: {
        top: null,
        bottom: null,
        left: null,
        right: null,
      },
      preAssignedSides: {},
    };

    expect(persistence.load()).toBeNull();
    persistence.save(state);
    expect(persistence.load()).toEqual(state);
  });
});
