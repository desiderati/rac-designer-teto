import {STORAGE_KEYS, ZOOM_LIMITS} from '@/shared/config.ts';

export interface StoredCanvasViewport {
  zoom: number;
  viewportX: number;
  viewportY: number;
}

export const DEFAULT_CANVAS_VIEWPORT_STORAGE: StoredCanvasViewport = {
  zoom: 1,
  viewportX: 0,
  viewportY: 0,
};

const HOUSE_VIEWPORT_STORAGE_VERSION = 'v2';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeStoredCanvasViewport(value: unknown): StoredCanvasViewport {
  if (!isRecord(value)) return {...DEFAULT_CANVAS_VIEWPORT_STORAGE};

  const zoom = normalizeFiniteNumber(value.zoom, DEFAULT_CANVAS_VIEWPORT_STORAGE.zoom);
  const viewportX = normalizeFiniteNumber(value.viewportX, DEFAULT_CANVAS_VIEWPORT_STORAGE.viewportX);
  const viewportY = normalizeFiniteNumber(value.viewportY, DEFAULT_CANVAS_VIEWPORT_STORAGE.viewportY);

  return {
    zoom: Math.max(ZOOM_LIMITS.min, Math.min(zoom, ZOOM_LIMITS.max)),
    viewportX: Math.max(0, viewportX),
    viewportY: Math.max(0, viewportY),
  };
}

function getScopedStorageKey(scope?: string | null): string {
  if (!scope) return STORAGE_KEYS.canvasViewport;
  return `${STORAGE_KEYS.canvasViewport}:${HOUSE_VIEWPORT_STORAGE_VERSION}:${encodeURIComponent(scope)}`;
}

function readStorageValue(key: string): StoredCanvasViewport | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return normalizeStoredCanvasViewport(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Lê a viewport da casa ativa.
 *
 * A chave antiga sem escopo continua disponível para ferramentas e testes que
 * usam o Canvas fora de uma casa. O editor real sempre informa houseId e não
 * herda o pan/zoom de outra casa — essa herança era uma causa direta de
 * desenhos válidos abrirem fora da área visível.
 */
export function readCanvasViewportStorage(houseId?: string | null): StoredCanvasViewport {
  const scoped = readStorageValue(getScopedStorageKey(houseId));
  return scoped ?? {...DEFAULT_CANVAS_VIEWPORT_STORAGE};
}

export function writeCanvasViewportStorage(value: StoredCanvasViewport, houseId?: string | null): void {
  try {
    localStorage.setItem(
      getScopedStorageKey(houseId),
      JSON.stringify(normalizeStoredCanvasViewport(value)),
    );
  } catch {
    // Keep the editor usable when Local Storage is unavailable or full.
  }
}

/** Remove o estado de uma casa quando ela é excluída definitivamente. */
export function clearCanvasViewportStorage(houseId: string): void {
  try {
    localStorage.removeItem(getScopedStorageKey(houseId));
  } catch {
    // Keep the editor usable when Local Storage is unavailable.
  }
}
