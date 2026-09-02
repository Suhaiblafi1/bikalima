import { useEffect } from "react";

/**
 * Per-page schema.org JSON-LD.
 *
 * The site-wide graph — Organization and WebSite — is static in index.html so
 * every crawler sees it without running JavaScript. Anything that varies by
 * route has to be injected here instead, and that carries a real caveat: this
 * is a client-rendered SPA, so a crawler that does not execute JavaScript
 * never sees these blocks. Googlebot does render, which is what the Course and
 * FAQPage rich results depend on; simpler crawlers get only the static graph.
 * Server-rendering these pages would remove the caveat and is the honest fix
 * if the rich results do not appear.
 *
 * One managed <script> per page, replaced on navigation and removed on
 * unmount, so two routes can never leave two graphs in the head.
 */
const SCRIPT_ID = "bikalima-jsonld";

export function useStructuredData(graph: unknown | null) {
  useEffect(() => {
    if (!graph) return;
    let el = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.id = SCRIPT_ID;
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(graph);
    return () => {
      // Leaving the node behind would describe the previous page on the next one.
      document.getElementById(SCRIPT_ID)?.remove();
    };
  }, [JSON.stringify(graph)]);
}

export const SITE_URL = "https://bikalima.com";
export const ORG_ID = `${SITE_URL}/#organization`;

/** A crumb trail Google can render under the result. */
export function breadcrumbList(trail: Array<{ name: string; path?: string }>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.path ? { item: `${SITE_URL}${c.path}` } : {}),
    })),
  };
}

/**
 * Course plus the offer that sells it. Google's Course rich result wants
 * provider and a description; the Offer is what puts a price in the result.
 *
 * hasCourseInstance carries the real delivery mode and duration rather than a
 * guess: courseWorkload is an ISO 8601 duration, so 27 hours is PT27H.
 */
export function courseGraph(opts: {
  name: string;
  description: string;
  path: string;
  hours: number;
  sessions: number;
  priceJod: number | null;
  inLanguage?: string;
  image?: string;
}) {
  const url = `${SITE_URL}${opts.path}`;
  return {
    "@type": "Course",
    "@id": `${url}#course`,
    name: opts.name,
    description: opts.description,
    url,
    inLanguage: opts.inLanguage ?? "ar",
    provider: { "@id": ORG_ID },
    ...(opts.image ? { image: opts.image.startsWith("http") ? opts.image : `${SITE_URL}${opts.image}` } : {}),
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "blended",
      courseWorkload: `PT${opts.hours}H`,
      courseSchedule: {
        "@type": "Schedule",
        repeatCount: opts.sessions,
      },
    },
    ...(opts.priceJod != null
      ? {
          offers: {
            "@type": "Offer",
            price: opts.priceJod,
            priceCurrency: "JOD",
            availability: "https://schema.org/InStock",
            category: "Paid",
            url,
          },
        }
      : {}),
  };
}

/** Only emit this where the questions are actually on the page. */
export function faqPage(items: ReadonlyArray<{ readonly q: string; readonly a: string }>) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/**
 * The testimonials already on the page, as schema.org Review nodes.
 *
 * Deliberately without reviewRating, and with no AggregateRating anywhere: the
 * testimonials carry a name, a role and a quote, and no one has ever given a
 * star. Emitting a rating here would mean inventing the number — fake review
 * markup, which is both against Google's guidelines and a lie told in a
 * machine-readable format. The consequence is honest and worth stating: with
 * no rating there is no star-snippet rich result. What this does buy is
 * extractability — a crawler or a language model reading the page gets the
 * quotes attributed to their authors and tied to the organisation, instead of
 * anonymous paragraphs.
 */
export function reviews(
  items: ReadonlyArray<{ readonly name: string; readonly role: string; readonly quote: string }>,
) {
  if (items.length === 0) return null;
  return items.map((item) => ({
    "@type": "Review",
    itemReviewed: { "@id": ORG_ID },
    author: { "@type": "Person", name: item.name, jobTitle: item.role },
    reviewBody: item.quote,
  }));
}

/** Wrap one or more nodes in the graph envelope. */
export function graph(...nodes: Array<object | null | undefined>) {
  const kept = nodes.filter(Boolean);
  if (kept.length === 0) return null;
  return { "@context": "https://schema.org", "@graph": kept };
}
