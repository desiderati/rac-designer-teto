import {describe, expect, it} from 'vitest';
import {
  cleanupStaleViewInstances,
  countViewInstances,
  rebuildSideMappingsFromViews,
  registerViewInstance,
  removeAllViewInstancesByType,
  removeViewInstance,
  removeViewInstanceByGroup,
} from './house-views.use-case.ts';
import type {HouseSideMapping, HouseViewInstance, HouseViews, HouseViewType,} from '@/shared/types/house.ts';

function createViews<TGroup>(): HouseViews<TGroup> {
  return {
    top: [],
    front: [],
    back: [],
    side1: [],
    side2: [],
  };
}

function createMappings(): HouseSideMapping {
  return {
    top: null,
    bottom: null,
    left: null,
    right: null,
  };
}

describe('house-views use cases', () => {
  it('registers view instances and updates side mappings', () => {
    const views = createViews<{ id: string }>();
    const mappings = createMappings();
    const group = {id: 'g1'};

    const result = registerViewInstance({
      instanceId: 'inst-1',
      side: 'top',
      sideMappings: mappings,
      viewType: 'front',
      views,
      group,
    });

    expect(result.views.front).toHaveLength(1);
    expect(result.views.front[0]).toMatchObject({group, side: 'top', instanceId: 'inst-1'});
    expect(result.sideMappings.top).toBe('front');
  });

  it('removes view instance by id and clears side mapping', () => {
    const views = createViews<{ id: string }>();
    const mappings = createMappings();

    const {views: withView, sideMappings: withMappings} = registerViewInstance({
      instanceId: 'inst-1',
      side: 'left',
      sideMappings: mappings,
      viewType: 'side1',
      views,
      group: {id: 'g1'},
    });

    const removed = removeViewInstance({
      instanceId: 'inst-1',
      sideMappings: withMappings,
      viewType: 'side1',
      views: withView,
    });

    expect(removed.removed?.instanceId).toBe('inst-1');
    expect(removed.views.side1).toHaveLength(0);
    expect(removed.sideMappings.left).toBeNull();
  });

  it('removes view instance by group and returns view type', () => {
    const views = createViews<{ id: string }>();
    const mappings = createMappings();
    const group = {id: 'g1'};

    const {views: withView, sideMappings: withMappings} = registerViewInstance({
      instanceId: 'inst-1',
      side: 'bottom',
      sideMappings: mappings,
      viewType: 'back',
      views,
      group,
    });

    const removed = removeViewInstanceByGroup({
      sideMappings: withMappings,
      views: withView,
      group,
    });

    expect(removed.removedViewType).toBe('back');
    expect(removed.removed?.instanceId).toBe('inst-1');
    expect(removed.sideMappings.bottom).toBeNull();
  });

  it('removes all instances by view type and clears related mappings', () => {
    const views = createViews<{ id: string }>();
    const mappings = createMappings();

    let result = registerViewInstance({
      instanceId: 'inst-1',
      side: 'top',
      sideMappings: mappings,
      viewType: 'front',
      views,
      group: {id: 'g1'},
    });

    result = registerViewInstance({
      instanceId: 'inst-2',
      side: 'bottom',
      sideMappings: result.sideMappings,
      viewType: 'front',
      views: result.views,
      group: {id: 'g2'},
    });

    const removed = removeAllViewInstancesByType({
      sideMappings: result.sideMappings,
      viewType: 'front',
      views: result.views,
    });

    expect(removed.removedCount).toBe(2);
    expect(removed.views.front).toHaveLength(0);
    expect(removed.sideMappings.top).toBeNull();
    expect(removed.sideMappings.bottom).toBeNull();
  });

  it('cleans up stale view instances based on liveness check', () => {
    const views = createViews<{ id: string }>();
    const mappings = createMappings();

    let result = registerViewInstance({
      instanceId: 'inst-1',
      side: 'left',
      sideMappings: mappings,
      viewType: 'side1',
      views,
      group: {id: 'alive'},
    });

    result = registerViewInstance({
      instanceId: 'inst-2',
      side: 'right',
      sideMappings: result.sideMappings,
      viewType: 'side1',
      views: result.views,
      group: {id: 'dead'},
    });

    const cleaned = cleanupStaleViewInstances({
      isAlive: (group) => group.id === 'alive',
      viewType: 'side1',
      views: result.views,
      sideMappings: result.sideMappings,
    });

    expect(cleaned.removedCount).toBe(1);
    expect(cleaned.views.side1).toHaveLength(1);
    expect(cleaned.views.side1[0]?.group.id).toBe('alive');
    expect(cleaned.sideMappings.right).toBeNull();
    expect(cleaned.sideMappings.left).toBe('side1');
  });

  it('rebuilds side mappings from views without overwriting first assignment', () => {
    const viewInstances: HouseViewInstance<{ id: string }>[] = [
      {group: {id: 'g1'}, side: 'left', instanceId: 'inst-1'},
      {group: {id: 'g2'}, side: 'left', instanceId: 'inst-2'},
    ];

    const views: HouseViews<{ id: string }> = {
      top: [],
      front: [],
      back: [],
      side1: viewInstances,
      side2: [],
    };

    const mappings = rebuildSideMappingsFromViews({
      views,
      sideMappingsTemplate: createMappings(),
    });

    expect(mappings.left).toBe('side1');
  });

  it('counts view instances per type', () => {
    const views = createViews<{ id: string }>();
    views.top.push({group: {id: 'g1'}, instanceId: 'inst-1'});
    views.top.push({group: {id: 'g2'}, instanceId: 'inst-2'});
    views.side2.push({group: {id: 'g3'}, instanceId: 'inst-3'});

    const counts = countViewInstances(views);
    const expected: Record<HouseViewType, number> = {
      top: 2,
      front: 0,
      back: 0,
      side1: 0,
      side2: 1,
    };

    expect(counts).toEqual(expected);
  });
});
