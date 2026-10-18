import {act, render, screen} from '@testing-library/react';
import {afterEach, expect, it, vi} from 'vitest';
import {CanvasOrientationNotice} from './CanvasOrientationNotice.tsx';

afterEach(() => {vi.restoreAllMocks(); vi.unstubAllGlobals();});

it('A-021 usa apenas o telefone animado e libera o Canvas ao girar', () => {
  vi.stubGlobal('innerWidth', 360);
  vi.stubGlobal('innerHeight', 800);
  vi.spyOn(window, 'matchMedia').mockImplementation((media) => ({matches:true,media,addEventListener:vi.fn(),removeEventListener:vi.fn()} as unknown as MediaQueryList));
  render(<CanvasOrientationNotice/>);
  const dialog = screen.getByRole('dialog');
  expect(screen.getByRole('heading', {name:'Gire seu celular'})).toBeVisible();
  expect(dialog.querySelector('svg.lucide-smartphone')).not.toBeNull();
  expect(dialog.querySelector('svg.lucide-rotate-cw')).toBeNull();
  expect(dialog.querySelector('svg.lucide-smartphone')?.getAttribute('class')).toContain('motion-safe:animate-');
  act(() => {
    vi.stubGlobal('innerWidth', 844);
    vi.stubGlobal('innerHeight', 390);
    window.dispatchEvent(new Event('resize'));
  });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('A-021 não solicita rotação em desktop', () => {
  vi.stubGlobal('innerWidth',1440);
  vi.stubGlobal('innerHeight',900);
  vi.spyOn(window, 'matchMedia').mockImplementation((media) => ({matches:false,media,addEventListener:vi.fn(),removeEventListener:vi.fn()} as unknown as MediaQueryList));
  render(<CanvasOrientationNotice/>);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
