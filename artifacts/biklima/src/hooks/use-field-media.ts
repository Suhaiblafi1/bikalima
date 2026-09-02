import { useEffect, useState } from "react";

/**
 * Published «من الميدان» items for one placement.
 *
 * The public pages that call this already have content to show without it —
 * a static curated list — so a failure here is not an error state worth
 * rendering: it returns nothing and the page is exactly what it was before
 * the CMS existed. That also means a cold API or a logged-out visitor can
 * never leave the library section empty.
 */
export type FieldMediaItem = {
  id: string;
  mediaType: "youtube" | "upload" | "image" | "instagram" | "tiktok";
  mediaUrl: string;
  thumbnailUrl: string | null;
  titleAr: string;
  titleEn: string | null;
  speakerName: string | null;
  category: string | null;
  targetSkill: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  placement: string[] | null;
  orderIndex: number;
};

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

export function useFieldMedia(placement: string): FieldMediaItem[] {
  const [items, setItems] = useState<FieldMediaItem[]>([]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    fetch(`${getApiBase()}/field-media?placement=${encodeURIComponent(placement)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : { items: [] }))
      .then((data: { items?: FieldMediaItem[] }) => {
        if (mounted) setItems(data.items ?? []);
      })
      .catch(() => {
        // Offline, blocked, or a 500: the section keeps its static content.
      });
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [placement]);

  return items;
}
