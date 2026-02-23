import type {DomainHouseType} from "./house-use-cases";
import type {ViewInstanceRecord, ViewsRecord} from "./house-views-repository";

export type RebuildViewType = "top" | "front" | "back" | "side1" | "side2";
export type RebuildSide = "top" | "bottom" | "left" | "right";

const REBUILD_VIEW_TYPES: RebuildViewType[] = ["top", "front", "back", "side1", "side2"];

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

export type RebuildViewsRecord<TGroup> = ViewsRecord<RebuildViewType, TGroup, RebuildSide>;
export type RebuildViewInstance<TGroup> = ViewInstanceRecord<TGroup, RebuildSide>;

export interface RebuildNormalizedItem<TGroup> extends RebuildViewInstance<TGroup> {
  viewType: RebuildViewType;
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

function isRebuildViewType(value: unknown): value is RebuildViewType {
  return typeof value === "string" && REBUILD_VIEW_TYPES.includes(value as RebuildViewType);
}

function isRebuildSide(value: unknown): value is RebuildSide {
  return value === "top" || value === "bottom" || value === "left" || value === "right";
}

function inferViewTypeForRebuild(
  meta: RebuildGroupMeta,
  houseType: DomainHouseType | null,
  currentCounts: Record<RebuildViewType, number>,
): RebuildViewType | null {
  if (isRebuildViewType(meta.houseViewType)) {
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

function inferSideForRebuild(meta: RebuildGroupMeta, viewType: RebuildViewType): RebuildSide | undefined {
  if (isRebuildSide(meta.houseSide)) {
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
  viewType: RebuildViewType,
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
  houseType: DomainHouseType | null;
  sources: RebuildViewSource<TGroup>[];
}): RebuildViewsResult<TGroup> {
  const views = createEmptyViews<TGroup>();
  const counts: Record<RebuildViewType, number> = {
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
