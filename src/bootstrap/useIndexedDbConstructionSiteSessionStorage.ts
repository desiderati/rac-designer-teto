import {useEffect, useMemo, useState} from 'react';
import {IndexedDbConstructionSiteRepositoryAdapter} from '@/infra/persistence/indexed-db-construction-site-repository.adapter.ts';
import type {
  ConstructionSiteSessionStoragePort,
  StoredConstructionSitesDocument,
} from '@/components/rac-editor/lib/construction-site-session.ts';
import type {ConstructionSiteState} from '@/shared/types/construction-site.ts';

type ConstructionSiteStorageLoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; storage: ConstructionSiteSessionStoragePort };

export function useIndexedDbConstructionSiteSessionStorage(): ConstructionSiteStorageLoadState {
  const repository = useMemo(() => new IndexedDbConstructionSiteRepositoryAdapter(), []);
  const [state, setState] = useState<ConstructionSiteStorageLoadState>({status: 'loading'});

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
          storage: createReactiveConstructionSiteSessionStorage(constructionSites, async (nextConstructionSites) => {
            await Promise.all(nextConstructionSites.map((constructionSite) => repository.save(constructionSite)));
          }),
        });
      } catch (error) {
        if (!alive) return;
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Falha ao carregar construções.',
        });
      }
    }

    void loadConstructionSites();

    return () => {
      alive = false;
    };
  }, [repository]);

  return state;
}

function createReactiveConstructionSiteSessionStorage(
  initialConstructionSites: ConstructionSiteState[],
  onWrite: (constructionSites: ConstructionSiteState[]) => Promise<void>,
): ConstructionSiteSessionStoragePort {
  let document: StoredConstructionSitesDocument = {
    version: 1,
    constructionSites: cloneConstructionSites(initialConstructionSites),
  };

  return {
    read: () => cloneDocument(document),
    write: (constructionSites) => {
      document = {
        version: document.version,
        constructionSites: cloneConstructionSites(constructionSites),
      };
      void onWrite(document.constructionSites);
    },
  };
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
