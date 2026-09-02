import { Link, useParams } from "wouter";
import {
  Feather,
  Globe,
  Heart,
  Lightbulb,
  Mic2,
  Sparkles,
  Star,
  Users,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useStructuredData, graph, SITE_URL, ORG_ID } from "@/hooks/use-structured-data";
import { useLang } from "@/hooks/useLang";
import { WISDOM_PIECES, wisdomBySlug, wisdomFor } from "@/wisdomContent";

/**
 * The only long-form writing the site owns, given addresses.
 *
 * These eight pieces come from the institution's own workbooks and programmes.
 * They already existed — duplicated inside home.tsx and workbooks.tsx as
 * decoration in a rotating panel — with no URL, no title, and nothing for a
 * search engine or a language model to cite. Nothing here is newly written;
 * what is new is that each piece is now a page that can be linked, indexed and
 * quoted with attribution.
 */

const ICONS: Record<string, typeof Lightbulb> = {
  Lightbulb, Mic2, Heart, Users, Star, Feather, Sparkles, Globe,
};

function iconFor(name: string) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon className="h-5 w-5" aria-hidden />;
}

/** schema.org Article for one piece, so a citation has an author and a source. */
function articleNode(slug: string, lang: "ar" | "en") {
  const piece = wisdomBySlug(slug);
  if (!piece) return null;
  const loc = piece[lang];
  return {
    "@type": "Article",
    "@id": `${SITE_URL}/insights/${slug}#article`,
    headline: loc.quote,
    articleBody: loc.body,
    articleSection: loc.category,
    inLanguage: lang === "ar" ? "ar" : "en",
    isPartOf: { "@id": `${SITE_URL}/insights` },
    // The workbook or programme the piece is drawn from — the citation the
    // institution would want carried with the quote.
    citation: loc.source,
    publisher: { "@id": ORG_ID },
    author: { "@id": ORG_ID },
    mainEntityOfPage: `${SITE_URL}/insights/${slug}`,
  };
}

export function InsightsIndex() {
  const { lang, dir } = useLang();
  const isAr = lang === "ar";
  const pieces = wisdomFor(lang);

  usePageMeta({
    title: isAr ? "مقتطفات" : "Insights",
    description: isAr
      ? "مقتطفات من كرّاسات بكلمة وبرامجها: الثقة، الخوف من الكلام، الصوت والهوية، ودور المربّي."
      : "Excerpts from Bikalima's workbooks and programmes: confidence, fear of speaking, voice and identity, and the educator's role.",
    canonicalPath: "/insights",
  });

  useStructuredData(
    graph({
      "@type": "CollectionPage",
      "@id": `${SITE_URL}/insights`,
      name: isAr ? "مقتطفات بكلمة" : "Bikalima Insights",
      publisher: { "@id": ORG_ID },
      hasPart: WISDOM_PIECES.map((p) => ({
        "@type": "Article",
        "@id": `${SITE_URL}/insights/${p.slug}#article`,
        headline: p[isAr ? "ar" : "en"].quote,
        url: `${SITE_URL}/insights/${p.slug}`,
      })),
    }),
  );

  return (
    <AppShell
      breadcrumb={[{ label: isAr ? "مقتطفات" : "Insights" }]}
      containerClassName="container mx-auto px-6 py-10"
    >
      <div dir={dir}>
        <header className="mb-8 max-w-2xl">
          <h1 className="font-serif text-3xl font-bold md:text-4xl">
            {isAr ? "مقتطفات" : "Insights"}
          </h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            {isAr
              ? "فقرات من كرّاسات بكلمة وبرامجها التدريبية — كل واحدة لها صفحتها، لتُقرأ وتُشارَك وتُنسَب إلى مصدرها."
              : "Passages from Bikalima's workbooks and training programmes — each with its own page, to be read, shared, and attributed to its source."}
          </p>
        </header>

        <ul className="grid gap-4 sm:grid-cols-2">
          {pieces.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/insights/${p.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {iconFor(p.icon)}
                  {p.category}
                </span>
                <h2 className="font-serif text-lg font-bold leading-snug text-foreground group-hover:text-primary">
                  {p.quote}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
                <span className="mt-3 text-[11px] text-muted-foreground">{p.source}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}

export default function InsightArticle() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const { lang, dir } = useLang();
  const isAr = lang === "ar";
  const piece = wisdomBySlug(slug);
  const loc = piece ? piece[isAr ? "ar" : "en"] : null;

  // Called unconditionally: hooks cannot sit behind the not-found branch.
  usePageMeta({
    title: loc?.quote,
    description: loc?.body,
    canonicalPath: piece ? `/insights/${slug}` : undefined,
    noindex: !piece,
  });
  useStructuredData(piece ? graph(articleNode(slug, isAr ? "ar" : "en")) : null);

  if (!piece || !loc) {
    return (
      <AppShell containerClassName="container mx-auto px-6 py-16">
        <div dir={dir} className="mx-auto max-w-md text-center">
          <p className="text-muted-foreground">
            {isAr ? "لم نعثر على هذا المقتطف." : "That insight was not found."}
          </p>
          <Link href="/insights" className="mt-4 inline-block text-primary underline">
            {isAr ? "عودة إلى المقتطفات" : "Back to insights"}
          </Link>
        </div>
      </AppShell>
    );
  }

  const index = WISDOM_PIECES.findIndex((p) => p.slug === slug);
  const prev = index > 0 ? WISDOM_PIECES[index - 1] : null;
  const next = index < WISDOM_PIECES.length - 1 ? WISDOM_PIECES[index + 1] : null;
  const Back = isAr ? ArrowRight : ArrowLeft;

  return (
    <AppShell
      breadcrumb={[
        { label: isAr ? "مقتطفات" : "Insights", href: "/insights" },
        { label: loc.category },
      ]}
      containerClassName="container mx-auto px-6 py-10"
    >
      <article dir={dir} className="mx-auto max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {iconFor(piece.icon)}
          {loc.category}
        </span>
        <h1 className="mt-4 font-serif text-2xl font-bold leading-snug md:text-3xl">{loc.quote}</h1>
        <p className="mt-5 text-base leading-loose text-foreground/90">{loc.body}</p>
        <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
          {isAr ? "المصدر: " : "Source: "}
          <span className="font-medium text-foreground/80">{loc.source}</span>
        </p>

        <nav className="mt-10 flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link href="/insights" className="inline-flex items-center gap-1.5 text-primary hover:underline">
            <Back className="h-4 w-4" aria-hidden />
            {isAr ? "كل المقتطفات" : "All insights"}
          </Link>
          <span className="flex gap-4">
            {prev && (
              <Link href={`/insights/${prev.slug}`} className="text-muted-foreground hover:text-foreground">
                {isAr ? "السابق" : "Previous"}
              </Link>
            )}
            {next && (
              <Link href={`/insights/${next.slug}`} className="text-muted-foreground hover:text-foreground">
                {isAr ? "التالي" : "Next"}
              </Link>
            )}
          </span>
        </nav>
      </article>
    </AppShell>
  );
}
