import { useEffect, useState } from "react";

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

type FlagsMap = Record<string, boolean>;

let cached: FlagsMap | null = null;
let inflight: Promise<FlagsMap> | null = null;
const subscribers = new Set<(flags: FlagsMap) => void>();

async function fetchFlags(): Promise<FlagsMap> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = fetch(`${getApiBase()}/feature-flags`, { credentials: "include" })
    .then(async (r) => {
      if (!r.ok) return {};
      const d = (await r.json()) as { flags?: FlagsMap };
      return d.flags ?? {};
    })
    .catch(() => ({} as FlagsMap))
    .then((flags) => {
      cached = flags;
      inflight = null;
      subscribers.forEach((cb) => cb(flags));
      return flags;
    });
  return inflight;
}

/**
 * Read a feature flag from the platform. Defaults to `true` while loading
 * and when the flag is missing on the server, so a flag that was never
 * created behaves like an enabled feature (zero behavior change).
 */
export function useFeatureFlag(key: string): boolean {
  const [enabled, setEnabled] = useState<boolean>(cached ? (cached[key] ?? true) : true);
  useEffect(() => {
    let mounted = true;
    const update = (flags: FlagsMap) => {
      if (!mounted) return;
      setEnabled(flags[key] ?? true);
    };
    subscribers.add(update);
    fetchFlags().then(update);
    return () => {
      mounted = false;
      subscribers.delete(update);
    };
  }, [key]);
  return enabled;
}

/** Force-refresh the flags cache (call after toggling a flag in admin). */
export function refreshFeatureFlags(): Promise<FlagsMap> {
  cached = null;
  inflight = null;
  return fetchFlags();
}
