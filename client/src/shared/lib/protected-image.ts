import {getSessionHeaders} from '@/_core/session-headers.ts';

const PROTECTED_IMAGE_CACHE_TTL_MS = 5 * 60 * 1000;
const PROTECTED_IMAGE_CACHE_MAX_ENTRIES = 128;

interface ProtectedImageCacheEntry {
  promise: Promise<string>;
  value?: string;
  expiresAt: number;
  lastAccessAt: number;
}

const protectedImageCache = new Map<string, ProtectedImageCacheEntry>();

export function isProtectedImageSource(source: string): boolean {
  try {
    const url = new URL(source, window.location.href);
    return url.origin === window.location.origin && url.pathname.startsWith('/manus-storage/');
  } catch {
    return false;
  }
}

function evictExpiredEntries(now = Date.now()): void {
  for (const [source, entry] of protectedImageCache) {
    if (entry.expiresAt <= now) protectedImageCache.delete(source);
  }
}

function evictLeastRecentlyUsedEntry(): void {
  let oldestSource: string | null = null;
  let oldestAccessAt = Number.POSITIVE_INFINITY;
  for (const [source, entry] of protectedImageCache) {
    if (entry.lastAccessAt < oldestAccessAt) {
      oldestSource = source;
      oldestAccessAt = entry.lastAccessAt;
    }
  }
  if (oldestSource) protectedImageCache.delete(oldestSource);
}

function observeWithAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(signal.reason ?? new DOMException('A operação foi cancelada.', 'AbortError'));

  return new Promise<T>((resolve, reject) => {
    const handleAbort = () => {
      signal.removeEventListener('abort', handleAbort);
      reject(signal.reason ?? new DOMException('A operação foi cancelada.', 'AbortError'));
    };
    signal.addEventListener('abort', handleAbort, {once: true});
    promise.then(
      (value) => {
        signal.removeEventListener('abort', handleAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener('abort', handleAbort);
        reject(error);
      },
    );
  });
}

function createProtectedImageRequest(source: string): Promise<string> {
  // O request compartilhado não recebe o AbortSignal de uma instância React:
  // desmontar um thumbnail não pode cancelar a carga dos demais.
  const signal = typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(8000) : undefined;
  return fetch(source, {
    credentials: 'include',
    headers: getSessionHeaders(),
    cache: 'no-store',
    redirect: 'error',
    ...(signal ? {signal} : {}),
  }).then(async (response) => {
    if (!response.ok) throw new Error('Não foi possível carregar a imagem protegida.');
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Não foi possível ler a imagem protegida.'));
      reader.readAsDataURL(blob);
    });
  });
}

/** Retorna pixels já resolvidos sem iniciar uma nova requisição. */
export function getCachedProtectedImageSource(source: string): string | null {
  if (!isProtectedImageSource(source)) return null;
  const now = Date.now();
  evictExpiredEntries(now);
  const entry = protectedImageCache.get(source);
  if (!entry?.value) return null;
  entry.lastAccessAt = now;
  return entry.value;
}

/** Limpa o cache em logout, troca de sessão ou testes. */
export function clearProtectedImageCache(): void {
  protectedImageCache.clear();
}

/**
 * Resolve uma referência privada para pixels autenticados.
 * A promessa e o resultado são compartilhados entre componentes/remontagens;
 * falhas não ficam armazenadas, permitindo retry posterior.
 */
export async function resolveProtectedImageSource(source: string, signal?: AbortSignal): Promise<string> {
  if (!isProtectedImageSource(source)) return source;
  if (signal?.aborted) {
    throw signal.reason ?? new DOMException('A operação foi cancelada.', 'AbortError');
  }

  const now = Date.now();
  evictExpiredEntries(now);
  let entry = protectedImageCache.get(source);
  if (!entry) {
    const promise = createProtectedImageRequest(source);
    entry = {
      promise,
      expiresAt: now + PROTECTED_IMAGE_CACHE_TTL_MS,
      lastAccessAt: now,
    };
    protectedImageCache.set(source, entry);
    while (protectedImageCache.size > PROTECTED_IMAGE_CACHE_MAX_ENTRIES) evictLeastRecentlyUsedEntry();
    promise.then((value) => {
      const current = protectedImageCache.get(source);
      if (current !== entry) return;
      current.value = value;
      current.expiresAt = Date.now() + PROTECTED_IMAGE_CACHE_TTL_MS;
      current.lastAccessAt = Date.now();
    }).catch(() => {
      if (protectedImageCache.get(source) === entry) protectedImageCache.delete(source);
    });
  } else {
    entry.lastAccessAt = now;
  }

  return observeWithAbort(entry.promise, signal);
}
