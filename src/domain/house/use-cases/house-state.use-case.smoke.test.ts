import {describe, expect, it} from 'vitest';
import {createDefaultPilotis, createEmptySideMappings, createEmptyViews,} from './house-state.use-case.ts';
import type {HousePiloti} from '@/shared/types/house.ts';

describe('house-state use cases', () => {
  it('creates default pilotis for all ids with cloned values', () => {
    const defaultPiloti: HousePiloti = {height: 1, isMaster: false, nivel: 0.2};
    const pilotis = createDefaultPilotis({
      pilotiIds: ['piloti_0_0', 'piloti_1_0'],
      defaultPiloti,
    });

    expect(Object.keys(pilotis)).toEqual(['piloti_0_0', 'piloti_1_0']);
    expect(pilotis.piloti_0_0).toEqual(defaultPiloti);
    expect(pilotis.piloti_1_0).toEqual(defaultPiloti);
    expect(pilotis.piloti_0_0).not.toBe(defaultPiloti);
    expect(pilotis.piloti_1_0).not.toBe(defaultPiloti);
  });

  it('creates empty views for all house view types', () => {
    const views = createEmptyViews<{ id: string }>();
    expect(views.top).toEqual([]);
    expect(views.front).toEqual([]);
    expect(views.back).toEqual([]);
    expect(views.side1).toEqual([]);
    expect(views.side2).toEqual([]);
  });

  it('creates empty side mappings', () => {
    const mappings = createEmptySideMappings();
    expect(mappings).toEqual({
      top: null,
      bottom: null,
      left: null,
      right: null,
    });
  });
});
