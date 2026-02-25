import type {
  SideAssignmentsRecord,
  ViewInstanceRecord,
  ViewsRecord,
} from '@/domain/repository/house-views-repository.ts';

function cloneViews<TView extends string, TGroup, TSide extends string>(
  views: ViewsRecord<TView, TGroup, TSide>,
): ViewsRecord<TView, TGroup, TSide> {
  const next = {} as ViewsRecord<TView, TGroup, TSide>;
  (Object.keys(views) as TView[]).forEach((viewType) => {
    next[viewType] = [...views[viewType]];
  });
  return next;
}

function cloneAssignments<TSide extends string, TView extends string>(
  sideAssignments: SideAssignmentsRecord<TSide, TView>,
): SideAssignmentsRecord<TSide, TView> {
  return {...sideAssignments};
}

export function registerViewInstance<TView extends string, TSide extends string, TGroup>(params: {
  views: ViewsRecord<TView, TGroup, TSide>;
  sideAssignments: SideAssignmentsRecord<TSide, TView>;
  viewType: TView;
  group: TGroup;
  instanceId: string;
  side?: TSide;
}): {
  views: ViewsRecord<TView, TGroup, TSide>;
  sideAssignments: SideAssignmentsRecord<TSide, TView>;
  instance: ViewInstanceRecord<TGroup, TSide>;
} {
  const nextViews = cloneViews(params.views);
  const nextAssignments = cloneAssignments(params.sideAssignments);
  const instance: ViewInstanceRecord<TGroup, TSide> = {
    group: params.group,
    side: params.side,
    instanceId: params.instanceId,
  };

  nextViews[params.viewType].push(instance);
  if (params.side) {
    nextAssignments[params.side] = params.viewType;
  }

  return {views: nextViews, sideAssignments: nextAssignments, instance};
}

function removeAtIndex<TView extends string, TSide extends string, TGroup>(params: {
  views: ViewsRecord<TView, TGroup, TSide>;
  sideAssignments: SideAssignmentsRecord<TSide, TView>;
  viewType: TView;
  index: number;
}): {
  views: ViewsRecord<TView, TGroup, TSide>;
  sideAssignments: SideAssignmentsRecord<TSide, TView>;
  removed: ViewInstanceRecord<TGroup, TSide> | null;
} {
  const instances = params.views[params.viewType];
  if (params.index < 0 || params.index >= instances.length) {
    return {
      views: params.views,
      sideAssignments: params.sideAssignments,
      removed: null,
    };
  }

  const nextViews = cloneViews(params.views);
  const nextAssignments = cloneAssignments(params.sideAssignments);
  const [removed] = nextViews[params.viewType].splice(params.index, 1);
  if (removed?.side) {
    nextAssignments[removed.side] = null;
  }

  return {views: nextViews, sideAssignments: nextAssignments, removed: removed ?? null};
}

export function removeViewInstance<TView extends string, TSide extends string, TGroup>(params: {
  views: ViewsRecord<TView, TGroup, TSide>;
  sideAssignments: SideAssignmentsRecord<TSide, TView>;
  viewType: TView;
  instanceId?: string;
  group?: TGroup;
}): {
  views: ViewsRecord<TView, TGroup, TSide>;
  sideAssignments: SideAssignmentsRecord<TSide, TView>;
  removed: ViewInstanceRecord<TGroup, TSide> | null;
} {
  const instances = params.views[params.viewType];
  const index =
    params.instanceId !== undefined
      ? instances.findIndex((instance) => instance.instanceId === params.instanceId)
      : instances.findIndex((instance) => instance.group === params.group);

  return removeAtIndex({
    views: params.views,
    sideAssignments: params.sideAssignments,
    viewType: params.viewType,
    index,
  });
}

export function removeViewInstanceByGroup<TView extends string, TSide extends string, TGroup>(params: {
  views: ViewsRecord<TView, TGroup, TSide>;
  sideAssignments: SideAssignmentsRecord<TSide, TView>;
  group: TGroup;
}): {
  views: ViewsRecord<TView, TGroup, TSide>;
  sideAssignments: SideAssignmentsRecord<TSide, TView>;
  removedViewType: TView | null;
  removed: ViewInstanceRecord<TGroup, TSide> | null;
} {
  for (const viewType of Object.keys(params.views) as TView[]) {
    const index = params.views[viewType].findIndex((instance) => instance.group === params.group);
    if (index === -1) continue;

    const removed = removeAtIndex({
      views: params.views,
      sideAssignments: params.sideAssignments,
      viewType,
      index,
    });

    return {
      views: removed.views,
      sideAssignments: removed.sideAssignments,
      removedViewType: viewType,
      removed: removed.removed,
    };
  }

  return {
    views: params.views,
    sideAssignments: params.sideAssignments,
    removedViewType: null,
    removed: null,
  };
}

export function removeAllViewInstancesByType<TView extends string, TSide extends string, TGroup>(params: {
  views: ViewsRecord<TView, TGroup, TSide>;
  sideAssignments: SideAssignmentsRecord<TSide, TView>;
  viewType: TView;
}): {
  views: ViewsRecord<TView, TGroup, TSide>;
  sideAssignments: SideAssignmentsRecord<TSide, TView>;
  removedCount: number;
} {
  const current = params.views[params.viewType];
  if (!current.length) {
    return {
      views: params.views,
      sideAssignments: params.sideAssignments,
      removedCount: 0,
    };
  }

  const nextViews = cloneViews(params.views);
  const nextAssignments = cloneAssignments(params.sideAssignments);
  current.forEach((instance) => {
    if (instance.side) {
      nextAssignments[instance.side] = null;
    }
  });
  const removedCount = current.length;
  nextViews[params.viewType] = [];

  return {views: nextViews, sideAssignments: nextAssignments, removedCount};
}

export function cleanupStaleViewInstances<TView extends string, TSide extends string, TGroup>(params: {
  views: ViewsRecord<TView, TGroup, TSide>;
  sideAssignments: SideAssignmentsRecord<TSide, TView>;
  viewType: TView;
  isAlive: (group: TGroup) => boolean;
}): {
  views: ViewsRecord<TView, TGroup, TSide>;
  sideAssignments: SideAssignmentsRecord<TSide, TView>;
  removedCount: number;
} {
  const current = params.views[params.viewType];
  if (!current.length) {
    return {
      views: params.views,
      sideAssignments: params.sideAssignments,
      removedCount: 0,
    };
  }

  const nextViews = cloneViews(params.views);
  const nextAssignments = cloneAssignments(params.sideAssignments);
  const validInstances: ViewInstanceRecord<TGroup, TSide>[] = [];
  let removedCount = 0;

  current.forEach((instance) => {
    if (params.isAlive(instance.group)) {
      validInstances.push(instance);
      return;
    }

    removedCount += 1;
    if (instance.side) {
      nextAssignments[instance.side] = null;
    }
  });

  nextViews[params.viewType] = validInstances;
  return {views: nextViews, sideAssignments: nextAssignments, removedCount};
}

export function rebuildSideAssignmentsFromViews<TView extends string, TSide extends string, TGroup>(params: {
  views: ViewsRecord<TView, TGroup, TSide>;
  sideAssignmentsTemplate: SideAssignmentsRecord<TSide, TView>;
}): SideAssignmentsRecord<TSide, TView> {
  const nextAssignments = cloneAssignments(params.sideAssignmentsTemplate);

  (Object.keys(nextAssignments) as TSide[]).forEach((side) => {
    nextAssignments[side] = null;
  });

  (Object.keys(params.views) as TView[]).forEach((viewType) => {
    params.views[viewType].forEach((instance) => {
      if (!instance.side) return;
      if (!nextAssignments[instance.side]) {
        nextAssignments[instance.side] = viewType;
      }
    });
  });

  return nextAssignments;
}

export function hasAnyViewInstances<TView extends string, TSide extends string, TGroup>(
  views: ViewsRecord<TView, TGroup, TSide>,
): boolean {
  return (Object.keys(views) as TView[]).some((viewType) => views[viewType].length > 0);
}

export function collectAllViewGroups<TView extends string, TSide extends string, TGroup>(
  views: ViewsRecord<TView, TGroup, TSide>,
): TGroup[] {
  const groups: TGroup[] = [];
  (Object.keys(views) as TView[]).forEach((viewType) => {
    views[viewType].forEach((instance) => {
      groups.push(instance.group);
    });
  });
  return groups;
}

export function countViewInstances<TView extends string, TSide extends string, TGroup>(
  views: ViewsRecord<TView, TGroup, TSide>,
): Record<TView, number> {
  const counts = {} as Record<TView, number>;
  (Object.keys(views) as TView[]).forEach((viewType) => {
    counts[viewType] = views[viewType].length;
  });
  return counts;
}
