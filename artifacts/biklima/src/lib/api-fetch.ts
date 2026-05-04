// Thin fetch wrapper that:
//   1. Auto-prefixes the api base path (`<BASE>/api`).
//   2. Sends credentials.
//   3. Reads the `csrf` cookie set by the API and echoes it as the
//      `x-csrf-token` header on unsafe methods so CSRF middleware passes.
// Use this for all writes from the SPA. GETs can use plain fetch but going
// through this is also safe.

function getApiBase(): string {
  const base = (import.meta.env.BASE_URL ?? "/") as string;
  // BASE_URL is the artifact's path (e.g. "/" or "/biklima/"). The API is
  // mounted at "/api" on the shared proxy, so strip the trailing slash and
  // append "/api" — works for both root-mounted and sub-pathed deployments.
  return base.replace(/\/$/, "") + "/api";
}

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return "";
}

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);
// Shared in-flight promise (see install-csrf-fetch.ts) to prevent a race
// where multiple concurrent unsafe requests skip waiting after one of
// them flips a primed boolean.
let csrfPrimePromise: Promise<void> | null = null;

function primeCsrfOnce(): Promise<void> {
  if (csrfPrimePromise) return csrfPrimePromise;
  csrfPrimePromise = (async () => {
    try {
      await fetch(`${getApiBase()}/csrf`, { credentials: "include" });
    } catch {
      csrfPrimePromise = null;
    }
  })();
  return csrfPrimePromise;
}

async function ensureCsrfToken(): Promise<string> {
  let token = readCookie("csrf");
  if (token) return token;
  await primeCsrfOnce();
  return readCookie("csrf");
}

export type ApiFetchInit = RequestInit & { rawPath?: boolean };

// Bilingual user-facing messages for the most common auth/policy
// failure paths. Components can read `error.userMessage` to surface
// a consistent Arabic/English notice instead of inventing their own.
function getLang(): "ar" | "en" {
  if (typeof document === "undefined") return "ar";
  const html = document.documentElement.getAttribute("lang");
  return html === "en" ? "en" : "ar";
}
const STATUS_MESSAGES: Record<number, { ar: string; en: string }> = {
  401: {
    ar: "يجب تسجيل الدخول للمتابعة.",
    en: "You need to sign in to continue.",
  },
  403: {
    ar: "لا تملك صلاحية الوصول إلى هذا المورد.",
    en: "You don't have permission to access this resource.",
  },
  429: {
    ar: "محاولات كثيرة. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.",
    en: "Too many requests. Please wait a moment and try again.",
  },
};
export type ApiError = Error & {
  status: number;
  userMessage: string;
  retryAfterSec?: number;
};

/**
 * `apiFetch` returns the raw Response so callers can inspect the body
 * shape. For 401/403/429 we additionally attach a `userMessage` to a
 * thrown ApiError so any layer that prefers throw-based flow gets
 * uniform Arabic/English messaging without re-implementing it.
 *
 * Listeners can subscribe to the `bikalima:auth-failure` window event
 * for global handling (e.g. redirect to /login on 401).
 */
export async function apiFetch(path: string, init: ApiFetchInit = {}): Promise<Response> {
  const url = init.rawPath ? path : `${getApiBase()}${path.startsWith("/") ? "" : "/"}${path}`;
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers ?? {});
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (!SAFE.has(method)) {
    const token = await ensureCsrfToken();
    if (token && !headers.has("x-csrf-token")) headers.set("x-csrf-token", token);
  }
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    method,
    headers,
  });
  // Centralised handling for the three policy-style statuses.
  if (res.status === 401 || res.status === 403 || res.status === 429) {
    const lang = getLang();
    const userMessage = STATUS_MESSAGES[res.status][lang];
    const retryHeader = res.headers.get("retry-after");
    const retryAfterSec = retryHeader ? Number(retryHeader) : undefined;
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("bikalima:auth-failure", {
          detail: { status: res.status, userMessage, retryAfterSec, url },
        }),
      );
    }
    // Stash the message on the response object so callers that use the
    // raw Response can read it without re-importing the table.
    (res as Response & { userMessage?: string }).userMessage = userMessage;
    if (retryAfterSec !== undefined) {
      (res as Response & { retryAfterSec?: number }).retryAfterSec = retryAfterSec;
    }
  }
  return res;
}

/** Call once on app boot so the CSRF cookie is set before any mutation. */
export function primeCsrf(): void {
  void ensureCsrfToken();
}
