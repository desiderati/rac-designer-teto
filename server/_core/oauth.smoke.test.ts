import {describe, expect, it, vi} from 'vitest';
import {registerOAuthRoutes} from './oauth';

type RouteHandler = (req: any, res: any) => Promise<void>;

function captureCallback() {
  let handler: RouteHandler | undefined;
  registerOAuthRoutes({
    get: vi.fn((_path: string, callback: RouteHandler) => {
      handler = callback;
    }),
  } as any);
  if (!handler) throw new Error('OAuth callback was not registered.');
  return handler;
}

function createResponse() {
  return {
    redirect: vi.fn(),
    clearCookie: vi.fn(),
  };
}

describe('Manus OAuth callback recovery', () => {
  it('redirects missing parameters to the friendly recovery state', async () => {
    const response = createResponse();
    await captureCallback()({query: {}, headers: {}}, response);

    expect(response.redirect).toHaveBeenCalledWith(302, '/?oauthError=missing_parameters');
  });

  it('rejects malformed or mismatched state without exchanging the code', async () => {
    const response = createResponse();
    await captureCallback()({
      query: {code: 'code-from-provider', state: 'malformed-state'},
      headers: {cookie: ''},
    }, response);

    expect(response.redirect).toHaveBeenCalledWith(302, '/?oauthError=invalid_state');
    expect(response.clearCookie).not.toHaveBeenCalled();
  });
});
