import type {Plugin} from 'vite';

export const E2E_SERVER_PROFILE_PATH = '/__rac__/server-profile';

interface ServerProfile {
  application: 'rac-designer-teto';
  version: 1;
  mode: string;
  e2e: boolean;
}

/** Expõe apenas o perfil efetivamente resolvido pelo Vite, nunca variáveis de ambiente. */
export function e2eServerProfilePlugin(): Plugin {
  let profile: ServerProfile;
  return {
    name: 'rac-e2e-server-profile',
    apply: 'serve',
    configResolved(config) {
      profile = {
        application: 'rac-designer-teto',
        version: 1,
        mode: config.mode,
        e2e: config.env.VITE_E2E === 'true',
      };
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split('?')[0] !== E2E_SERVER_PROFILE_PATH) return next();
        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Cache-Control', 'no-store');
        response.end(JSON.stringify(profile));
      });
    },
  };
}

/** Falha antes dos testes se a porta responder por outro perfil ou por outro aplicativo. */
export async function assertE2EServerProfile(baseURL: string, timeoutMs = 5000): Promise<void> {
  const url = new URL(E2E_SERVER_PROFILE_PATH, baseURL);
  const fail = (reason: string) => new Error(
    `[E2E] Perfil de servidor inválido em ${url.origin}: ${reason}. `
    + 'Esperado RAC Designer TETO em development com VITE_E2E=true. '
    + 'Escolha outra porta com E2E_PORT ou encerre manualmente o servidor incompatível e execute novamente os E2E; '
    + 'o Playwright iniciará o servidor correto.',
  );

  let response: Response;
  let profile: unknown;
  try {
    response = await fetch(url, {
      redirect: 'error',
      signal: AbortSignal.timeout(timeoutMs),
      headers: {Accept: 'application/json'},
    });
  } catch {
    throw fail('não foi possível consultar a identificação do servidor');
  }
  if (!response.ok) throw fail(`identificação indisponível (HTTP ${response.status})`);
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw fail('a resposta não contém uma identificação JSON');
  }
  try {
    profile = await response.json();
  } catch {
    throw fail('identificação JSON ilegível ou incompleta');
  }
  if (!profile || typeof profile !== 'object'
    || !('application' in profile) || profile.application !== 'rac-designer-teto'
    || !('version' in profile) || profile.version !== 1) {
    throw fail('aplicativo ou versão de identificação não reconhecidos');
  }
  if (!('mode' in profile) || profile.mode !== 'development'
    || !('e2e' in profile) || profile.e2e !== true) {
    throw fail('o servidor está executando um perfil incompatível');
  }
}
