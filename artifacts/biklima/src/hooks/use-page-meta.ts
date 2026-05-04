import { useEffect } from "react";

const SITE_NAME = "بكلمة";
const DEFAULT_DESC =
  "بكلمة — منهجية شاملة لصناعة الأثر وفن الإلقاء والخطابة. برامج للأفراد والمدربين والمعلمين والأطفال.";

export type PageMeta = {
  title?: string;
  description?: string;
  /** Path part only (e.g. `/programs/influential-speaker`) — auto-canonicalised to bikalima.com. */
  canonicalPath?: string;
  /** Set to true for /checkout, /dashboard, /admin, /login, etc. */
  noindex?: boolean;
  ogImage?: string;
};

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Per-page <title>, <meta description>, canonical, OG/Twitter tags, and
 * robots noindex. Replaces the static defaults from index.html.
 */
export function usePageMeta(meta: PageMeta) {
  useEffect(() => {
    const title = meta.title ? `${meta.title} | ${SITE_NAME}` : `${SITE_NAME} - صناعة الأثر وفن الإلقاء والخطابة`;
    const description = meta.description ?? DEFAULT_DESC;
    document.title = title;

    setMeta("description", description);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:site_name", SITE_NAME, "property");
    setMeta("og:type", "website", "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    if (meta.ogImage) {
      setMeta("og:image", meta.ogImage, "property");
      setMeta("twitter:image", meta.ogImage);
    }

    const canonicalHref = meta.canonicalPath
      ? `https://bikalima.com${meta.canonicalPath.startsWith("/") ? meta.canonicalPath : `/${meta.canonicalPath}`}`
      : `https://bikalima.com${window.location.pathname}`;
    setLink("canonical", canonicalHref);
    setMeta("og:url", canonicalHref, "property");

    setMeta("robots", meta.noindex ? "noindex, nofollow" : "index, follow");
  }, [meta.title, meta.description, meta.canonicalPath, meta.noindex, meta.ogImage]);
}
