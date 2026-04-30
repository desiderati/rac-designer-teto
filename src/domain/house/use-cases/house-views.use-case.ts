import {
  HouseSide,
  HouseSideMapping,
  HouseViewInstance,
  HouseViewInstanceId,
  HouseViews,
  HouseViewType
} from '@/shared/types/house.ts';

export function cloneViews(
  views: HouseViews,
): HouseViews {
  const next = {} as HouseViews;
  (Object.keys(views) as HouseViewType[]).forEach((viewType) => {
    next[viewType] = [...views[viewType]];
  });
  return next;
}

export function cloneMappings(
  sideMappings: HouseSideMapping,
): HouseSideMapping {
  return {...sideMappings};
}

export function registerViewInstance(params: {
  instanceId: HouseViewInstanceId;
  side?: HouseSide;
  sideMappings: HouseSideMapping;
  viewType: HouseViewType;
  views: HouseViews;
}): {
  instance: HouseViewInstance;
  views: HouseViews;
  sideMappings: HouseSideMapping;
} {
  const nextViews = cloneViews(params.views);
  const nextMappings = cloneMappings(params.sideMappings);
  const instance: HouseViewInstance = {
    side: params.side,
    instanceId: params.instanceId,
  };

  nextViews[params.viewType].push(instance);
  if (params.side) {
    nextMappings[params.side] = params.viewType;
  }

  return {views: nextViews, sideMappings: nextMappings, instance};
}

export function removeAtIndex(params: {
  index: number;
  sideMappings: HouseSideMapping;
  viewType: HouseViewType;
  views: HouseViews;
}): {
  removed: HouseViewInstance | null;
  views: HouseViews;
  sideMappings: HouseSideMapping;
} {
  const instances = params.views[params.viewType];
  if (params.index < 0 || params.index >= instances.length) {
    return {
      views: params.views,
      sideMappings: params.sideMappings,
      removed: null,
    };
  }

  const nextViews = cloneViews(params.views);
  const nextMappings = cloneMappings(params.sideMappings);
  const [removed] = nextViews[params.viewType].splice(params.index, 1);
  if (removed?.side) {
    nextMappings[removed.side] = null;
  }

  return {views: nextViews, sideMappings: nextMappings, removed: removed ?? null};
}

export function removeViewInstance(params: {
  instanceId?: HouseViewInstanceId;
  sideMappings: HouseSideMapping;
  viewType: HouseViewType;
  views: HouseViews;
}): {
  removed: HouseViewInstance | null;
  views: HouseViews;
  sideMappings: HouseSideMapping;
} {
  const instances = params.views[params.viewType];
  const index = instances.findIndex((instance) => instance.instanceId === params.instanceId);

  return removeAtIndex({
    views: params.views,
    sideMappings: params.sideMappings,
    viewType: params.viewType,
    index,
  });
}

export function removeViewInstanceById(params: {
  sideMappings: HouseSideMapping;
  views: HouseViews;
  instanceId: HouseViewInstanceId;
}): {
  removed: HouseViewInstance | null;
  removedViewType: HouseViewType | null;
  views: HouseViews;
  sideMappings: HouseSideMapping;
} {
  for (const viewType of Object.keys(params.views) as HouseViewType[]) {
    const index =
      params.views[viewType].findIndex(
        (instance) => instance.instanceId === params.instanceId
      );
    if (index === -1) continue;

    const removed = removeAtIndex({
      views: params.views,
      sideMappings: params.sideMappings,
      viewType,
      index,
    });

    return {
      views: removed.views,
      sideMappings: removed.sideMappings,
      removedViewType: viewType,
      removed: removed.removed,
    };
  }

  return {
    views: params.views,
    sideMappings: params.sideMappings,
    removedViewType: null,
    removed: null,
  };
}

export function removeAllViewInstancesByType(params: {
  sideMappings: HouseSideMapping;
  viewType: HouseViewType;
  views: HouseViews;
}): {
  removedCount: number;
  views: HouseViews;
  sideMappings: HouseSideMapping;
} {
  const current = params.views[params.viewType];
  if (!current.length) {
    return {
      views: params.views,
      sideMappings: params.sideMappings,
      removedCount: 0,
    };
  }

  const nextViews = cloneViews(params.views);
  const nextMappings = cloneMappings(params.sideMappings);
  current.forEach((instance) => {
    if (instance.side) {
      nextMappings[instance.side] = null;
    }
  });
  const removedCount = current.length;
  nextViews[params.viewType] = [];

  return {views: nextViews, sideMappings: nextMappings, removedCount};
}

export function cleanupStaleViewInstances(params: {
  isAlive: (instanceId: HouseViewInstanceId) => boolean;
  viewType: HouseViewType;
  views: HouseViews;
  sideMappings: HouseSideMapping;
}): {
  removedCount: number;
  views: HouseViews;
  sideMappings: HouseSideMapping;
} {
  const current = params.views[params.viewType];
  if (!current.length) {
    return {
      views: params.views,
      sideMappings: params.sideMappings,
      removedCount: 0,
    };
  }

  const nextViews = cloneViews(params.views);
  const nextMappings = cloneMappings(params.sideMappings);
  const validInstances: HouseViewInstance[] = [];
  let removedCount = 0;

  current.forEach((instance) => {
    if (params.isAlive(instance.instanceId)) {
      validInstances.push(instance);
      return;
    }

    removedCount += 1;
    if (instance.side) {
      nextMappings[instance.side] = null;
    }
  });

  nextViews[params.viewType] = validInstances;
  return {views: nextViews, sideMappings: nextMappings, removedCount};
}

export function rebuildSideMappingsFromViews(params: {
  views: HouseViews;
  sideMappingsTemplate: HouseSideMapping;
}): HouseSideMapping {
  const nextMappings = cloneMappings(params.sideMappingsTemplate);

  (Object.keys(nextMappings) as HouseSide[]).forEach((side) => {
    nextMappings[side] = null;
  });

  (Object.keys(params.views) as HouseViewType[]).forEach((viewType) => {
    params.views[viewType].forEach((instance) => {
      if (!instance.side) return;
      if (!nextMappings[instance.side]) {
        nextMappings[instance.side] = viewType;
      }
    });
  });

  return nextMappings;
}

export function countViewInstances(
  views: HouseViews,
): Record<HouseViewType, number> {
  const counts = {} as Record<HouseViewType, number>;
  (Object.keys(views) as HouseViewType[]).forEach((viewType) => {
    counts[viewType] = views[viewType].length;
  });
  return counts;
}
