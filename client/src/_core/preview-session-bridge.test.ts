import { describe, expect, it } from 'vitest';
import { extractManusSessionCookie } from './preview-session-bridge.ts';

describe('extractManusSessionCookie', () => {
  it('preserva o cookie de sessão emitido pelo container Manus', () => {
    expect(extractManusSessionCookie('app_session_id=session-token; Path=/; SameSite=None; Secure'))
      .toBe('app_session_id=session-token; Path=/; SameSite=None; Secure');
  });

  it('ignora mensagens que não contêm a sessão da aplicação', () => {
    expect(extractManusSessionCookie('other_cookie=value; Path=/')).toBeNull();
    expect(extractManusSessionCookie(null)).toBeNull();
  });
});
