import {
  COOKIE_NAME,
  ONE_YEAR_MS,
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_COOKIE_LOCAL,
  decodeOAuthState,
} from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getOAuthStateCookieOptions, getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function redirectToOAuthError(res: Response, code: string) {
  res.redirect(302, `/?oauthError=${encodeURIComponent(code)}`);
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      redirectToOAuthError(res, "missing_parameters");
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. An attacker can
    // forge `state`, but cannot plant this cookie in the victim's browser.
    const { nonce } = decodeOAuthState(state);
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const oauthStateCookieOptions = getOAuthStateCookieOptions(req);
    const expectedNonce = cookies[oauthStateCookieOptions.secure ? OAUTH_STATE_COOKIE : OAUTH_STATE_COOKIE_LOCAL];
    if (!nonce || nonce !== expectedNonce) {
      redirectToOAuthError(res, "invalid_state");
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, oauthStateCookieOptions);
    res.clearCookie(OAUTH_STATE_COOKIE_LOCAL, oauthStateCookieOptions);

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        redirectToOAuthError(res, "profile_unavailable");
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      redirectToOAuthError(res, "callback_failed");
    }
  });
}
