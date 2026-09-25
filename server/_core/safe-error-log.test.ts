import {describe, expect, it, vi} from 'vitest';
import {logSafeServerError} from './safe-error-log.ts';

describe('logSafeServerError', () => {
  it('omits request bodies, tokens and untrusted error messages', () => {
    const marker = 'TOKEN_SINTETICO_SECRETO';
    const error = Object.assign(new Error(marker), {
      code: 'ERR_BAD_RESPONSE',
      response: {status: 502, data: marker},
      config: {data: {accessToken: marker}},
    });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      logSafeServerError('[OAuth] Callback failed', error);
      expect(log).toHaveBeenCalledWith('[OAuth] Callback failed', {code: 'ERR_BAD_RESPONSE', status: 502});
      expect(JSON.stringify(log.mock.calls)).not.toContain(marker);
    } finally {
      log.mockRestore();
    }
  });
});
