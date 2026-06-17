import {beforeEach, describe, expect, it, vi} from 'vitest';
import {STORAGE_KEYS} from '@/shared/config.ts';
import {
  DEFAULT_CANVAS_VIEWPORT_STORAGE,
  readCanvasViewportStorage,
  writeCanvasViewportStorage,
} from './canvas-viewport-storage.ts';

describe('canvas-viewport-storage.ts', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('retorna o padrão quando o storage está vazio ou inválido', () => {
    expect(readCanvasViewportStorage()).toEqual(DEFAULT_CANVAS_VIEWPORT_STORAGE);

    localStorage.setItem(STORAGE_KEYS.canvasViewport, '{valor inválido');

    expect(readCanvasViewportStorage()).toEqual(DEFAULT_CANVAS_VIEWPORT_STORAGE);
  });

  it('normaliza valores persistidos fora dos limites seguros', () => {
    localStorage.setItem(STORAGE_KEYS.canvasViewport, JSON.stringify({
      zoom: 99,
      viewportX: -10,
      viewportY: Number.POSITIVE_INFINITY,
    }));

    expect(readCanvasViewportStorage()).toEqual({
      zoom: 2,
      viewportX: 0,
      viewportY: 0,
    });
  });

  it('persiste a última viewport sem quebrar quando o Local Storage falha', () => {
    writeCanvasViewportStorage({zoom: 0.7, viewportX: 320, viewportY: 140});

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.canvasViewport) ?? '{}')).toEqual({
      zoom: 0.7,
      viewportX: 320,
      viewportY: 140,
    });

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => writeCanvasViewportStorage({zoom: 1, viewportX: 0, viewportY: 0})).not.toThrow();
  });
});
