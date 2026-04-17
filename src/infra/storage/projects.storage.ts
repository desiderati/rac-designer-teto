import {STORAGE_KEYS} from '@/shared/config.ts';
import type {ProjectState} from '@/shared/types/project.ts';

interface StoredProjectsDocument {
  version: number;
  projects: ProjectState[];
}

const EMPTY_DOCUMENT: StoredProjectsDocument = {
  version: 1,
  projects: [],
};

function isStoredProjectsDocument(value: unknown): value is StoredProjectsDocument {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<StoredProjectsDocument>;
  return Array.isArray(candidate.projects);
}

export function readProjectsStorage(): StoredProjectsDocument {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.projects);
    if (!raw) return {...EMPTY_DOCUMENT};
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredProjectsDocument(parsed)) return {...EMPTY_DOCUMENT};
    return {
      version: Number(parsed.version) || EMPTY_DOCUMENT.version,
      projects: parsed.projects,
    };
  } catch {
    return {...EMPTY_DOCUMENT};
  }
}

export function writeProjectsStorage(projects: ProjectState[]): void {
  const payload: StoredProjectsDocument = {
    version: EMPTY_DOCUMENT.version,
    projects,
  };
  localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(payload));
}
