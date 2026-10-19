import {act, renderHook} from '@testing-library/react';
import {useRef, type TouchEvent} from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {useCanvasViewport} from '@/components/rac-editor/@canvas/hooks/useCanvasViewport.ts';
import {useCanvasPointerInteractions} from './useCanvasPointerInteractions.ts';
import type {Canvas as FabricCanvas} from 'fabric';

function touch(points: Array<[number, number]>) {
  return {touches: points.map(([clientX, clientY]) => ({clientX, clientY})), preventDefault: vi.fn()} as unknown as TouchEvent;
}

function useInteractions(selected = false) {
  const viewport = useCanvasViewport({});
  const containerRef = useRef(document.createElement('div'));
  containerRef.current.getBoundingClientRect = () => ({left: 0, top: 0, width: 915, height: 340}) as DOMRect;
  const fabricCanvasRef = useRef(selected ? {getActiveObject: () => ({})} as unknown as FabricCanvas : null);
  const interactions = useCanvasPointerInteractions({...viewport, containerRef, fabricCanvasRef, canvasToolMode: 'select'});
  return {...viewport, ...interactions};
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    matches: query.includes('pointer: coarse'), media: query,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }) as unknown as MediaQueryList);
});
afterEach(() => vi.restoreAllMocks());

describe('gestos do Canvas em celular na horizontal', () => {
  it('não desloca a viewport durante o arrasto de um objeto selecionado', () => {
    const {result} = renderHook(() => useInteractions(true));
    act(() => result.current.setContainerSize({width: 915, height: 340}));
    act(() => result.current.handleViewportChange(300, 200));
    act(() => result.current.handleTouchStart(touch([[500, 180]])));
    act(() => result.current.handleTouchMove(touch([[430, 140]])));
    expect(result.current.viewportX).toBe(300);
    expect(result.current.viewportY).toBe(200);
  });
  it('permite arrastar com um dedo mesmo acima de 767 px', () => {
    const {result} = renderHook(useInteractions);
    act(() => result.current.setContainerSize({width: 915, height: 340}));
    act(() => result.current.handleViewportChange(300, 200));
    act(() => result.current.handleTouchStart(touch([[500, 180]])));
    act(() => result.current.handleTouchMove(touch([[430, 140]])));
    expect(result.current.viewportX).toBeCloseTo(370);
    expect(result.current.viewportY).toBeCloseTo(240);
  });

  it('combina zoom e deslocamento sem perder o ponto sob os dedos', () => {
    const {result} = renderHook(useInteractions);
    act(() => result.current.setContainerSize({width: 915, height: 340}));
    act(() => result.current.handleViewportChange(300, 200));
    act(() => result.current.handleTouchStart(touch([[200, 150], [300, 150]])));
    act(() => result.current.handleTouchMove(touch([[250, 130], [390, 130]])));
    expect(result.current.zoom).toBeCloseTo(1.2);
    expect(result.current.viewportX).toBeCloseTo(340);
    expect(result.current.viewportY).toBeCloseTo(290);
  });

  it('mantém o deslocamento com dois dedos sem alterar a escala', () => {
    const {result} = renderHook(useInteractions);
    act(() => result.current.setContainerSize({width: 915, height: 340}));
    act(() => result.current.handleViewportChange(300, 200));
    act(() => result.current.handleTouchStart(touch([[200, 150], [300, 150]])));
    act(() => result.current.handleTouchMove(touch([[150, 120], [250, 120]])));
    expect(result.current.zoom).toBe(1);
    expect(result.current.viewportX).toBeCloseTo(350);
    expect(result.current.viewportY).toBeCloseTo(230);
  });
});
