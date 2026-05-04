// Global fetch interceptor: every unsafe (POST/PUT/PATCH/DELETE) same-origin
// request automatically gets the `x-csrf-token` header echoed from the
// `csrf` cookie set by the API. This way arbitrary callsites
// (use-auth, dashboard mutations, ad-hoc fetch in pages, generated
// react-query hooks) do not have to know about CSRF.
//
// Cross-origin requests are passed through untouched.

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_COOKIE = "csrf";
const CSRF_HEADER = "x-csrf-token";

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

function isSameOrigin(url: string): boolean {
  if (typeof window === "undefined") return true;
  if (url.startsWith("/")) return true;
  try {
    const u = new URL(url, window.location.href);
    return u.origin === window.location.origin;
  } catch {
    return false;
  }
}

function getApiBase(): string {
  const base = (import.meta.env.BASE_URL ?? "/") as string;
  return base.replace(/\/$/, "") + "/api";
}

let primed = false;
async function primeCsrf(originalFetch: typeof fetch): Promise<void> {
  if (primed) return;
  primed = true;
  try {
    await originalFetch(`${getApiBase()}/csrf`, { credentials: "include" });
  } catch {
    /* network blip — caller will retry */
  }
}

export function installCsrfFetch(): void {
  if (typeof window === "undefined") return;
  // Mark so we don't double-install on HMR.
  const w = window as unknown as { __csrfFetchInstalled?: boolean };
  if (w.__csrfFetchInstalled) return;
  w.__csrfFetchInstalled = true;

  const originalFetch = window.fetch.bind(window);
  // Fire and forget: get the cookie set ASAP so the first mutation works.
  void primeCsrf(originalFetch);

  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const method = (init.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (SAFE.has(method) || !isSameOrigin(url)) {
      return originalFetch(input as RequestInfo, init);
    }

    let token = readCookie(CSRF_COOKIE);
    if (!token) {
      await primeCsrf(originalFetch);
      token = readCookie(CSRF_COOKIE);
    }

    const headers = new Headers(init.headers ?? (input instanceof Request ? input.headers : undefined));
    if (token && !headers.has(CSRF_HEADER)) headers.set(CSRF_HEADER, token);

    // Always include credentials for same-origin unsafe requests so the
    // session cookie travels with profile/password/order writes.
    const merged: RequestInit = {
      credentials: init.credentials ?? "include",
      ...init,
      method,
      headers,
    };
    return originalFetch(input as RequestInfo, merged);
  };
}
