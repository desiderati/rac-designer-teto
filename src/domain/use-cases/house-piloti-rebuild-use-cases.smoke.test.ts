import {describe, expect, it} from 'vitest';
import {getAllPilotiIds, rebuildPilotiDataFromSources} from './house-piloti-rebuild-use-cases.ts';

const defaultPiloti = {
  height: 1.0,
  isMaster: false,
  nivel: 0.2,
};

describe('house-piloti rebuild use cases', () => {
  it('returns all 12 piloti ids and initializes with current/default values', () => {
    const ids = getAllPilotiIds();
    expect(ids).toHaveLength(12);
    expect(ids).toContain('piloti_0_0');
    expect(ids).toContain('piloti_3_2');

    const rebuilt = rebuildPilotiDataFromSources({
      pilotiIds: ids,
      currentPilotis: {
        piloti_0_0: {height: 2.0, isMaster: true, nivel: 0.8},
      },
      defaultPiloti,
      sources: [],
    });

    expect(rebuilt.piloti_0_0).toEqual({height: 2.0, isMaster: true, nivel: 0.8});
    expect(rebuilt.piloti_3_2).toEqual(defaultPiloti);
  });

  it('rebuilds piloti data from source objects using circle/rect markers', () => {
    const rebuilt = rebuildPilotiDataFromSources({
      pilotiIds: getAllPilotiIds(),
      currentPilotis: {},
      defaultPiloti,
      sources: [
        {
          objects: [
            {
              pilotiId: 'piloti_1_1',
              isPilotiCircle: true,
              pilotiHeight: 2.5,
              pilotiIsMaster: true,
              pilotiNivel: 0.9,
            },
            {
              pilotiId: 'piloti_2_1',
              isPilotiRect: true,
              pilotiHeight: 1.5,
              pilotiIsMaster: false,
              pilotiNivel: 0.4,
            },
            {
              pilotiId: 'piloti_0_0',
              pilotiHeight: 3.0,
            },
          ],
        },
      ],
    });

    expect(rebuilt.piloti_1_1).toEqual({height: 2.5, isMaster: true, nivel: 0.9});
    expect(rebuilt.piloti_2_1).toEqual({height: 1.5, isMaster: false, nivel: 0.4});
    expect(rebuilt.piloti_0_0).toEqual(defaultPiloti);
  });
});
