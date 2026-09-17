import { useEffect, useMemo, useState } from 'react';
import type {
  ConstructionSiteSessionStoragePort,
  StoredConstructionSitesDocument,
} from '@/components/rac-editor/lib/construction-site-session.ts';
import type { ConstructionSiteRepositoryPort } from '@/domain/construction-site/construction-site-repository.port.ts';
import { racTrpcClient } from '@/lib/trpc-client.ts';
import { RemoteConstructionSiteRepositoryAdapter } from '@/infra/persistence/remote-construction-site-repository.adapter.ts';
import type { ConstructionSiteState } from '@/shared/types/construction-site.ts';

type RemoteConstructionSiteStorageLoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; storage: ConstructionSiteSessionStoragePort };

/**
 * Hidrata a sessão síncrona usada pelo canvas a partir do repositório remoto.
 * A escrita é otimista e enfileirada; IndexedDB não participa como fonte de verdade.
 */
export function useRemoteConstructionSiteSessionStorage(): RemoteConstructionSiteStorageLoadState {
  const repository = useMemo(() => new RemoteConstructionSiteRepositoryAdapter(racTrpcClient), []);
  const [state, setState] = useState<RemoteConstructionSiteStorageLoadState>({ status: 'loading' });

  useEffect(() => {
    let alive = true;

    async function loadConstructionSites() {
      try {
        const summaries = await repository.list();
        const constructionSites = (await Promise.all(
          summaries.map((summary) => repository.load(summary.id)),
        )).filter((constructionSite): constructionSite is ConstructionSiteState => constructionSite !== null);

        if (!alive) return;
        setState({
          status: 'ready',
          storage: createReactiveConstructionSiteSessionStorage(
            constructionSites,
            (next, previous) => persistReactiveConstructionSites(repository, next, previous),
          ),
        });
      } catch (error) {
        if (!alive) return;
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Falha ao carregar as Construções TETO remotas.',
        });
      }
    }

    void loadConstructionSites();
    return () => { alive = false; };
  }, [repository]);

  return state;
}

export async function persistReactiveConstructionSites(
  repository: Pick<ConstructionSiteRepositoryPort, 'save' | 'remove'>,
  constructionSites: ConstructionSiteState[],
  previousConstructionSites: ConstructionSiteState[],
): Promise<void> {
  const previousById = new Map(previousConstructionSites.map((entry) => [entry.constructionSite.id, entry]));
  const nextIds = new Set(constructionSites.map((entry) => entry.constructionSite.id));
  const changed = constructionSites.filter((entry) => !areConstructionSitesEqual(entry, previousById.get(entry.constructionSite.id)));
  const removedIds = previousConstructionSites
    .map((entry) => entry.constructionSite.id)
    .filter((constructionSiteId) => !nextIds.has(constructionSiteId));

  await Promise.all(changed.map((constructionSite) => repository.save(constructionSite)));
  await Promise.all(removedIds.map((constructionSiteId) => repository.remove(constructionSiteId)));
}

export function createReactiveConstructionSiteSessionStorage(
  initialConstructionSites: ConstructionSiteState[],
  onWrite: (next: ConstructionSiteState[], previous: ConstructionSiteState[]) => Promise<void>,
): ConstructionSiteSessionStoragePort {
  let pendingWrite: Promise<void> | null = null;
  let document: StoredConstructionSitesDocument = {
    version: 1,
    constructionSites: cloneConstructionSites(initialConstructionSites),
  };

  return {
    read: () => cloneDocument(document),
    write: (constructionSites) => {
      const previous = document.constructionSites;
      document = {
        version: document.version,
        constructionSites: cloneConstructionSites(constructionSites),
      };
      const nextSnapshot = cloneConstructionSites(document.constructionSites);
      const previousSnapshot = cloneConstructionSites(previous);
      const run = async () => {
        await onWrite(nextSnapshot, previousSnapshot);
      };
      const scheduled = pendingWrite ? pendingWrite.then(run, run) : run();
      const tracked = scheduled.catch((error) => {
        console.error('[rac] Falha ao sincronizar Construções TETO remotas.', error);
      });
      pendingWrite = tracked;
      void tracked.finally(() => {
        if (pendingWrite === tracked) pendingWrite = null;
      });
    },
  };
}

function areConstructionSitesEqual(
  next: ConstructionSiteState,
  previous: ConstructionSiteState | undefined,
): boolean {
  if (!previous) return false;
  const nextVersion = next.constructionSite.documentVersion;
  const previousVersion = previous.constructionSite.documentVersion;
  const normalizedNext = {
    ...next,
    constructionSite: { ...next.constructionSite, documentVersion: undefined },
  };
  const normalizedPrevious = {
    ...previous,
    constructionSite: { ...previous.constructionSite, documentVersion: undefined },
  };
  return nextVersion === previousVersion && JSON.stringify(normalizedNext) === JSON.stringify(normalizedPrevious);
}

function cloneDocument(document: StoredConstructionSitesDocument): StoredConstructionSitesDocument {
  return {
    version: document.version,
    constructionSites: cloneConstructionSites(document.constructionSites),
  };
}

function cloneConstructionSites(constructionSites: ConstructionSiteState[]): ConstructionSiteState[] {
  return JSON.parse(JSON.stringify(constructionSites)) as ConstructionSiteState[];
}
