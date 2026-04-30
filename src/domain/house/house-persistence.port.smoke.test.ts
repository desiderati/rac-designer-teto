import {describe, expect, it} from 'vitest';
import type {HousePersistencePort} from './house-persistence.port.ts';
import type {HouseState} from '@/shared/types/house.ts';

class MemoryHousePersistence implements HousePersistencePort {
  private state: HouseState | null = null;

  load(): HouseState | null {
    return this.state;
  }

  save(state: HouseState | null): void {
    this.state = state;
  }
}

describe('house-persistence.port.ts', () => {
  it('suporta o contrato de load/save em uma implementação mínima', () => {
    const persistence = new MemoryHousePersistence();
    const state: HouseState = {
      id: 'house-1',
      houseType: 'tipo6',
      pilotis: {},
      terrainType: 1,
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

