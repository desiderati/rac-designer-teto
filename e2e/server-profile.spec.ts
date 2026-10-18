import {expect, test} from '@playwright/test';
import {createServer, type RequestListener} from 'node:http';
import type {AddressInfo} from 'node:net';
import {assertE2EServerProfile, E2E_SERVER_PROFILE_PATH} from '../scripts/e2e-server-profile';
import {resolveE2EPort} from '../scripts/e2e-port.mjs';

test.describe('Porta do servidor E2E', () => {
  test('mantém 5200 quando E2E_PORT não está definido', () => {
    expect(resolveE2EPort()).toBe(5200);
  });

  test('aceita uma porta alternativa e os limites válidos', () => {
    expect(resolveE2EPort('5307')).toBe(5307);
    expect(resolveE2EPort('1')).toBe(1);
    expect(resolveE2EPort('65535')).toBe(65535);
  });

  for (const value of ['', '0', '65536', '-1', '5307.5', 'abc', 'http://localhost:5307', '5e3', ' 5307 ']) {
    test(`recusa E2E_PORT=${JSON.stringify(value)}`, () => {
      expect(() => resolveE2EPort(value)).toThrow('[E2E] E2E_PORT deve ser um inteiro decimal entre 1 e 65535');
    });
  }
});

const validProfile = {application: 'rac-designer-teto', version: 1, mode: 'development', e2e: true};

async function withServer(handle: RequestListener, verify: (baseURL: string) => Promise<void>) {
  const server = createServer(handle);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    const {port} = server.address() as AddressInfo;
    await verify(`http://127.0.0.1:${port}`);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test.describe('Identificação do servidor antes dos E2E', () => {
  test('aceita somente a identidade do perfil E2E correto', async () => {
    let requestedPath: string | undefined;
    await withServer((request, response) => {
      requestedPath = request.url;
      response.writeHead(200, {'Content-Type': 'application/json'}).end(JSON.stringify(validProfile));
    }, async (baseURL) => {
      await expect(assertE2EServerProfile(baseURL)).resolves.toBeUndefined();
      expect(requestedPath).toBe(E2E_SERVER_PROFILE_PATH);
    });
  });

  for (const {name, profile} of [
    {name: 'isolated', profile: {...validProfile, mode: 'isolated', e2e: false}},
    {name: 'isolated mesmo com VITE_E2E habilitado', profile: {...validProfile, mode: 'isolated'}},
    {name: 'development sem VITE_E2E', profile: {...validProfile, e2e: false}},
    {name: 'outro aplicativo', profile: {...validProfile, application: 'outro'}},
    {name: 'versão desconhecida', profile: {...validProfile, version: 2}},
    {name: 'identificação incompleta', profile: {application: 'rac-designer-teto', version: 1}},
  ]) {
    test(`recusa ${name} sem encerrar o servidor`, async () => {
      await withServer((_request, response) => {
        response.writeHead(200, {'Content-Type': 'application/json'}).end(JSON.stringify(profile));
      }, async (baseURL) => {
        await expect(assertE2EServerProfile(baseURL)).rejects.toThrow('[E2E] Perfil de servidor inválido');
        expect((await fetch(baseURL)).status).toBe(200);
      });
    });
  }

  test('recusa o fallback HTML de uma SPA mesmo com HTTP 200', async () => {
    await withServer((_request, response) => {
      response.writeHead(200, {'Content-Type': 'text/html'}).end('<!doctype html><title>Outro servidor</title>');
    }, async (baseURL) => {
      await expect(assertE2EServerProfile(baseURL)).rejects.toThrow('não contém uma identificação JSON');
    });
  });

  test('recusa JSON malformado e HTTP de erro', async () => {
    await withServer((_request, response) => {
      response.writeHead(200, {'Content-Type': 'application/json'}).end('{');
    }, async (baseURL) => {
      await expect(assertE2EServerProfile(baseURL)).rejects.toThrow('JSON ilegível');
    });
    await withServer((_request, response) => response.writeHead(503).end(), async (baseURL) => {
      await expect(assertE2EServerProfile(baseURL)).rejects.toThrow('HTTP 503');
    });
  });

  test('não aceita redirecionamento para outro servidor', async () => {
    await withServer((_request, response) => response.writeHead(302, {Location: '/'}).end(), async (baseURL) => {
      await expect(assertE2EServerProfile(baseURL)).rejects.toThrow('não foi possível consultar');
    });
  });

  test('limita a espera quando o servidor não responde', async () => {
    await withServer(() => undefined, async (baseURL) => {
      await expect(assertE2EServerProfile(baseURL, 100)).rejects.toThrow('não foi possível consultar');
    });
  });
});
