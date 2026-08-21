import { type ReactNode } from "react";
import { Quote, Star, Users, Globe2, GraduationCap } from "lucide-react";

type Lang = "ar" | "en";

const copy = {
  ar: {
    wordmark: "بكلمة",
    headlineA: "لديك ما تقوله —",
    headlineB: "وبكلمة ستُسمَع.",
    sub: "منصّة عربية متخصصة في فنّ الإلقاء والخطابة، من أول وقفة أمام الجمهور حتى اعتمادك مدرّباً.",
    quote: "الكلمة الصادقة تصل أبعد من ألف خطاب مزخرف.",
    quoteBy: "صهيب الخوالدة",
    stats: [
      { icon: Users, value: "+800", label: "متدرب" },
      { icon: Globe2, value: "7", label: "دول" },
      { icon: Star, value: "4.9/5", label: "تقييم" },
      { icon: GraduationCap, value: "+16", label: "سنة خبرة" },
    ],
  },
  en: {
    wordmark: "Bikalima",
    headlineA: "You have something to say —",
    headlineB: "Bikalima makes it heard.",
    sub: "An Arabic-first platform for public speaking, from your first stage appearance to certified trainer.",
    quote: "A sincere word travels further than a thousand ornate speeches.",
    quoteBy: "Suhaib Al-Khawaldeh",
    stats: [
      { icon: Users, value: "800+", label: "trainees" },
      { icon: Globe2, value: "7", label: "countries" },
      { icon: Star, value: "4.9/5", label: "rating" },
      { icon: GraduationCap, value: "16+", label: "years" },
    ],
  },
} as const;

/**
 * Shared shell for /login, /forgot-password, /reset-password.
 * Split layout: the task form owns the start (right in RTL) side, and a
 * deep-teal brand panel carries the promise, a signature quote, and the
 * trust strip from the landing page. On mobile the panel collapses to a
 * compact header so the form stays first.
 */
export function AuthShell({
  lang,
  children,
}: {
  lang: Lang;
  children: ReactNode;
}) {
  const c = copy[lang];
  const isAr = lang === "ar";

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen bg-background flex flex-col lg:grid lg:grid-cols-[1.05fr_1fr]"
    >
      {/* Compact brand header — mobile only */}
      <div className="lg:hidden bg-primary text-primary-foreground px-6 pt-8 pb-10 relative overflow-hidden">
        <div className="absolute -top-16 -start-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
        <p className="font-serif text-3xl font-bold relative">{c.wordmark}</p>
        <p className="mt-2 text-sm text-primary-foreground/85 relative leading-relaxed">
          {c.headlineA} <span className="font-bold">{c.headlineB}</span>
        </p>
      </div>

      {/* Form panel */}
      <main className="flex items-center justify-center px-4 py-8 md:p-10 -mt-5 lg:mt-0 relative z-10">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Brand panel — desktop */}
      <aside className="hidden lg:flex relative overflow-hidden bg-primary text-primary-foreground flex-col justify-between p-12 xl:p-16">
        <div className="absolute -top-24 -end-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -start-24 w-[28rem] h-[28rem] rounded-full bg-black/15 blur-3xl" />

        <p className="font-serif text-4xl font-bold relative">{c.wordmark}</p>

        <div className="relative space-y-8">
          <h2 className="font-serif text-4xl xl:text-5xl font-bold leading-[1.35]">
            {c.headlineA}
            <br />
            <span className="text-secondary">{c.headlineB}</span>
          </h2>
          <p className="text-primary-foreground/85 leading-loose max-w-md">{c.sub}</p>

          <figure className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/15 max-w-md">
            <Quote className="w-5 h-5 mb-3 opacity-60" aria-hidden />
            <blockquote className="font-serif text-lg leading-relaxed">
              {c.quote}
            </blockquote>
            <figcaption className="mt-3 text-sm text-primary-foreground/75">
              — {c.quoteBy}
            </figcaption>
          </figure>
        </div>

        <dl className="relative grid grid-cols-4 gap-4 border-t border-white/15 pt-6">
          {c.stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center">
              <Icon className="w-4 h-4 mx-auto mb-1.5 opacity-70" aria-hidden />
              <dt className="sr-only">{label}</dt>
              <dd className="font-bold text-lg leading-none">{value}</dd>
              <dd className="text-xs text-primary-foreground/75 mt-1">{label}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}
