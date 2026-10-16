import {afterEach, describe, expect, it, vi} from 'vitest';
import {COOKIE_NAME} from '@shared/const';
import {canonicalizeProtectedImageSource, clearProtectedImageCache, resolveProtectedImageSource, setProtectedImageIdentity, subscribeProtectedImage} from './protected-image.ts';

afterEach(() => {
  sessionStorage.clear();
  setProtectedImageIdentity(null);
  clearProtectedImageCache();
  vi.unstubAllGlobals();
});

describe('transporte de imagens protegidas', () => {
  it('A-003 reabre do cache persistente e publica pixels novos após revalidação sem trocar de usuário', async () => {
    type ImageResponse = {ok: boolean; headers: Headers; clone(): ImageResponse; blob(): Promise<Blob>};
    const stored = new Map<string, ImageResponse>();
    const cache = {match: vi.fn(async (key: string) => stored.get(key)), put: vi.fn(async (key: string, value: ImageResponse) => {stored.set(key, value);}), keys: async () => [], delete: vi.fn()};
    vi.stubGlobal('caches', {open: vi.fn(async () => cache), keys: async () => [], delete: vi.fn()});
    const response = (content: string): ImageResponse => ({ok: true, headers: new Headers({'content-type': 'image/png'}), clone() {return response(content);}, blob: async () => new Blob([content], {type: 'image/png'})});
    let finishRefresh!: (value: unknown) => void;
    const fetchMock = vi.fn().mockResolvedValueOnce(response('first')).mockImplementationOnce(() => new Promise((resolve) => {finishRefresh = resolve;}));
    vi.stubGlobal('fetch', fetchMock);
    setProtectedImageIdentity('account-A');
    const first = await resolveProtectedImageSource('/manus-storage/private/persistent.png');
    expect(cache.put).toHaveBeenCalledOnce();
    setProtectedImageIdentity(null); setProtectedImageIdentity('account-A');
    const listener = vi.fn();
    const unsubscribe = subscribeProtectedImage('/manus-storage/private/persistent.png', listener);
    expect(await resolveProtectedImageSource('/manus-storage/private/persistent.png')).toBe(first);
    finishRefresh(response('changed'));
    await vi.waitFor(() => expect(listener).toHaveBeenCalledWith(expect.not.stringContaining(btoa('first'))));
    expect(await resolveProtectedImageSource('/manus-storage/private/persistent.png')).not.toBe(first);
    unsubscribe();
    setProtectedImageIdentity('account-B');
    expect(caches.open).toHaveBeenCalledWith('rac-private-images-v1-account-A');
  });

  it('envia Bearer do preview com cookies e revalidação HTTP, sem colocar token na URL', async () => {
    sessionStorage.setItem('manus-cookie', `${COOKIE_NAME}=preview-token`);
    const fetchMock = vi.fn().mockResolvedValue({ok: true, blob: async () => new Blob(['image'], {type: 'image/png'})});
    vi.stubGlobal('fetch', fetchMock);
    const result = await resolveProtectedImageSource('/manus-storage/private/photo.png');
    expect(result).toMatch(/^data:image\/png;base64,/);
    expect(fetchMock).toHaveBeenCalledWith('/api/private-storage/private/photo.png', expect.objectContaining({
      credentials: 'include', headers: {Authorization: 'Bearer preview-token'}, cache: 'no-cache', redirect: 'error',
    }));
  });

  it('preserva a autenticação por cookie sem Bearer no navegador normal', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ok: true, blob: async () => new Blob(['image'], {type: 'image/png'})});
    vi.stubGlobal('fetch', fetchMock);
    await resolveProtectedImageSource('/manus-storage/private/photo.png');
    expect(fetchMock).toHaveBeenCalledWith('/api/private-storage/private/photo.png', expect.objectContaining({credentials: 'include', headers: {}}));
  });

  it('converte uma URL absoluta legada para a rota privada do host atual', async () => {
    expect(canonicalizeProtectedImageSource('https://old-preview.example.test/manus-storage/private/photo.png'))
      .toBe('/api/private-storage/private/photo.png');
  });

  it.each([
    '/api/public-assets/landing.png',
    'data:image/png;base64,abc',
    'https://other.example.test/manus-storage/photo.png',
    '//other.example.test/manus-storage/photo.png',
  ])('não envia credenciais nem busca fonte externa/pública/local: %s', async (source) => {
    sessionStorage.setItem('manus-cookie', `${COOKIE_NAME}=preview-token`);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await resolveProtectedImageSource(source)).toBe(source);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('não transforma uma resposta 401 em uma imagem utilizável', async () => {
    const blob = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok: false, status: 401, blob}));
    await expect(resolveProtectedImageSource('/manus-storage/private/photo.png')).rejects.toThrow('imagem protegida');
    expect(blob).not.toHaveBeenCalled();
  });

  it('compartilha a carga e reutiliza os pixels resolvidos para a mesma referência', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['image'], {type: 'image/png'}),
    });
    vi.stubGlobal('fetch', fetchMock);

    const first = resolveProtectedImageSource('/manus-storage/shared/photo.png');
    const second = resolveProtectedImageSource('/manus-storage/shared/photo.png');
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [firstValue, secondValue] = await Promise.all([first, second]);
    expect(firstValue).toBe(secondValue);

    await resolveProtectedImageSource('/manus-storage/shared/photo.png');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
