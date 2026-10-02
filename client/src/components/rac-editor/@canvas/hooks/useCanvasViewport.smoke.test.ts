import {act, renderHook} from '@testing-library/react';
import {beforeEach, describe, expect, it} from 'vitest';
import {STORAGE_KEYS} from '@/shared/config.ts';
import {useCanvasViewport} from './useCanvasViewport.ts';

describe('useCanvasViewport.ts', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('hidrata a última viewport salva no Local Storage', () => {
    localStorage.setItem(STORAGE_KEYS.canvasViewport, JSON.stringify({
      zoom: 0.7,
      viewportX: 420,
      viewportY: 180,
    }));

    const {result} = renderHook(() => useCanvasViewport({}));

    expect(result.current.zoom).toBe(0.7);
    expect(result.current.viewportX).toBe(420);
    expect(result.current.viewportY).toBe(180);
  });

  it('persiste alterações de zoom e deslocamento da viewport', () => {
    const {result} = renderHook(() => useCanvasViewport({}));

    act(() => {
      result.current.setZoom(0.7);
      result.current.handleViewportChange(320, 140);
    });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.canvasViewport) ?? '{}')).toEqual({
      zoom: 0.7,
      viewportX: 320,
      viewportY: 140,
    });
  });

  it('enquadra objetos distantes usando a área real ocupada', () => {
    const {result} = renderHook(() => useCanvasViewport({}));
    act(() => result.current.setContainerSize({width: 600, height: 400}));
    act(() => result.current.fitContent({left: 1100, top: 800, width: 160, height: 90}));
    expect(result.current.zoom).toBeGreaterThan(0.25);
    expect(result.current.viewportX).toBeGreaterThan(0);
    expect(result.current.viewportY).toBeGreaterThan(0);
  });
});
