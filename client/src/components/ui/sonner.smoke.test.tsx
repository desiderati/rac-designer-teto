import {render} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {toast as rawToast} from 'sonner';
import {beginToastTask, toast, Toaster, ERROR_TOAST_DURATION} from './sonner.tsx';

const mocks = vi.hoisted(() => ({toaster: vi.fn((_props: unknown) => null)}));
vi.mock('next-themes', () => ({useTheme: () => ({theme: 'light'})}));
vi.mock('sonner', () => ({toast: Object.assign(vi.fn(), {error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn(), loading: vi.fn(), message: vi.fn(), custom: vi.fn(), promise: vi.fn(), dismiss: vi.fn()}), Toaster: mocks.toaster}));

afterEach(() => {vi.restoreAllMocks(); vi.unstubAllGlobals();});

describe('avisos compartilhados', () => {
  it('padroniza erros em trinta segundos mesmo com duração explícita', () => {
    expect(ERROR_TOAST_DURATION).toBe(30_000);
    toast.error('Erro', {duration: 4000});
    expect(rawToast.error).toHaveBeenLastCalledWith(expect.any(Function), expect.objectContaining({duration: ERROR_TOAST_DURATION}));
    expect((vi.mocked(rawToast.error).mock.lastCall![0] as () => React.ReactElement)().props.title).toBe('Erro');
    toast.error('PDF', {duration: Infinity});
    expect(rawToast.error).toHaveBeenLastCalledWith(expect.any(Function), expect.objectContaining({duration: 30_000}));
    expect((vi.mocked(rawToast.error).mock.lastCall![0] as () => React.ReactElement)().props.title).toBe('PDF');
  });

  it('posiciona todos os avisos no topo do celular mesmo com posição explícita', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({matches: true, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn()} as unknown as MediaQueryList));
    toast.success('Imagem', {position: 'bottom-right'});
    toast.loading('Preparando PDF', {position: 'bottom-right'});
    toast.error('Falha', {position: 'bottom-right'});
    expect(rawToast.success).toHaveBeenLastCalledWith(expect.any(Function), expect.objectContaining({position: 'top-center'}));
    expect(rawToast.loading).toHaveBeenLastCalledWith(expect.any(Function), expect.objectContaining({position: 'top-center'}));
    expect(rawToast.error).toHaveBeenLastCalledWith(expect.any(Function), expect.objectContaining({position: 'top-center'}));
  });

  it('centraliza identidade visual e limite da pilha no componente global', () => {
    vi.stubGlobal('innerWidth', 420);
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({matches: true, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn()} as unknown as MediaQueryList));
    render(<Toaster/>);
    const props = mocks.toaster.mock.calls.at(-1)?.[0] as unknown as {position: string; visibleToasts: number; icons: {error: unknown}; toastOptions: {classNames: {error: string; success: string; warning: string; info: string}}};
    expect(props.position).toBe('top-center');
    expect(props).toHaveProperty('closeButton', true);
    expect(props.visibleToasts).toBe(2);
    expect(props.icons.error).toBeTruthy();
    expect(props.toastOptions.classNames.error).toBe('rac-error-toast');
    expect(props.toastOptions.classNames.success).toBe('rac-success-toast');
    expect(props.toastOptions.classNames.warning).toBe('rac-warning-toast');
    expect(props.toastOptions.classNames.info).toBeUndefined();
  });

  it('preserva ação, ID e detalhe no componente comum', () => {
    const action = {label: 'Atualizar agora', onClick: vi.fn()};
    toast('Nova versão disponível', {id: 'rac-new-version', duration: Infinity, description: 'Salve suas alterações.', action});
    const [content, options] = vi.mocked(rawToast).mock.lastCall!;
    expect(typeof content).toBe('function');
    expect((content as () => React.ReactElement)().props).toEqual(expect.objectContaining({title: 'Nova versão disponível', detail: 'Salve suas alterações.'}));
    expect(options).toEqual(expect.objectContaining({id: 'rac-new-version', duration: Infinity, action}));
    expect(options?.description).toBeUndefined();
  });

  it('mantém o mesmo ID em tarefas e ignora resultado após dispensa', () => {
    const task = beginToastTask('terrain-upload-1', 'Enviando foto…');
    const [, options] = vi.mocked(rawToast.loading).mock.lastCall!;
    task.success('Foto adicionada.');
    expect(rawToast.success).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({id: 'terrain-upload-1'}));
    options?.onDismiss?.({id: 'terrain-upload-1'} as never);
    task.error('Falha');
    expect(rawToast.error).not.toHaveBeenCalled();
  });

  it('mantém promise e sua duração na fila nativa do Sonner', () => {
    const operation = Promise.resolve();
    toast.promise(operation, {loading: 'Processando', success: 'Concluído', error: 'Falhou'});
    const [, data] = vi.mocked(rawToast.promise).mock.lastCall!;
    expect(data).toEqual({loading: 'Processando', success: 'Concluído', error: 'Falhou'});
  });

  it('preserva callbacks de promise e chamada sem opções', () => {
    const success = (name: string) => `${name} pronto`;
    toast.promise(Promise.resolve('RAC'), {success});
    const [, data] = vi.mocked(rawToast.promise).mock.lastCall!;
    expect(data?.success).toBe(success);
    toast.promise(Promise.resolve('RAC'));
    expect(rawToast.promise).toHaveBeenLastCalledWith(expect.any(Promise));
  });
});
