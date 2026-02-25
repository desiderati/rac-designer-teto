import type {HouseViewsRepository} from "@/domain/repository/house-views-repository.ts";
import {
  cleanupStaleViewInstances,
  rebuildSideAssignmentsFromViews,
  registerViewInstance,
  removeAllViewInstancesByType,
  removeViewInstance,
  removeViewInstanceByGroup,
} from "../use-cases/house-views-use-cases.ts";
import type {RebuildViewSource, RebuildViewsResult} from "../use-cases/house-views-rebuild-use-cases.ts";
import {rebuildViewsFromSources} from "../use-cases/house-views-rebuild-use-cases.ts";
import {HouseSide, HouseTypeExcludeNull, HouseViewType} from "@/shared/types/house.ts";

export function registerView<TView extends string, TSide extends string, TGroup>(
  repository: HouseViewsRepository<TView, TSide, TGroup>,
  params: {
    viewType: TView;
    group: TGroup;
    instanceId: string;
    side?: TSide;
  },
): void {
  const result = registerViewInstance({
    views: repository.getViews(),
    sideAssignments: repository.getSideAssignments(),
    ...params,
  });

  repository.setViews(result.views);
  repository.setSideAssignments(result.sideAssignments);
}

export function removeView<TView extends string, TSide extends string, TGroup>(
  repository: HouseViewsRepository<TView, TSide, TGroup>,
  params: {
    viewType?: TView;
    instanceId?: string;
    group: TGroup;
  },
): {
  removedViewType: TView | null;
  removedCount: number;
} {
  if (params.viewType) {
    const result = removeViewInstance({
      views: repository.getViews(),
      sideAssignments: repository.getSideAssignments(),
      viewType: params.viewType,
      instanceId: params.instanceId,
      group: params.group,
    });
    repository.setViews(result.views);
    repository.setSideAssignments(result.sideAssignments);
    return {
      removedViewType: result.removed ? params.viewType : null,
      removedCount: result.removed ? 1 : 0,
    };
  }

  const result = removeViewInstanceByGroup({
    views: repository.getViews(),
    sideAssignments: repository.getSideAssignments(),
    group: params.group,
  });
  repository.setViews(result.views);
  repository.setSideAssignments(result.sideAssignments);
  return {
    removedViewType: result.removedViewType,
    removedCount: result.removed ? 1 : 0,
  };
}

export function removeAllViewsByType<TView extends string, TSide extends string, TGroup>(
  repository: HouseViewsRepository<TView, TSide, TGroup>,
  viewType: TView,
): number {
  const result = removeAllViewInstancesByType({
    views: repository.getViews(),
    sideAssignments: repository.getSideAssignments(),
    viewType,
  });
  repository.setViews(result.views);
  repository.setSideAssignments(result.sideAssignments);
  return result.removedCount;
}

export function cleanupStaleViews<TView extends string, TSide extends string, TGroup>(
  repository: HouseViewsRepository<TView, TSide, TGroup>,
  viewType: TView,
  isAlive: (group: TGroup) => boolean,
): number {
  const result = cleanupStaleViewInstances({
    views: repository.getViews(),
    sideAssignments: repository.getSideAssignments(),
    viewType,
    isAlive,
  });
  repository.setViews(result.views);
  repository.setSideAssignments(result.sideAssignments);
  return result.removedCount;
}

export function rebuildSideAssignments<TView extends string, TSide extends string, TGroup>(
  repository: HouseViewsRepository<TView, TSide, TGroup>,
): void {
  const nextAssignments = rebuildSideAssignmentsFromViews({
    views: repository.getViews(),
    sideAssignmentsTemplate: repository.getSideAssignments(),
  });
  repository.setSideAssignments(nextAssignments);
}

export function rebuildViewsFromCanvasSources<TGroup>(
  repository: HouseViewsRepository<HouseViewType, HouseSide, TGroup>,
  params: {
    houseType: HouseTypeExcludeNull | null;
    sources: RebuildViewSource<TGroup>[];
  },
): RebuildViewsResult<TGroup> {
  const rebuilt = rebuildViewsFromSources(params);
  repository.setViews(rebuilt.views);
  rebuildSideAssignments(repository);
  return rebuilt;
}
