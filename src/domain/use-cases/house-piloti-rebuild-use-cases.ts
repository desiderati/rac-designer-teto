import {HousePiloti} from '@/shared/types/house.ts';

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

export function getAllPilotiIds(): string[] {
  const ids: string[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      ids.push(`piloti_${col}_${row}`);
    }
  }
  return ids;
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
