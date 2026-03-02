import {describe, expect, it} from 'vitest';
import {HouseAggregate} from '@/domain/house/house-aggregate.ts';
import {HouseState, HouseViewType} from '@/shared/types/house.ts';

function createViewInstances(viewType: HouseViewType, count: number) {
  return Array.from({length: count}, (_, index) => ({
    instanceId: `${viewType}_${index}`,
    group: {},
  }));
}

function createState(seed?: {
  houseType?: 'tipo6' | 'tipo3' | null;
  viewCounts?: Partial<Record<HouseViewType, number>>;
  pilotis?: Record<string, { height: number; isMaster: boolean; nivel: number }>;
}): HouseState<any> {
  const houseType = seed?.houseType ?? 'tipo6';
  const viewCounts = {
    top: 0,
    front: 0,
    back: 0,
    side1: 0,
    side2: 0,
    ...(seed?.viewCounts ?? {}),
  };

  return {
    id: 'house_1',
    houseType,
    pilotis: {
      piloti_0_0: {height: 1.0, isMaster: false, nivel: 0.2},
      piloti_3_0: {height: 1.0, isMaster: false, nivel: 0.2},
      piloti_0_2: {height: 1.0, isMaster: false, nivel: 0.2},
      piloti_3_2: {height: 1.0, isMaster: false, nivel: 0.2},
      ...(seed?.pilotis ?? {}),
    },
    terrainType: 1,
    views: {
      top: createViewInstances('top', viewCounts.top),
      front: createViewInstances('front', viewCounts.front),
      back: createViewInstances('back', viewCounts.back),
      side1: createViewInstances('side1', viewCounts.side1),
      side2: createViewInstances('side2', viewCounts.side2),
    },
    sideMappings: {top: null, bottom: null, left: null, right: null},
    preAssignedSides: {},
  };
}

describe('house aggregate', () => {
  it('applies layout rules for sides and pre-assigned slots', () => {
    const state = createState({houseType: 'tipo6'});
    state.views.front.push({instanceId: 'front_1', group: {id: 'g1'}, side: 'top'});
    state.sideMappings.top = 'front';
    state.preAssignedSides = {front: 'top'};
    const aggregate = HouseAggregate.fromState(state as HouseState<{ id: string }>);

    expect(aggregate.hasOtherViews()).toBe(true);
    expect(aggregate.canDeletePlant()).toBe(false);
    expect(aggregate.getAvailableSides('front')).toEqual(['bottom']);
    expect(aggregate.hasPreAssignedSides()).toBe(true);
    expect(aggregate.getPreAssignedSides('front')).toEqual([
      {label: 'Superior', side: 'top', onCanvas: true},
    ]);
  });

  it('sets house type and clears pre-assigned slots when null', () => {
    const state = createState({houseType: 'tipo6'});
    state.preAssignedSides = {front: 'top'};
    const aggregate = HouseAggregate.fromState(state);

    aggregate.setHouseType(null);

    expect(aggregate.getHouseType()).toBeNull();
    expect(aggregate.toState().preAssignedSides).toEqual({});
  });

  it('auto-assigns all sides from initial side', () => {
    const aggregate = HouseAggregate.fromState(createState({houseType: 'tipo6'}));

    aggregate.autoAssignAllSides('top');

    expect(aggregate.toState().preAssignedSides).toEqual({
      front: 'top',
      back: 'bottom',
      side1_0: 'right',
      side1_1: 'left',
    });
  });

  it('registers and removes views while syncing side mappings', () => {
    const aggregate = HouseAggregate.fromState(createState() as HouseState<{ id: string }>);
    const group = {id: 'g1'};

    aggregate.registerView({
      viewType: 'front',
      group,
      instanceId: 'front_1',
      side: 'top',
    });
    expect(aggregate.toState().views.front).toHaveLength(1);
    expect(aggregate.toState().sideMappings.top).toBe('front');

    const removed = aggregate.removeView({
      viewType: 'front',
      instanceId: 'front_1',
      group,
    });
    expect(removed.removedCount).toBe(1);
    expect(aggregate.toState().views.front).toHaveLength(0);
    expect(aggregate.toState().sideMappings.top).toBeNull();
  });

  it('cleans stale views and rebuilds side mappings from current views', () => {
    const aggregate = HouseAggregate.fromState(createState() as HouseState<{ id: string }>);

    aggregate.registerView({
      viewType: 'back',
      group: {id: 'dead'},
      instanceId: 'back_1',
      side: 'top',
    });
    aggregate.registerView({
      viewType: 'back',
      group: {id: 'alive'},
      instanceId: 'back_2',
      side: 'bottom',
    });

    const removedCount = aggregate.cleanupStaleViews('back', (group) => group.id === 'alive');
    expect(removedCount).toBe(1);
    expect(aggregate.toState().views.back).toHaveLength(1);
    expect(aggregate.toState().sideMappings.top).toBeNull();
    expect(aggregate.toState().sideMappings.bottom).toBe('back');
  });

  it('rebuilds views from canvas-like sources and side mappings', () => {
    const aggregate =
      HouseAggregate.fromState(createState() as HouseState<{ id: string }>);

    const rebuilt = aggregate.rebuildViewsFromCanvasSources([
      {group: {id: 'front-a'}, metadata: {houseView: 'front', isFlippedHorizontally: true}},
      {group: {id: 'side-a'}, metadata: {houseView: 'side', isRightSide: true}},
    ]);

    expect(rebuilt.views.front).toHaveLength(1);
    expect(rebuilt.views.side1).toHaveLength(1);
    expect(aggregate.toState().sideMappings.top).toBe('front');
    expect(aggregate.toState().sideMappings.right).toBe('side1');
  });

  it('gets max view count from current house type', () => {
    const aggregate = HouseAggregate.fromState(createState({houseType: 'tipo3'}));
    expect(aggregate.getMaxViewCount('front')).toBe(0);
    expect(aggregate.getMaxViewCount('back')).toBe(2);
  });

  it('checks if a view can be added from current state', () => {
    const aggregate = HouseAggregate.fromState(
      createState({houseType: 'tipo6', viewCounts: {front: 1}}),
    );
    expect(aggregate.canAddView('front')).toBe(false);
    expect(aggregate.canAddView('back')).toBe(true);
  });

  it('determines if a view is at limit and returns available views', () => {
    const aggregate = HouseAggregate.fromState(createState({
      houseType: 'tipo6',
      viewCounts: {
        top: 1,
        front: 1,
        back: 0,
        side1: 1,
        side2: 0,
      },
    }));

    expect(aggregate.isViewLimitAchieved('front')).toBe(true);
    expect(aggregate.isViewLimitAchieved('back')).toBe(false);
    expect(aggregate.getAvailableViews()).toEqual(['back', 'side1']);
  });

  it('applies piloti update and enforces single master', () => {
    const state = createState({
      pilotis: {
        piloti_0_0: {height: 1.0, isMaster: true, nivel: 0.3},
        piloti_3_2: {height: 1.5, isMaster: false, nivel: 0.6},
      },
    });
    const aggregate = HouseAggregate.fromState(state);

    const result = aggregate.applyPilotiPatch(
      'piloti_3_2',
      {isMaster: true},
    );
    const pilotis = aggregate.toState().pilotis;

    expect(result.clearedMasters).toEqual(['piloti_0_0']);
    expect(pilotis.piloti_0_0.isMaster).toBe(false);
    expect(pilotis.piloti_3_2.isMaster).toBe(true);
  });

  it('recalculates recommended piloti data', () => {
    const aggregate = HouseAggregate.fromState(createState({
      pilotis: {
        piloti_0_0: {height: 1.0, isMaster: false, nivel: 0.2},
        piloti_3_0: {height: 1.0, isMaster: false, nivel: 0.4},
        piloti_0_2: {height: 1.0, isMaster: false, nivel: 0.6},
        piloti_3_2: {height: 1.0, isMaster: false, nivel: 0.8},
      },
    }));

    aggregate.recalculateRecommendedPilotiData({height: 1, isMaster: false, nivel: 0.2});
    const pilotis = aggregate.toState().pilotis;

    expect(pilotis.piloti_1_1.nivel).toBe(0.47);
    expect(pilotis.piloti_1_1.height).toBe(1.5);
  });
});
