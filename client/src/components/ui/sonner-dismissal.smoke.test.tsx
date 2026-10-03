import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {toast, Toaster} from './sonner.tsx';
import {toast as nativeToast} from 'sonner';

vi.mock('next-themes', () => ({useTheme: () => ({theme: 'dark'})}));
afterEach(() => {
  act(() => {toast.getToasts().forEach(({id}) => toast.dismiss(id));});
  cleanup();
  vi.useRealTimers();
});

describe('fechamento do toast real', () => {
  it.each([
    {withLoading: true, duration: Infinity},
    {withLoading: false, duration: Infinity},
    {withLoading: true, duration: 0},
  ])('aplica trinta segundos ao erro de promise com hover ($withLoading, $duration)', async ({withLoading, duration}) => {
    vi.useFakeTimers();
    render(<Toaster/>);
    const failure = new Error('Falha da operação');
    const onFinally = vi.fn();
    let result: ReturnType<typeof toast.promise>;
    act(() => {
      result = toast.promise(Promise.reject(failure), {
        ...(withLoading ? {loading: 'Operação pendente'} : {}),
        error: async (error) => error.message,
        description: async () => 'Detalhe preservado',
        duration,
        finally: onFinally,
      });
    });
    const unwrapped = result!.unwrap().catch((error: unknown) => error);
    await act(async () => {await vi.advanceTimersByTimeAsync(10);});
    expect(await unwrapped).toBe(failure);
    expect(onFinally).toHaveBeenCalledOnce();
    const title = screen.getByText('Falha da operação');
    const article = title.closest('[data-sonner-toast]') as HTMLElement;
    const host = title.closest('[data-sonner-toaster]') as HTMLElement;
    expect(screen.getByText('Detalhe preservado')).toBeVisible();
    expect(toast.getToasts().filter((entry) => 'type' in entry && entry.type === 'error'))
      .toEqual([expect.objectContaining({duration: 30_000})]);
    await act(async () => {await vi.advanceTimersByTimeAsync(10_000);});
    fireEvent.mouseEnter(host);
    await act(async () => {await vi.advanceTimersByTimeAsync(60_000);});
    expect(article).toHaveAttribute('data-removed', 'false');
    fireEvent.mouseLeave(host);
    await act(async () => {await vi.advanceTimersByTimeAsync(19_000);});
    expect(article).toHaveAttribute('data-removed', 'false');
    await act(async () => {await vi.advanceTimersByTimeAsync(1_300);});
    expect(screen.queryByText('Falha da operação')).not.toBeInTheDocument();
  });

  it.each(['dismiss', 'success'] as const)('não restaura um erro cujo estado mudou antes do efeito (%s)', async (nextState) => {
    vi.useFakeTimers();
    render(<Toaster/>);
    act(() => {toast.loading('Operação ativa', {id: 'superseded-error'});});
    await act(async () => {await vi.advanceTimersByTimeAsync(10);});
    act(() => {
      nativeToast.error('Erro obsoleto', {id: 'superseded-error', duration: Infinity});
      if (nextState === 'dismiss') toast.dismiss('superseded-error');
      else toast.success('Resultado atualizado', {id: 'superseded-error', duration: 1_200});
    });
    await act(async () => {await vi.advanceTimersByTimeAsync(500);});
    await act(async () => {await vi.advanceTimersByTimeAsync(300);});
    expect(screen.queryByText('Erro obsoleto')).not.toBeInTheDocument();
    const current = toast.getToasts().find(({id}) => id === 'superseded-error');
    if (nextState === 'dismiss') expect(current).toBeUndefined();
    else expect(current).toMatchObject({type: 'success', duration: 1_200});
  });

  it('aplica a política ao erro HTTP resolvido preservando a semântica nativa de unwrap', async () => {
    vi.useFakeTimers();
    render(<Toaster/>);
    const response = {ok: false, status: 503};
    const onSuccess = vi.fn(() => 'Sucesso');
    let result: ReturnType<typeof toast.promise>;
    act(() => {
      result = toast.promise(Promise.resolve(response), {error: 'Serviço indisponível', success: onSuccess});
    });
    await act(async () => {await vi.advanceTimersByTimeAsync(10);});
    expect(await result!.unwrap()).toBe(response);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByText('Serviço indisponível')).toBeVisible();
    expect(toast.getToasts()).toEqual([expect.objectContaining({type: 'error', duration: 30_000})]);
  });

  it.each([undefined, 1_700, Infinity])('preserva duração e retorno do sucesso de promise (%s)', async (duration) => {
    vi.useFakeTimers();
    render(<Toaster duration={2_300}/>);
    const action = vi.fn();
    const onFinally = vi.fn();
    let result: ReturnType<typeof toast.promise>;
    act(() => {
      result = toast.promise(Promise.resolve('RAC'), {
        id: 'success-duration-test', loading: 'Aguarde', duration,
        success: async (name) => `${name} concluída`,
        finally: onFinally,
        action: {label: 'Abrir', onClick: action},
      });
    });
    await act(async () => {await vi.advanceTimersByTimeAsync(10);});
    expect(await result!.unwrap()).toBe('RAC');
    expect(onFinally).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', {name: 'Abrir'})).toBeVisible();
    const article = screen.getByText('RAC concluída').closest('[data-sonner-toast]');
    const expectedDuration = duration ?? 2_300;
    if (expectedDuration === Infinity) {
      await act(async () => {await vi.advanceTimersByTimeAsync(60_000);});
      expect(article).toHaveAttribute('data-removed', 'false');
      fireEvent.click(screen.getByRole('button', {name: 'Close toast'}));
    } else {
      await act(async () => {await vi.advanceTimersByTimeAsync(expectedDuration - 100);});
      expect(article).toHaveAttribute('data-removed', 'false');
      await act(async () => {await vi.advanceTimersByTimeAsync(100);});
    }
    await act(async () => {await vi.advanceTimersByTimeAsync(300);});
    expect(screen.queryByText('RAC concluída')).not.toBeInTheDocument();
  });

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
