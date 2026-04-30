import {describe, expect, it} from 'vitest';
import {createHouseStateSnapshot} from './house-state-snapshot.ts';
import type {HouseState} from '@/shared/types/house.ts';

describe('createHouseStateSnapshot', () => {
  it('copia coleções mutáveis do estado lógico da casa', () => {
    const house: HouseState = {
      id: 'house_1',
      houseType: 'tipo6',
      pilotis: {A1: {height: 1, isMaster: true, nivel: 0}},
      terrainType: 2,
      views: {
        top: [{instanceId: 'top_1'}],
        front: [],
        back: [],
        side1: [],
        side2: [],
      },
      sideMappings: {
        top: 'front',
        bottom: 'back',
        left: 'side1',
        right: null,
      },
      preAssignedSides: {front_1: 'top'},
    };

    const snapshot = createHouseStateSnapshot(house);

    expect(snapshot).toEqual(house);
    expect(snapshot).not.toBe(house);
    expect(snapshot?.pilotis).not.toBe(house.pilotis);
    expect(snapshot?.views.top).not.toBe(house.views.top);
    expect(snapshot?.sideMappings).not.toBe(house.sideMappings);
    expect(snapshot?.preAssignedSides).not.toBe(house.preAssignedSides);
  });
});
