import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useLang } from "@/hooks/useLang";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ExternalLink, Calendar, Building2, FileCheck2, Award, Loader2 } from "lucide-react";

type Status = "active" | "expired" | "pending_renewal" | "revoked" | "suspended";

interface Accreditation {
  id: string;
  nameAr: string; nameEn: string | null;
  descriptionAr: string | null; descriptionEn: string | null;
  issuerNameAr: string; issuerNameEn: string | null;
  issuerCountry: string | null;
  issuerWebsite: string | null;
  issuerLogoUrl: string | null;
  accreditationNumber: string | null;
  scopeAr: string | null; scopeEn: string | null;
  issueDate: string;
  expiryDate: string | null;
  status: Status;
  certificateFileUrl: string | null;
  verificationUrl: string | null;
  badgeColor: string;
  isFeatured: boolean;
}

const STATUS_BADGE: Record<Status, { ar: string; en: string; cls: string }> = {
  active:           { ar: "ساري",            en: "Active",          cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  pending_renewal:  { ar: "قيد التجديد",      en: "Pending Renewal", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  expired:          { ar: "منتهٍ",            en: "Expired",         cls: "bg-slate-200 text-slate-700 border-slate-300" },
  suspended:        { ar: "موقوف",            en: "Suspended",       cls: "bg-orange-100 text-orange-700 border-orange-200" },
  revoked:          { ar: "ملغى",             en: "Revoked",         cls: "bg-rose-100 text-rose-700 border-rose-200" },
};

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

function formatDate(d: string | null, lang: "ar" | "en"): string {
  if (!d) return lang === "ar" ? "—" : "—";
  try {
    return new Date(d).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { year: "numeric", month: "long", day: "numeric" });
  } catch { return d; }
}

export default function AccreditationsPage() {
  const { lang } = useLang();
  const [items, setItems] = useState<Accreditation[]>([]);
  const [loading, setLoading] = useState(true);

  // Per-page SEO. Public, indexable page with a stable canonical.
  usePageMeta({
    title: lang === "ar" ? "اعتماداتنا وشراكاتنا" : "Our Accreditations & Partnerships",
    description:
      lang === "ar"
        ? "اعتمادات بكلمة الرسمية من جهات موثوقة محلياً ودولياً. كل شهادة قابلة للتحقق."
        : "Bikalima's official accreditations from trusted local and international bodies — every certificate is verifiable.",
    canonicalPath: "/accreditations",
  });

  useEffect(() => {
    fetch(`${getApiBase()}/accreditations`, { credentials: "include" })
      .then(r => r.ok ? r.json() : { accreditations: [] })
      .then(d => setItems(d.accreditations ?? []))
      .finally(() => setLoading(false));
  }, []);

  const featured = items.filter(i => i.isFeatured);
  const others = items.filter(i => !i.isFeatured);

  return (
    <AppShell
      breadcrumb={[{ label: lang === "ar" ? "الاعتمادات" : "Accreditations" }]}
      containerClassName="container mx-auto px-4 py-8 max-w-6xl"
    >
      <header className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          {lang === "ar" ? "اعتماداتنا وشراكاتنا" : "Our Accreditations & Partnerships"}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {lang === "ar"
            ? "نحرص على تقديم تدريب معتمد من جهات موثوقة محلياً ودولياً. كل شهادة هنا قابلة للتحقق."
            : "We deliver training accredited by trusted local and international bodies. Every certificate below is independently verifiable."}
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          {lang === "ar" ? "لم يتم نشر اعتمادات بعد." : "No accreditations published yet."}
        </CardContent></Card>
      ) : (
        <div className="space-y-10">
          {featured.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                {lang === "ar" ? "اعتمادات رئيسية" : "Featured Accreditations"}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {featured.map(a => <AccreditationCard key={a.id} a={a} lang={lang} featured />)}
              </div>
            </section>
          )}
          {others.length > 0 && (
            <section>
              {featured.length > 0 && (
                <h2 className="text-xl font-bold mb-4">
                  {lang === "ar" ? "اعتمادات أخرى" : "Other Accreditations"}
                </h2>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {others.map(a => <AccreditationCard key={a.id} a={a} lang={lang} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </AppShell>
  );
}

function AccreditationCard({ a, lang, featured }: { a: Accreditation; lang: "ar" | "en"; featured?: boolean }) {
  const name = lang === "ar" ? a.nameAr : (a.nameEn || a.nameAr);
  const issuer = lang === "ar" ? a.issuerNameAr : (a.issuerNameEn || a.issuerNameAr);
  const desc = lang === "ar" ? a.descriptionAr : (a.descriptionEn || a.descriptionAr);
  const scope = lang === "ar" ? a.scopeAr : (a.scopeEn || a.scopeAr);
  const status = STATUS_BADGE[a.status];

  return (
    <Card className={`overflow-hidden ${featured ? "ring-2 ring-amber-200" : ""}`}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          {a.issuerLogoUrl ? (
            <img src={a.issuerLogoUrl} alt={issuer} className="w-14 h-14 object-contain rounded-lg bg-white border border-border" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
              <Building2 className="w-7 h-7 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold leading-tight">{name}</h3>
            <p className="text-sm text-muted-foreground truncate">{issuer}{a.issuerCountry ? ` • ${a.issuerCountry}` : ""}</p>
          </div>
          <Badge variant="outline" className={status.cls}>{lang === "ar" ? status.ar : status.en}</Badge>
        </div>

        {desc && <p className="text-sm text-foreground/80 leading-relaxed">{desc}</p>}

        {scope && (
          <div className="text-xs bg-muted/50 rounded-lg p-2.5">
            <span className="font-semibold">{lang === "ar" ? "النطاق: " : "Scope: "}</span>
            {scope}
          </div>
        )}

        <dl className="grid grid-cols-2 gap-2 text-xs">
          {a.accreditationNumber && (
            <div>
              <dt className="text-muted-foreground">{lang === "ar" ? "رقم الاعتماد" : "Number"}</dt>
              <dd className="font-mono font-semibold">{a.accreditationNumber}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{lang === "ar" ? "تاريخ الإصدار" : "Issued"}</dt>
            <dd className="font-semibold">{formatDate(a.issueDate, lang)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{lang === "ar" ? "تاريخ الانتهاء" : "Expires"}</dt>
            <dd className="font-semibold">{a.expiryDate ? formatDate(a.expiryDate, lang) : (lang === "ar" ? "بدون انتهاء" : "Lifetime")}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
          {a.certificateFileUrl && (
            <a href={a.certificateFileUrl} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
              <FileCheck2 className="w-3.5 h-3.5" />
              {lang === "ar" ? "شهادة الاعتماد" : "Certificate"}
            </a>
          )}
          {a.verificationUrl && (
            <a href={a.verificationUrl} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
              <ExternalLink className="w-3.5 h-3.5" />
              {lang === "ar" ? "تحقق لدى الجهة" : "Verify with issuer"}
            </a>
          )}
          {a.issuerWebsite && (
            <a href={a.issuerWebsite} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary">
              <Building2 className="w-3.5 h-3.5" />
              {lang === "ar" ? "موقع الجهة" : "Issuer site"}
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
