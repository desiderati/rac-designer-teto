import type {
  CommunityRecord,
  ConstructionSiteState,
  FamilyRecord,
  MonitorRecord,
  PersistedHouseRecord,
} from '@/shared/types/construction-site.ts';

export type ConstructionSiteEntityKind = 'communities' | 'families' | 'monitors' | 'houses';

export interface RemoteOnlyEntity {
  kind: ConstructionSiteEntityKind;
  id: string;
  label: string;
}

export interface ConstructionSiteMergeResult {
  ok: boolean;
  state: ConstructionSiteState | null;
  conflicts: string[];
  remoteOnlyEntities: RemoteOnlyEntity[];
}

type EntityWithId = { id: string };
type MergeMetadataPath = 'updatedAt' | 'version' | 'activeHouseId' | 'documentVersion';

const ENTITY_COLLECTIONS: ConstructionSiteEntityKind[] = [
  'communities',
  'families',
  'monitors',
  'houses',
];

/**
 * Faz um merge conservador entre a base que o operador carregou, sua versão
 * local e a versão que chegou ao servidor durante a edição.
 *
 * A regra é deliberadamente assimétrica em relação à perda de dados:
 * - uma criação independente em cada sessão é preservada;
 * - uma alteração feita somente por um lado é preservada;
 * - alterações concorrentes no mesmo campo são bloqueadas;
 * - remoção de uma entidade que ainda existe no outro lado é bloqueada.
 */
export function mergeConstructionSiteStates(
  baseState: ConstructionSiteState | null,
  localState: ConstructionSiteState,
  remoteState: ConstructionSiteState,
): ConstructionSiteMergeResult {
  if (!baseState) {
    if (deepEqual(localState, remoteState)) {
      return {ok: true, state: cloneState(remoteState), conflicts: [], remoteOnlyEntities: []};
    }

    return {
      ok: false,
      state: null,
      conflicts: ['Não foi possível identificar uma base comum para este conflito.'],
      remoteOnlyEntities: collectRemoteOnlyEntities(localState, remoteState),
    };
  }

  const conflicts: string[] = [];
  const remoteOnlyEntities: RemoteOnlyEntity[] = [];
  const constructionSite = mergeValue(
    baseState.constructionSite,
    localState.constructionSite,
    remoteState.constructionSite,
    'constructionSite',
    conflicts,
  );

  const communities = mergeEntityCollection(
    baseState.communities,
    localState.communities,
    remoteState.communities,
    'communities',
    conflicts,
    remoteOnlyEntities,
  );
  const families = mergeEntityCollection(
    baseState.families,
    localState.families,
    remoteState.families,
    'families',
    conflicts,
    remoteOnlyEntities,
  );
  const monitors = mergeEntityCollection(
    baseState.monitors,
    localState.monitors,
    remoteState.monitors,
    'monitors',
    conflicts,
    remoteOnlyEntities,
  );
  const houses = mergeEntityCollection(
    baseState.houses,
    localState.houses,
    remoteState.houses,
    'houses',
    conflicts,
    remoteOnlyEntities,
  );

  if (conflicts.length > 0) {
    return {ok: false, state: null, conflicts, remoteOnlyEntities};
  }

  const state: ConstructionSiteState = {
    constructionSite: constructionSite as ConstructionSiteState['constructionSite'],
    communities: communities as CommunityRecord[],
    families: families as FamilyRecord[],
    monitors: monitors as MonitorRecord[],
    houses: houses as PersistedHouseRecord[],
  };

  return {ok: true, state: cloneState(state), conflicts: [], remoteOnlyEntities};
}

function mergeEntityCollection<T extends EntityWithId>(
  baseCollection: T[],
  localCollection: T[],
  remoteCollection: T[],
  kind: ConstructionSiteEntityKind,
  conflicts: string[],
  remoteOnlyEntities: RemoteOnlyEntity[],
): T[] {
  const baseById = new Map(baseCollection.map((entry) => [entry.id, entry]));
  const localById = new Map(localCollection.map((entry) => [entry.id, entry]));
  const remoteById = new Map(remoteCollection.map((entry) => [entry.id, entry]));
  const orderedIds = [...new Set([...remoteCollection, ...localCollection].map((entry) => entry.id))];
  const merged: T[] = [];

  for (const id of orderedIds) {
    const base = baseById.get(id);
    const local = localById.get(id);
    const remote = remoteById.get(id);
    const path = `${kind}.${id}`;

    if (remote && !local) {
      if (base) {
        conflicts.push(`${path}: a entidade foi removida localmente, mas continua no servidor`);
      } else {
        remoteOnlyEntities.push({kind, id, label: entityLabel(kind, remote)});
      }
      merged.push(remote);
      continue;
    }

    if (local && !remote) {
      if (base) {
        conflicts.push(`${path}: a entidade foi removida no servidor, mas continua localmente`);
      }
      merged.push(local);
      continue;
    }

    if (!local || !remote) continue;
    merged.push(mergeValue(base, local, remote, path, conflicts) as T);
  }

  return merged;
}

function mergeValue(
  base: unknown,
  local: unknown,
  remote: unknown,
  path: string,
  conflicts: string[],
): unknown {
  if (deepEqual(local, remote)) return local;
  if (deepEqual(local, base)) return remote;
  if (deepEqual(remote, base)) return local;

  const metadata = metadataPath(path);
  if (metadata === 'documentVersion') return remote;
  if (metadata === 'activeHouseId') return local ?? remote;
  if (metadata === 'updatedAt') return maxComparable(local, remote);
  if (metadata === 'version') return Math.max(asNumber(local), asNumber(remote));

  if (isRecord(base) && isRecord(local) && isRecord(remote)) {
    const keys = new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)]);
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      result[key] = mergeValue(base[key], local[key], remote[key], `${path}.${key}`, conflicts);
    }
    return result;
  }

  conflicts.push(`${path}: alterações concorrentes no mesmo campo`);
  return remote;
}

function metadataPath(path: string): MergeMetadataPath | null {
  const field = path.split('.').at(-1);
  if (field === 'updatedAt' || field === 'version' || field === 'activeHouseId' || field === 'documentVersion') {
    return field;
  }
  return null;
}

function collectRemoteOnlyEntities(
  localState: ConstructionSiteState,
  remoteState: ConstructionSiteState,
): RemoteOnlyEntity[] {
  return ENTITY_COLLECTIONS.flatMap((kind) => {
    const localIds = new Set(localState[kind].map((entry) => entry.id));
    return remoteState[kind]
      .filter((entry) => !localIds.has(entry.id))
      .map((entry) => ({kind, id: entry.id, label: entityLabel(kind, entry)}));
  });
}

function entityLabel(kind: ConstructionSiteEntityKind, entity: EntityWithId & {name?: string}): string {
  if (kind === 'houses') return `Casa ${entity.id}`;
  if (kind === 'families') return entity.name?.trim() || `Família ${entity.id}`;
  if (kind === 'monitors') return entity.name?.trim() || `Monitor ${entity.id}`;
  return entity.name?.trim() || `Comunidade ${entity.id}`;
}

function maxComparable(local: unknown, remote: unknown): unknown {
  if (typeof local === 'string' && typeof remote === 'string') return local >= remote ? local : remote;
  return remote ?? local;
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function cloneState(state: ConstructionSiteState): ConstructionSiteState {
  return JSON.parse(JSON.stringify(state)) as ConstructionSiteState;
}
