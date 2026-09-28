import express from 'express';
import type {Server} from 'node:http';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

const {authenticateRequest} = vi.hoisted(() => ({authenticateRequest: vi.fn()}));
vi.mock('./sdk', () => ({sdk: {authenticateRequest}}));

vi.mock('./env', () => ({
  ENV: {
    forgeApiUrl: 'https://forge.example.test',
    forgeApiKey: 'forge-test-key',
  },
}));

import {registerStorageProxy} from './storageProxy.ts';

const nativeFetch = globalThis.fetch;

async function requestStorageAsset(path: string, headers?: Record<string, string>): Promise<{response: Response; body: Buffer}> {
  const app = express();
  registerStorageProxy(app);
  const server = await new Promise<Server>((resolve) => {
    const listeningServer = app.listen(0, '127.0.0.1', () => resolve(listeningServer));
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Servidor de teste sem porta.');

  try {
    const response = await nativeFetch(`http://127.0.0.1:${address.port}${path}`, {headers});
    const body = Buffer.from(await response.arrayBuffer());
    return {response, body};
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

describe('storageProxy', () => {
  beforeEach(() => {
    authenticateRequest.mockReset().mockRejectedValue(new Error('Invalid session'));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('proxy imagens do Storage no mesmo domínio, sem redirecionar para o bucket', async () => {
    authenticateRequest.mockResolvedValue({id: 1});
    const imageBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({url: 'https://bucket.example.test/private/foto.png'}), {
        status: 200,
        headers: {'content-type': 'application/json'},
      }))
      .mockResolvedValueOnce(new Response(imageBytes, {
        status: 200,
        headers: {
          'content-type': 'image/png',
          'content-length': String(imageBytes.byteLength),
        },
      }));
    vi.stubGlobal('fetch', fetchMock);

    const {response, body} = await requestStorageAsset('/manus-storage/rac-designer-teto/test/foto.png');

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('content-type')).toContain('image/png');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('vary')).toContain('Authorization');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(body).toEqual(Buffer.from(imageBytes));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('v1/storage/presign/get');
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('path=rac-designer-teto%2Ftest%2Ffoto.png');
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://bucket.example.test/private/foto.png');
  });

  it.each([undefined, {authorization: 'Bearer invalid-or-expired'}])('nega sessão ausente/inválida antes de consultar o Storage (%s)', async (headers) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const {response} = await requestStorageAsset('/manus-storage/private/photo.png', headers);
    expect(response.status).toBe(401);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([{cookie: 'session=test'}, {authorization: 'Bearer preview-test'}])('encaminha cookie/Bearer ao autenticador existente (%s)', async (headers) => {
    authenticateRequest.mockResolvedValue({id: 1});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', {status: 503})));
    await requestStorageAsset('/manus-storage/private/photo.png', headers);
    expect(authenticateRequest.mock.calls[0][0].headers).toMatchObject(headers);
  });

  it.each([
    'rac-editor-landing-screenshot-harmonized_95473d21.png',
    'teto-house-linework-transparent-cropped_770579e2.png',
  ])('mantém somente o asset da Landing Page público: %s', async (asset) => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({url: 'https://bucket.example.test/landing.png'})))
      .mockResolvedValueOnce(new Response(new Uint8Array([1]), {headers: {'content-type': 'image/png'}})));
    const {response} = await requestStorageAsset(`/api/public-assets/${asset}`);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('public');
    expect(authenticateRequest).not.toHaveBeenCalled();
  });

  it('não permite usar a rota pública para uma foto privada', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const {response} = await requestStorageAsset('/api/public-assets/private-photo.png');
    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
