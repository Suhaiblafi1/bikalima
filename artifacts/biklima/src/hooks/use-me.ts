import { useEffect, useState } from "react";

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

/**
 * Fetches the currently authenticated user (with role) from `/api/me`.
 * Returns `user: null` and `role: null` if the user is not signed in.
 * The `refresh` function re-fetches from the server (e.g. after a role change).
 */
export function useMe(): MeState {
  const [user, setUser] = useState<MeUser | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${getApiBase()}/me`, { credentials: "include" })
      .then(async (r) => {
        if (r.status === 401) return null;
        if (!r.ok) return null;
        const data = await r.json();
        return data?.user ?? null;
      })
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return {
    user,
    role: user?.role ?? null,
    isLoading,
    refresh: () => setTick((t) => t + 1),
  };
}
