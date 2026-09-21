import { OAUTH_STATE_COOKIE, OAUTH_STATE_COOKIE_LOCAL, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Start the Manus OAuth login. Call this from an event handler or effect at the
// moment you want to navigate, e.g. `onClick={() => startLogin()}`.
//
// It has SIDE EFFECTS — it mints a one-time nonce, writes the HTTPS host-only
// cookie (or the local HTTP fallback), and navigates immediately — so the cookie nonce always matches the
// `state` it sends. Do NOT call it during render (no `href={startLogin()}` /
// `loginUrl={...}`): each call overwrites the cookie, so a stray render-phase
// call would desync it from an in-flight login and the callback would reject it
// with "invalid oauth state". It returns void by design, so there is no URL to
// stash across renders.
const LOGIN_LOCK_KEY = 'rac-designer.oauth-login-started-at';
const LOGIN_LOCK_TTL_MS = 10 * 60 * 1000;
let loginNavigationStarted = false;

export function clearLoginLock() {
  loginNavigationStarted = false;
  try {
    sessionStorage.removeItem(LOGIN_LOCK_KEY);
  } catch {
    // Storage can be unavailable in restricted browsing contexts.
  }
}

function hasRecentLoginLock() {
  if (loginNavigationStarted) return true;
  try {
    const startedAt = Number(sessionStorage.getItem(LOGIN_LOCK_KEY));
    if (Number.isFinite(startedAt) && Date.now() - startedAt < LOGIN_LOCK_TTL_MS) {
      loginNavigationStarted = true;
      return true;
    }
    sessionStorage.removeItem(LOGIN_LOCK_KEY);
  } catch {
    // Continue with the module-level guard when sessionStorage is blocked.
  }
  return false;
}

export const startLogin = (): boolean => {
  if (typeof window === 'undefined' || hasRecentLoginLock()) return false;

  loginNavigationStarted = true;
  try {
    sessionStorage.setItem(LOGIN_LOCK_KEY, String(Date.now()));
  } catch {
    // The in-memory lock still prevents duplicate calls in this document.
  }

  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  const nonce = crypto.randomUUID();
  const isSecure = window.location.protocol === 'https:';
  const cookieName = isSecure ? OAUTH_STATE_COOKIE : OAUTH_STATE_COOKIE_LOCAL;
  document.cookie = `${cookieName}=${nonce}; Path=/; Max-Age=600; SameSite=${isSecure ? 'None' : 'Lax'}${isSecure ? '; Secure' : ''}`;
  const state = encodeOAuthState({ redirectUri, nonce });

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  window.location.href = url.toString();
  return true;
};
