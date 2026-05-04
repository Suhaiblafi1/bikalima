import type { Request, Response, NextFunction, RequestHandler } from "express";
import crypto from "node:crypto";

// ──────────────────────────────────────────────────────────────────────
// Security headers
// ──────────────────────────────────────────────────────────────────────
// Hand-rolled to avoid pulling in helmet (~kb savings, no extra dep) while
// covering the headers the audit calls out. Values are conservative for an
// Arabic-first SPA with Google Fonts and a Stripe Checkout redirect.
const CSP_DIRECTIVES = [
  "default-src 'self'",
  // Vite injects inline scripts in dev; the prod bundle is hashed but we
  // still allow 'unsafe-inline' because the SPA relies on a few inline
  // bootstrap snippets in index.html. Keep restrictive otherwise.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https: blob:",
  "connect-src 'self' https:",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.youtube.com https://player.vimeo.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "object-src 'none'",
].join("; ");

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Strip the default Express identifier — informational and not useful to clients.
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(self), interest-cohort=()",
  );
  // HSTS only when we know we're behind TLS to avoid breaking local plain-HTTP dev.
  const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0] ?? req.protocol;
  if (proto === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  }
  res.setHeader("Content-Security-Policy", CSP_DIRECTIVES);
  next();
}

// ──────────────────────────────────────────────────────────────────────
// CORS allowlist
// ──────────────────────────────────────────────────────────────────────
// Build the allowlist once at startup. Includes any REPLIT_DOMAINS entries
// (preview + prod), the marketing domain, and localhost for tests.
function buildCorsAllowlist(): Set<string> {
  const set = new Set<string>([
    "https://bikalima.com",
    "https://www.bikalima.com",
    "http://localhost",
    "http://localhost:80",
    "http://localhost:3000",
    "http://localhost:5173",
  ]);
  for (const d of (process.env.REPLIT_DOMAINS ?? "").split(",")) {
    const trimmed = d.trim();
    if (trimmed) set.add(`https://${trimmed}`);
  }
  if (process.env.REPLIT_DEV_DOMAIN) set.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
  for (const extra of (process.env.CORS_ALLOWED_ORIGINS ?? "").split(",")) {
    const t = extra.trim();
    if (t) set.add(t);
  }
  return set;
}

const CORS_ALLOWLIST = buildCorsAllowlist();

export function strictCors(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  // Same-origin or non-browser request: no CORS headers needed; just continue.
  if (!origin) {
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
    return;
  }
  if (CORS_ALLOWLIST.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-CSRF-Token, X-Chat-Token",
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );
    res.setHeader("Access-Control-Max-Age", "600");
  }
  if (req.method === "OPTIONS") {
    // Don't leak details; if origin wasn't on the allowlist the browser sees
    // the missing Allow-Origin and rejects the preflight automatically.
    res.status(204).end();
    return;
  }
  next();
}

// ──────────────────────────────────────────────────────────────────────
// Rate limiting (in-memory, bounded, lazy GC)
// ──────────────────────────────────────────────────────────────────────
const RATE_MAX_KEYS = 10_000;
type Bucket = { count: number; resetAt: number };

function makeBucketStore() {
  const map = new Map<string, Bucket>();
  return {
    bump(key: string, max: number, windowMs: number): boolean {
      const now = Date.now();
      const entry = map.get(key);
      if (!entry || entry.resetAt < now) {
        if (map.size >= RATE_MAX_KEYS) {
          for (const [k, v] of map) if (v.resetAt < now) map.delete(k);
          while (map.size >= RATE_MAX_KEYS) {
            const first = map.keys().next().value;
            if (first === undefined) break;
            map.delete(first);
          }
        }
        map.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }
      if (entry.count >= max) return false;
      entry.count++;
      return true;
    },
  };
}

const globalStore = makeBucketStore();
const authStore = makeBucketStore();

/** Per-IP global limiter for the whole API surface. Generous default. */
export function globalRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip ?? "unknown";
  const ok = globalStore.bump(`g:${ip}`, 600, 60_000); // 600 req / minute / IP
  if (!ok) {
    res.status(429).json({ error: "Too many requests. Please slow down." });
    return;
  }
  next();
}

/** Tight limiter for sensitive auth endpoints. */
export function authRateLimit(max: number, windowMs: number): RequestHandler {
  return (req, res, next) => {
    const ip = req.ip ?? "unknown";
    const ok = authStore.bump(`${req.path}:${ip}`, max, windowMs);
    if (!ok) {
      res.status(429).json({
        error: "محاولات كثيرة. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.",
      });
      return;
    }
    next();
  };
}

// ──────────────────────────────────────────────────────────────────────
// CSRF (double-submit cookie)
// ──────────────────────────────────────────────────────────────────────
// Strategy:
//   - Issue a non-httpOnly `csrf` cookie on the first request that doesn't
//     have one. Frontend reads it from document.cookie and echoes it as
//     the `x-csrf-token` header on all unsafe requests.
//   - Reject unsafe (POST/PUT/PATCH/DELETE) requests when the header is
//     missing OR doesn't match the cookie. Token comparison is constant-
//     time to avoid timing oracles.
//   - Exempt webhook endpoints (none yet, but reserve `/api/webhooks/*`)
//     and Bearer-token requests (used by mobile / future API clients).
//   - Exempt `/api/chat/threads/*` mutations because they're authenticated
//     by their own per-thread X-Chat-Token, not by the session cookie, so
//     they're already CSRF-immune.
export const CSRF_COOKIE = "csrf";
const CSRF_HEADER = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function newCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

function isExemptPath(p: string): boolean {
  if (p.startsWith("/api/webhooks/")) return true;
  // Chat per-thread mutations carry their own opaque token.
  if (/^\/api\/chat\/threads\/[^/]+/.test(p)) return true;
  return false;
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Always make sure a token cookie exists so the frontend can read it.
  let token = req.cookies?.[CSRF_COOKIE] as string | undefined;
  if (!token || token.length < 32) {
    token = newCsrfToken();
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }
  if (isExemptPath(req.path)) {
    next();
    return;
  }
  // Bearer token auth bypasses CSRF (no cookies → no CSRF surface).
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }
  // No session cookie at all → nothing to protect against.
  if (!req.cookies?.["sid"]) {
    next();
    return;
  }
  const headerToken = req.headers[CSRF_HEADER];
  if (typeof headerToken !== "string" || !safeEqual(headerToken, token)) {
    res.status(403).json({ error: "Invalid or missing CSRF token" });
    return;
  }
  next();
}
