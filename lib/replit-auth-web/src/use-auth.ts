import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthUser } from "@workspace/api-client-react";

export type { AuthUser };

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (data: { email: string; password: string; firstName?: string; lastName?: string }) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

export const AUTH_USER_QUERY_KEY = ["auth", "user"] as const;

async function fetchAuthUser(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/user", { credentials: "include" });
  if (!res.ok) return null;
  const data = (await res.json()) as { user: AuthUser | null };
  return data.user ?? null;
}

/**
 * Shared auth state backed by React Query. All components that call
 * `useAuth()` share a single in-memory cache entry, so the network
 * `/api/auth/user` request only fires once per page navigation no matter
 * how many components mount simultaneously (header, route guards,
 * notification bell, page itself, etc.).
 */
export function useAuth(): AuthState {
  const qc = useQueryClient();

  const { data: user = null, isPending, isFetching } = useQuery({
    queryKey: AUTH_USER_QUERY_KEY,
    queryFn: fetchAuthUser,
    // 30s stale window dedupes the burst of mounts on a single page
    // navigation (header, route guards, page itself, etc.) and keeps
    // SPA navigations from re-fetching identity on every transition.
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    // Refocus revalidates so a tab that was open during another tab's
    // sign-out picks up the new state quickly. This is cheap because the
    // server returns 304 when the cookie hasn't changed.
    refetchOnWindowFocus: true,
    refetchOnMount: false,
  });

  const login = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) return { error: data.error || "Login failed" };
        qc.setQueryData<AuthUser | null>(AUTH_USER_QUERY_KEY, data.user);
        // Invalidate role-aware /me too so consumers refresh after sign-in.
        qc.invalidateQueries({ queryKey: ["auth", "me"] });
        return {};
      } catch {
        return { error: "Network error" };
      }
    },
    [qc],
  );

  const register = useCallback(
    async (data: { email: string; password: string; firstName?: string; lastName?: string }): Promise<{ error?: string }> => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok) return { error: result.error || "Registration failed" };
        qc.setQueryData<AuthUser | null>(AUTH_USER_QUERY_KEY, result.user);
        qc.invalidateQueries({ queryKey: ["auth", "me"] });
        return {};
      } catch {
        return { error: "Network error" };
      }
    },
    [qc],
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    qc.setQueryData<AuthUser | null>(AUTH_USER_QUERY_KEY, null);
    // Drop any sibling auth-keyed caches (role, /me, etc.) so role-gated
    // UI flips back to the signed-out state immediately and the next read
    // hits the network instead of returning a stale cached identity.
    qc.removeQueries({ queryKey: ["auth", "me"] });
    qc.invalidateQueries({ queryKey: AUTH_USER_QUERY_KEY });
  }, [qc]);

  const refreshUser = useCallback(() => {
    qc.invalidateQueries({ queryKey: AUTH_USER_QUERY_KEY });
  }, [qc]);

  return {
    user,
    // Treat the very first load as loading; cached reads should not flip the
    // UI back to a loading state.
    isLoading: isPending && isFetching,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };
}
