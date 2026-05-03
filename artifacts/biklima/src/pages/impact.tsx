import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Quote, Users, Mic2, ShieldCheck, TrendingUp, Sparkles, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useLang } from "@/hooks/useLang";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { getApiBase } from "@/pages/admin/_shared";

type ImpactStat = {
  key: string;
  labelAr: string;
  labelEn: string;
  value: string;
  isOverridden: boolean;
};

type ImpactStory = {
  id: string;
  name: string;
  roleAr: string | null;
  roleEn: string | null;
  quoteAr: string;
  quoteEn: string | null;
  photoUrl: string | null;
};

const KEY_ICON: Record<string, React.ReactNode> = {
  trainees_total:      <Users className="w-7 h-7" />,
  speeches_evaluated:  <Mic2 className="w-7 h-7" />,
  certificates_issued: <ShieldCheck className="w-7 h-7" />,
  completion_rate:     <TrendingUp className="w-7 h-7" />,
};

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] || "") + (parts[parts.length - 1][0] || "");
}

const AVATAR_BG = [
  "bg-primary/15 text-primary",
  "bg-accent/25 text-accent-foreground",
  "bg-secondary text-secondary-foreground",
  "bg-foreground/10 text-foreground",
];

export default function ImpactPage() {
  const { lang, dir } = useLang();
  const [, navigate] = useLocation();
  const [stats, setStats] = useState<ImpactStat[]>([]);
  const [stories, setStories] = useState<ImpactStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const apiBase = getApiBase();
    fetch(`${apiBase}/impact`, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error("failed");
        const d = (await r.json()) as { stats: ImpactStat[]; stories: ImpactStory[] };
        if (cancelled) return;
        setStats(d.stats ?? []);
        setStories(d.stories ?? []);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const heading = lang === "ar" ? "أثرنا بالأرقام" : "Our impact in numbers";
  const eyebrow = lang === "ar" ? "صفحة الشفافية" : "Transparency page";
  const sub = lang === "ar"
    ? "منذ انطلاقة بكلمة، نقيس تأثيرنا بالأرقام الحقيقية وبقصص الناس التي تغيّرت أصواتهم. هذه الصفحة تُحدَّث تلقائياً من قاعدة بياناتنا."
    : "Since Bikalima started, we measure impact through real data and the stories of people whose voices have changed. This page is updated automatically from our database.";

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden" dir={dir} data-testid="page-impact">
      <SiteHeader />
      <div aria-hidden className="h-16 md:h-20 shrink-0" />
      <Breadcrumb items={[{ label: lang === "ar" ? "الأثر" : "Impact" }]} />

      {/* HERO */}
      <div className="py-16 bg-gradient-to-b from-primary/5 to-background text-center border-b border-border">
        <div className="container mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            {eyebrow}
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">{heading}</h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">{sub}</p>
        </div>
      </div>

      {/* STATS */}
      <section className="py-14 md:py-20 bg-gradient-to-b from-primary to-primary/90 text-primary-foreground relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-10">
          <div className="absolute top-10 -start-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 -end-10 w-72 h-72 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="container mx-auto px-6 relative">
          {loading ? (
            <div className="py-10 text-center text-white/80">…</div>
          ) : error ? (
            <div className="py-10 text-center text-white/90">
              {lang === "ar" ? "تعذّر تحميل الأرقام، حاول لاحقاً." : "Could not load numbers, please try again later."}
            </div>
          ) : stats.length === 0 ? (
            <div className="py-10 text-center text-white/90">
              {lang === "ar"
                ? "نعمل على جمع الأرقام، ستظهر قريباً."
                : "We're collecting numbers, they will appear soon."}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
              {stats.map((s, i) => (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.45 }}
                  className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-3xl p-5 sm:p-6 text-center"
                  data-testid={`impact-stat-${s.key}`}
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 text-white mb-4">
                    {KEY_ICON[s.key] ?? <Sparkles className="w-7 h-7" />}
                  </div>
                  <div className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-none mb-2 tabular-nums" data-testid={`impact-stat-value-${s.key}`}>
                    {s.value || "—"}
                  </div>
                  <p className="text-xs sm:text-sm text-white/85 leading-snug font-medium">
                    {lang === "ar" ? s.labelAr : (s.labelEn || s.labelAr)}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* STORIES */}
      <section className="py-20 bg-background border-y border-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="uppercase tracking-[0.25em] text-xs sm:text-sm text-primary font-bold mb-3">
              {lang === "ar" ? "قصص التحوّل" : "Transformation stories"}
            </p>
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4">
              {lang === "ar" ? "أصواتٌ تغيّرت" : "Voices that changed"}
            </h2>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              {lang === "ar"
                ? "كل رقم في الأعلى يمثّل إنساناً عاش رحلة. هذه بعض قصصهم بكلماتهم."
                : "Every number above is a person who walked the journey. Here are a few of their stories, in their own words."}
            </p>
          </div>

          {loading ? (
            <div className="py-10 text-center text-muted-foreground text-sm">…</div>
          ) : stories.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm border border-dashed border-border rounded-2xl max-w-xl mx-auto" data-testid="impact-stories-empty">
              {lang === "ar"
                ? "نُجمّع قصصَ خرّيجينا، ستظهر هنا قريباً."
                : "We're gathering our graduates' stories — they'll appear here soon."}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5 max-w-6xl mx-auto">
              {stories.map((s, i) => {
                const quote = lang === "ar" ? s.quoteAr : (s.quoteEn || s.quoteAr);
                const role = lang === "ar" ? s.roleAr : (s.roleEn || s.roleAr);
                return (
                  <motion.figure
                    key={s.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: (i % 4) * 0.08, duration: 0.45 }}
                    className="relative bg-card border border-border rounded-3xl p-6 md:p-7 shadow-sm hover:shadow-lg transition-shadow flex flex-col"
                    data-testid={`impact-story-${s.id}`}
                  >
                    <Quote aria-hidden className="absolute top-5 end-5 w-9 h-9 text-primary/15" strokeWidth={1.5} />
                    <blockquote className="text-foreground leading-relaxed text-sm md:text-base mb-6 flex-1">
                      <span className="font-serif text-2xl text-primary me-1 align-top">”</span>
                      {quote}
                    </blockquote>
                    <figcaption className="flex items-center gap-3 pt-4 border-t border-border/60">
                      {s.photoUrl ? (
                        <img src={s.photoUrl} alt={s.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${AVATAR_BG[i % AVATAR_BG.length]}`} aria-hidden>
                          {initialsFor(s.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-foreground text-sm truncate">{s.name}</p>
                        {role && <p className="text-xs text-muted-foreground truncate">{role}</p>}
                      </div>
                    </figcaption>
                  </motion.figure>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* METHODOLOGY */}
      <section className="py-16 bg-secondary/10">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-10">
            <p className="uppercase tracking-[0.25em] text-xs sm:text-sm text-primary font-bold mb-3">
              {lang === "ar" ? "كيف نقيس؟" : "Methodology"}
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold">
              {lang === "ar" ? "أرقامٌ نقف خلفها" : "Numbers we stand behind"}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                ar: { t: "المتدرّبون", b: "نحسبهم من المستخدمين الذين سجّلوا فعلياً في برنامج واحد على الأقل، بدون تكرار." },
                en: { t: "Trainees", b: "Counted as distinct users with at least one real enrollment — no duplicates." },
              },
              {
                ar: { t: "الخطابات المُقيَّمة", b: "كل تقييم خطاب وصلنا، سواء عبر النموذج المجاني أو في إطار البرامج." },
                en: { t: "Speeches evaluated", b: "Every speech-evaluation request we received, free or in-program." },
              },
              {
                ar: { t: "الشهادات الصادرة", b: "الشهادات النشطة فقط (المُلغاة لا تُحتسب)، ويمكن التحقق من كل شهادة عبر صفحة التحقق." },
                en: { t: "Certificates issued", b: "Active certificates only (revoked are excluded). Each is publicly verifiable." },
              },
              {
                ar: { t: "نسبة الإكمال", b: "متوسّط نسبة الدروس المكتملة لكل تسجيل في كل الدورات المنشورة." },
                en: { t: "Completion rate", b: "Average completed-lessons per enrollment across all published courses." },
              },
            ].map((m, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold mb-2">{lang === "ar" ? m.ar.t : m.en.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{lang === "ar" ? m.ar.b : m.en.b}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button
              size="lg"
              onClick={() => navigate("/consultation")}
              className="rounded-full bg-primary text-white hover:bg-primary/90 h-12 px-7 text-base"
              data-testid="impact-cta-consultation"
            >
              <MessageCircle className="w-5 h-5 me-2" />
              {lang === "ar" ? "احجز استشارة مجانية" : "Book a free consultation"}
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
