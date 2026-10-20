import {act, renderHook} from '@testing-library/react';
import {beforeEach, describe, expect, it} from 'vitest';
import {STORAGE_KEYS} from '@/shared/config.ts';
import {useCanvasViewport} from './useCanvasViewport.ts';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';

describe('useCanvasViewport.ts', () => {
  it('enquadra toda a página na altura disponível de um celular horizontal', () => {
    const {result, unmount} = renderHook(() => useCanvasViewport({}));
    act(() => result.current.setContainerSize({width: 915, height: 280}));
    act(() => {result.current.setZoom(2); result.current.handleViewportChange(1000, 800);});
    act(() => result.current.fitToView());
    expect(CANVAS_HEIGHT * result.current.zoom).toBeLessThanOrEqual(280 * 0.95);
    expect(CANVAS_WIDTH * result.current.zoom).toBeLessThanOrEqual(915 * 0.95);
    expect(result.current.viewportX).toBe(0);
    expect(result.current.viewportY).toBe(0);
    const fittedZoom = result.current.zoom;
    unmount();
    const reopened = renderHook(() => useCanvasViewport({}));
    expect(reopened.result.current.zoom).toBe(fittedZoom);
  });

  it('preserva o mínimo normal de zoom em uma janela desktop', () => {
    const {result} = renderHook(() => useCanvasViewport({}));
    act(() => result.current.setContainerSize({width: 1280, height: 900}));
    expect(result.current.minimumZoom).toBe(0.25);
    act(() => result.current.handleZoomChange(0.1));
    expect(result.current.zoom).toBe(0.25);
  });
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

  it('centraliza conteúdo carregado sem alterar sua geometria', () => {
    const {result} = renderHook(() => useCanvasViewport({houseId: 'house-a'}));
    act(() => result.current.setContainerSize({width: 600, height: 400}));
    act(() => result.current.setZoom(0.65));
    act(() => result.current.setViewportX(900));
    act(() => result.current.setViewportY(700));

    act(() => result.current.fitContentInView({left: 900, top: 600, width: 300, height: 240}, true));

    expect(result.current.zoom).toBe(0.65);
    expect(result.current.viewportX).toBeCloseTo(382.5);
    expect(result.current.viewportY).toBeCloseTo(268);
  });

  it('preserva o zoom atual e troca somente o pan ao mudar de casa', () => {
    localStorage.setItem(`${STORAGE_KEYS.canvasViewport}:v2:house-a`, JSON.stringify({
      zoom: 0.6,
      viewportX: 380,
      viewportY: 160,
    }));
    localStorage.setItem(`${STORAGE_KEYS.canvasViewport}:v2:house-b`, JSON.stringify({
      zoom: 1,
      viewportX: 0,
      viewportY: 0,
    }));

    const {result, rerender} = renderHook(({houseId}) => useCanvasViewport({houseId}), {
      initialProps: {houseId: 'house-a'},
    });
    expect(result.current.viewportX).toBe(380);

    act(() => {
      result.current.setIsPanning(true);
      result.current.setIsSingleFingerPanning(true);
    });

    rerender({houseId: 'house-b'});

    expect(result.current.zoom).toBe(0.6);
    expect(result.current.viewportX).toBe(0);
    expect(result.current.viewportY).toBe(0);
    expect(result.current.isPanning).toBe(false);
    expect(result.current.isSingleFingerPanning).toBe(false);
  });
});
