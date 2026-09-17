import {STORAGE_KEYS} from '@/shared/config.ts';
import type {ConstructionSiteState} from '@/shared/types/construction-site.ts';

interface StoredConstructionSitesDocument {
  version: number;
  constructionSites: ConstructionSiteState[];
}

const EMPTY_DOCUMENT: StoredConstructionSitesDocument = {
  version: 1,
  constructionSites: [],
};

function isStoredConstructionSitesDocument(value: unknown): value is StoredConstructionSitesDocument {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<StoredConstructionSitesDocument>;
  return Array.isArray(candidate.constructionSites);
}

export function readConstructionSitesStorage(): StoredConstructionSitesDocument {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.constructionSites);
    if (!raw) return {...EMPTY_DOCUMENT};
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredConstructionSitesDocument(parsed)) return {...EMPTY_DOCUMENT};
    return {
      version: Number(parsed.version) || EMPTY_DOCUMENT.version,
      constructionSites: parsed.constructionSites,
    };
  } catch {
    return {...EMPTY_DOCUMENT};
  }
}

export function writeConstructionSitesStorage(constructionSites: ConstructionSiteState[]): void {
  const payload: StoredConstructionSitesDocument = {
    version: EMPTY_DOCUMENT.version,
    constructionSites,
  };
  localStorage.setItem(STORAGE_KEYS.constructionSites, JSON.stringify(payload));
}
