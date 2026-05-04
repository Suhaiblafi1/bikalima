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

export async function apiFetch(path: string, init: ApiFetchInit = {}): Promise<Response> {
  const url = init.rawPath ? path : `${getApiBase()}${path.startsWith("/") ? "" : "/"}${path}`;
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers ?? {});
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (!SAFE.has(method)) {
    const token = await ensureCsrfToken();
    if (token && !headers.has("x-csrf-token")) headers.set("x-csrf-token", token);
  }
  return fetch(url, {
    credentials: "include",
    ...init,
    method,
    headers,
  });
}

/** Call once on app boot so the CSRF cookie is set before any mutation. */
export function primeCsrf(): void {
  void ensureCsrfToken();
}
