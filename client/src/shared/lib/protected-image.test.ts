import {afterEach, describe, expect, it, vi} from 'vitest';
import {COOKIE_NAME} from '@shared/const';
import {resolveProtectedImageSource} from './protected-image.ts';

afterEach(() => {
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe('transporte de imagens protegidas', () => {
  it('envia Bearer do preview com cookies e sem cache, sem colocar token na URL', async () => {
    sessionStorage.setItem('manus-cookie', `${COOKIE_NAME}=preview-token`);
    const fetchMock = vi.fn().mockResolvedValue({ok: true, blob: async () => new Blob(['image'], {type: 'image/png'})});
    vi.stubGlobal('fetch', fetchMock);
    const result = await resolveProtectedImageSource('/manus-storage/private/photo.png');
    expect(result).toMatch(/^data:image\/png;base64,/);
    expect(fetchMock).toHaveBeenCalledWith('/manus-storage/private/photo.png', expect.objectContaining({
      credentials: 'include', headers: {Authorization: 'Bearer preview-token'}, cache: 'no-store', redirect: 'error',
    }));
  });

  it('preserva a autenticação por cookie sem Bearer no navegador normal', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ok: true, blob: async () => new Blob(['image'], {type: 'image/png'})});
    vi.stubGlobal('fetch', fetchMock);
    await resolveProtectedImageSource('/manus-storage/private/photo.png');
    expect(fetchMock).toHaveBeenCalledWith('/manus-storage/private/photo.png', expect.objectContaining({credentials: 'include', headers: {}}));
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
});
