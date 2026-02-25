import {describe, expect, it} from 'vitest';
import {rebuildViewsFromSources} from '@/domain/use-cases/house-views-rebuild-use-cases.ts';

describe('house views rebuild use cases', () => {
  it('rebuilds normalized views with inferred type/side and unique ids', () => {
    const g1 = {id: 'g1'};
    const g2 = {id: 'g2'};
    const g3 = {id: 'g3'};
    const g4 = {id: 'g4'};

    const rebuilt = rebuildViewsFromSources({
      houseType: 'tipo3',
      sources: [
        {group: g1, meta: {houseView: 'top', houseInstanceId: '  '}},
        {group: g2, meta: {houseView: 'side', isRightSide: true}},
        {group: g3, meta: {houseView: 'side', isRightSide: false}},
        {group: g4, meta: {houseViewType: 'back', houseSide: 'top', houseInstanceId: 'dup'}},
        {group: {id: 'g5'}, meta: {houseViewType: 'back', houseSide: 'bottom', houseInstanceId: 'dup'}},
      ],
    });

    expect(rebuilt.views.top).toHaveLength(1);
    expect(rebuilt.views.side1).toHaveLength(1);
    expect(rebuilt.views.side2).toHaveLength(1);
    expect(rebuilt.views.back).toHaveLength(2);
    expect(rebuilt.views.side1[0]?.side).toBe('right');
    expect(rebuilt.views.side2[0]?.side).toBe('left');

    const ids = rebuilt.normalizedItems.map((item) => item.instanceId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ignores sources that cannot infer a valid view type', () => {
    const rebuilt = rebuildViewsFromSources({
      houseType: null,
      sources: [
        {group: {id: 'x'}, meta: {houseView: 'unknown'}},
      ],
    });

    expect(rebuilt.normalizedItems).toHaveLength(0);
    expect(rebuilt.views.top).toHaveLength(0);
    expect(rebuilt.views.front).toHaveLength(0);
    expect(rebuilt.views.back).toHaveLength(0);
    expect(rebuilt.views.side1).toHaveLength(0);
    expect(rebuilt.views.side2).toHaveLength(0);
  });
});
