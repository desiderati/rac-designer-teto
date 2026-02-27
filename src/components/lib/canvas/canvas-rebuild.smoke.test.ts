import {describe, expect, it} from 'vitest';
import {
  collectHouseGroupCandidates,
  findTopViewGroupCandidate,
  isHouseGroupCandidate,
  rebuildPilotiDataFromSources,
  toRebuildViewSource,
} from './canvas-rebuild.ts';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';

describe('canvas rebuild helpers', () => {
  it('rebuilds piloti data from sources', () => {
    const next = rebuildPilotiDataFromSources({
      pilotiIds: ['piloti_0_0'],
      currentPilotis: {piloti_0_0: {...DEFAULT_HOUSE_PILOTI}},
      defaultPiloti: DEFAULT_HOUSE_PILOTI,
      sources: [
        {
          objects: [{pilotiId: 'piloti_0_0', isPilotiCircle: true, pilotiHeight: 2.5}],
        },
      ],
    });

    expect(next.piloti_0_0.height).toBe(2.5);
  });

  it('filters and finds top view candidates', () => {
    const objects = [
      {type: 'group', myType: 'house', houseView: 'top'},
      {type: 'group', myType: 'house', houseView: 'front'},
    ];
    expect(isHouseGroupCandidate(objects[0] as any)).toBe(true);
    expect(collectHouseGroupCandidates(objects as any)).toHaveLength(2);
    expect(findTopViewGroupCandidate(objects as any)?.houseView).toBe('top');
  });

  it('maps group into rebuild source', () => {
    const group = {
      houseViewType: 'top',
      houseView: 'top',
      houseSide: 'top',
      houseInstanceId: 'top_1',
    } as any;

    const mapped = toRebuildViewSource(group);
    expect(mapped.metadata.houseViewType).toBe('top');
    expect(mapped.metadata.houseInstanceId).toBe('top_1');
  });
});
