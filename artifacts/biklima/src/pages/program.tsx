import { useEffect, useMemo, useState } from "react";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft, ArrowRight, Clock, Calendar, Users, Target,
  CheckCircle2, BookOpen, Sparkles, MessageSquare, Mail,
  Share2, Check, Layers, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { programs, getLocalizedProgram, RECORDED_PRICES, WORKBOOK_FACTS } from "@/programsData";
import { AppShell } from "@/components/app-shell";
import { useLang } from "@/hooks/useLang";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useCurrency, SLUG_TO_PROGRAM_ID } from "@/lib/site-config";
import {
  AudienceSection, OutcomesSection, SessionsAccordion,
  FAQSection, getCoursePageData, type DbLesson,
} from "./course-components";

const HERO_GRADIENT: Record<string, string> = {
  core: "from-primary via-primary/90 to-primary/70",
  tot: "from-amber-800 via-amber-700 to-amber-600",
  teachers: "from-teal-800 via-teal-700 to-teal-600",
  children: "from-sky-800 via-sky-700 to-sky-600",
};

const T = {
  ar: {
    breadcrumbHome: "الرئيسية",
    breadcrumbPrograms: "البرامج",
    backToPrograms: "العودة للبرامج",
    sectionAudience: "لمن هذا البرنامج؟",
    sectionProblem: "المشكلة التي يحلّها",
    sectionMeta: "تفاصيل البرنامج",
    metaDuration: "المدة",
    metaSessions: "عدد الجلسات",
    metaPrice: "السعر",
    metaHoursUnit: "ساعة",
    metaSessionsUnit: "جلسة",
    metaPriceUnit: "د.أ",
    metaSchoolsOnly: "للمدارس فقط",
    sectionOutcomes: "مخرجات البرنامج",
    sectionModules: "الجلسات والمحاور",
    sectionWorkbook: "الكراسة المرافقة",
    sectionWorkbookStructure: "بنية الكراسة",
    workbookSectionsLabel: "قسم تدريبي",
    workbookUnitsLabel: "وحدة رئيسية",
    workbookFactsIntro: "مبني على كراسة تدريبية مُحكمة، بهيكل واضح وتمارين مُتدرّجة:",
    sectionFaq: "أسئلة شائعة",
    shareBtn: "مشاركة",
    shareCopied: "تم نسخ الرابط",
    transformationLabel: "التحوّل",
    primaryCta: "سجّل اهتمامك",
    secondaryCta: "اطلب استشارة",
    primaryCtaSub: "اترك بياناتك وسنتواصل معك خلال ٢٤ ساعة",
    secondaryCtaSub: "احجز مكالمة قصيرة لاختيار المسار الأنسب",
    finalCtaHeading: "خطوتك القادمة",
    finalCtaSub: "اختر الطريقة التي تناسبك لتبدأ رحلتك مع",
    notFound: "لم نعثر على هذا البرنامج",
    backHome: "العودة للرئيسية",
    interestSubject: "تسجيل اهتمام في برنامج",
    consultationSubject: "طلب استشارة حول برنامج",
    interestBody:
      "السلام عليكم،%0D%0A%0D%0Aأرغب بتسجيل اهتمامي ببرنامج: ",
    interestBodyPart2:
      "%0D%0A%0D%0Aالاسم: %0D%0Aالبلد: %0D%0Aرقم التواصل: %0D%0Aملاحظات إضافية: %0D%0A",
    consultationBody:
      "السلام عليكم،%0D%0A%0D%0Aأرغب بحجز استشارة قصيرة بخصوص برنامج: ",
    consultationBodyPart2:
      "%0D%0A%0D%0Aالاسم: %0D%0Aالبلد: %0D%0Aهدفي من البرنامج: %0D%0A",
  },
  en: {
    breadcrumbHome: "Home",
    breadcrumbPrograms: "Programs",
    backToPrograms: "Back to Programs",
    sectionAudience: "Who Is This Program For?",
    sectionProblem: "The Problem It Solves",
    sectionMeta: "Program Details",
    metaDuration: "Duration",
    metaSessions: "Sessions",
    metaPrice: "Price",
    metaHoursUnit: "hours",
    metaSessionsUnit: "sessions",
    metaPriceUnit: "JOD",
    metaSchoolsOnly: "Schools only",
    sectionOutcomes: "Program Outcomes",
    sectionModules: "Sessions & Modules",
    sectionWorkbook: "The Companion Workbook",
    sectionWorkbookStructure: "Workbook Structure",
    workbookSectionsLabel: "training sections",
    workbookUnitsLabel: "core units",
    workbookFactsIntro: "Built on a rigorously structured training workbook with progressive exercises:",
    sectionFaq: "Frequently Asked Questions",
    shareBtn: "Share",
    shareCopied: "Link copied",
    transformationLabel: "Transformation",
    primaryCta: "Register Your Interest",
    secondaryCta: "Request a Consultation",
    primaryCtaSub: "Leave your details and we'll reach out within 24 hours",
    secondaryCtaSub: "Book a short call to pick the right track for you",
    finalCtaHeading: "Your Next Step",
    finalCtaSub: "Choose the option that works best for you to start your journey with",
    notFound: "Program not found",
    backHome: "Back to Home",
    interestSubject: "Interest in program",
    consultationSubject: "Consultation request for program",
    interestBody:
      "Hello,%0D%0A%0D%0AI'd like to register my interest in: ",
    interestBodyPart2:
      "%0D%0A%0D%0AName: %0D%0ACountry: %0D%0APhone: %0D%0AAdditional notes: %0D%0A",
    consultationBody:
      "Hello,%0D%0A%0D%0AI'd like to book a short consultation about: ",
    consultationBodyPart2:
      "%0D%0A%0D%0AName: %0D%0ACountry: %0D%0AMy goal: %0D%0A",
  },
};

const ADMIN_EMAIL = "info@bikalima.com";

function getApiBase() {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

export default function ProgramPage() {
  const [, params] = useRoute("/programs/:slug");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();
  const { lang } = useLang();
  const { format: formatPrice } = useCurrency();
  const isRtl = lang === "ar";
  const t = T[lang === "ar" ? "ar" : "en"];

  const programId = SLUG_TO_PROGRAM_ID[slug];
  const program = programs.find((p) => p.id === programId);
  const courseData = programId ? getCoursePageData(programId) : undefined;
  const workbookFacts = programId ? WORKBOOK_FACTS[programId] : undefined;
  const dbLessons: DbLesson[] = useMemo(() => [], []);
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareTitle = program ? getLocalizedProgram(program, lang).shortTitle + " — بكلمة" : "بكلمة";
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }).share) {
      try {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({ title: shareTitle, url: shareUrl });
        return;
      } catch { /* user cancelled — fall back to copy */ }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [slug]);

  useEffect(() => {
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang, isRtl]);

  // Per-page SEO. Called unconditionally (Rules of Hooks) — falls back
  // to a generic title when the slug doesn't match a known program.
  const pageLoc = program ? getLocalizedProgram(program, lang) : null;
  usePageMeta({
    title: pageLoc?.shortTitle,
    description: pageLoc?.hook ?? pageLoc?.description,
    canonicalPath: program ? `/programs/${slug}` : undefined,
    ogImage: program?.image,
  });

  if (!program) {
    return (
      <AppShell containerClassName="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-6">
          <p className="text-muted-foreground text-lg">{t.notFound}</p>
          <Button onClick={() => navigate("/")}>{t.backHome}</Button>
        </div>
      </AppShell>
    );
  }

  const loc = getLocalizedProgram(program, lang);
  const price = RECORDED_PRICES[programId as keyof typeof RECORDED_PRICES];
  const heroGradient = HERO_GRADIENT[programId] || "from-primary to-primary/80";
  const isSchoolsOnly = programId === "children";

  const Arrow = isRtl ? ArrowRight : ArrowLeft;

  // Unified CTAs: sellable programs route to /checkout (which handles
  // preview + login gate + Stripe). Schools-only "children" stays on
  // mailto because it's a B2B engagement, not a self-serve purchase.
  // Consultation CTA points to the on-site /consultation form so leads
  // are captured in the CRM instead of disappearing into an inbox.
  const interestMailto =
    `mailto:${ADMIN_EMAIL}` +
    `?subject=${encodeURIComponent(t.interestSubject + " — " + loc.shortTitle)}` +
    `&body=${t.interestBody}${encodeURIComponent(loc.shortTitle)}${t.interestBodyPart2}`;
  const interestHref = isSchoolsOnly
    ? interestMailto
    : `/checkout?slug=${encodeURIComponent(slug)}`;
  const consultationHref = `/consultation?topic=${encodeURIComponent(loc.shortTitle)}`;

  return (
    <AppShell
      containerClassName=""
      breadcrumb={[
        { label: t.breadcrumbPrograms, href: "/#structure" },
        { label: loc.shortTitle },
      ]}
    >
      {/* ── HERO ── */}
      <section className={`relative bg-gradient-to-br ${heroGradient} text-white overflow-hidden`}>
        <div
          className="absolute inset-0 opacity-15 bg-cover bg-center"
          style={{ backgroundImage: `url(${program.image})` }}
          aria-hidden
        />
        <div className="relative container mx-auto px-6 py-16 md:py-24">
          <div className="max-w-3xl">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6 transition-colors"
              data-testid="link-back-to-programs"
            >
              <Arrow className="w-4 h-4" />
              {t.backToPrograms}
            </button>

            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              {loc.role}
            </div>

            <h1 className="font-serif text-3xl md:text-5xl font-black leading-tight mb-4" data-testid="text-program-title">
              {loc.shortTitle}
            </h1>

            {courseData?.tagline ? (
              <p className="text-lg md:text-xl text-white/85 leading-relaxed mb-6">
                {courseData.tagline}
              </p>
            ) : (
              <p className="text-lg md:text-xl text-white/85 leading-relaxed mb-6">
                {loc.hook}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> {program.hours} {t.metaHoursUnit}
              </span>
              <span className="opacity-50">·</span>
              <span>{program.sessions} {t.metaSessionsUnit}</span>
              <span className="opacity-50">·</span>
              {isSchoolsOnly ? (
                <span className="font-bold">{t.metaSchoolsOnly}</span>
              ) : typeof price === "number" ? (
                <span className="font-bold">{formatPrice(price)}</span>
              ) : null}
            </div>

            {/* Hero CTAs */}
            <div className="flex flex-wrap gap-3 mt-8">
              <Button
                asChild
                size="lg"
                className="bg-white text-gray-900 hover:bg-white/90 font-bold rounded-full px-8 shadow-lg"
              >
                <a href={interestHref} data-testid="button-register-interest-hero">
                  <Mail className="w-4 h-4 me-2" />
                  {t.primaryCta}
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-transparent border-white/40 text-white hover:bg-white/10 font-bold rounded-full px-8"
              >
                <a href={consultationHref} data-testid="button-request-consultation-hero">
                  <MessageSquare className="w-4 h-4 me-2" />
                  {t.secondaryCta}
                </a>
              </Button>
              <Button
                onClick={handleShare}
                size="lg"
                variant="ghost"
                className="bg-white/10 hover:bg-white/20 text-white font-bold rounded-full px-6"
                data-testid="button-share-program"
                aria-label={t.shareBtn}
              >
                {shareCopied ? <Check className="w-4 h-4 me-2" /> : <Share2 className="w-4 h-4 me-2" />}
                {shareCopied ? t.shareCopied : t.shareBtn}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROGRAM META CARD ── */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetaCell icon={<Clock className="w-5 h-5" />} label={t.metaDuration} value={`${program.hours} ${t.metaHoursUnit}`} />
            <MetaCell icon={<Calendar className="w-5 h-5" />} label={t.metaSessions} value={`${program.sessions} ${t.metaSessionsUnit}`} />
            <MetaCell
              icon={<Target className="w-5 h-5" />}
              label={t.metaPrice}
              value={isSchoolsOnly ? t.metaSchoolsOnly : (typeof price === "number" ? formatPrice(price) : "—")}
            />
            <MetaCell icon={<Users className="w-5 h-5" />} label={loc.delivery.includes("·") ? loc.delivery.split("·")[0].trim() : loc.role} value={courseData?.format ?? loc.delivery} />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-10 items-start">
          {/* ── MAIN COLUMN ── */}
          <div className="min-w-0 space-y-2">

            {/* Mobile CTAs */}
            <div className="lg:hidden mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button asChild className="w-full rounded-xl font-bold py-6">
                <a href={interestHref} data-testid="button-register-interest-mobile">
                  <Mail className="w-4 h-4 me-2" />
                  {t.primaryCta}
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-xl font-bold py-6">
                <a href={consultationHref} data-testid="button-request-consultation-mobile">
                  <MessageSquare className="w-4 h-4 me-2" />
                  {t.secondaryCta}
                </a>
              </Button>
            </div>

            {/* 1. PROBLEM IT SOLVES */}
            <section className="py-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
                <span className="w-1 h-8 bg-primary rounded-full inline-block" />
                {t.sectionProblem}
              </h2>
              <p className="text-base md:text-lg text-foreground/85 leading-loose mb-6">
                {loc.description}
              </p>
              <div className="bg-primary/5 border-s-4 border-primary rounded-e-2xl p-5">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                  {t.transformationLabel}
                </p>
                <p className="text-base md:text-lg font-semibold text-foreground leading-relaxed">
                  {loc.transformation}
                </p>
              </div>
            </section>

            {/* 2. AUDIENCE */}
            {courseData?.audienceItems ? (
              <AudienceSection items={courseData.audienceItems} lang={lang} />
            ) : (
              <section className="py-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
                  <span className="w-1 h-8 bg-primary rounded-full inline-block" />
                  {t.sectionAudience}
                </h2>
                <p className="text-base text-foreground/85 leading-relaxed">{loc.audience}</p>
              </section>
            )}

            {/* 3. OUTCOMES */}
            {courseData?.outcomes ? (
              <OutcomesSection outcomes={courseData.outcomes} lang={lang} />
            ) : (
              <section className="py-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
                  <span className="w-1 h-8 bg-primary rounded-full inline-block" />
                  {t.sectionOutcomes}
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {loc.outcomes.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-card border border-border rounded-xl p-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. MODULES / SESSIONS */}
            {courseData?.modules ? (
              <SessionsAccordion modules={courseData.modules} dbLessons={dbLessons} lang={lang} />
            ) : (
              <section className="py-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
                  <span className="w-1 h-8 bg-primary rounded-full inline-block" />
                  {t.sectionModules}
                </h2>
                <ol className="space-y-3">
                  {loc.modules.map((m, i) => (
                    <li key={i} className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
                      <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed">{m}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* 5. WORKBOOK */}
            <section className="py-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
                <span className="w-1 h-8 bg-primary rounded-full inline-block" />
                {t.sectionWorkbook}
              </h2>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl p-6 flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-lg md:text-xl font-bold mb-2">{loc.workbook.title}</h3>
                  <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                    {loc.workbook.description}
                  </p>
                </div>
              </div>

              {workbookFacts && (
                <div className="mt-6 bg-card border border-border rounded-2xl p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Layers className="w-5 h-5 text-primary" />
                    <h3 className="font-serif text-lg md:text-xl font-bold">{t.sectionWorkbookStructure}</h3>
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
                    {t.workbookFactsIntro}
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 text-center">
                      <div className="text-3xl md:text-4xl font-black text-primary leading-none mb-1">
                        {workbookFacts.sections}
                      </div>
                      <div className="text-[11px] md:text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        {t.workbookSectionsLabel}
                      </div>
                    </div>
                    <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 text-center">
                      <div className="text-3xl md:text-4xl font-black text-primary leading-none mb-1">
                        {workbookFacts.units.length}
                      </div>
                      <div className="text-[11px] md:text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        {t.workbookUnitsLabel}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    {workbookFacts.unitsLabel[lang === "ar" ? "ar" : "en"]}
                  </div>
                  <ol className="space-y-2">
                    {workbookFacts.units.map((u, i) => (
                      <li key={i} className="flex items-start gap-3 bg-background/60 border border-border rounded-xl p-3">
                        <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-sm md:text-base font-semibold leading-relaxed pt-0.5">
                          {u[lang === "ar" ? "ar" : "en"]}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </section>

            {/* 6. FAQ */}
            {courseData?.faqItems && (
              <FAQSection faqItems={courseData.faqItems} lang={lang} />
            )}

            {/* 7. FINAL CTA */}
            <section className="py-12">
              <div className={`bg-gradient-to-br ${heroGradient} text-white rounded-3xl p-8 md:p-10 text-center shadow-xl`}>
                <h2 className="font-serif text-2xl md:text-3xl font-bold mb-3">
                  {t.finalCtaHeading}
                </h2>
                <p className="text-white/85 text-sm md:text-base mb-6 max-w-xl mx-auto">
                  {t.finalCtaSub} <span className="font-bold">{loc.shortTitle}</span>
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-gray-900 hover:bg-white/90 font-bold rounded-full px-8 shadow-lg"
                  >
                    <a href={interestHref} data-testid="button-register-interest-final">
                      <Mail className="w-4 h-4 me-2" />
                      {t.primaryCta}
                    </a>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-white/40 text-white hover:bg-white/10 font-bold rounded-full px-8"
                  >
                    <a href={consultationHref} data-testid="button-request-consultation-final">
                      <MessageSquare className="w-4 h-4 me-2" />
                      {t.secondaryCta}
                    </a>
                  </Button>
                </div>
              </div>
            </section>
          </div>

          {/* ── DESKTOP STICKY SIDEBAR ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="bg-card border border-border rounded-2xl shadow-xl p-6 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    {t.metaPrice}
                  </p>
                  {isSchoolsOnly ? (
                    <p className="text-2xl font-black text-primary">{t.metaSchoolsOnly}</p>
                  ) : typeof price === "number" ? (
                    <p className="text-3xl font-black text-primary">{formatPrice(price)}</p>
                  ) : null}
                </div>
                <div className="border-t border-border pt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> {t.metaDuration}
                    </span>
                    <span className="font-bold">{program.hours} {t.metaHoursUnit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground inline-flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> {t.metaSessions}
                    </span>
                    <span className="font-bold">{program.sessions} {t.metaSessionsUnit}</span>
                  </div>
                  {courseData?.format && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground inline-flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                      </span>
                      <span className="font-semibold text-end">{courseData.format}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-border pt-4 space-y-3">
                  <Button asChild className="w-full rounded-xl font-bold py-6">
                    <a href={interestHref} data-testid="button-register-interest-sidebar">
                      <Mail className="w-4 h-4 me-2" />
                      {t.primaryCta}
                    </a>
                  </Button>
                  <p className="text-[11px] text-center text-muted-foreground">{t.primaryCtaSub}</p>
                  <Button asChild variant="outline" className="w-full rounded-xl font-bold py-5">
                    <a href={consultationHref} data-testid="button-request-consultation-sidebar">
                      <MessageSquare className="w-4 h-4 me-2" />
                      {t.secondaryCta}
                    </a>
                  </Button>
                  <p className="text-[11px] text-center text-muted-foreground">{t.secondaryCtaSub}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function MetaCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-bold truncate">{value}</p>
      </div>
    </div>
  );
}
