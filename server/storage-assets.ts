import {createHash} from 'node:crypto';

export const STORAGE_REFERENCE_ROUTES = ['/api/private-storage/', '/manus-storage/'] as const;

export type StorageAssetPurpose = 'house-photo' | 'generated-3d' | 'landing-asset' | 'unknown';

/**
 * Valida uma chave física sem aceitar normalizações ambíguas de caminho.
 * A mesma regra é usada no backfill e nos saves normais do documento.
 */
export function validateStorageKey(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Chave de Storage inválida');
  const key = value.trim();
  if (!key || key.length > 1024 || key.startsWith('/')) throw new Error('Chave de Storage inválida');
  if (key.includes('\\') || key.includes('?') || key.includes('#') || key.includes('%')) {
    throw new Error(`Chave de Storage insegura: ${key}`);
  }
  if (!key.split('/').every((segment) => segment && segment !== '.' && segment !== '..'
    && ![...segment].some((character) => character.charCodeAt(0) < 32))) {
    throw new Error(`Chave de Storage insegura: ${key}`);
  }
  return key;
}

export function hashStorageKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/** Converte formatos canônico, legado e absoluto para a chave física, sem aceitar URL externa arbitrária. */
export function storageKeyFromReference(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const candidate = value.trim();
  if (!candidate) return null;

  const fromPath = (pathname: string): string | null => {
    const route = STORAGE_REFERENCE_ROUTES.find((prefix) => pathname.startsWith(prefix));
    return route ? validateStorageKey(pathname.slice(route.length)) : null;
  };

  const direct = fromPath(candidate);
  if (direct) return direct;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return fromPath(parsed.pathname);
  } catch {
    return null;
  }
}

/**
 * Extrai referências do formato real do documento. `storageKey` é aceito para
 * compatibilidade com serializers que persistem a chave de forma explícita.
 */
export function extractStorageKeys(value: unknown): string[] {
  const keys = new Set<string>();
  const visit = (current: unknown): void => {
    if (typeof current === 'string') {
      const key = storageKeyFromReference(current);
      if (key) keys.add(key);
      return;
    }
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }
    if (!current || typeof current !== 'object') return;

    for (const [property, nested] of Object.entries(current)) {
      if (property === 'storageKey') {
        keys.add(validateStorageKey(nested));
      } else {
        visit(nested);
      }
    }
  };
  visit(value);
  return [...keys].sort();
}

export function classifyStorageAssetPurpose(key: string): StorageAssetPurpose {
  const normalized = validateStorageKey(key);
  if (normalized.includes('/temp/house-3d/')) return 'generated-3d';
  if (normalized.includes('/photos/')) return 'house-photo';
  if (normalized.startsWith('rac-editor-landing-') || normalized.startsWith('teto-house-linework-')) {
    return 'landing-asset';
  }
  return 'unknown';
}
