import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {toast, Toaster} from './sonner.tsx';

vi.mock('next-themes', () => ({useTheme: () => ({theme: 'dark'})}));
afterEach(() => {
  act(() => {toast.dismiss();});
  cleanup();
  vi.useRealTimers();
});

describe('fechamento do toast real', () => {
  it('mantém o host claro para não aplicar o fechamento preto do tema escuro', async () => {
    render(<Toaster theme='dark'/>);
    act(() => {toast.error('Erro no ambiente escuro', {id: 'fixed-light-theme', duration: Infinity});});
    const title = await screen.findByText('Erro no ambiente escuro');
    const host = title.closest('[data-sonner-toaster]');
    expect(host).toHaveAttribute('data-theme', 'light');
    const close = within(title.closest('[data-sonner-toast]') as HTMLElement).getByRole('button', {name: 'Close toast'});
    fireEvent.click(close);
    await waitFor(() => expect(screen.queryByText('Erro no ambiente escuro')).not.toBeInTheDocument());
  });

  it('mantém título, ícone e ação do aviso neutro no mesmo host', async () => {
    const update = vi.fn();
    render(<Toaster/>);
    act(() => {toast('Nova versão disponível', {id: 'pwa-neutral-test', description: 'Salve suas alterações.', duration: Infinity, action: {label: 'Atualizar agora', onClick: update}});});
    expect(toast.getToasts().find((entry) => entry.id === 'pwa-neutral-test')).toEqual(expect.objectContaining({action: expect.objectContaining({label: 'Atualizar agora'})}));
    const title = await screen.findByText('Nova versão disponível');
    const article = title.closest('[data-sonner-toast]');
    expect(article).not.toBeNull();
    expect(article?.querySelector('.rac-toast-inline-icon')).not.toBeNull();
    expect(within(article as HTMLElement).getByText('Salve suas alterações.')).toBeVisible();
    fireEvent.click(within(article as HTMLElement).getByRole('button', {name: 'Atualizar agora'}));
    expect(update).toHaveBeenCalledOnce();
  });

  it('oferece fechamento manual depois que o progresso se transforma em erro', async () => {
    render(<Toaster/>);
    act(() => {toast.loading('Preparando PDF', {id: 'pdf-dismiss-test'});});
    await screen.findByText('Preparando PDF');
    act(() => {toast.error('Falha na captura 3D', {id: 'pdf-dismiss-test', duration: Infinity});});
    expect(await screen.findByText('Falha na captura 3D')).toBeVisible();
    const close = screen.getByRole('button', {name: 'Close toast'});
    expect(close).not.toBeDisabled();
    fireEvent.click(close);
    await waitFor(() => expect(screen.queryByText('Falha na captura 3D')).not.toBeInTheDocument());
  });

  it('fecha o erro após trinta segundos e retoma apenas o tempo restante após hover', async () => {
    vi.useFakeTimers();
    render(<Toaster/>);
    act(() => {toast.loading('Preparando documento', {id: 'pdf-timer-test'});});
    await act(async () => {await vi.advanceTimersByTimeAsync(1);});
    await act(async () => {await vi.advanceTimersByTimeAsync(40_000);});
    expect(screen.getByText('Preparando documento')).toBeInTheDocument();

    act(() => {toast.error('Erro temporizado', {id: 'pdf-timer-test'});});
    await act(async () => {await vi.advanceTimersByTimeAsync(1);});
    const title = screen.getByText('Erro temporizado');
    const article = title.closest('[data-sonner-toast]') as HTMLElement;
    const host = title.closest('[data-sonner-toaster]') as HTMLElement;
    await act(async () => {await vi.advanceTimersByTimeAsync(10_000);});
    fireEvent.mouseEnter(host);
    await act(async () => {await vi.advanceTimersByTimeAsync(60_000);});
    expect(article).toHaveAttribute('data-removed', 'false');

    fireEvent.mouseLeave(host);
    await act(async () => {await vi.advanceTimersByTimeAsync(19_000);});
    expect(article).toHaveAttribute('data-removed', 'false');
    await act(async () => {await vi.advanceTimersByTimeAsync(1_001);});
    expect(article).toHaveAttribute('data-removed', 'true');
    await act(async () => {await vi.advanceTimersByTimeAsync(300);});
    expect(screen.queryByText('Erro temporizado')).not.toBeInTheDocument();
  });
});
