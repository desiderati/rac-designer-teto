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

export function readCanvasViewportStorage(): StoredCanvasViewport {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.canvasViewport);
    if (!raw) return {...DEFAULT_CANVAS_VIEWPORT_STORAGE};
    return normalizeStoredCanvasViewport(JSON.parse(raw));
  } catch {
    return {...DEFAULT_CANVAS_VIEWPORT_STORAGE};
  }
}

export function writeCanvasViewportStorage(value: StoredCanvasViewport): void {
  try {
    localStorage.setItem(STORAGE_KEYS.canvasViewport, JSON.stringify(normalizeStoredCanvasViewport(value)));
  } catch {
    // Keep the editor usable when Local Storage is unavailable or full.
  }
}
