import type {ConstructionSiteState} from '@/shared/types/construction-site.ts';

export interface StoredConstructionSitesDocument {
  version: number;
  constructionSites: ConstructionSiteState[];
}

export interface ConstructionSiteStorageDriver {
  read(): Promise<StoredConstructionSitesDocument>;
  write(document: StoredConstructionSitesDocument): Promise<void>;
  clear?(): Promise<void>;
}

const DATABASE_NAME = 'rac-designer-teto';
const DATABASE_VERSION = 2;
const STORE_NAME = 'construction-site-documents';
const CONSTRUCTION_SITES_DOCUMENT_KEY = 'construction-sites';

const EMPTY_DOCUMENT: StoredConstructionSitesDocument = {
  version: 1,
  constructionSites: [],
};

export class IndexedDbConstructionSiteStorageDriver implements ConstructionSiteStorageDriver {
  constructor(
    private readonly indexedDb: IDBFactory | undefined = globalThis.indexedDB,
    private readonly databaseName: string = DATABASE_NAME,
    private readonly requireAvailable = false,
  ) {
  }

  async read(): Promise<StoredConstructionSitesDocument> {
    if (!this.indexedDb) {
      if (this.requireAvailable) throw new Error('IndexedDB indisponível; os dados locais não podem ser carregados.');
      return cloneStorageDocument(EMPTY_DOCUMENT);
    }

    const database = await openExistingDatabase(this.indexedDb, this.databaseName);
    if (!database) return cloneStorageDocument(EMPTY_DOCUMENT);
    try {
      if (!database.objectStoreNames.contains(STORE_NAME)) return cloneStorageDocument(EMPTY_DOCUMENT);
      const result = await requestToPromise<StoredConstructionSitesDocument | undefined>(
        database
          .transaction(STORE_NAME, 'readonly')
          .objectStore(STORE_NAME)
          .get(CONSTRUCTION_SITES_DOCUMENT_KEY),
      );

      if (result !== undefined && !isStoredConstructionSitesDocument(result)) {
        throw new Error('Os dados locais têm formato incompatível e foram preservados.');
      }
      if (result === undefined) return cloneStorageDocument(EMPTY_DOCUMENT);
      return cloneStorageDocument(result);
    } finally {
      database.close();
    }
  }

  async write(document: StoredConstructionSitesDocument): Promise<void> {
    if (!this.indexedDb) {
      if (this.requireAvailable) throw new Error('IndexedDB indisponível; os dados locais não podem ser salvos.');
      return;
    }

    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const completed = transactionComplete(transaction);
      transaction.objectStore(STORE_NAME).put(cloneStorageDocument(document), CONSTRUCTION_SITES_DOCUMENT_KEY);
      await completed;
    } finally {
      database.close();
    }
  }

  async clear(): Promise<void> {
    await this.write(EMPTY_DOCUMENT);
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!this.indexedDb) {
        reject(new Error('IndexedDB indisponível.'));
        return;
      }

      const request = this.indexedDb.open(this.databaseName, DATABASE_VERSION);
      request.onerror = () => reject(request.error ?? new Error('Falha ao abrir IndexedDB.'));
      request.onblocked = () => reject(new Error('Feche outras abas para atualizar o IndexedDB.'));
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME);
        }
      };
    });
  }
}

/** Abrir sem versão não migra uma base existente. A criação implícita é abortada. */
export function openExistingDatabase(indexedDb: IDBFactory, name: string): Promise<IDBDatabase | null> {
  return new Promise((resolve, reject) => {
    let absent = false;
    const request = indexedDb.open(name);
    request.onupgradeneeded = () => {
      absent = true;
      request.transaction!.abort();
    };
    request.onerror = () => absent
      ? resolve(null)
      : reject(request.error ?? new Error('Falha ao consultar IndexedDB.'));
    request.onblocked = () => reject(new Error('O IndexedDB está bloqueado por outra aba.'));
    request.onsuccess = () => resolve(request.result);
  });
}

export async function inspectLegacyConstructionSiteData(indexedDb = globalThis.indexedDB): Promise<boolean> {
  if (!indexedDb) return false;
  const database = await openExistingDatabase(indexedDb, DATABASE_NAME);
  if (!database) return false;
  try {
    const names = Array.from(database.objectStoreNames);
    if (!names.length) return false;
    const transaction = database.transaction(names, 'readonly');
    const checks = names.map(async (name) => {
      const store = transaction.objectStore(name);
      if (name !== STORE_NAME) return (await requestToPromise(store.count())) > 0;
      const [document, count] = await Promise.all([
        requestToPromise<unknown>(store.get(CONSTRUCTION_SITES_DOCUMENT_KEY)),
        requestToPromise(store.count()),
      ]);
      // Registros incompatíveis ou em outras chaves também exigem consentimento.
      return count > 1 || (document === undefined ? count > 0
        : !isStoredConstructionSitesDocument(document) || document.constructionSites.length > 0);
    });
    return (await Promise.all(checks)).some(Boolean);
  } finally {
    database.close();
  }
}

/** Somente o handler acionado pela confirmação humana deve chamar esta limpeza. */
export async function clearConfirmedLegacyConstructionSiteData(indexedDb = globalThis.indexedDB): Promise<void> {
  if (!indexedDb) throw new Error('IndexedDB indisponível; os dados locais não foram apagados.');
  const database = await openExistingDatabase(indexedDb, DATABASE_NAME);
  if (!database) return;
  try {
    const names = Array.from(database.objectStoreNames);
    if (!names.length) return;
    const transaction = database.transaction(names, 'readwrite');
    const completed = transactionComplete(transaction);
    for (const name of names) transaction.objectStore(name).clear();
    await completed;
  } finally {
    database.close();
  }
}

export function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('Transação IndexedDB cancelada.'));
    transaction.onerror = () => reject(transaction.error ?? new Error('Falha na transação IndexedDB.'));
  });
}

export function createIndexedDbConstructionSiteStorageDriver(databaseName?: string, requireAvailable = false): ConstructionSiteStorageDriver {
  return new IndexedDbConstructionSiteStorageDriver(globalThis.indexedDB, databaseName, requireAvailable);
}

function requestToPromise<T = unknown>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error ?? new Error('Falha ao acessar IndexedDB.'));
    request.onsuccess = () => resolve(request.result);
  });
}

function isStoredConstructionSitesDocument(value: unknown): value is StoredConstructionSitesDocument {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<StoredConstructionSitesDocument>;
  return Array.isArray(candidate.constructionSites);
}

function cloneStorageDocument(document: StoredConstructionSitesDocument): StoredConstructionSitesDocument {
  return JSON.parse(JSON.stringify(document)) as StoredConstructionSitesDocument;
}
