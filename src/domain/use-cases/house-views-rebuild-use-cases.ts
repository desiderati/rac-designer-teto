import type {ViewInstanceRecord, ViewsRecord} from "@/domain/repository/house-views-repository.ts";
import {ALL_HOUSE_VIEW_TYPES, HouseSide, HouseTypeExcludeNull, HouseViewType} from "@/shared/types/house.ts";

export interface RebuildGroupMeta {
  houseViewType?: string;
  houseView?: string;
  houseSide?: string;
  houseInstanceId?: string;
  isFlippedHorizontally?: boolean;
  isRightSide?: boolean;
}

export interface RebuildViewSource<TGroup> {
  group: TGroup;
  meta: RebuildGroupMeta;
}

export type RebuildViewsRecord<TGroup> = ViewsRecord<HouseViewType, TGroup, HouseSide>;
export type RebuildViewInstance<TGroup> = ViewInstanceRecord<TGroup, HouseSide>;

export interface RebuildNormalizedItem<TGroup> extends RebuildViewInstance<TGroup> {
  viewType: HouseViewType;
}

export interface RebuildViewsResult<TGroup> {
  views: RebuildViewsRecord<TGroup>;
  normalizedItems: RebuildNormalizedItem<TGroup>[];
}

function createEmptyViews<TGroup>(): RebuildViewsRecord<TGroup> {
  return {
    top: [],
    front: [],
    back: [],
    side1: [],
    side2: [],
  };
}

function isHouseViewType(value: unknown): value is HouseViewType {
  return typeof value === "string" && ALL_HOUSE_VIEW_TYPES.includes(value as HouseViewType);
}

function isHouseSide(value: unknown): value is HouseSide {
  return value === "top" || value === "bottom" || value === "left" || value === "right";
}

function inferViewTypeForRebuild(
  meta: RebuildGroupMeta,
  houseType: HouseTypeExcludeNull | null,
  currentCounts: Record<HouseViewType, number>,
): HouseViewType | null {

  if (isHouseViewType(meta.houseViewType)) {
    return meta.houseViewType;
  }

  if (meta.houseView === "top" || meta.houseView === "front" || meta.houseView === "back") {
    return meta.houseView;
  }

  if (meta.houseView === "side") {
    if (houseType === "tipo6") return "side1";
    if (houseType === "tipo3") return currentCounts.side1 === 0 ? "side1" : "side2";
    return currentCounts.side1 <= currentCounts.side2 ? "side1" : "side2";
  }

  return null;
}

function inferSideForRebuild(meta: RebuildGroupMeta, viewType: HouseViewType): HouseSide | undefined {
  if (isHouseSide(meta.houseSide)) {
    return meta.houseSide;
  }

  if (viewType === "front" || viewType === "back") {
    return meta.isFlippedHorizontally ? "top" : "bottom";
  }

  if (viewType === "side1" || viewType === "side2") {
    return meta.isRightSide ? "right" : "left";
  }

  return undefined;
}

function normalizeInstanceId(
  viewType: HouseViewType,
  rawInstanceId: string | undefined,
  countForViewType: number,
  usedIds: Set<string>,
): string {

  const trimmed = String(rawInstanceId ?? "").trim();
  const instanceIdBase = trimmed || `${viewType}_restored_${countForViewType}`;

  let instanceId = instanceIdBase;
  let suffix = 1;
  while (usedIds.has(instanceId)) {
    instanceId = `${instanceIdBase}_${suffix++}`;
  }
  usedIds.add(instanceId);

  return instanceId;
}

export function rebuildViewsFromSources<TGroup>(params: {
  houseType: HouseTypeExcludeNull | null;
  sources: RebuildViewSource<TGroup>[];
}): RebuildViewsResult<TGroup> {

  const views = createEmptyViews<TGroup>();
  const counts: Record<HouseViewType, number> = {
    top: 0,
    front: 0,
    back: 0,
    side1: 0,
    side2: 0,
  };
  const usedIds = new Set<string>();
  const normalizedItems: RebuildNormalizedItem<TGroup>[] = [];

  params.sources.forEach((source) => {
    const viewType = inferViewTypeForRebuild(source.meta, params.houseType, counts);
    if (!viewType) return;

    const side = inferSideForRebuild(source.meta, viewType);
    const instanceId = normalizeInstanceId(viewType, source.meta.houseInstanceId, counts[viewType], usedIds);

    const instance = {group: source.group, side, instanceId};
    views[viewType].push(instance);
    normalizedItems.push({viewType, ...instance});
    counts[viewType] += 1;
  });

  return {views, normalizedItems};
}
