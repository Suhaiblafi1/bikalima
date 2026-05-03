import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { AppShell } from "@/components/app-shell";
import { useLang } from "@/hooks/useLang";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ScrollText, Shield, Wallet, Users, HeartHandshake, Copyright,
  Loader2, ChevronRight, Calendar,
} from "lucide-react";

interface Policy {
  id: string;
  slug: string;
  version: number;
  titleAr: string; titleEn: string | null;
  summaryAr: string | null; summaryEn: string | null;
  bodyAr: string; bodyEn: string | null;
  effectiveDate: string;
  requiresAcceptance: boolean;
  icon: string;
}

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "scroll-text": ScrollText,
  "shield": Shield,
  "wallet": Wallet,
  "users": Users,
  "heart-handshake": HeartHandshake,
  "copyright": Copyright,
};

function fmtDate(d: string, lang: "ar" | "en"): string {
  try {
    return new Date(d).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { year: "numeric", month: "long", day: "numeric" });
  } catch { return d; }
}

export default function PoliciesPage() {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug ?? null;
  const { lang } = useLang();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [single, setSingle] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (slug) {
      fetch(`${getApiBase()}/policies/${slug}`, { credentials: "include" })
        .then(r => r.ok ? r.json() : { policy: null })
        .then(d => setSingle(d.policy ?? null))
        .finally(() => setLoading(false));
    } else {
      fetch(`${getApiBase()}/policies`, { credentials: "include" })
        .then(r => r.ok ? r.json() : { policies: [] })
        .then(d => setPolicies(d.policies ?? []))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) {
    return (
      <AppShell containerClassName="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </AppShell>
    );
  }

  if (slug) {
    if (!single) {
      return (
        <AppShell containerClassName="container mx-auto px-4 py-12 max-w-3xl text-center">
          <p className="text-muted-foreground">{lang === "ar" ? "السياسة غير موجودة." : "Policy not found."}</p>
          <Link href="/policies" className="text-primary text-sm hover:underline mt-4 inline-block">
            {lang === "ar" ? "← العودة لقائمة السياسات" : "← Back to policies"}
          </Link>
        </AppShell>
      );
    }
    const Icon = ICON_MAP[single.icon] ?? ScrollText;
    const title = lang === "ar" ? single.titleAr : (single.titleEn || single.titleAr);
    const body = lang === "ar" ? single.bodyAr : (single.bodyEn || single.bodyAr);
    return (
      <AppShell
        breadcrumb={[
          { label: lang === "ar" ? "السياسات" : "Policies", href: "/policies" },
          { label: title },
        ]}
        containerClassName="container mx-auto px-4 py-8 max-w-3xl"
      >
        <header className="mb-6 pb-6 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{lang === "ar" ? "نافذ من" : "Effective"}: {fmtDate(single.effectiveDate, lang)}</span>
                <Badge variant="outline">v{single.version}</Badge>
                {single.requiresAcceptance && (
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                    {lang === "ar" ? "يتطلب موافقة" : "Requires acceptance"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </header>

        <article
          className="prose prose-sm sm:prose-base max-w-none rtl:text-right policy-prose"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
        />

        <style>{`
          .policy-prose h1 { font-size: 1.5rem; font-weight: 700; margin: 1.25rem 0 0.75rem; }
          .policy-prose h2 { font-size: 1.15rem; font-weight: 700; margin: 1.25rem 0 0.5rem; color: hsl(var(--primary)); }
          .policy-prose p { margin: 0.5rem 0; line-height: 1.8; }
          .policy-prose ul { list-style: disc; padding-inline-start: 1.25rem; margin: 0.5rem 0; }
          .policy-prose li { margin: 0.25rem 0; line-height: 1.7; }
          .policy-prose strong { font-weight: 700; }
        `}</style>
      </AppShell>
    );
  }

  return (
    <AppShell
      breadcrumb={[{ label: lang === "ar" ? "الشروط والسياسات" : "Terms & Policies" }]}
      containerClassName="container mx-auto px-4 py-8 max-w-4xl"
    >
      <header className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
          <ScrollText className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          {lang === "ar" ? "الشروط والسياسات" : "Terms & Policies"}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {lang === "ar"
            ? "كل ما يتعلق بحقوقك والتزاماتك على منصة بكلمة."
            : "Everything about your rights and obligations on the Bikalima platform."}
        </p>
      </header>

      {policies.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          {lang === "ar" ? "لم تُنشر سياسات بعد." : "No policies published yet."}
        </CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {policies.map(p => {
            const Icon = ICON_MAP[p.icon] ?? ScrollText;
            const title = lang === "ar" ? p.titleAr : (p.titleEn || p.titleAr);
            const summary = lang === "ar" ? p.summaryAr : (p.summaryEn || p.summaryAr);
            return (
              <Link key={p.id} href={`/policies/${p.slug}`}>
                <a className="block">
                  <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold leading-tight">{title}</h3>
                            <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180 mt-1" />
                          </div>
                          {summary && <p className="text-sm text-muted-foreground mt-1">{summary}</p>}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">v{p.version}</Badge>
                            {p.requiresAcceptance && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">
                                {lang === "ar" ? "يتطلب موافقة" : "Acceptance required"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

// Tiny markdown renderer (headings, bold, lists, paragraphs). We deliberately
// avoid pulling a full markdown lib for one page.
function renderMarkdown(md: string): string {
  const escape = (s: string) => s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  const flushList = () => { if (inList) { out.push("</ul>"); inList = false; } };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushList(); continue; }
    if (line.startsWith("# ")) { flushList(); out.push(`<h1>${escape(line.slice(2))}</h1>`); continue; }
    if (line.startsWith("## ")) { flushList(); out.push(`<h2>${escape(line.slice(3))}</h2>`); continue; }
    if (line.startsWith("- ")) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${inlineFmt(escape(line.slice(2)))}</li>`);
      continue;
    }
    flushList();
    out.push(`<p>${inlineFmt(escape(line))}</p>`);
  }
  flushList();
  return out.join("\n");
}

function inlineFmt(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
