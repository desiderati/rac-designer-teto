import type {ConstructionSiteState} from '@/shared/types/construction-site.ts';
import {transactionComplete} from './indexed-db-construction-sites.storage.ts';

export const REMOTE_SCOPE_ID = 'rac-designer-teto-global';
const DATABASE_NAME = 'rac-designer-teto-remote-sync';
const STORE_NAME = 'sessions';

export interface RemoteJournalIdentity {
  userId: string;
  sessionId: string;
  scopeId: typeof REMOTE_SCOPE_ID;
}

export interface RemoteJournalSnapshot {
  document: ConstructionSiteState[];
  synchronized: ConstructionSiteState[];
}

export interface PendingRemoteJournalSession {
  sessionId: string;
  revision: number;
  savedAt: string;
  documentCount: number;
}

interface StoredRemoteJournal extends RemoteJournalSnapshot, RemoteJournalIdentity {
  schemaVersion: 1;
  revision: number;
  savedAt: string;
  transferredTo?: string;
}

const TRANSFERRED_MESSAGE = 'Esta fila foi retomada em outra aba; feche a aba anterior.';

export interface RemoteSyncJournal {
  read(): Promise<RemoteJournalSnapshot | null>;
  write(snapshot: RemoteJournalSnapshot): Promise<void>;
}

/** A sessão da aba sobrevive à recarga; contas e abas diferentes não compartilham a fila. */
export function remoteJournalIdentity(userId: string): RemoteJournalIdentity {
  if (!userId.trim()) throw new Error('A fila remota exige uma identidade autenticada.');
  const key = `rac-remote-session:${JSON.stringify([REMOTE_SCOPE_ID, userId])}`;
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(key, sessionId);
  }
  return {userId, sessionId, scopeId: REMOTE_SCOPE_ID};
}

/** Banco separado do legado. Nunca contém cookies, tokens ou credenciais. */
export class IndexedDbRemoteSyncJournal implements RemoteSyncJournal {
  private revision = 0;

  constructor(
    private readonly identity: RemoteJournalIdentity,
    private readonly indexedDb: IDBFactory | undefined = globalThis.indexedDB,
  ) {}

  private get key(): string {
    return JSON.stringify([this.identity.scopeId, this.identity.userId, this.identity.sessionId]);
  }

  async read(): Promise<RemoteJournalSnapshot | null> {
    const database = await this.open();
    try {
      const value = await new Promise<StoredRemoteJournal | undefined>((resolve, reject) => {
        const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(this.key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('Falha ao ler a fila remota.'));
      });
      if (!value) { this.revision = 0; return null; }
      assertJournal(value, this.identity);
      if (value.transferredTo) throw new Error(TRANSFERRED_MESSAGE);
      this.revision = value.revision;
      return structuredClone({document: value.document, synchronized: value.synchronized});
    } finally {
      database.close();
    }
  }

  async write(snapshot: RemoteJournalSnapshot): Promise<void> {
    const database = await this.open();
    try {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const completed = transactionComplete(transaction);
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(this.key);
      let conflict = false;
      let failure: Error | undefined;
      request.onsuccess = () => {
        const current = request.result as StoredRemoteJournal | undefined;
        if (current) {
          try {
            assertJournal(current, this.identity);
            if (current.transferredTo) throw new Error(TRANSFERRED_MESSAGE);
          } catch (error) {
            failure = error as Error;
            transaction.abort();
            return;
          }
        }
        if ((current?.revision ?? 0) !== this.revision) {
          conflict = true;
          transaction.abort();
          return;
        }
        const value: StoredRemoteJournal = {
          ...structuredClone(snapshot),
          ...this.identity,
          schemaVersion: 1,
          revision: this.revision + 1,
          savedAt: new Date().toISOString(),
        };
        store.put(value, this.key);
      };
      try {
        await completed;
      } catch (error) {
        if (failure) throw failure;
        if (conflict) throw new Error('Outra aba alterou esta fila. Preserve esta aba e retome pela sessão original.');
        throw error;
      }
      this.revision += 1;
    } finally {
      database.close();
    }
  }

  /** Apenas candidatas da mesma conta com intenção ainda diferente da base sincronizada. */
  async pendingSessions(): Promise<PendingRemoteJournalSession[]> {
    const database = await this.open();
    try {
      const records = await new Promise<StoredRemoteJournal[]>((resolve, reject) => {
        const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result as StoredRemoteJournal[]);
        request.onerror = () => reject(request.error ?? new Error('Falha ao listar filas remotas.'));
      });
      return records.flatMap((record) => {
        if (record?.scopeId !== this.identity.scopeId || record.userId !== this.identity.userId
          || record.sessionId === this.identity.sessionId) return [];
        assertJournal(record, {...this.identity, sessionId: record.sessionId});
        if (record.transferredTo) return [];
        if (!hasPendingIntent(record)) return [];
        return [{sessionId: record.sessionId, revision: record.revision,
          savedAt: record.savedAt, documentCount: record.document.length}];
      }).sort((a, b) => a.sessionId.localeCompare(b.sessionId));
    } finally {
      database.close();
    }
  }

  /** Recuperação explícita: destino e marcador que invalida a origem são uma transação. */
  async recover(sessionId: string, revision: number): Promise<void> {
    if (!sessionId || sessionId === this.identity.sessionId || !Number.isInteger(revision) || revision < 1) {
      throw new Error('Sessão ou revisão de recuperação inválida.');
    }
    const database = await this.open();
    try {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const completed = transactionComplete(transaction);
      const store = transaction.objectStore(STORE_NAME);
      const sourceKey = JSON.stringify([this.identity.scopeId, this.identity.userId, sessionId]);
      const sourceRequest = store.get(sourceKey);
      let failure: Error | undefined;
      let destinationRevision = 0;
      const abort = (error: Error) => { failure = error; transaction.abort(); };
      sourceRequest.onsuccess = () => {
        const source = sourceRequest.result as StoredRemoteJournal | undefined;
        try {
          if (!source) throw new Error('A sessão anterior não existe mais.');
          assertJournal(source, {...this.identity, sessionId});
          if (source.transferredTo) throw new Error(TRANSFERRED_MESSAGE);
          if (source.revision !== revision || !hasPendingIntent(source)) {
            throw new Error('A sessão anterior mudou desde a listagem; consulte as pendências novamente.');
          }
        } catch (error) { abort(error as Error); return; }

        const destinationRequest = store.get(this.key);
        destinationRequest.onsuccess = () => {
          const destination = destinationRequest.result as StoredRemoteJournal | undefined;
          try {
            if (destination) assertJournal(destination, this.identity);
            if (destination?.transferredTo) throw new Error(TRANSFERRED_MESSAGE);
            if ((destination?.revision ?? 0) !== this.revision) {
              throw new Error('A sessão atual mudou; releia a fila antes de recuperar.');
            }
            if (destination && hasPendingIntent(destination)) {
              throw new Error('A sessão atual já tem alterações pendentes.');
            }
            destinationRevision = (destination?.revision ?? 0) + 1;
            store.put({...structuredClone({document: source.document, synchronized: source.synchronized}),
              ...this.identity, schemaVersion: 1, revision: destinationRevision,
              savedAt: new Date().toISOString()} satisfies StoredRemoteJournal, this.key);
            store.put({...source, document: [], synchronized: [], revision: source.revision + 1,
              savedAt: new Date().toISOString(), transferredTo: this.identity.sessionId} satisfies StoredRemoteJournal, sourceKey);
          } catch (error) { abort(error as Error); }
        };
      };
      try {
        await completed;
      } catch (error) {
        throw failure ?? error;
      }
      this.revision = destinationRevision;
    } finally {
      database.close();
    }
  }

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!this.indexedDb) { reject(new Error('IndexedDB indisponível; não é seguro enviar alterações sem fila persistente.')); return; }
      const request = this.indexedDb.open(DATABASE_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
      request.onerror = () => reject(request.error ?? new Error('Falha ao abrir a fila remota.'));
      request.onblocked = () => reject(new Error('A fila remota está bloqueada por outra aba.'));
      request.onsuccess = () => resolve(request.result);
    });
  }
}

function hasPendingIntent(snapshot: RemoteJournalSnapshot): boolean {
  const canonical = (states: ConstructionSiteState[]) => JSON.stringify(states.map((state) => {
    const copy = structuredClone(state);
    delete (copy.constructionSite as Partial<typeof copy.constructionSite>).documentVersion;
    return sortObjectKeys(copy);
  }));
  return canonical(snapshot.document) !== canonical(snapshot.synchronized);
}

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, sortObjectKeys(item)]));
  }
  return value;
}

function assertJournal(value: StoredRemoteJournal, identity: RemoteJournalIdentity): void {
  if (value.schemaVersion !== 1 || value.userId !== identity.userId
    || value.scopeId !== identity.scopeId || value.sessionId !== identity.sessionId
    || typeof value.userId !== 'string' || !value.userId.trim()
    || typeof value.sessionId !== 'string' || !value.sessionId.trim()
    || !Number.isInteger(value.revision) || value.revision < 1
    || typeof value.savedAt !== 'string' || !Number.isFinite(Date.parse(value.savedAt))
    || new Date(value.savedAt).toISOString() !== value.savedAt
    || !Array.isArray(value.document) || !Array.isArray(value.synchronized)
    || (value.transferredTo !== undefined && (typeof value.transferredTo !== 'string'
      || !value.transferredTo.trim() || value.transferredTo === value.sessionId
      || value.document.length !== 0 || value.synchronized.length !== 0))) {
    throw new Error('Fila remota incompatível; o registro foi preservado para recuperação.');
  }
  for (const state of [...value.document, ...value.synchronized]) {
    if (!state?.constructionSite?.id || !Array.isArray(state.houses)
      || !Array.isArray(state.families) || !Array.isArray(state.monitors) || !Array.isArray(state.communities)) {
      throw new Error('Documento inválido na fila remota; nenhuma alteração foi enviada.');
    }
  }
}
