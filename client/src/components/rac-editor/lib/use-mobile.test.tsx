import {act, renderHook} from '@testing-library/react';
import {afterEach, expect, it, vi} from 'vitest';
import {useIsMobile} from './use-mobile.tsx';

afterEach(() => {vi.restoreAllMocks(); vi.unstubAllGlobals();});

it('preserva o breakpoint global e permite acompanhar o layout empilhado do formulário', () => {
  vi.stubGlobal('innerWidth',744);
  const listeners = new Map<string, () => void>();
  const remove = vi.fn();
  const match = vi.spyOn(window,'matchMedia').mockImplementation((query) => ({media:query,matches:false,
    addEventListener: (_event: string, listener: () => void) => listeners.set(query,listener),
    removeEventListener: remove} as unknown as MediaQueryList));
  const global = renderHook(() => useIsMobile());
  expect(global.result.current).toBe(true);
  global.unmount();
  const sidebar = renderHook(({breakpoint}) => useIsMobile(breakpoint),{initialProps:{breakpoint:640}});
  expect(sidebar.result.current).toBe(false);
  expect(match).toHaveBeenCalledWith('(max-width: 639px)');
  act(() => {vi.stubGlobal('innerWidth',360); listeners.get('(max-width: 639px)')!();});
  expect(sidebar.result.current).toBe(true);
  sidebar.rerender({breakpoint:768});
  expect(remove).toHaveBeenCalled();
  expect(match).toHaveBeenLastCalledWith('(max-width: 767px)');
});
