import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

export function isSecureRequest(req: Request) {
  if (req.secure) return true;
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (forwardedProto) {
    const protoList = Array.isArray(forwardedProto)
      ? forwardedProto
      : forwardedProto.split(",");

    if (protoList.some(proto => proto.trim().toLowerCase() === "https")) return true;
  }

  // Some managed preview gateways omit x-forwarded-proto while still serving
  // the public app over HTTPS. Never emit SameSite=None without Secure there.
  // Plain HTTP remains supported only for local development hosts.
  const hostname = req.hostname ?? "";
  return !LOCAL_HOSTS.has(hostname) && !isIpAddress(hostname);
}

export function getOAuthStateCookieOptions(
  req: Request,
): Pick<CookieOptions, "path" | "sameSite" | "secure"> {
  const secure = isSecureRequest(req);
  return {
    path: "/",
    sameSite: secure ? "none" : "lax",
    secure,
  };
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  // const hostname = req.hostname;
  // const shouldSetDomain =
  //   hostname &&
  //   !LOCAL_HOSTS.has(hostname) &&
  //   !isIpAddress(hostname) &&
  //   hostname !== "127.0.0.1" &&
  //   hostname !== "::1";

  // const domain =
  //   shouldSetDomain && !hostname.startsWith(".")
  //     ? `.${hostname}`
  //     : shouldSetDomain
  //       ? hostname
  //       : undefined;

  return {
    httpOnly: true,
    path: "/",
    sameSite: isSecureRequest(req) ? "none" : "lax",
    secure: isSecureRequest(req),
  };
}
