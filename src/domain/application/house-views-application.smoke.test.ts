import {describe, expect, it} from 'vitest';
import type {
  HouseViewsRepository,
  SideAssignmentsRecord,
  ViewsRecord,
} from '@/domain/repository/house-views-repository.ts';
import {
  cleanupStaleViews,
  rebuildViewsFromCanvasSources,
  rebuildSideAssignments,
  registerView,
  removeAllViewsByType,
  removeView,
} from '@/domain/application/house-views-application.ts';

type ViewType = 'top' | 'front' | 'back' | 'side1' | 'side2';
type Side = 'top' | 'bottom' | 'left' | 'right';
type GroupRef = { id: string };

function createRepository(): HouseViewsRepository<ViewType, Side, GroupRef> {
  let views: ViewsRecord<ViewType, GroupRef, Side> = {
    top: [],
    front: [],
    back: [],
    side1: [],
    side2: [],
  };
  let sideAssignments: SideAssignmentsRecord<Side, ViewType> = {
    top: null,
    bottom: null,
    left: null,
    right: null,
  };

  return {
    getViews: () => views,
    setViews: (nextViews) => {
      views = nextViews;
    },
    getSideAssignments: () => sideAssignments,
    setSideAssignments: (nextAssignments) => {
      sideAssignments = nextAssignments;
    },
  };
}

describe('house views application services', () => {
  it('registers and removes views through repository', () => {
    const repository = createRepository();
    const group = {id: 'g1'};

    registerView(repository, {
      viewType: 'front',
      group,
      instanceId: 'front_1',
      side: 'top',
    });
    expect(repository.getViews().front).toHaveLength(1);
    expect(repository.getSideAssignments().top).toBe('front');

    const removed = removeView(repository, {
      viewType: 'front',
      instanceId: 'front_1',
      group,
    });
    expect(removed.removedCount).toBe(1);
    expect(repository.getViews().front).toHaveLength(0);
    expect(repository.getSideAssignments().top).toBeNull();
  });

  it('cleans stale views and can rebuild side assignments', () => {
    const repository = createRepository();
    registerView(repository, {
      viewType: 'back',
      group: {id: 'dead'},
      instanceId: 'back_1',
      side: 'top',
    });
    registerView(repository, {
      viewType: 'back',
      group: {id: 'alive'},
      instanceId: 'back_2',
      side: 'bottom',
    });

    const removedCount = cleanupStaleViews(repository, 'back', (group) => group.id === 'alive');
    expect(removedCount).toBe(1);
    expect(repository.getViews().back).toHaveLength(1);

    rebuildSideAssignments(repository);
    expect(repository.getSideAssignments().top).toBeNull();
    expect(repository.getSideAssignments().bottom).toBe('back');
  });

  it('removes all views by type through repository', () => {
    const repository = createRepository();
    registerView(repository, {
      viewType: 'side1',
      group: {id: 'l'},
      instanceId: 'side1_1',
      side: 'left',
    });
    registerView(repository, {
      viewType: 'side1',
      group: {id: 'r'},
      instanceId: 'side1_2',
      side: 'right',
    });

    const removed = removeAllViewsByType(repository, 'side1');
    expect(removed).toBe(2);
    expect(repository.getViews().side1).toHaveLength(0);
    expect(repository.getSideAssignments().left).toBeNull();
    expect(repository.getSideAssignments().right).toBeNull();
  });

  it('rebuilds views from canvas-like sources and side assignments', () => {
    const repository = createRepository();

    const rebuilt = rebuildViewsFromCanvasSources(repository, {
      houseType: 'tipo6',
      sources: [
        {group: {id: 'front-a'}, meta: {houseView: 'front', isFlippedHorizontally: true}},
        {group: {id: 'side-a'}, meta: {houseView: 'side', isRightSide: true}},
      ],
    });

    expect(rebuilt.views.front).toHaveLength(1);
    expect(rebuilt.views.side1).toHaveLength(1);
    expect(repository.getSideAssignments().top).toBe('front');
    expect(repository.getSideAssignments().right).toBe('side1');
  });
});
