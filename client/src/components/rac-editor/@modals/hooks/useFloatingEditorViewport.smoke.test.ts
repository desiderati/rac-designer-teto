import {act, renderHook} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {useFloatingEditorViewport} from './useFloatingEditorViewport.ts';

afterEach(() => vi.unstubAllGlobals());

describe('viewport visível do editor mobile', () => {
  it('acompanha teclado, deslocamento visual e fechamento sem depender de resize da janela', () => {
    const visual = Object.assign(new EventTarget(), {height: 320, offsetTop: 0});
    vi.stubGlobal('visualViewport', visual);
    vi.stubGlobal('innerHeight', 320);
    const {result, unmount} = renderHook(() => useFloatingEditorViewport(true));
    act(() => {visual.height = 180; visual.dispatchEvent(new Event('resize'));});
    expect(result.current).toEqual({height: 180, bottom: 140});
    act(() => {visual.offsetTop = 20; visual.dispatchEvent(new Event('scroll'));});
    expect(result.current).toEqual({height: 180, bottom: 120});
    act(() => {visual.height = 320; visual.offsetTop = 0; visual.dispatchEvent(new Event('resize'));});
    expect(result.current).toEqual({height: 320, bottom: 0});
    const removeListener = vi.spyOn(visual, 'removeEventListener');
    unmount();
    expect(removeListener).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('usa a altura da janela quando a API visualViewport não está disponível', () => {
    vi.stubGlobal('visualViewport', undefined);
    vi.stubGlobal('innerHeight', 320);
    const {result} = renderHook(() => useFloatingEditorViewport(true));
    act(() => {vi.stubGlobal('innerHeight', 180); window.dispatchEvent(new Event('resize'));});
    expect(result.current).toEqual({height: 180, bottom: 0});
  });
});
