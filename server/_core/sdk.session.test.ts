import {describe, expect, it, vi} from 'vitest';
import {ENV} from './env.ts';
import {sdk} from './sdk.ts';

describe('SDK session token', () => {
  it('roundtrips an omitted display name while still requiring identity, signature and expiry', async () => {
    const originalAppId = ENV.appId;
    const originalSecret = ENV.cookieSecret;
    ENV.appId = 'app-synthetic';
    ENV.cookieSecret = 'secret-synthetic-for-tests';
    const log = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const token = await sdk.createSessionToken('open-id-synthetic');
      await expect(sdk.verifySession(token)).resolves.toEqual({
        openId: 'open-id-synthetic', appId: 'app-synthetic', name: '',
      });
      const missingIdentity = await sdk.signSession({openId: '', appId: 'app-synthetic', name: ''});
      await expect(sdk.verifySession(missingIdentity)).resolves.toBeNull();
      await expect(sdk.verifySession(`${token}invalid`)).resolves.toBeNull();
      const expired = await sdk.createSessionToken('open-id-synthetic', {expiresInMs: -1000});
      await expect(sdk.verifySession(expired)).resolves.toBeNull();
    } finally {
      ENV.appId = originalAppId;
      ENV.cookieSecret = originalSecret;
      log.mockRestore();
    }
  });
});
