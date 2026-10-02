import {act, renderHook} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {useRacEditorHotkeys} from './useRacEditorHotkeys.ts';

describe('atalhos de Canvas', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.focus();
  });

  it('usa L para localizar e D para o lápis sem ativar zoom', () => {
    vi.stubGlobal('matchMedia', () => ({matches: false}));
    const onFitContent = vi.fn();
    const onFitToView = vi.fn();
    const onToggleDrawMode = vi.fn();
    renderHook(() => useRacEditorHotkeys({
      onFitContent,
      onFitToView,
      onToggleDrawMode,
      onToggleZoomControls: vi.fn(),
      onSetCanvasToolMode: vi.fn(),
    }));

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', {key: 'l', bubbles: true})));
    expect(onFitContent).toHaveBeenCalledTimes(1);
    expect(onFitToView).not.toHaveBeenCalled();
    expect(onToggleDrawMode).not.toHaveBeenCalled();

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', {key: 'd', bubbles: true})));
    expect(onToggleDrawMode).toHaveBeenCalledTimes(1);
  });

  it('ignora L durante a digitação', () => {
    const onFitContent = vi.fn();
    renderHook(() => useRacEditorHotkeys({
      onFitContent,
      onFitToView: vi.fn(),
      onToggleDrawMode: vi.fn(),
      onToggleZoomControls: vi.fn(),
      onSetCanvasToolMode: vi.fn(),
    }));
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', {key: 'l', bubbles: true})));
    expect(onFitContent).not.toHaveBeenCalled();
    input.remove();
  });
});
