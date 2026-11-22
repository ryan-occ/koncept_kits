import { createHmac, timingSafeEqual } from "node:crypto";
import express, { type NextFunction, type Request, type Response } from "express";

const COOKIE_NAME = "vanguard_access";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const SESSION_TTL_SECONDS = SESSION_TTL_MS / 1000;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

export interface AccessGateConfig {
  passcode: string | null;
  sessionSecret: string | null;
  production: boolean;
}

interface AttemptWindow {
  count: number;
  resetAt: number;
}

export function createAccessGate(config: AccessGateConfig) {
  const passcode = config.passcode?.trim() || null;
  const sessionSecret = config.sessionSecret?.trim() || null;
  if (config.production && !passcode) {
    throw new Error("PASSCODE must be set in production to protect the app.");
  }
  if (passcode && !/^\d{6}$/.test(passcode)) {
    throw new Error("PASSCODE must contain exactly six digits.");
  }
  if (passcode && !sessionSecret) {
    throw new Error("SESSION_SECRET must be set when PASSCODE is enabled.");
  }

  const attempts = new Map<string, AttemptWindow>();
  const router = express.Router();
  const enabled = passcode !== null;

  const signatureFor = (expiresAt: number) => createHmac("sha256", sessionSecret!)
    .update(`vanguard-access:${passcode}:${expiresAt}`)
    .digest("base64url");

  const hasValidSession = (req: Request) => {
    if (!enabled) return true;
    const rawCookie = req.headers.cookie?.split(";")
      .map(part => part.trim())
      .find(part => part.startsWith(`${COOKIE_NAME}=`))
      ?.slice(COOKIE_NAME.length + 1);
    if (!rawCookie) return false;

    const [expiryText, providedSignature, ...extra] = rawCookie.split(".");
    const expiresAt = Number(expiryText);
    if (extra.length || !Number.isSafeInteger(expiresAt) || expiresAt <= Date.now() || !providedSignature) return false;
    const expectedSignature = signatureFor(expiresAt);
    const provided = Buffer.from(providedSignature);
    const expected = Buffer.from(expectedSignature);
    return provided.length === expected.length && timingSafeEqual(provided, expected);
  };

  const clientKey = (req: Request) => req.ip || req.socket.remoteAddress || "unknown";

  router.get("/auth/status", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ enabled, authenticated: hasValidSession(req) });
  });

  router.post("/auth/login", express.json({ limit: "2kb" }), (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!enabled) {
      res.json({ enabled: false, authenticated: true });
      return;
    }

    const now = Date.now();
    const key = clientKey(req);
    let window = attempts.get(key);
    if (window && window.resetAt <= now) {
      attempts.delete(key);
      window = undefined;
    }
    if (window && window.count >= MAX_FAILED_ATTEMPTS) {
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil((window.resetAt - now) / 1000))));
      res.status(429).json({ error: "Too many attempts. Try again later.", code: "RATE_LIMITED" });
      return;
    }

    const submitted = typeof req.body?.code === "string" ? req.body.code : "";
    const matches = /^\d{6}$/.test(submitted)
      && timingSafeEqual(Buffer.from(submitted), Buffer.from(passcode!));
    if (!matches) {
      if (!window) {
        window = { count: 0, resetAt: now + ATTEMPT_WINDOW_MS };
        attempts.set(key, window);
      }
      window.count += 1;
      if (attempts.size > 1000) {
        for (const [ip, entry] of attempts) {
          if (entry.resetAt <= now) attempts.delete(ip);
        }
      }
      res.status(401).json({ error: "Incorrect code. Try again.", code: "INVALID_CODE" });
      return;
    }

    attempts.delete(key);
    const expiresAt = now + SESSION_TTL_MS;
    const secure = config.production ? "; Secure" : "";
    res.setHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=${expiresAt}.${signatureFor(expiresAt)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}${secure}`,
    );
    res.json({ enabled: true, authenticated: true });
  });

  router.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === "/healthz" || hasValidSession(req)) {
      next();
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    res.status(401).json({ error: "Enter the access code to continue.", code: "AUTH_REQUIRED" });
  });

  return { router, enabled };
}
