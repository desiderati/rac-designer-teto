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
import { mergeConstructionSiteStates } from '@/domain/construction-site/construction-site-conflict-merge.ts';
import {createIndexedDbConstructionSiteStorageDriver} from '@/infra/storage/indexed-db-construction-sites.storage.ts';
import {isIsolatedLocalMode, isLocalEditorMode} from '@/shared/local-runtime.ts';
import {
  IndexedDbRemoteSyncJournal,
  remoteJournalIdentity,
  type RemoteSyncJournal,
  type RemoteJournalSnapshot,
} from '@/infra/storage/remote-sync-journal.ts';
import type {
  RemoteSyncConflict,
  RemoteSyncController,
  RemoteSyncStatus,
} from '@/contexts/RemoteSyncContext.tsx';

export type RemoteConstructionSiteStorageLoadState =
  | { status: 'loading' }
  | { status: 'pending_sessions'; sessions: PendingSession[]; message?: string;
    recover: (session: PendingSession) => Promise<void>; continueCurrent: () => void }
  | { status: 'legacy_confirmation'; message?: string; discardLegacyData: () => Promise<void>; keepLegacyData: () => void }
  | { status: 'blocked'; reviewLegacyData: () => void }
  | { status: 'error'; message: string }
  | { status: 'ready'; storage: ConstructionSiteSessionStoragePort; sync: RemoteSyncController };

type SessionRepository = ConstructionSiteRepositoryPort & {
  setDocumentVersion?: (constructionSiteId: string, version: number) => void;
  getSavedAt?: (constructionSiteId: string) => string | undefined;
};

type PendingSession = {sessionId: string; revision: number; savedAt: string; documentCount: number};

export function useRemoteConstructionSiteSessionStorage(ownerId?: string): RemoteConstructionSiteStorageLoadState {
  const sessionRepository = useMemo<{ownerId?: string; repository: SessionRepository}>(() => ({
    ownerId,
    repository: isLocalEditorMode
      ? new IndexedDbConstructionSiteRepositoryAdapter(
        isIsolatedLocalMode
          ? createIndexedDbConstructionSiteStorageDriver('rac-designer-teto-isolated', true)
          : createIndexedDbConstructionSiteStorageDriver(),
      )
      : new RemoteConstructionSiteRepositoryAdapter(racTrpcClient),
  }), [ownerId]);
  const repository = sessionRepository.repository;
  const journalState = useMemo(() => {
    if (isLocalEditorMode) return {journal: undefined, error: null};
    try {
      return {journal: new IndexedDbRemoteSyncJournal(remoteJournalIdentity(ownerId ?? '')), error: null};
    } catch (error) {
      return {journal: undefined, error: toRemoteSyncMessage(error, 'Não foi possível preparar a fila persistente.')};
    }
  }, [ownerId]);
  const [loadStatus, setLoadStatus] = useState<'loading' | 'legacy_confirmation' | 'pending_sessions' | 'blocked' | 'ready' | 'error'>('loading');
  const [pendingSessions, setPendingSessions] = useState<PendingSession[]>([]);
  const recoveryReviewedFor = useRef<string | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [storage, setStorage] = useState<ReturnType<typeof createReactiveConstructionSiteSessionStorage> | null>(null);
  const [syncStatus, setSyncStatus] = useState<RemoteSyncStatus>('syncing');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState<RemoteSyncConflict | null>(null);
  const [revision, setRevision] = useState(0);
  const [loadGeneration, setLoadGeneration] = useState(0);
  const syncSessionGenerationRef = useRef(0);
  const needsRemoteReload = useRef(false);
  const loadedOwner = useRef<string | undefined>(undefined);

  const loadRemote = useCallback(async () => {
    const syncSessionGeneration = syncSessionGenerationRef.current + 1;
    syncSessionGenerationRef.current = syncSessionGeneration;
    setLoadStatus('loading');
    setLoadError(null);
    setSyncStatus('syncing');
    try {
      if (journalState.error) throw new Error(journalState.error);
      const recovered = await journalState.journal?.read();
      if (syncSessionGenerationRef.current !== syncSessionGeneration) return;
      const hasPending = recovered && !areConstructionSiteListsEqual(recovered.document, recovered.synchronized);
      if (!hasPending && recoveryReviewedFor.current !== ownerId) {
        const sessions = await journalState.journal?.pendingSessions() ?? [];
        if (syncSessionGenerationRef.current !== syncSessionGeneration) return;
        if (sessions.length) {
          setPendingSessions(sessions);
          setLoadStatus('pending_sessions');
          return;
        }
        recoveryReviewedFor.current = ownerId;
      }
      let constructionSites: ConstructionSiteState[];
      let cachedOffline = false;
      needsRemoteReload.current = false;
      if (recovered && hasPending) {
        constructionSites = recovered.document;
        for (const state of recovered.synchronized) {
          repository.setDocumentVersion?.(state.constructionSite.id, state.constructionSite.documentVersion ?? 0);
        }
      } else {
        try {
          const summaries = await repository.list();
          const results = await Promise.allSettled(summaries.map((summary) => repository.load(summary.id)));
          const failure = results.find(entry => entry.status === 'rejected' && isAuthenticationError(entry.reason))
            ?? results.find(entry => entry.status === 'rejected');
          if (failure?.status === 'rejected') throw failure.reason;
          constructionSites = results.flatMap(entry => entry.status === 'fulfilled' && entry.value ? [entry.value] : []);
        } catch (error) {
          if (syncSessionGenerationRef.current !== syncSessionGeneration) return;
          if (!recovered || isAuthenticationError(error)) throw error;
          constructionSites = recovered.document;
          // As cargas paralelas que tiveram sucesso podem ter avançado o cache
          // de versões do adapter. A edição continuará baseada no snapshot local.
          for (const state of recovered.synchronized) {
            repository.setDocumentVersion?.(state.constructionSite.id, state.constructionSite.documentVersion ?? 0);
          }
          cachedOffline = true;
          needsRemoteReload.current = true;
          setErrorMessage('Exibindo a cópia deste dispositivo. Reconecte para consultar a base compartilhada.');
        }
        if (syncSessionGenerationRef.current !== syncSessionGeneration) return;
        if (!cachedOffline) await journalState.journal?.write({document: constructionSites, synchronized: constructionSites});
      }

      const nextStorage = createReactiveConstructionSiteSessionStorage(
        constructionSites,
        async (next, previous) => {
          const isCurrentSyncSession = () => syncSessionGenerationRef.current === syncSessionGeneration;
          if (!isCurrentSyncSession()) return false;
          if (isCurrentSyncSession()) setSyncStatus('pending');
          const synchronized = await persistReactiveConstructionSites(
            repository,
            next,
            previous,
            (status) => {
              if (isCurrentSyncSession()) setSyncStatus(status);
            },
            (value) => {
              if (isCurrentSyncSession()) setLastSyncedAt(value);
            },
            (value) => {
              if (isCurrentSyncSession()) setErrorMessage(value);
            },
            (value) => {
              if (isCurrentSyncSession()) setConflict(value);
            },
            (id) => nextStorage.read().constructionSites.find((entry) => entry.constructionSite.id === id),
            isCurrentSyncSession,
            (id, saved) => nextStorage.acknowledge(id, saved),
          );
          if (synchronized && isCurrentSyncSession()) {
            setSyncStatus('synced');
            setLastSyncedAt(new Date().toISOString());
          }
          return synchronized;
        },
        {
          journal: journalState.journal,
          initialSynchronized: hasPending ? recovered!.synchronized : constructionSites,
          isActive: () => syncSessionGenerationRef.current === syncSessionGeneration,
          onPersistenceError: (error) => {
            if (syncSessionGenerationRef.current !== syncSessionGeneration) return;
            setSyncStatus('error');
            setErrorMessage(toRemoteSyncMessage(error, 'Não foi possível preservar as alterações neste dispositivo.'));
          },
          onSettled: () => {
            if (syncSessionGenerationRef.current !== syncSessionGeneration) return;
            setSyncStatus('synced');
            setErrorMessage(null);
          },
        },
      );
      if (syncSessionGenerationRef.current !== syncSessionGeneration) return;
      setStorage(nextStorage);
      setConflict(null);
      if (!cachedOffline) setErrorMessage(null);
      setSyncStatus(cachedOffline ? 'error' : hasPending ? 'pending' : 'synced');
      setLastSyncedAt(cachedOffline || hasPending ? null : new Date().toISOString());
      loadedOwner.current = ownerId;
      setLoadStatus('ready');
      if (hasPending) nextStorage.resume?.();
    } catch (error) {
      if (syncSessionGenerationRef.current !== syncSessionGeneration) return;
      setLoadStatus('error');
      setLoadError(toRemoteSyncMessage(error, 'Falha ao carregar as Construções TETO remotas.'));
      setSyncStatus('error');
    }
  }, [journalState, ownerId, repository]);

  useEffect(() => {
    let alive = true;

    if (isLocalEditorMode) {
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
    return () => { alive = false; syncSessionGenerationRef.current += 1; };
  }, [loadRemote, loadGeneration]);

  const discardLegacyData = useCallback(async () => {
    setLoadError(null);
    try {
      await clearLegacyIndexedDbConstructionSites();
      setLoadGeneration((generation) => generation + 1);
    } catch (error) {
      setLoadError(toRemoteSyncMessage(error, 'Não foi possível apagar os dados locais. Tente novamente.'));
    }
  }, []);

  const recoverPendingSession = useCallback(async (session: PendingSession) => {
    const generation = syncSessionGenerationRef.current;
    setLoadError(null);
    try {
      await journalState.journal?.recover(session.sessionId, session.revision);
      if (syncSessionGenerationRef.current !== generation) return;
      recoveryReviewedFor.current = ownerId;
      await loadRemote();
    } catch (error) {
      if (syncSessionGenerationRef.current !== generation) return;
      setLoadError(toRemoteSyncMessage(error, 'Não foi possível retomar a fila. Os registros foram preservados.'));
      try {
        const sessions = await journalState.journal?.pendingSessions() ?? [];
        if (syncSessionGenerationRef.current === generation) setPendingSessions(sessions);
      } catch {
        // A falha original permanece visível e nenhum registro é substituído.
      }
    }
  }, [journalState, loadRemote, ownerId]);

  const continueCurrentSession = useCallback(() => {
    recoveryReviewedFor.current = ownerId;
    void loadRemote();
  }, [loadRemote, ownerId]);

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
    storage.replace?.(next, conflict.constructionSiteId);
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
      if (conflict.operation === 'remove') {
        if (conflict.remoteState.constructionSite.status !== 'archived') {
          throw new Error('A construção não está mais arquivada. Use a versão remota para continuar.');
        }
        repository.setDocumentVersion?.(conflict.constructionSiteId, conflict.remoteVersion);
        setConflict(null);
        setRevision(value => value + 1);
        setSyncStatus('pending');
        await storage.confirmRemoval(conflict.remoteState);
        return;
      }
      const latestLocal = storage.read().constructionSites.find(
        (entry) => entry.constructionSite.id === conflict.constructionSiteId,
      );
      if (!latestLocal) throw new Error('A Construção TETO local não está mais disponível para mesclar.');
      const merged = mergeConstructionSiteStates(
        conflict.baseState,
        latestLocal,
        conflict.remoteState,
      );
      if (!merged.ok || !merged.state) {
        setSyncStatus('conflict');
        setErrorMessage('A resolução automática foi bloqueada porque existem alterações concorrentes no mesmo dado. Use a versão remota e reabra a Construção para reaplicar suas mudanças manualmente.');
        return;
      }

      const mergedState = merged.state;
      mergedState.constructionSite.documentVersion = conflict.remoteVersion;
      repository.setDocumentVersion?.(conflict.constructionSiteId, conflict.remoteVersion);
      await repository.save(mergedState);
      storage.replace?.(replaceConstructionSite(storage.read().constructionSites, mergedState), conflict.constructionSiteId);
      setRevision((value) => value + 1);
      setConflict(null);
      setSyncStatus('synced');
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      setConflict(current => current ?? conflict);
      setSyncStatus('conflict');
      setErrorMessage(toRemoteSyncMessage(error, 'Não foi possível aplicar suas alterações.'));
    }
  }, [conflict, repository, storage]);

  const retry = useCallback(async () => {
    if (conflict) {
      setSyncStatus('conflict');
      return;
    }
    if (storage) {
      if (!needsRemoteReload.current) {
        storage.resume?.();
        return;
      }
      const generation = syncSessionGenerationRef.current;
      setSyncStatus('syncing');
      try {
        // A consulta usa outro adapter: versões recebidas só podem avançar a
        // fila atual se a sessão não tiver mudado durante o carregamento.
        const freshRepository = new RemoteConstructionSiteRepositoryAdapter(racTrpcClient);
        const refreshed = await storage.refresh(async () => {
          const summaries = await freshRepository.list();
          return (await Promise.all(summaries.map(summary => freshRepository.load(summary.id))))
            .filter((state): state is ConstructionSiteState => state !== null);
        }, states => {
          for (const state of states) {
            repository.setDocumentVersion?.(state.constructionSite.id, state.constructionSite.documentVersion ?? 0);
          }
        });
        if (syncSessionGenerationRef.current !== generation) return;
        if (refreshed) {
          needsRemoteReload.current = false;
          setRevision(value => value + 1);
          setErrorMessage(null);
          setLastSyncedAt(new Date().toISOString());
          setSyncStatus('synced');
        } else storage.resume?.();
      } catch (error) {
        if (syncSessionGenerationRef.current !== generation) return;
        setSyncStatus('error');
        setErrorMessage(toRemoteSyncMessage(error, 'Não foi possível atualizar a base remota. A sessão local foi preservada.'));
      }
      return;
    }
    await loadRemote();
  }, [conflict, loadRemote, repository, storage]);

  useEffect(() => {
    if (isLocalEditorMode || !storage) return;
    const reconnect = () => { void retry(); };
    window.addEventListener('online', reconnect);
    return () => window.removeEventListener('online', reconnect);
  }, [retry, storage]);

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

  if (loadStatus === 'loading' || (!isLocalEditorMode && loadStatus === 'ready' && loadedOwner.current !== ownerId)) return { status: 'loading' };
  if (loadStatus === 'legacy_confirmation') return { status: 'legacy_confirmation', message: loadError ?? undefined, discardLegacyData, keepLegacyData };
  if (loadStatus === 'pending_sessions') return {status: 'pending_sessions', sessions: pendingSessions,
    message: loadError ?? undefined, recover: recoverPendingSession, continueCurrent: continueCurrentSession};
  if (loadStatus === 'blocked') return { status: 'blocked', reviewLegacyData };
  if (loadStatus === 'error') return { status: 'error', message: loadError ?? 'Falha ao carregar a base remota.' };
  if (!storage) return { status: 'loading' };
  return { status: 'ready', storage, sync };
}

export async function persistReactiveConstructionSites(
  repository: Pick<ConstructionSiteRepositoryPort, 'save' | 'remove'> & {
    load?: (constructionSiteId: string) => Promise<ConstructionSiteState | null>;
    getSavedAt?: (constructionSiteId: string) => string | undefined;
  },
  constructionSites: ConstructionSiteState[],
  previousConstructionSites: ConstructionSiteState[],
  setStatus?: (status: RemoteSyncStatus) => void,
  setLastSyncedAt?: (value: string) => void,
  setErrorMessage?: (value: string | null) => void,
  setConflict?: (value: RemoteSyncConflict | null) => void,
  getLatestLocalState?: (constructionSiteId: string) => ConstructionSiteState | undefined,
  isActive: () => boolean = () => true,
  onAcknowledged?: (id: string, saved?: ConstructionSiteState) => Promise<void>,
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
      if (!isActive()) return false;
      try {
        await repository.save(constructionSite);
        await onAcknowledged?.(constructionSite.constructionSite.id, constructionSite);
      } catch (error) {
        if (!isConflictError(error)) throw error;
        const remote = repository.load
          ? await loadConflictState(
            (id) => repository.load!(id),
            constructionSite,
            previousById.get(constructionSite.constructionSite.id) ?? null,
            (id) => repository.getSavedAt?.(id),
            getLatestLocalState,
          )
          : null;
        if (remote) {
          setConflict?.(remote);
          setStatus?.('conflict');
          return false;
        }
        throw error;
      }
    }
    for (const constructionSiteId of removedIds) {
      if (!isActive()) return false;
      try {
        await repository.remove(constructionSiteId);
      } catch (error) {
        if (!isConflictError(error) || !repository.load) throw error;
        const base = previousById.get(constructionSiteId)!;
        const remote = await loadConflictState(
          id => repository.load!(id), base, base, id => repository.getSavedAt?.(id),
        );
        if (remote) {
          setConflict?.({...remote, operation: 'remove'});
          setStatus?.('conflict');
          return false;
        }
        // A intenção de excluir já foi satisfeita por outra sessão.
      }
      await onAcknowledged?.(constructionSiteId);
    }
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
  onWrite: (next: ConstructionSiteState[], previous: ConstructionSiteState[]) => Promise<boolean>,
  options: {
    journal?: RemoteSyncJournal;
    initialSynchronized?: ConstructionSiteState[];
    isActive?: () => boolean;
    onPersistenceError?: (error: unknown) => void;
    onSettled?: () => void;
  } = {},
): ConstructionSiteSessionStoragePort & {
  acknowledge(id: string, saved?: ConstructionSiteState): Promise<void>;
  refresh(load: () => Promise<ConstructionSiteState[]>, onAccepted: (states: ConstructionSiteState[]) => void): Promise<boolean>;
  confirmRemoval(remoteState: ConstructionSiteState): Promise<void>;
} {
  let pendingWrite: Promise<void> | null = null;
  let paused = false;
  let document: StoredConstructionSitesDocument = {
    version: 1,
    constructionSites: cloneConstructionSites(initialConstructionSites),
  };
  let synchronizedConstructionSites = cloneConstructionSites(options.initialSynchronized ?? initialConstructionSites);
  let persistenceQueue = Promise.resolve();
  let mutationRevision = 0;
  const persist = () => {
    const snapshot: RemoteJournalSnapshot = {
      document: cloneConstructionSites(document.constructionSites),
      synchronized: cloneConstructionSites(synchronizedConstructionSites),
    };
    const task = persistenceQueue.then(() => options.journal?.write(snapshot));
    persistenceQueue = task.then(() => undefined, () => undefined);
    return task;
  };
  const persistenceFailed = (error: unknown) => {
    paused = true;
    options.onPersistenceError?.(error);
  };

  const schedule = () => {
    if (paused || pendingWrite || (options.isActive && !options.isActive())
      || areConstructionSiteListsEqual(document.constructionSites, synchronizedConstructionSites)) return;
    const run = async () => {
      while (!paused && !areConstructionSiteListsEqual(document.constructionSites, synchronizedConstructionSites)) {
        if (options.isActive && !options.isActive()) return;
        const next = cloneConstructionSites(document.constructionSites);
        const localSnapshot = cloneConstructionSites(next);
        const previous = cloneConstructionSites(synchronizedConstructionSites);
        // A intenção deve estar confirmada no IndexedDB ANTES de qualquer chamada de rede.
        await persist();
        if (paused || (options.isActive && !options.isActive())) return;
        if (!await onWrite(next, previous)) {
          paused = true;
          await persist();
          return;
        }
        synchronizedConstructionSites = cloneConstructionSites(next);
        // O adapter remoto pode transformar o documento durante o save, por
        // exemplo, externalizando uma imagem data: em uma URL do Storage. Se
        // nenhuma edição nova chegou enquanto a gravação estava em andamento,
        // o documento em memória também deve adotar essa versão persistida.
        // Caso contrário, a diferença local data: × URL dispara saves
        // consecutivos e deixa o indicador preso em “Sincronizando”.
        if (areConstructionSiteListsEqual(document.constructionSites, localSnapshot)) {
          document = {version: document.version, constructionSites: cloneConstructionSites(next)};
        }
        await persist();
      }
      if (!paused && (!options.isActive || options.isActive())) options.onSettled?.();
    };
    const tracked = run().catch((error) => {
      persistenceFailed(error);
    });
    pendingWrite = tracked;
    void tracked.finally(() => {
      if (pendingWrite === tracked) pendingWrite = null;
      schedule();
    });
  };

  return {
    refresh: async (load, onAccepted) => {
      const revision = mutationRevision;
      if (pendingWrite || (options.isActive && !options.isActive())
        || !areConstructionSiteListsEqual(document.constructionSites, synchronizedConstructionSites)) return false;
      const fresh = await load();
      if (revision !== mutationRevision || pendingWrite || (options.isActive && !options.isActive())) return false;
      onAccepted(fresh);
      document = {version: document.version, constructionSites: cloneConstructionSites(fresh)};
      synchronizedConstructionSites = cloneConstructionSites(fresh);
      mutationRevision += 1;
      const acceptedRevision = mutationRevision;
      try { await persist(); } catch (error) { persistenceFailed(error); throw error; }
      return acceptedRevision === mutationRevision && !pendingWrite;
    },
    confirmRemoval: async (remoteState) => {
      const id = remoteState.constructionSite.id;
      synchronizedConstructionSites = replaceConstructionSite(synchronizedConstructionSites, remoteState);
      document = {...document, constructionSites: document.constructionSites.filter(entry => entry.constructionSite.id !== id)};
      mutationRevision += 1;
      const previousWrite = pendingWrite;
      try {
        await persist();
        await previousWrite;
        paused = false;
        schedule();
      } catch (error) { persistenceFailed(error); throw error; }
    },
    acknowledge: async (id, saved) => {
      mutationRevision += 1;
      synchronizedConstructionSites = saved
        ? replaceConstructionSite(synchronizedConstructionSites, saved)
        : synchronizedConstructionSites.filter(entry => entry.constructionSite.id !== id);
      await persist();
    },
    read: () => cloneDocument(document),
    write: (constructionSites) => {
      mutationRevision += 1;
      document = { version: document.version, constructionSites: cloneConstructionSites(constructionSites) };
      void persist().catch(persistenceFailed);
      schedule();
    },
    replace: (constructionSites, synchronizedConstructionSiteId) => {
      mutationRevision += 1;
      document = { version: document.version, constructionSites: cloneConstructionSites(constructionSites) };
      if (synchronizedConstructionSiteId) {
        const synchronized = constructionSites.find((entry) => entry.constructionSite.id === synchronizedConstructionSiteId);
        if (synchronized) synchronizedConstructionSites = replaceConstructionSite(synchronizedConstructionSites, synchronized);
      } else {
        synchronizedConstructionSites = cloneConstructionSites(constructionSites);
      }
      const previousWrite = pendingWrite;
      void persist().then(() => previousWrite).then(() => {
        paused = false;
        schedule();
      }).catch(persistenceFailed);
    },
    resume: () => {
      paused = false;
      void persist().then(() => {
        if (areConstructionSiteListsEqual(document.constructionSites, synchronizedConstructionSites)) options.onSettled?.();
        else schedule();
      }).catch(persistenceFailed);
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
  baseState: ConstructionSiteState | null,
  getRemoteSavedAt?: (constructionSiteId: string) => string | undefined,
  getLatestLocalState?: (constructionSiteId: string) => ConstructionSiteState | undefined,
): Promise<RemoteSyncConflict | null> {
  const remoteState = await load(localState.constructionSite.id);
  if (!remoteState) return null;
  const latestLocalState = getLatestLocalState?.(localState.constructionSite.id) ?? localState;
  const merge = mergeConstructionSiteStates(baseState, latestLocalState, remoteState);
  return {
    constructionSiteId: localState.constructionSite.id,
    baseState: baseState ? cloneConstructionSite(baseState) : null,
    localState: cloneConstructionSite(latestLocalState),
    remoteState: cloneConstructionSite(remoteState),
    remoteVersion: remoteState.constructionSite.documentVersion ?? 0,
    remoteSavedAt: getRemoteSavedAt?.(localState.constructionSite.id),
    conflicts: merge.conflicts,
    remoteOnlyEntities: merge.remoteOnlyEntities,
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
  return JSON.stringify(canonicalizeForComparison(normalizedNext))
    === JSON.stringify(canonicalizeForComparison(normalizedPrevious));
}

function areConstructionSiteListsEqual(next: ConstructionSiteState[], previous: ConstructionSiteState[]): boolean {
  return next.length === previous.length && next.every((entry, index) => areConstructionSitesEqual(entry, previous[index]));
}

function canonicalizeForComparison(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeForComparison);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, canonicalizeForComparison(nested)]),
  );
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
