import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";
import { ProgramProof } from "@/components/program-proof";
import {
  useStructuredData,
  graph,
  courseGraph,
  faqPage,
  breadcrumbList,
} from "@/hooks/use-structured-data";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  FileText,
  Layers,
  Library,
  MessageSquare,
  Share2,
  Sparkles,
  Target,
  Ticket,
  Trophy,
  Users,
  Users2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { programs, getLocalizedProgram, RECORDED_PRICES, WORKBOOK_FACTS } from "@/programsData";
import { AppShell } from "@/components/app-shell";
import { useLang } from "@/hooks/useLang";
import { T as Translations } from "@/translations";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useCurrency, SLUG_TO_PROGRAM_ID, PROGRAM_SLUGS } from "@/lib/site-config";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { OPEN_CHAT_EVENT } from "@/components/live-chat-widget";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import {
  trackReserveSeatClick,
  trackQuestionBeforeBookingClick,
  trackTabChange,
} from "@/lib/analytics";
import {
  AudienceSection, OutcomesSection, SessionsAccordion,
  FAQSection, getCoursePageData, type DbLesson,
} from "./course-components";

// A wash laid over the photograph, not a replacement for it. The stops stay
// deep enough on the text side to keep white legible and lift towards the
// far corner so the image reads through.
const HERO_GRADIENT: Record<string, string> = {
  core: "from-primary via-primary/85 to-primary/55",
  tot: "from-amber-900 via-amber-800/85 to-amber-700/55",
  teachers: "from-teal-900 via-teal-800/85 to-teal-700/55",
  children: "from-sky-900 via-sky-800/85 to-sky-700/55",
};

const ADMIN_EMAIL = "info@bikalima.com";

type TabId = "overview" | "audience" | "outcomes" | "modules" | "workbook" | "booking" | "faq";
// Five tabs, not seven. "Who it's for" reads as part of the overview, and
// the workbook is one of the materials a module ships with rather than a
// destination of its own. Both old ids still resolve so shared links and
// bookmarks land on the tab that absorbed them.
const TAB_ORDER: TabId[] = ["overview", "outcomes", "modules", "booking", "faq"];
const MERGED_TABS: Record<string, TabId> = { audience: "overview", workbook: "modules" };

function isInternalHash(h: string): h is TabId {
  return (TAB_ORDER as string[]).includes(h) || h in MERGED_TABS;
}

function resolveTab(h: string): TabId {
  return MERGED_TABS[h] ?? (h as TabId);
}

export default function ProgramPage() {
  const [, params] = useRoute("/programs/:slug");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();
  const { lang } = useLang();
  const { format: formatPrice } = useCurrency();
  const isRtl = lang === "ar";
  const t = Translations[lang === "ar" ? "ar" : "en"].programPage;

  const programId = SLUG_TO_PROGRAM_ID[slug];
  const program = programs.find((p) => p.id === programId);
  const courseData = programId ? getCoursePageData(programId) : undefined;
  const workbookFacts = programId ? WORKBOOK_FACTS[programId] : undefined;

  // The workbook's sample PDF is the one thing a visitor can hold before
  // paying, so it is worth a request of its own. Failure is silent: no sample
  // simply means no button, never a broken page.
  const [samplePdfUrl, setSamplePdfUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!programId) return;
    let cancelled = false;
    apiFetch("/workbooks-cms")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.workbooks) return;
        const match = (data.workbooks as Array<{ linkedProgramId: string | null; samplePdfUrl: string | null }>)
          .find((w) => w.linkedProgramId === programId && w.samplePdfUrl);
        setSamplePdfUrl(match?.samplePdfUrl ?? null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [programId]);
  const dbLessons: DbLesson[] = useMemo(() => [], []);
  const [shareCopied, setShareCopied] = useState(false);

  const { data: settingsResp } = useSiteSettings();
  const liveChatEnabled = useFeatureFlag("live_chat");
  const whatsappRaw = settingsResp?.settings?.whatsappNumber ?? null;
  const whatsappDigits = whatsappRaw ? whatsappRaw.replace(/[^\d]/g, "") : "";

  const initialTab: TabId = (() => {
    if (typeof window === "undefined") return "overview";
    const h = window.location.hash.replace(/^#/, "");
    return isInternalHash(h) ? resolveTab(h) : "overview";
  })();
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareTitle = program ? getLocalizedProgram(program, lang).shortTitle + t.shareTitleSuffix : t.shareSiteName;
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

  // Sync hash when tab changes (without scroll jump).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const newHash = `#${activeTab}`;
    if (window.location.hash !== newHash) {
      const url = `${window.location.pathname}${window.location.search}${newHash}`;
      window.history.replaceState(null, "", url);
    }
  }, [activeTab]);

  // Per-page SEO (called unconditionally).
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

  // Course + Offer put the price and duration in a Google result; FAQPage is
  // emitted only when the questions are genuinely rendered on this page, which
  // is Google's own condition for the rich result.
  useStructuredData(
    program && pageLoc
      ? graph(
          courseGraph({
            name: pageLoc.shortTitle ?? pageLoc.title,
            description: pageLoc.hook ?? pageLoc.description,
            path: `/programs/${slug}`,
            hours: program.hours,
            sessions: program.sessions,
            priceJod: typeof price === "number" ? price : null,
            inLanguage: lang,
            image: program.image,
          }),
          courseData?.faqItems?.length ? faqPage(courseData.faqItems) : null,
          breadcrumbList([
            { name: lang === "ar" ? "الرئيسية" : "Home", path: "/" },
            { name: lang === "ar" ? "البرامج" : "Programs", path: "/programs" },
            { name: pageLoc.shortTitle ?? pageLoc.title },
          ]),
        )
      : null,
  );
  const heroGradient = HERO_GRADIENT[programId] || "from-primary to-primary/80";
  const isSchoolsOnly = programId === "children";
  const courseSlug = PROGRAM_SLUGS[programId];

  const Arrow = isRtl ? ArrowRight : ArrowLeft;

  // Primary CTA: sellable programs go straight to /checkout. Schools-only
  // programs ("children") open the contact channel for a B2B inquiry.
  const reserveCheckoutHref = `/checkout?slug=${encodeURIComponent(courseSlug)}`;
  const schoolMailto =
    `mailto:${ADMIN_EMAIL}` +
    `?subject=${encodeURIComponent(t.schoolMailSubject + " — " + loc.shortTitle)}` +
    `&body=${t.schoolMailBody}${encodeURIComponent(loc.shortTitle)}${t.schoolMailBody2}`;

  const openWhatsapp = (msg: string) => {
    if (!whatsappDigits) return false;
    const url = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  };

  // Try to open the in-page chat widget. Returns true only if we can confirm
  // the widget is actually mounted in the DOM — otherwise the caller should
  // fall back to WhatsApp / mailto.
  const tryOpenChat = (): boolean => {
    if (!liveChatEnabled) return false;
    if (typeof document === "undefined") return false;
    const mounted = document.querySelector('[data-testid="live-chat-widget"]');
    if (!mounted) return false;
    window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT));
    return true;
  };

  // "Question before booking" — try in-page chat first, then WhatsApp,
  // and finally mailto as a last-resort silent fallback.
  const handleQuestion = (source: string) => {
    trackQuestionBeforeBookingClick(programId, source);
    if (tryOpenChat()) return;
    if (openWhatsapp(t.waBookingMsg(loc.shortTitle))) return;
    window.location.href =
      `mailto:${ADMIN_EMAIL}` +
      `?subject=${encodeURIComponent(t.questionMailSubject + loc.shortTitle)}`;
  };

  // Schools-only primary CTA — chat → WhatsApp → mailto.
  const handleSchoolRequest = (source: string) => {
    trackReserveSeatClick(programId, `school_${source}`);
    if (tryOpenChat()) return;
    if (openWhatsapp(t.waSchoolMsg(loc.shortTitle))) return;
    window.location.href = schoolMailto;
  };

  const handleReserve = (source: string) => {
    if (isSchoolsOnly) {
      handleSchoolRequest(source);
      return;
    }
    trackReserveSeatClick(programId, source);
    navigate(reserveCheckoutHref);
  };

  const onTabChange = (next: string) => {
    if (!isInternalHash(next)) return;
    const tab = resolveTab(next);
    setActiveTab(tab);
    trackTabChange(programId, tab);
  };

  // Reusable button blocks
  const PrimaryButton = ({ source, size = "lg", className = "", testId }: {
    source: string; size?: "lg" | "default"; className?: string; testId: string;
  }) => (
    <Button
      type="button"
      size={size}
      className={`bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-8 shadow-lg ${className}`}
      onClick={() => handleReserve(source)}
      data-testid={testId}
    >
      {isSchoolsOnly ? <Building2 className="w-4 h-4 me-2" /> : <Ticket className="w-4 h-4 me-2" />}
      {isSchoolsOnly ? t.schoolPrimaryCta : t.primaryCta}
    </Button>
  );

  const SecondaryButton = ({ source, className = "", testId, variant = "outline" }: {
    source: string; className?: string; testId: string; variant?: "outline" | "ghost";
  }) => (
    <Button
      type="button"
      size="lg"
      variant={variant}
      className={`font-bold rounded-full px-6 ${className}`}
      onClick={() => handleQuestion(source)}
      data-testid={testId}
    >
      <MessageSquare className="w-4 h-4 me-2" />
      {t.secondaryCta}
    </Button>
  );

  return (
    <AppShell
      containerClassName=""
      breadcrumb={[
        { label: t.breadcrumbPrograms, href: "/#structure" },
        { label: loc.shortTitle },
      ]}
    >
      {/* ── HERO ── */}
      {/* The photograph carries the hero; the brand colour tints it. It used to
          be the other way round — a solid gradient with the image at 15%,
          which read as a flat slab of colour with a ghost behind it. */}
      <section className="relative bg-foreground text-white overflow-hidden">
        <img
          src={program.image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div className={`absolute inset-0 bg-gradient-to-br ${heroGradient} opacity-[0.72]`} aria-hidden />
        {/* Keeps white text legible over whatever the photo happens to be. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" aria-hidden />
        <div className="relative container mx-auto px-6 py-12 md:py-20">
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

            <p className="text-base md:text-xl text-white/85 leading-relaxed mb-6">
              {courseData?.tagline ?? loc.hook}
            </p>

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
                type="button"
                size="lg"
                className="bg-white text-gray-900 hover:bg-white/90 font-bold rounded-full px-8 shadow-lg"
                onClick={() => handleReserve("hero")}
                data-testid="button-reserve-hero"
              >
                {isSchoolsOnly ? <Building2 className="w-4 h-4 me-2" /> : <Ticket className="w-4 h-4 me-2" />}
                {isSchoolsOnly ? t.schoolPrimaryCta : t.primaryCta}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="bg-transparent border-white/40 text-white hover:bg-white/10 font-bold rounded-full px-6"
                onClick={() => handleQuestion("hero")}
                data-testid="button-question-hero"
              >
                <MessageSquare className="w-4 h-4 me-2" />
                {t.secondaryCta}
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

      {/* ── PROGRAM META BAND ── */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetaCell icon={<Clock className="w-5 h-5" />} label={t.metaDuration} value={`${program.hours} ${t.metaHoursUnit}`} />
            <MetaCell icon={<Calendar className="w-5 h-5" />} label={t.metaSessions} value={`${program.sessions} ${t.metaSessionsUnit}`} />
            <MetaCell
              icon={<Target className="w-5 h-5" />}
              label={t.metaPrice}
              value={isSchoolsOnly ? t.metaSchoolsOnly : (typeof price === "number" ? formatPrice(price) : "—")}
            />
            <MetaCell
              icon={<Users className="w-5 h-5" />}
              label={loc.role}
              value={isSchoolsOnly ? (courseData?.format ?? loc.delivery) : Translations[lang].structure.deliveryOptions}
            />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
          {/* ── MAIN COLUMN ── */}
          <div className="min-w-0">
            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
              <div className="sticky top-16 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 bg-background/95 backdrop-blur-md border-b border-border mb-6">
                <TabsList
                  className="h-auto bg-transparent p-0 flex w-full gap-1 overflow-x-auto justify-start rounded-none scrollbar-thin"
                  aria-label={loc.shortTitle}
                >
                  {TAB_ORDER.map((id) => (
                    <TabsTrigger
                      key={id}
                      value={id}
                      data-testid={`program-tab-${id}`}
                      className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground border border-transparent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary hover:text-foreground transition-colors"
                    >
                      {t.tabs[id]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* OVERVIEW */}
              <TabsContent value="overview" className="space-y-6 mt-0 focus-visible:outline-none">
                <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                  <span className="w-1 h-8 bg-primary rounded-full inline-block" />
                  {t.sectionProblem}
                </h2>
                <p className="text-base md:text-lg text-foreground/85 leading-loose">
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
                <div className="pt-2 border-t border-border/60">
                {courseData?.audienceItems ? (
                  <AudienceSection items={courseData.audienceItems} lang={lang} />
                ) : (
                  <section className="py-2">
                    <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
                      <span className="w-1 h-8 bg-primary rounded-full inline-block" />
                      {t.sectionAudience}
                    </h2>
                    <p className="text-base text-foreground/85 leading-relaxed">{loc.audience}</p>
                  </section>
                )}
                </div>
              </TabsContent>

              {/* AUDIENCE */}
              {/* OUTCOMES */}
              <TabsContent value="outcomes" className="mt-0 focus-visible:outline-none">
                {courseData?.outcomes ? (
                  <OutcomesSection outcomes={courseData.outcomes} lang={lang} />
                ) : (
                  <section className="py-2">
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

                {/* What the fee actually buys. "Recorded course" undersells a
                    programme that also grades work and ends on a stage, and a
                    visitor deciding whether to pay has no other place to learn
                    that before checkout. */}
                <section className="pt-8 mt-8 border-t border-border/60">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
                    <span className="w-1 h-8 bg-primary rounded-full inline-block" />
                    {t.includes.heading}
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6 max-w-2xl">
                    {t.includes.sub}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3" data-testid="program-includes">
                    {t.includes.items.map((item, i) => {
                      const Icon = [BookOpen, Library, FileText, ClipboardList, Target, Trophy][i] ?? CheckCircle2;
                      return (
                        <div
                          key={item.title}
                          className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
                        >
                          <span className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Icon className="w-5 h-5" aria-hidden />
                          </span>
                          <div>
                            <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                            <p className="text-[13px] text-muted-foreground leading-relaxed">{item.body}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </TabsContent>

              {/* MODULES */}
              <TabsContent value="modules" className="mt-0 focus-visible:outline-none">
                {courseData?.modules ? (
                  <SessionsAccordion modules={courseData.modules} dbLessons={dbLessons} lang={lang} />
                ) : (
                  <section className="py-2">
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
                <div className="pt-8 mt-8 border-t border-border/60 space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
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
                    {samplePdfUrl && (
                      <a
                        href={samplePdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-background/70 px-4 py-2 text-sm font-bold text-amber-800 transition-colors hover:bg-amber-500/10 dark:text-amber-200"
                        data-testid="program-workbook-sample"
                      >
                        <Download className="w-4 h-4" aria-hidden />
                        {lang === "ar" ? "حمّل عيّنة من الكرّاسة (PDF)" : "Download a sample (PDF)"}
                      </a>
                    )}
                  </div>
                </div>

                {workbookFacts && (
                  <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
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
                </div>
              </TabsContent>

              {/* WORKBOOK */}
              {/* PRICE & BOOKING */}
              <TabsContent value="booking" className="mt-0 focus-visible:outline-none space-y-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3 mb-2">
                    <span className="w-1 h-8 bg-primary rounded-full inline-block" />
                    {t.bookingHeading}
                  </h2>
                  <p className="text-muted-foreground text-sm">{t.bookingSub}</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                  {!isSchoolsOnly && (
                    <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                      <p className="font-bold text-foreground mb-1">{t.deliveryHeading}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{t.deliveryBody}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{t.metaPrice}</p>
                      {isSchoolsOnly ? (
                        <p className="text-xl font-black text-primary">{t.metaSchoolsOnly}</p>
                      ) : typeof price === "number" ? (
                        <p className="text-2xl font-black text-primary">{formatPrice(price)}</p>
                      ) : <p className="text-xl">—</p>}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{t.metaDuration}</p>
                      <p className="text-lg font-bold">{program.hours} {t.metaHoursUnit}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{t.metaSessions}</p>
                      <p className="text-lg font-bold">{program.sessions} {t.metaSessionsUnit}</p>
                    </div>
                  </div>

                  {isSchoolsOnly && (
                    <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 text-sky-900 dark:text-sky-200 rounded-xl p-4 text-sm leading-relaxed">
                      {t.schoolNote}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <PrimaryButton source="booking_tab" testId="button-reserve-booking-tab" />
                    <SecondaryButton source="booking_tab" testId="button-question-booking-tab" />
                  </div>

                  {!isSchoolsOnly && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{t.reassure}</p>
                  )}
                </div>

                {/* Someone else's word and an answer to "what if it doesn't
                    work for me" — the page carried neither, next to a price
                    it repeats four times. */}
                {!isSchoolsOnly && <ProgramProof />}
              </TabsContent>

              {/* FAQ */}
              <TabsContent value="faq" className="mt-0 focus-visible:outline-none">
                {courseData?.faqItems ? (
                  <FAQSection faqItems={courseData.faqItems} lang={lang} />
                ) : (
                  <section className="py-2">
                    <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
                      <span className="w-1 h-8 bg-primary rounded-full inline-block" />
                      {t.sectionFaq}
                    </h2>
                    <p className="text-muted-foreground">—</p>
                  </section>
                )}
              </TabsContent>
            </Tabs>

            {/* ── FINAL CTA (always visible below the tabs) ── */}
            <section className="py-10 mt-6">
              <div className={`bg-gradient-to-br ${heroGradient} text-white rounded-3xl p-8 md:p-10 text-center shadow-xl`}>
                <h2 className="font-serif text-2xl md:text-3xl font-bold mb-3">
                  {t.finalCtaHeading}
                </h2>
                <p className="text-white/85 text-sm md:text-base mb-6 max-w-xl mx-auto">
                  {t.finalCtaSub} <span className="font-bold">{loc.shortTitle}</span>
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button
                    type="button"
                    size="lg"
                    className="bg-white text-gray-900 hover:bg-white/90 font-bold rounded-full px-8 shadow-lg"
                    onClick={() => handleReserve("final_cta")}
                    data-testid="button-reserve-final"
                  >
                    {isSchoolsOnly ? <Building2 className="w-4 h-4 me-2" /> : <Ticket className="w-4 h-4 me-2" />}
                    {isSchoolsOnly ? t.schoolPrimaryCta : t.primaryCta}
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-white/40 text-white hover:bg-white/10 font-bold rounded-full px-6"
                    onClick={() => handleQuestion("final_cta")}
                    data-testid="button-question-final"
                  >
                    <MessageSquare className="w-4 h-4 me-2" />
                    {t.secondaryCta}
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
                  <PrimaryButton source="sidebar" className="w-full !px-4 py-6" testId="button-reserve-sidebar" />
                  {!isSchoolsOnly && (
                    <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                      {t.reassure}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleQuestion("sidebar")}
                    className="w-full text-sm font-medium text-primary hover:underline text-center inline-flex items-center justify-center gap-1.5"
                    data-testid="button-question-sidebar"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {t.secondaryCta}
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── MOBILE STICKY BOTTOM BAR (program-specific) ── */}
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-[55] bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_-6px_rgba(0,0,0,0.12)] print:hidden"
        data-testid="program-mobile-sticky"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
      >
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none mb-1">
              {isSchoolsOnly ? t.metaSchoolsOnly : t.metaPrice}
            </p>
            {!isSchoolsOnly && typeof price === "number" && (
              <p className="text-base font-black text-primary leading-none truncate">
                {formatPrice(price)}
              </p>
            )}
            {isSchoolsOnly && (
              <p className="text-xs font-bold text-foreground leading-none truncate">
                {loc.shortTitle}
              </p>
            )}
          </div>
          <Button
            type="button"
            onClick={() => handleReserve("mobile_sticky")}
            className="rounded-full font-bold px-5 py-3 shrink-0"
            data-testid="button-reserve-mobile-sticky"
          >
            {isSchoolsOnly ? <Building2 className="w-4 h-4 me-2" /> : <Ticket className="w-4 h-4 me-2" />}
            {isSchoolsOnly ? t.schoolPrimaryCta : t.primaryCta}
          </Button>
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
