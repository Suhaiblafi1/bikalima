import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type Role = "admin" | "trainer" | "student" | "sales";

export interface MeUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: Role;
  emailVerified?: boolean;
}

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

interface MeState {
  user: MeUser | null;
  role: Role | null;
  isLoading: boolean;
  refresh: () => void;
}

export const ME_QUERY_KEY = ["auth", "me"] as const;

async function fetchMe(): Promise<MeUser | null> {
  const r = await fetch(`${getApiBase()}/me`, { credentials: "include" });
  if (r.status === 401 || !r.ok) return null;
  const data = await r.json();
  return (data?.user as MeUser) ?? null;
}

/**
 * Fetches the currently authenticated user (with role) from `/api/me`.
 * Backed by React Query so all call sites share a single cached result and
 * only one network request fires per navigation.
 */
export function useMe(): MeState {
  const qc = useQueryClient();
  const { data: user = null, isPending, isFetching } = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: fetchMe,
    // 30s stale window dedupes per-page mounts; refetch-on-focus picks up
    // role / email-verification changes promptly across tabs.
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
  });

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ME_QUERY_KEY });
  }, [qc]);

  return {
    user,
    role: user?.role ?? null,
    isLoading: isPending && isFetching,
    refresh,
  };
}
