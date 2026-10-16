import {getSessionHeaders} from '@/_core/session-headers.ts';

const PROTECTED_IMAGE_CACHE_TTL_MS = 5 * 60 * 1000;
let imageIdentity: string | null = null;
let cacheGeneration = 0;
const IMAGE_CACHE_PREFIX = 'rac-private-images-v1-';
export function setProtectedImageIdentity(identity: string | number | null | undefined): void {
  const next = identity == null ? null : String(identity);
  if (next !== imageIdentity) { protectedImageCache.clear(); cacheGeneration++; imageIdentity = next; }
}
async function persistentImageCache(): Promise<Cache | null> {
  if (!imageIdentity || typeof caches === 'undefined') return null;
  try { return await caches.open(IMAGE_CACHE_PREFIX + encodeURIComponent(imageIdentity)); } catch { return null; }
}
const PROTECTED_IMAGE_CACHE_MAX_ENTRIES = 128;

interface ProtectedImageCacheEntry {
  promise: Promise<string>;
  value?: string;
  expiresAt: number;
  lastAccessAt: number;
}

const protectedImageCache = new Map<string, ProtectedImageCacheEntry>();
const imageListeners = new Map<string, Set<(value: string) => void>>();

export function subscribeProtectedImage(source: string, listener: (value: string) => void): () => void {
  const listeners = imageListeners.get(source) ?? new Set();
  listeners.add(listener);
  imageListeners.set(source, listeners);
  return () => { listeners.delete(listener); if (!listeners.size) imageListeners.delete(source); };
}

function publishImage(source: string, value: string): void {
  imageListeners.get(source)?.forEach((listener) => listener(value));
}

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
    if (!entry.value && entry.expiresAt <= now) protectedImageCache.delete(source);
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

async function createProtectedImageRequest(source: string): Promise<string> {
  const generation = cacheGeneration;
  const cache = await persistentImageCache();
  const cached = await cache?.match(source).catch(() => undefined);
  const request = () => fetchImage();
  async function fetchImage(): Promise<Response> {
    const response = await fetch(source, {credentials: 'include', headers: getSessionHeaders(), cache: 'no-cache', redirect: 'error', signal: AbortSignal.timeout(8000)});
    if (!response.ok) throw new Error('Não foi possível carregar a imagem protegida.');
    if (cache && generation === cacheGeneration && (response.headers.get('content-type') ?? '').startsWith('image/')) {
      await cache.put(source, response.clone()).catch(() => undefined);
      const keys = await cache.keys();
      for (const key of keys.slice(0, Math.max(0, keys.length - PROTECTED_IMAGE_CACHE_MAX_ENTRIES))) await cache.delete(key);
    }
    return response;
  }
  const response = cached ?? await request();
  if (cached) void request().then(async (fresh) => {
    const value = await asDataUrl(fresh);
    const current = protectedImageCache.get(source);
    if (current && generation === cacheGeneration) {
      current.value = value; current.promise = Promise.resolve(value); current.expiresAt = Date.now() + PROTECTED_IMAGE_CACHE_TTL_MS;
      publishImage(source, value);
    }
  }).catch(() => undefined);
  return asDataUrl(response);
}

function asDataUrl(response: Response): Promise<string> {
  return Promise.resolve(response).then(async (response) => {
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
  cacheGeneration++;
  if (typeof caches !== 'undefined') void caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(IMAGE_CACHE_PREFIX)).map((key) => caches.delete(key)))).catch(() => undefined);
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
  if (!entry || entry.expiresAt <= now) {
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
      publishImage(source, value);
    }).catch(() => {
      if (protectedImageCache.get(source) === entry) protectedImageCache.delete(source);
    });
  } else {
    entry.lastAccessAt = now;
  }

  return observeWithAbort(entry.promise, signal);
}
