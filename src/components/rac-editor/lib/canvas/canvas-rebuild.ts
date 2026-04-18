import {DEFAULT_HOUSE_PILOTI, HousePiloti} from '@/shared/types/house.ts';
import {Canvas as FabricCanvas} from 'fabric';
import {
  CanvasGroup,
  getCanvasGroupObjects,
  isCanvasGroup
} from '@/components/rac-editor/lib/canvas/index.ts';
import {RebuildViewSource} from '@/shared/types/house-rebuild.ts';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';

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

export function readPilotiDataFromCanvas(
  canvas: FabricCanvas,
  currentPilotis?: Record<string, HousePiloti>,
): Record<string, HousePiloti> {
  const houseGroups = canvas
    ? canvas.getObjects().filter(
      (object): object is CanvasGroup => isCanvasGroup(object)
    ) : [];

  const sources: RebuildPilotiSource[] =
    collectHouseGroupPilotiSources(houseGroups).map((source) => ({
      objects: source.objects
        .map((value) => toRebuildPilotiSourceObject(value))
        .filter((value): value is RebuildPilotiSourceObject => value !== null),
    }));

  return rebuildPilotiDataFromSources({
    pilotiIds: getAllPilotiIds(),
    currentPilotis: currentPilotis ?? {},
    defaultPiloti: DEFAULT_HOUSE_PILOTI,
    sources,
  });
}

export function toRebuildPilotiSourceObject(value: unknown): RebuildPilotiSourceObject | null {
  if (!value || typeof value !== 'object') return null;
  return value as RebuildPilotiSourceObject;
}

export function findTopViewGroupCandidate<T extends CanvasGroup>(objects: T[]): T | null {
  return objects.find((object) => isTopViewGroupCandidate(object)) ?? null;
}

export function isTopViewGroupCandidate(value: CanvasGroup): boolean {
  return isHouseGroupCandidate(value) && value?.houseView === 'top';
}

export function isHouseGroupCandidate(value: CanvasGroup): boolean {
  return isCanvasGroup(value) && value?.myType === 'house';
}

export function mapHouseGroupToRebuildSource<TGroup extends CanvasGroup>(
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

export function collectHouseGroupRebuildSources<TGroup extends CanvasGroup>(
  objects: TGroup[],
): RebuildViewSource<TGroup>[] {
  return collectHouseGroupCandidates(objects).map(
    (group) => mapHouseGroupToRebuildSource(group)
  );
}

export function collectHouseGroupPilotiSources<TGroup extends CanvasGroup>(
  objects: TGroup[],
): RebuildPilotiSource[] {
  return collectHouseGroupCandidates(objects).map((group) => ({
    objects: getCanvasGroupObjects(group),
  }));
}

export function collectHouseGroupCandidates<T extends CanvasGroup>(objects: T[]): T[] {
  return objects.filter((object) => isHouseGroupCandidate(object));
}

export function toRebuildViewSource(canvasGroup: CanvasGroup): RebuildViewSource<CanvasGroup> {
  return {
    group: canvasGroup,
    metadata: {
      houseViewType: canvasGroup.houseViewType,
      // Compatibilidade com JSONs antigos que persistiam somente `houseView`.
      houseView: canvasGroup.houseView ?? canvasGroup.houseViewType,
      houseSide: canvasGroup.houseSide,
      houseInstanceId: canvasGroup.houseInstanceId,
      isFlippedHorizontally: Boolean(canvasGroup.flipX),
      isRightSide: canvasGroup.houseSide === 'right',
    },
  };
}
