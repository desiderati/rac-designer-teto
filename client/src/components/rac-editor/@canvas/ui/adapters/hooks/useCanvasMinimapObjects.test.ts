import {act, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ActiveSelection, Rect, type Canvas} from 'fabric';
import {useCanvasMinimapObjects} from './useCanvasMinimapObjects.ts';

const frames = new Map<number, FrameRequestCallback>();
let nextFrame = 0;
beforeEach(() => {
  frames.clear();
  nextFrame = 0;
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)));
});
afterEach(() => vi.unstubAllGlobals());

function flushFrame() {
  act(() => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach(callback => callback(0));
  });
}

function setup(objects: Rect[]) {
  const listeners = new Map<string, Set<() => void>>();
  const getObjects = vi.fn(() => objects);
  const canvas = {
    getObjects,
    on: (event: string, callback: () => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(callback);
    },
    off: (event: string, callback: () => void) => listeners.get(event)?.delete(callback),
  };
  const canvasRef = {current: canvas as unknown as Canvas};
  const hook = renderHook(({houseId}) => useCanvasMinimapObjects(canvasRef, houseId), {
    initialProps: {houseId: 'casa-a'},
  });
  act(() => hook.result.current.updateMinimapObjects(canvasRef.current));
  const fire = () => act(() => listeners.get('object:moving')?.forEach(callback => callback()));
  return {...hook, canvasRef, getObjects, listeners, fire};
}

function rectangle(left: number, top: number) {
  return new Rect({left, top, width: 40, height: 20, originX: 'center', originY: 'center', strokeWidth: 0});
}

describe('prévia do minimapa durante o arraste', () => {
  it('atualiza antes de soltar e agrupa movimentos no mesmo quadro', () => {
    const object = rectangle(100, 80);
    const {result, fire, getObjects} = setup([object]);
    expect(result.current.minimapObjects[0].left).toBe(80);
    object.set({left: 140, top: 100});
    fire();
    object.set({left: 180, top: 120});
    fire();
    expect(frames.size).toBe(1);
    expect(getObjects).toHaveBeenCalledOnce();
    flushFrame();
    expect(result.current.minimapObjects[0]).toMatchObject({left: 160, top: 110});
    expect(getObjects).toHaveBeenCalledTimes(2);
  });

  it('acompanha todos os itens da ActiveSelection em coordenadas do Canvas', () => {
    const first = rectangle(100, 80);
    const second = rectangle(240, 140);
    const {result, fire, canvasRef} = setup([first, second]);
    const initial = result.current.minimapObjects;
    const selection = new ActiveSelection([first, second]);
    selection.set({left: selection.left + 60, top: selection.top - 20});
    fire();
    flushFrame();
    const moved = result.current.minimapObjects;
    moved.forEach((object, index) => {
      expect(object.left).toBeCloseTo(initial[index].left + 60);
      expect(object.top).toBeCloseTo(initial[index].top - 20);
      expect(object.width).toBeCloseTo(initial[index].width);
    });
    selection.removeAll();
    act(() => result.current.updateMinimapObjects(canvasRef.current));
    result.current.minimapObjects.forEach((object, index) => {
      expect(object.left).toBeCloseTo(moved[index].left);
      expect(object.top).toBeCloseTo(moved[index].top);
    });
  });

  it('respeita o centro, a escala e a rotação ao projetar um objeto', () => {
    const object = rectangle(100, 80);
    object.set({scaleX: 2, scaleY: 3, angle: 45});
    const {result} = setup([object]);
    expect(result.current.minimapObjects[0]).toMatchObject({left: 60, top: 50, width: 80, height: 60, angle: 45});
  });

  it('usa a mesma fila para o movimento manual sem depender de um evento Fabric', () => {
    const object = rectangle(100, 80);
    const {result, canvasRef} = setup([object]);
    object.set({left: 150, top: 110});
    act(() => result.current.scheduleMinimapUpdate(canvasRef.current));
    flushFrame();
    expect(result.current.minimapObjects[0]).toMatchObject({left: 130, top: 100});
  });

  it('cancela o quadro pendente na troca de casa e remove listeners ao desmontar', () => {
    const {fire, rerender, unmount, listeners, getObjects} = setup([rectangle(100, 80)]);
    fire();
    expect(frames.size).toBe(1);
    rerender({houseId: 'casa-b'});
    expect(frames.size).toBe(0);
    expect(listeners.get('object:moving')?.size).toBe(1);
    fire();
    unmount();
    expect(frames.size).toBe(0);
    expect(listeners.get('object:moving')?.size).toBe(0);
    expect(getObjects).toHaveBeenCalledOnce();
  });
});
