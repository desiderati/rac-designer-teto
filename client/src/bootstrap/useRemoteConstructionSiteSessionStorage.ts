import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { startLogin } from '@/const.ts';
import type {
  ConstructionSiteSessionStoragePort,
  StoredConstructionSitesDocument,
} from '@/components/rac-editor/lib/construction-site-session.ts';
import type { ConstructionSiteRepositoryPort } from '@/domain/construction-site/construction-site-repository.port.ts';
import { racTrpcClient } from '@/lib/trpc-client.ts';
import { RemoteConstructionSiteRepositoryAdapter } from '@/infra/persistence/remote-construction-site-repository.adapter.ts';
import {
  clearLegacyIndexedDbConstructionSites,
  hasLegacyIndexedDbConstructionSites,
  IndexedDbConstructionSiteRepositoryAdapter,
} from '@/infra/persistence/indexed-db-construction-site-repository.adapter.ts';
import type { ConstructionSiteState } from '@/shared/types/construction-site.ts';
import type {
  RemoteSyncConflict,
  RemoteSyncController,
  RemoteSyncStatus,
} from '@/contexts/RemoteSyncContext.tsx';

export type RemoteConstructionSiteStorageLoadState =
  | { status: 'loading' }
  | { status: 'legacy_confirmation'; discardLegacyData: () => Promise<void>; keepLegacyData: () => void }
  | { status: 'blocked'; reviewLegacyData: () => void }
  | { status: 'error'; message: string }
  | { status: 'ready'; storage: ConstructionSiteSessionStoragePort; sync: RemoteSyncController };

type SessionRepository = ConstructionSiteRepositoryPort & {
  setDocumentVersion?: (constructionSiteId: string, version: number) => void;
};

const isLocalE2eMode = import.meta.env.VITE_E2E === 'true';

export function useRemoteConstructionSiteSessionStorage(): RemoteConstructionSiteStorageLoadState {
  const repository = useMemo<SessionRepository>(() => (
    isLocalE2eMode
      ? new IndexedDbConstructionSiteRepositoryAdapter()
      : new RemoteConstructionSiteRepositoryAdapter(racTrpcClient)
  ), []);
  const [loadStatus, setLoadStatus] = useState<'loading' | 'legacy_confirmation' | 'blocked' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [storage, setStorage] = useState<ConstructionSiteSessionStoragePort | null>(null);
  const [syncStatus, setSyncStatus] = useState<RemoteSyncStatus>('syncing');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState<RemoteSyncConflict | null>(null);
  const [revision, setRevision] = useState(0);
  const retryWriteRef = useRef<{ next: ConstructionSiteState[]; previous: ConstructionSiteState[] } | null>(null);
  const [loadGeneration, setLoadGeneration] = useState(0);

  const loadRemote = useCallback(async () => {
    setLoadStatus('loading');
    setLoadError(null);
    setSyncStatus('syncing');
    try {
      const summaries = await repository.list();
      const constructionSites = (await Promise.all(
        summaries.map((summary) => repository.load(summary.id)),
      )).filter((constructionSite): constructionSite is ConstructionSiteState => constructionSite !== null);

      const nextStorage = createReactiveConstructionSiteSessionStorage(
        constructionSites,
        async (next, previous) => {
          setSyncStatus('pending');
          retryWriteRef.current = { next, previous };
          const synchronized = await persistReactiveConstructionSites(
            repository,
            next,
            previous,
            setSyncStatus,
            setLastSyncedAt,
            setErrorMessage,
            setConflict,
          );
          if (synchronized) retryWriteRef.current = null;
        },
      );
      setStorage(nextStorage);
      setConflict(null);
      setErrorMessage(null);
      setSyncStatus('synced');
      setLastSyncedAt(new Date().toISOString());
      setLoadStatus('ready');
    } catch (error) {
      setLoadStatus('error');
      setLoadError(toRemoteSyncMessage(error, 'Falha ao carregar as Construções TETO remotas.'));
      setSyncStatus('error');
    }
  }, [repository]);

  useEffect(() => {
    let alive = true;

    if (isLocalE2eMode) {
      void loadRemote();
      return () => { alive = false; };
    }

    void hasLegacyIndexedDbConstructionSites()
      .then((hasLegacyData) => {
        if (!alive) return;
        if (hasLegacyData) {
          setLoadStatus('legacy_confirmation');
          return;
        }
        void loadRemote();
      })
      .catch((error) => {
        if (!alive) return;
        setLoadStatus('error');
        setLoadError(toRemoteSyncMessage(error, 'Não foi possível verificar os dados locais.'));
      });
    return () => { alive = false; };
  }, [loadRemote, loadGeneration]);

  const discardLegacyData = useCallback(async () => {
    await clearLegacyIndexedDbConstructionSites();
    setLoadGeneration((generation) => generation + 1);
  }, []);

  const keepLegacyData = useCallback(() => {
    setLoadStatus('blocked');
  }, []);

  const reviewLegacyData = useCallback(() => {
    setLoadStatus('legacy_confirmation');
  }, []);

  const dismissError = useCallback(() => setErrorMessage(null), []);

  const useRemoteVersion = useCallback(async () => {
    if (!conflict || !storage) return;
    const current = storage.read().constructionSites;
    const next = replaceConstructionSite(current, conflict.remoteState);
    storage.replace?.(next);
    repository.setDocumentVersion?.(conflict.constructionSiteId, conflict.remoteVersion);
    setRevision((value) => value + 1);
    setConflict(null);
    setErrorMessage(null);
    setSyncStatus('synced');
    setLastSyncedAt(new Date().toISOString());
  }, [conflict, repository, storage]);

  const keepLocalVersion = useCallback(async () => {
    if (!conflict || !storage) return;
    setSyncStatus('syncing');
    setErrorMessage(null);
    try {
      repository.setDocumentVersion?.(conflict.constructionSiteId, conflict.remoteVersion);
      await repository.save(conflict.localState);
      storage.replace?.(replaceConstructionSite(storage.read().constructionSites, conflict.localState));
      setRevision((value) => value + 1);
      setConflict(null);
      setSyncStatus('synced');
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      setSyncStatus('conflict');
      setErrorMessage(toRemoteSyncMessage(error, 'Não foi possível aplicar suas alterações.'));
    }
  }, [conflict, repository, storage]);

  const retry = useCallback(async () => {
    if (conflict) {
      setSyncStatus('conflict');
      return;
    }
    const pendingWrite = retryWriteRef.current;
    if (pendingWrite) {
      const synchronized = await persistReactiveConstructionSites(
        repository,
        pendingWrite.next,
        pendingWrite.previous,
        setSyncStatus,
        setLastSyncedAt,
        setErrorMessage,
        setConflict,
      );
      if (synchronized) retryWriteRef.current = null;
      return;
    }
    await loadRemote();
  }, [conflict, loadRemote, repository]);

  const sync = useMemo<RemoteSyncController>(() => ({
    status: syncStatus,
    revision,
    lastSyncedAt,
    errorMessage,
    conflict,
    dismissError,
    useRemoteVersion,
    keepLocalVersion,
    retry,
  }), [conflict, dismissError, errorMessage, keepLocalVersion, lastSyncedAt, retry, revision, syncStatus, useRemoteVersion]);

  if (loadStatus === 'loading') return { status: 'loading' };
  if (loadStatus === 'legacy_confirmation') return { status: 'legacy_confirmation', discardLegacyData, keepLegacyData };
  if (loadStatus === 'blocked') return { status: 'blocked', reviewLegacyData };
  if (loadStatus === 'error') return { status: 'error', message: loadError ?? 'Falha ao carregar a base remota.' };
  if (!storage) return { status: 'loading' };
  return { status: 'ready', storage, sync };
}

export async function persistReactiveConstructionSites(
  repository: Pick<ConstructionSiteRepositoryPort, 'save' | 'remove'> & {
    load?: (constructionSiteId: string) => Promise<ConstructionSiteState | null>;
  },
  constructionSites: ConstructionSiteState[],
  previousConstructionSites: ConstructionSiteState[],
  setStatus?: (status: RemoteSyncStatus) => void,
  setLastSyncedAt?: (value: string) => void,
  setErrorMessage?: (value: string | null) => void,
  setConflict?: (value: RemoteSyncConflict | null) => void,
): Promise<boolean> {
  setStatus?.('syncing');
  setErrorMessage?.(null);
  const previousById = new Map(previousConstructionSites.map((entry) => [entry.constructionSite.id, entry]));
  const nextIds = new Set(constructionSites.map((entry) => entry.constructionSite.id));
  const changed = constructionSites.filter((entry) => !areConstructionSitesEqual(entry, previousById.get(entry.constructionSite.id)));
  const removedIds = previousConstructionSites
    .map((entry) => entry.constructionSite.id)
    .filter((constructionSiteId) => !nextIds.has(constructionSiteId));

  try {
    for (const constructionSite of changed) {
      try {
        await repository.save(constructionSite);
      } catch (error) {
        if (!isConflictError(error)) throw error;
        const remote = repository.load ? await loadConflictState(repository.load, constructionSite) : null;
        if (remote) {
          setConflict?.(remote);
          setStatus?.('conflict');
          return false;
        }
        throw error;
      }
    }
    for (const constructionSiteId of removedIds) await repository.remove(constructionSiteId);
    setStatus?.('synced');
    setLastSyncedAt?.(new Date().toISOString());
    return true;
  } catch (error) {
    setStatus?.('error');
    setErrorMessage?.(toRemoteSyncMessage(error, 'Não foi possível sincronizar as alterações.'));
    if (isAuthenticationError(error) && typeof window !== 'undefined') {
      // A chamada é assíncrona e acontece fora da renderização. Assim, uma sessão
      // vencida no meio da edição volta ao fluxo Manus, sem deixar o usuário com
      // um retry que jamais teria credenciais para concluir.
      window.setTimeout(() => startLogin(), 0);
    }
    return false;
  }
}

export function createReactiveConstructionSiteSessionStorage(
  initialConstructionSites: ConstructionSiteState[],
  onWrite: (next: ConstructionSiteState[], previous: ConstructionSiteState[]) => Promise<void>,
): ConstructionSiteSessionStoragePort {
  let pendingWrite: Promise<void> | null = null;
  let writeSequence = 0;
  let document: StoredConstructionSitesDocument = {
    version: 1,
    constructionSites: cloneConstructionSites(initialConstructionSites),
  };

  return {
    read: () => cloneDocument(document),
    write: (constructionSites) => {
      const sequence = ++writeSequence;
      const previous = document.constructionSites;
      document = { version: document.version, constructionSites: cloneConstructionSites(constructionSites) };
      const nextSnapshot = cloneConstructionSites(document.constructionSites);
      const previousSnapshot = cloneConstructionSites(previous);
      const run = async () => {
        await onWrite(nextSnapshot, previousSnapshot);
        if (sequence === writeSequence) {
          document = { version: document.version, constructionSites: cloneConstructionSites(nextSnapshot) };
        }
      };
      const scheduled = pendingWrite ? pendingWrite.then(run, run) : run();
      const tracked = scheduled.catch((error) => console.error('[rac] Falha ao sincronizar Construções TETO remotas.', error));
      pendingWrite = tracked;
      void tracked.finally(() => {
        if (pendingWrite === tracked) pendingWrite = null;
      });
    },
    replace: (constructionSites) => {
      document = { version: document.version, constructionSites: cloneConstructionSites(constructionSites) };
    },
  };
}

function toRemoteSyncMessage(error: unknown, fallback: string): string {
  if (error instanceof TRPCClientError) {
    if (error.data?.code === 'UNAUTHORIZED' || error.message === UNAUTHED_ERR_MSG) {
      return 'Sua sessão Manus expirou ou foi bloqueada pelo preview. Entre novamente para continuar sincronizando.';
    }
    if (error.data?.code === 'PAYLOAD_TOO_LARGE') {
      return 'O documento ficou grande demais para sincronizar. Reduza imagens incorporadas e tente novamente.';
    }
    if (error.message.trim()) return error.message;
  }
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

function replaceConstructionSite(list: ConstructionSiteState[], replacement: ConstructionSiteState): ConstructionSiteState[] {
  const next = list.filter((entry) => entry.constructionSite.id !== replacement.constructionSite.id);
  next.push(cloneConstructionSite(replacement));
  return next;
}

async function loadConflictState(
  load: (constructionSiteId: string) => Promise<ConstructionSiteState | null>,
  localState: ConstructionSiteState,
): Promise<RemoteSyncConflict | null> {
  const remoteState = await load(localState.constructionSite.id);
  if (!remoteState) return null;
  return {
    constructionSiteId: localState.constructionSite.id,
    localState: cloneConstructionSite(localState),
    remoteState: cloneConstructionSite(remoteState),
    remoteVersion: remoteState.constructionSite.documentVersion ?? 0,
  };
}

function isConflictError(error: unknown): boolean {
  return error instanceof TRPCClientError && error.data?.code === 'CONFLICT';
}

function isAuthenticationError(error: unknown): boolean {
  return error instanceof TRPCClientError
    && (error.data?.code === 'UNAUTHORIZED' || error.message === UNAUTHED_ERR_MSG);
}

function areConstructionSitesEqual(next: ConstructionSiteState, previous: ConstructionSiteState | undefined): boolean {
  if (!previous) return false;
  const normalizedNext = { ...next, constructionSite: { ...next.constructionSite, documentVersion: undefined } };
  const normalizedPrevious = { ...previous, constructionSite: { ...previous.constructionSite, documentVersion: undefined } };
  return JSON.stringify(normalizedNext) === JSON.stringify(normalizedPrevious);
}

function cloneDocument(document: StoredConstructionSitesDocument): StoredConstructionSitesDocument {
  return { version: document.version, constructionSites: cloneConstructionSites(document.constructionSites) };
}

function cloneConstructionSites(constructionSites: ConstructionSiteState[]): ConstructionSiteState[] {
  return constructionSites.map(cloneConstructionSite);
}

function cloneConstructionSite(constructionSite: ConstructionSiteState): ConstructionSiteState {
  return JSON.parse(JSON.stringify(constructionSite)) as ConstructionSiteState;
}
