import {afterEach, describe, expect, it, vi} from 'vitest';
import {renderHook} from '@testing-library/react';
import {useHotkeys} from './useHotkeys.ts';

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function dispatchKey(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', {key, bubbles: true}));
}

describe('useHotkeys.ts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('enables S, P and F shortcuts on desktop', () => {
    mockMatchMedia(false);
    const onSetCanvasToolMode = vi.fn();
    const onFitToView = vi.fn();

    renderHook(() => useHotkeys({
      onToggleDrawMode: vi.fn(),
      onToggleZoomControls: vi.fn(),
      onSetCanvasToolMode,
      onFitToView,
    }));

    dispatchKey('s');
    dispatchKey('p');
    dispatchKey('f');

    expect(onSetCanvasToolMode).toHaveBeenNthCalledWith(1, 'select');
    expect(onSetCanvasToolMode).toHaveBeenNthCalledWith(2, 'pan');
    expect(onFitToView).toHaveBeenCalledTimes(1);
  });

  it('disables only S, P and F shortcuts on mobile', () => {
    mockMatchMedia(true);
    const onToggleDrawMode = vi.fn();
    const onToggleZoomControls = vi.fn();
    const onSetCanvasToolMode = vi.fn();
    const onFitToView = vi.fn();

    renderHook(() => useHotkeys({
      onToggleDrawMode,
      onToggleZoomControls,
      onSetCanvasToolMode,
      onFitToView,
    }));

    dispatchKey('s');
    dispatchKey('p');
    dispatchKey('f');
    dispatchKey('l');
    dispatchKey('z');

    expect(onSetCanvasToolMode).not.toHaveBeenCalled();
    expect(onFitToView).not.toHaveBeenCalled();
    expect(onToggleDrawMode).toHaveBeenCalledTimes(1);
    expect(onToggleZoomControls).toHaveBeenCalledTimes(1);
  });
});
