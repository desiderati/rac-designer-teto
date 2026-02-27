import {DEFAULT_HOUSE_PILOTI, HousePiloti} from "@/shared/types/house.ts";
import {Canvas as FabricCanvas, FabricObject, Group} from "fabric";
import {CanvasObject, getAllPilotiIds, toCanvasGroup} from "@/components/lib/canvas/index.ts";
import {RebuildViewSource} from "@/shared/types/house-rebuild.ts";

export interface RebuildPilotiSourceObject {
  pilotiId?: unknown;
  isPilotiCircle?: unknown;
  isPilotiRect?: unknown;
  pilotiHeight?: unknown;
  pilotiIsMaster?: unknown;
  pilotiNivel?: unknown;
}

export interface RebuildPilotiSource {
  objects: RebuildPilotiSourceObject[];
}

export function rebuildPilotiDataFromSources(params: {
  pilotiIds: string[];
  currentPilotis: Record<string, HousePiloti>;
  defaultPiloti: HousePiloti;
  sources: RebuildPilotiSource[];
}): Record<string, HousePiloti> {
  const nextPilotis: Record<string, HousePiloti> = {};

  params.pilotiIds.forEach((id) => {
    const current = params.currentPilotis[id] ?? params.defaultPiloti;
    nextPilotis[id] = {...current};
  });

  for (const source of params.sources) {
    for (const id of params.pilotiIds) {
      const object = source.objects.find(
        (item) => item?.pilotiId === id && (item?.isPilotiCircle || item?.isPilotiRect),
      );
      if (!object) continue;

      nextPilotis[id] = {
        height: Number(object.pilotiHeight ?? nextPilotis[id].height ?? params.defaultPiloti.height),
        isMaster: Boolean(object.pilotiIsMaster ?? nextPilotis[id].isMaster ?? params.defaultPiloti.isMaster),
        nivel: Number(object.pilotiNivel ?? nextPilotis[id].nivel ?? params.defaultPiloti.nivel),
      };
    }
  }

  return nextPilotis;
}

export function readPilotiDataFromCanvas(canvas: FabricCanvas): Record<string, HousePiloti> {
  const houseGroups = canvas
    ? canvas.getObjects().filter(
      (object): object is Group & CanvasObject => isHouseGroupWithObjects(object)
    ) : [];

  const sources: RebuildPilotiSource[] =
    collectHouseGroupPilotiSources(houseGroups).map((source) => ({
      objects: source.objects
        .map((value) => toRebuildPilotiSourceObject(value))
        .filter((value): value is RebuildPilotiSourceObject => value !== null),
    }));

  return rebuildPilotiDataFromSources({
    pilotiIds: getAllPilotiIds(),
    currentPilotis: this.house?.pilotis ?? {},
    defaultPiloti: DEFAULT_HOUSE_PILOTI,
    sources,
  });
}

export function isHouseGroupWithObjects(object: FabricObject): object is Group & CanvasObject {
  return object.type === 'group' && typeof (object as { getObjects?: unknown }).getObjects === 'function';
}

export function toRebuildPilotiSourceObject(value: unknown): RebuildPilotiSourceObject | null {
  if (!value || typeof value !== 'object') return null;
  return value as RebuildPilotiSourceObject;
}

export function isHouseGroupCandidate(value: CanvasObject): boolean {
  return value?.type === 'group' && value?.myType === 'house';
}

export function findTopViewGroupCandidate<T extends CanvasObject>(objects: T[]): T | null {
  return objects.find((object) => isTopViewGroupCandidate(object)) ?? null;
}

export function isTopViewGroupCandidate(value: CanvasObject): boolean {
  return isHouseGroupCandidate(value) && value?.houseView === 'top';
}

export function mapHouseGroupToRebuildSource<TGroup extends CanvasObject>(
  group: TGroup,
): RebuildViewSource<TGroup> {
  return {
    group,
    metadata: {
      houseViewType: group.houseViewType,
      houseView: group.houseView,
      houseSide: group.houseSide,
      houseInstanceId: group.houseInstanceId,
      isFlippedHorizontally: Boolean(group.isFlippedHorizontally),
      isRightSide: Boolean(group.isRightSide),
    },
  };
}

export function collectHouseGroupRebuildSources<TGroup extends CanvasObject>(
  objects: TGroup[],
): RebuildViewSource<TGroup>[] {
  return collectHouseGroupCandidates(objects).map(
    (group) => mapHouseGroupToRebuildSource(group)
  );
}

export function collectHouseGroupPilotiSources<TGroup extends CanvasObject>(
  objects: TGroup[],
): RebuildPilotiSource[] {
  return collectHouseGroupCandidates(objects).map((group) => ({
    objects: group.getObjects(),
  }));
}

export function collectHouseGroupCandidates<T extends CanvasObject>(objects: T[]): T[] {
  return objects.filter((object) => isHouseGroupCandidate(object));
}

export function toRebuildViewSource(group: Group): RebuildViewSource<Group> {
  const canvasGroup = toCanvasGroup(group);
  return {
    group,
    metadata: {
      houseViewType: canvasGroup.houseViewType,
      houseView: canvasGroup.houseViewType,
      houseSide: canvasGroup.houseSide,
      houseInstanceId: canvasGroup.houseInstanceId,
      isFlippedHorizontally: Boolean(canvasGroup.flipX),
      isRightSide: canvasGroup.houseSide === 'right',
    },
  };
}
