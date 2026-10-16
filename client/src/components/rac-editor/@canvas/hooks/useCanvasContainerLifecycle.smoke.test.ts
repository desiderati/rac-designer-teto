import {renderHook, act} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {useCanvasContainerLifecycle} from './useCanvasContainerLifecycle.ts';

class TestResizeObserver {
  static instances: TestResizeObserver[] = [];
  readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    TestResizeObserver.instances.push(this);
  }

  observe() {
  }

  disconnect() {
  }

  emit() {
    this.callback([], this as unknown as ResizeObserver);
  }
}

describe('useCanvasContainerLifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestResizeObserver.instances = [];
    vi.stubGlobal('ResizeObserver', TestResizeObserver);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('coalesce o mesmo tamanho e agenda mudanças fora da notificação', () => {
    const container = document.createElement('div');
    let width = 640;
    let height = 480;
    Object.defineProperties(container, {
      clientWidth: {get: () => width},
      clientHeight: {get: () => height},
    });
    const containerRef = {current: container};
    const setContainerSize = vi.fn();

    const {unmount} = renderHook(() => useCanvasContainerLifecycle({
      containerRef,
      setContainerSize,
      containerSize: {width: 0, height: 0},
      zoom: 1,
      setViewportX: vi.fn(),
      setViewportY: vi.fn(),
    }));

    expect(setContainerSize).toHaveBeenCalledTimes(1);
    TestResizeObserver.instances[0]!.emit();
    TestResizeObserver.instances[0]!.emit();
    expect(setContainerSize).toHaveBeenCalledTimes(1);
    act(() => vi.runAllTimers());
    expect(setContainerSize).toHaveBeenCalledTimes(1);

    width = 720;
    height = 520;
    TestResizeObserver.instances[0]!.emit();
    expect(setContainerSize).toHaveBeenCalledTimes(1);
    act(() => vi.runAllTimers());
    expect(setContainerSize).toHaveBeenCalledTimes(2);

    unmount();
  });
});
