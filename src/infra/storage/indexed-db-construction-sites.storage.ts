import type {ConstructionSiteState} from '@/shared/types/construction-site.ts';

export interface StoredConstructionSitesDocument {
  version: number;
  constructionSites: ConstructionSiteState[];
}

export interface ConstructionSiteStorageDriver {
  read(): Promise<StoredConstructionSitesDocument>;
  write(document: StoredConstructionSitesDocument): Promise<void>;
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
  constructor(private readonly indexedDb: IDBFactory | undefined = globalThis.indexedDB) {
  }

  async read(): Promise<StoredConstructionSitesDocument> {
    if (!this.indexedDb) return cloneStorageDocument(EMPTY_DOCUMENT);

    const database = await this.openDatabase();
    try {
      const result = await requestToPromise<StoredConstructionSitesDocument | undefined>(
        database
          .transaction(STORE_NAME, 'readonly')
          .objectStore(STORE_NAME)
          .get(CONSTRUCTION_SITES_DOCUMENT_KEY),
      );

      if (!isStoredConstructionSitesDocument(result)) return cloneStorageDocument(EMPTY_DOCUMENT);
      return cloneStorageDocument(result);
    } finally {
      database.close();
    }
  }

  async write(document: StoredConstructionSitesDocument): Promise<void> {
    if (!this.indexedDb) return;

    const database = await this.openDatabase();
    try {
      await requestToPromise(
        database
          .transaction(STORE_NAME, 'readwrite')
          .objectStore(STORE_NAME)
          .put(cloneStorageDocument(document), CONSTRUCTION_SITES_DOCUMENT_KEY),
      );
    } finally {
      database.close();
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!this.indexedDb) {
        reject(new Error('IndexedDB indisponível.'));
        return;
      }

      const request = this.indexedDb.open(DATABASE_NAME, DATABASE_VERSION);
      request.onerror = () => reject(request.error ?? new Error('Falha ao abrir IndexedDB.'));
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        const database = request.result;
        for (const storeName of Array.from(database.objectStoreNames)) {
          if (storeName !== STORE_NAME) {
            database.deleteObjectStore(storeName);
          }
        }
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME);
        }
      };
    });
  }
}

export function createIndexedDbConstructionSiteStorageDriver(): ConstructionSiteStorageDriver {
  return new IndexedDbConstructionSiteStorageDriver();
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
