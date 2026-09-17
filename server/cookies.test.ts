import { describe, expect, it } from 'vitest';
import { getSessionCookieOptions } from './_core/cookies';

describe('getSessionCookieOptions', () => {
  it('uses Secure and SameSite=None for the public HTTPS preview', () => {
    const options = getSessionCookieOptions({
      protocol: 'https',
      headers: {},
    } as never);

    expect(options).toMatchObject({
      secure: true,
      sameSite: 'none',
      httpOnly: true,
      path: '/',
    });
  });

  it('recognizes HTTPS terminated by the gateway', () => {
    const options = getSessionCookieOptions({
      protocol: 'http',
      headers: { 'x-forwarded-proto': 'https, http' },
    } as never);

    expect(options).toMatchObject({ secure: true, sameSite: 'none' });
  });

  it('treats a public preview host as secure when the gateway omits the protocol header', () => {
    const options = getSessionCookieOptions({
      protocol: 'http',
      hostname: '3000-iuomjbw3lcbiaahl3omk3-ea1d9032.us1.manus.computer',
      headers: {},
    } as never);

    expect(options).toMatchObject({ secure: true, sameSite: 'none' });
  });

  it('keeps local HTTP development compatible with browser cookie rules', () => {
    const options = getSessionCookieOptions({
      protocol: 'http',
      hostname: 'localhost',
      headers: {},
    } as never);

    expect(options).toMatchObject({ secure: false, sameSite: 'lax' });
  });
});
