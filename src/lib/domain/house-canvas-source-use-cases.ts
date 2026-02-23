export interface CanvasObjectCandidate {
  type?: unknown;
  myType?: unknown;
  houseView?: unknown;
  houseViewType?: unknown;
  houseSide?: unknown;
  houseInstanceId?: unknown;
  isFlippedHorizontally?: unknown;
  isRightSide?: unknown;
}

export function isHouseGroupCandidate(value: CanvasObjectCandidate): boolean {
  return value?.type === "group" && value?.myType === "house";
}

export function isTopViewGroupCandidate(value: CanvasObjectCandidate): boolean {
  return isHouseGroupCandidate(value) && value?.houseView === "top";
}

export function collectHouseGroupCandidates<T extends CanvasObjectCandidate>(objects: T[]): T[] {
  return objects.filter((object) => isHouseGroupCandidate(object));
}

export function findTopViewGroupCandidate<T extends CanvasObjectCandidate>(objects: T[]): T | null {
  return objects.find((object) => isTopViewGroupCandidate(object)) ?? null;
}

export interface HouseGroupRebuildSource<TGroup> {
  group: TGroup;
  meta: {
    houseViewType?: unknown;
    houseView?: unknown;
    houseSide?: unknown;
    houseInstanceId?: unknown;
    isFlippedHorizontally: boolean;
    isRightSide: boolean;
  };
}

export interface HouseGroupWithObjects extends CanvasObjectCandidate {
  getObjects: () => unknown[];
}

export interface HouseGroupPilotiSource {
  objects: unknown[];
}

export function mapHouseGroupToRebuildSource<TGroup extends CanvasObjectCandidate>(
  group: TGroup,
): HouseGroupRebuildSource<TGroup> {
  return {
    group,
    meta: {
      houseViewType: group.houseViewType,
      houseView: group.houseView,
      houseSide: group.houseSide,
      houseInstanceId: group.houseInstanceId,
      isFlippedHorizontally: Boolean(group.isFlippedHorizontally),
      isRightSide: Boolean(group.isRightSide),
    },
  };
}

export function collectHouseGroupRebuildSources<TGroup extends CanvasObjectCandidate>(
  objects: TGroup[],
): HouseGroupRebuildSource<TGroup>[] {
  return collectHouseGroupCandidates(objects).map((group) => mapHouseGroupToRebuildSource(group));
}

export function collectHouseGroupPilotiSources<TGroup extends HouseGroupWithObjects>(
  objects: TGroup[],
): HouseGroupPilotiSource[] {
  return collectHouseGroupCandidates(objects).map((group) => ({
    objects: group.getObjects(),
  }));
}
