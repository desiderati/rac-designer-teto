import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {HouseMaterialsSummary} from './HouseMaterialsSummary.tsx';
import {CANVAS_MOBILE_QUERY} from '@/components/rac-editor/lib/use-canvas-mobile-viewport.ts';

let coarse = false;
beforeEach(() => {
  coarse = false;
  vi.stubGlobal('innerWidth', 1280);
  vi.stubGlobal('innerHeight', 900);
  vi.stubGlobal('matchMedia', (query: string) => ({media: query,
    get matches() {return query === CANVAS_MOBILE_QUERY && (window.innerWidth <= 767 || coarse && window.innerHeight <= 600);},
    addEventListener: vi.fn(), removeEventListener: vi.fn()}));
});
afterEach(() => {cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();});

it.each([
  {width: 1280, height: 900, touch: false, shell: 'dialog'},
  {width: 915, height: 393, touch: false, shell: 'dialog'},
  {width: 768, height: 900, touch: false, shell: 'dialog'},
  {width: 767, height: 900, touch: false, shell: 'drawer'},
  {width: 390, height: 844, touch: true, shell: 'drawer'},
  {width: 1024, height: 600, touch: true, shell: 'drawer'},
])('usa $shell em $width × $height com toque=$touch', async ({width, height, touch, shell}) => {
  window.innerWidth = width; window.innerHeight = height; coarse = touch;
  const onOpenHouse = vi.fn();
  render(<div onClick={onOpenHouse}>
    <HouseMaterialsSummary familyName='Teste' materials={{stairType: 'landing', gutterCount: 2}}/>
  </div>);
  const user = userEvent.setup();
  const trigger = screen.getByRole('button', {name: 'Resumo da Casa de Teste'});
  await user.hover(trigger);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await user.click(trigger);
  const dialog = await screen.findByRole('dialog', {name: 'Resumo da Casa'});
  expect(dialog).toHaveAttribute('data-rac-modal-shell', shell);
  expect(within(dialog).getByText('Com Patamar')).toBeVisible();
  expect(within(dialog).getByText('Calhas')).toBeVisible();
  const close = within(dialog).getByRole('button', {name: 'Fechar resumo da casa'});
  expect(close.querySelector('svg') !== null).toBe(shell === 'dialog');
  fireEvent.click(close);
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(trigger).toHaveFocus();
  expect(onOpenHouse).not.toHaveBeenCalled();
});

it('conserva o resumo aberto ao trocar desktop por mobile e fecha com Escape', async () => {
  render(<HouseMaterialsSummary familyName='Teste'/>);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', {name: 'Resumo da Casa de Teste'}));
  const resize = (width: number, height: number) => act(() => {
    window.innerWidth = width; window.innerHeight = height;
    window.dispatchEvent(new Event('resize'));
  });
  resize(390, 844);
  expect(screen.getByRole('dialog', {name: 'Resumo da Casa'})).toHaveAttribute('data-rac-modal-shell', 'drawer');
  resize(1280, 900);
  expect(screen.getByRole('dialog', {name: 'Resumo da Casa'})).toHaveAttribute('data-rac-modal-shell', 'dialog');
  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByRole('button', {name: 'Resumo da Casa de Teste'})).toHaveFocus();
});
