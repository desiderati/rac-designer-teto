import {render} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {toast as rawToast} from 'sonner';
import {beginToastTask, toast, Toaster, ERROR_TOAST_DURATION} from './sonner.tsx';

const mocks = vi.hoisted(() => ({toaster: vi.fn((_props: unknown) => null)}));
vi.mock('next-themes', () => ({useTheme: () => ({theme: 'light'})}));
vi.mock('sonner', () => ({toast: Object.assign(vi.fn(), {error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn(), loading: vi.fn(), message: vi.fn(), custom: vi.fn(), promise: vi.fn(), dismiss: vi.fn()}), Toaster: mocks.toaster, useSonner: () => ({toasts: []})}));

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

  it.each([
    {width: 852, height: 393, coarse: true, mobile: true},
    {width: 852, height: 393, coarse: false, mobile: false},
    {width: 1024, height: 768, coarse: true, mobile: false},
  ])('respeita toque e altura em $width×$height com coarse=$coarse', ({width, height, coarse, mobile}) => {
    vi.stubGlobal('innerWidth', width);
    vi.stubGlobal('innerHeight', height);
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
      matches: width <= 767 || (query.includes('(pointer: coarse)') && coarse && height <= 600),
      media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    } as unknown as MediaQueryList));
    toast.info('Selecione o destino', {position: 'bottom-left'});
    toast.custom(() => null, {position: 'bottom-left'});
    expect(rawToast.info).toHaveBeenLastCalledWith(expect.any(Function), expect.objectContaining({position: mobile ? 'top-center' : 'bottom-left'}));
    expect(rawToast.custom).toHaveBeenLastCalledWith(expect.any(Function), expect.objectContaining({position: mobile ? 'top-center' : 'bottom-left'}));
    render(<Toaster/>);
    const props = mocks.toaster.mock.calls.at(-1)?.[0] as {position: string; visibleToasts: number; offset: unknown};
    expect(props.position).toBe(mobile ? 'top-center' : 'bottom-right');
    expect(props.visibleToasts).toBe(mobile ? 2 : 3);
    expect(props.offset).toEqual(mobile ? {top: 'max(16px, env(safe-area-inset-top))', left: 16, right: 16} : undefined);
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

  it('mantém promise na fila nativa para o host aplicar a política de erro', () => {
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
