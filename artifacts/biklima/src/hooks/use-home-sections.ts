import { useEffect, useState } from "react";
import {
  HOME_SECTION_KEYS,
  type SectionKey,
  type SectionRecord,
} from "@/cms/sections-schema";

export type HomeSectionsMap = Partial<Record<SectionKey, SectionRecord | null>>;

type ApiResponse = {
  sections?: Array<Partial<SectionRecord> & { sectionKey?: string }>;
};

// Lightweight, dependency-free fetch hook (no react-query) that loads the
// public, published, visible home sections and exposes them keyed by
// sectionKey. Failures degrade silently — the home page falls back to its
// hardcoded translation copy via `getSectionContent`.
export function useHomeSections(): { cms: HomeSectionsMap; loading: boolean } {
  const [cms, setCms] = useState<HomeSectionsMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/home-sections", {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ApiResponse;
        if (cancelled) return;
        const map: HomeSectionsMap = {};
        for (const r of data.sections ?? []) {
          const k = r.sectionKey;
          if (!k || !(HOME_SECTION_KEYS as readonly string[]).includes(k)) continue;
          map[k as SectionKey] = r as SectionRecord;
        }
        setCms(map);
      } catch {
        // Silent — page renders with hardcoded fallbacks.
        if (!cancelled) setCms({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { cms, loading };
}
