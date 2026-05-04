import { useEffect, useMemo, useState } from "react";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft, ArrowRight, Clock, Calendar, Users, Target,
  CheckCircle2, BookOpen, Sparkles, MessageSquare,
  Share2, Check, Layers, FileText, Ticket, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { programs, getLocalizedProgram, RECORDED_PRICES, WORKBOOK_FACTS } from "@/programsData";
import { AppShell } from "@/components/app-shell";
import { useLang } from "@/hooks/useLang";
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

const HERO_GRADIENT: Record<string, string> = {
  core: "from-primary via-primary/90 to-primary/70",
  tot: "from-amber-800 via-amber-700 to-amber-600",
  teachers: "from-teal-800 via-teal-700 to-teal-600",
  children: "from-sky-800 via-sky-700 to-sky-600",
};

const ADMIN_EMAIL = "info@bikalima.com";

const T = {
  ar: {
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
    primaryCta: "احجز مقعدك الآن",
    secondaryCta: "لدي سؤال قبل الحجز",
    schoolPrimaryCta: "اطلب عرضًا للمدرسة",
    schoolNote: "هذا البرنامج يُقدَّم للمدارس والمؤسسات حصراً عبر مدرّبين معتمدين، وليس للشراء الفردي المباشر.",
    finalCtaHeading: "خطوتك القادمة",
    finalCtaSub: "خطوة واحدة تفصلك عن أن تبدأ رحلتك مع",
    notFound: "لم نعثر على هذا البرنامج",
    backHome: "العودة للرئيسية",
    reassure: "سيتم إنشاء حسابك أو تسجيل دخولك أولًا، ثم إكمال طلب التسجيل والدفع بأمان.",
    schoolMailSubject: "طلب عرض مدرسة لبرنامج",
    schoolMailBody: "السلام عليكم،%0D%0A%0D%0Aأودّ ترتيب البرنامج التالي لمدرستنا/مؤسستنا: ",
    schoolMailBody2: "%0D%0A%0D%0Aاسم المدرسة: %0D%0Aالمسؤول للتواصل: %0D%0Aعدد الطلاب: %0D%0Aرقم التواصل: %0D%0Aملاحظات: %0D%0A",
    waBookingMsg: (title: string) => `السلام عليكم، لدي سؤال قبل الحجز في برنامج «${title}». أرجو التواصل معي.`,
    waSchoolMsg: (title: string) => `السلام عليكم، نودّ ترتيب برنامج «${title}» لمدرستنا. أرجو التواصل لمعرفة التفاصيل.`,
    tabs: {
      overview: "نظرة عامة",
      audience: "لمن هذا البرنامج؟",
      outcomes: "ماذا ستتعلم؟",
      modules: "المحاور والجلسات",
      workbook: "الكراسة والمواد",
      booking: "السعر والحجز",
      faq: "الأسئلة الشائعة",
    },
    bookingHeading: "السعر والحجز",
    bookingSub: "كل التفاصيل التي تحتاجها قبل أن تحجز مقعدك.",
  },
  en: {
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
    primaryCta: "Reserve Your Seat",
    secondaryCta: "I have a question",
    schoolPrimaryCta: "Request a school proposal",
    schoolNote: "This program is delivered exclusively to schools and institutions through certified trainers — not as an individual purchase.",
    finalCtaHeading: "Your Next Step",
    finalCtaSub: "One step away from starting your journey with",
    notFound: "Program not found",
    backHome: "Back to Home",
    reassure: "We'll create your account or sign you in first, then complete enrollment and payment securely.",
    schoolMailSubject: "School proposal request for program",
    schoolMailBody: "Hello,%0D%0A%0D%0AWe'd like to arrange the following program for our school/institution: ",
    schoolMailBody2: "%0D%0A%0D%0ASchool name: %0D%0AContact person: %0D%0AStudent count: %0D%0APhone: %0D%0ANotes: %0D%0A",
    waBookingMsg: (title: string) => `Hello, I have a question before booking the "${title}" program. Please get in touch.`,
    waSchoolMsg: (title: string) => `Hello, we'd like to arrange the "${title}" program for our school. Please get in touch with the details.`,
    tabs: {
      overview: "Overview",
      audience: "Who It's For",
      outcomes: "What You'll Learn",
      modules: "Modules & Sessions",
      workbook: "Workbook & Materials",
      booking: "Price & Booking",
      faq: "FAQ",
    },
    bookingHeading: "Price & Booking",
    bookingSub: "Everything you need before reserving your seat.",
  },
};

type TabId = "overview" | "audience" | "outcomes" | "modules" | "workbook" | "booking" | "faq";
const TAB_ORDER: TabId[] = ["overview", "audience", "outcomes", "modules", "workbook", "booking", "faq"];

function isInternalHash(h: string): h is TabId {
  return (TAB_ORDER as string[]).includes(h);
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

  const { data: settingsResp } = useSiteSettings();
  const liveChatEnabled = useFeatureFlag("live_chat");
  const whatsappRaw = settingsResp?.settings?.whatsappNumber ?? null;
  const whatsappDigits = whatsappRaw ? whatsappRaw.replace(/[^\d]/g, "") : "";

  const initialTab: TabId = (() => {
    if (typeof window === "undefined") return "overview";
    const h = window.location.hash.replace(/^#/, "");
    return isInternalHash(h) ? h : "overview";
  })();
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

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
      `?subject=${encodeURIComponent("Question before booking — " + loc.shortTitle)}`;
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
    setActiveTab(next);
    trackTabChange(programId, next);
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
      <section className={`relative bg-gradient-to-br ${heroGradient} text-white overflow-hidden`}>
        <div
          className="absolute inset-0 opacity-15 bg-cover bg-center"
          style={{ backgroundImage: `url(${program.image})` }}
          aria-hidden
        />
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
            <MetaCell icon={<Users className="w-5 h-5" />} label={loc.role} value={courseData?.format ?? loc.delivery} />
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
              </TabsContent>

              {/* AUDIENCE */}
              <TabsContent value="audience" className="mt-0 focus-visible:outline-none">
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
              </TabsContent>

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
              </TabsContent>

              {/* WORKBOOK */}
              <TabsContent value="workbook" className="mt-0 focus-visible:outline-none space-y-6">
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
              </TabsContent>

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
