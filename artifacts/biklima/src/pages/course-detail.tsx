import React, { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, BookOpen, Layers, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { programs, getLocalizedProgram, RECORDED_PRICES, WORKBOOK_FACTS } from "@/programsData";
import { AppShell } from "@/components/app-shell";
import { useLang } from "@/hooks/useLang";
import {
  CourseHero,
  StickyPurchaseCard,
  AudienceSection,
  OutcomesSection,
  HowItWorks,
  SessionsAccordion,
  PracticeSection,
  AccessSection,
  TrainerSection,
  FAQSection,
  FinalCTA,
  getCoursePageData,
  type DbLesson,
} from "./course-components";
import { COURSE_SLUG_TO_PROGRAM_ID } from "@/lib/site-config";

interface WorkbookStructureSectionProps {
  programId: string;
  workbookTitle: string;
  workbookDescription: string;
  lang: "ar" | "en" | "fr";
}

function WorkbookStructureSection({ programId, workbookTitle, workbookDescription, lang }: WorkbookStructureSectionProps) {
  const facts = WORKBOOK_FACTS[programId];
  if (!facts) return null;
  const isAr = lang === "ar";
  const sectionsLabel = isAr ? "قسم تدريبي" : "training sections";
  const unitsLabel = isAr ? "وحدة رئيسية" : "core units";
  const intro = isAr
    ? "مبني على كراسة تدريبية مُحكمة، بهيكل واضح وتمارين مُتدرّجة:"
    : "Built on a rigorously structured training workbook with progressive exercises:";
  const heading = isAr ? "الكراسة المرافقة" : "The Companion Workbook";
  const structureHeading = isAr ? "بنية الكراسة" : "Workbook Structure";
  const langKey = isAr ? "ar" : "en";

  return (
    <section className="py-10 border-t border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">{heading}</h2>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl p-6 flex items-start gap-4 mb-6">
        <div className="shrink-0 w-12 h-12 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-serif text-lg md:text-xl font-bold mb-2">{workbookTitle}</h3>
          <p className="text-sm md:text-base text-foreground/80 leading-relaxed">{workbookDescription}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <Layers className="w-5 h-5 text-primary" />
          <h3 className="font-serif text-lg md:text-xl font-bold">{structureHeading}</h3>
        </div>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">{intro}</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 text-center">
            <div className="text-3xl md:text-4xl font-black text-primary leading-none mb-1">{facts.sections}</div>
            <div className="text-[11px] md:text-xs uppercase tracking-wider text-muted-foreground font-semibold">{sectionsLabel}</div>
          </div>
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 text-center">
            <div className="text-3xl md:text-4xl font-black text-primary leading-none mb-1">{facts.units.length}</div>
            <div className="text-[11px] md:text-xs uppercase tracking-wider text-muted-foreground font-semibold">{unitsLabel}</div>
          </div>
        </div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5" />
          {facts.unitsLabel[langKey]}
        </div>
        <ol className="space-y-2">
          {facts.units.map((u, i) => (
            <li key={i} className="flex items-start gap-3 bg-background/60 border border-border rounded-xl p-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-sm md:text-base font-semibold leading-relaxed pt-0.5">
                {u[langKey]}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const HERO_COLORS: Record<string, string> = {
  core: "from-primary to-primary/80",
  tot: "from-amber-800 to-amber-700",
  teachers: "from-teal-800 to-teal-700",
  children: "from-sky-800 to-sky-700",
};

function getApiBase() {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

export default function CourseDetailPage() {
  const [, params] = useRoute("/courses/:slug");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();
  const { lang } = useLang();

  const [hasAccess, setHasAccess] = useState(false);
  const [dbLessons, setDbLessons] = useState<DbLesson[]>([]);

  const isRtl = lang === "ar";
  const apiBase = getApiBase();

  const programId = COURSE_SLUG_TO_PROGRAM_ID[slug];
  const program = programs.find((p) => p.id === programId);

  useEffect(() => {
    if (!slug) return;
    setHasAccess(false);
    setDbLessons([]);
    fetch(`${apiBase}/courses/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.course?.id) {
          if (Array.isArray(data.course.lessons)) {
            setDbLessons(data.course.lessons.map((l: { id: string; titleAr?: string; titleEn?: string; isFreePreview?: boolean; sortOrder?: number }) => ({
              id: l.id,
              titleAr: l.titleAr ?? "",
              titleEn: l.titleEn ?? "",
              isFreePreview: l.isFreePreview ?? false,
              sortOrder: l.sortOrder ?? 0,
            })));
          }
        }
      })
      .catch(() => {});
    fetch(`${apiBase}/courses/${slug}/access`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setHasAccess(data?.hasAccess === true); })
      .catch(() => {});
  }, [slug, apiBase]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [slug]);

  useEffect(() => {
    if (program) {
      const loc = getLocalizedProgram(program, lang);
      document.title = `${loc.shortTitle} — بكلمة`;
    }
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang, isRtl, program]);

  const ArrowStart = isRtl ? ArrowRight : ArrowLeft;

  if (!program) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" dir="rtl">
        <p className="text-muted-foreground text-lg">الدورة غير موجودة</p>
        <Button onClick={() => navigate(`/courses`)}>العودة للدورات</Button>
      </div>
    );
  }

  const loc = getLocalizedProgram(program, lang);
  const price = RECORDED_PRICES[programId as keyof typeof RECORDED_PRICES];
  const heroColor = HERO_COLORS[programId] || "from-primary to-primary/80";
  const courseData = getCoursePageData(programId);
  const priceJod: number | "free" = price ?? "free";

  return (
    <AppShell
      containerClassName=""
      breadcrumb={[
        { label: lang === "ar" ? "البرامج" : "Programs", href: `/#structure` },
        { label: loc.shortTitle },
      ]}
    >
      {/* ── Hero ── */}
      <CourseHero
        title={loc.shortTitle}
        tagline={courseData?.tagline ?? loc.hook}
        role={loc.role}
        sessions={program.sessions}
        hours={program.hours}
        priceJod={priceJod}
        format={courseData?.format ?? ""}
        slug={slug}
        heroGradient={heroColor}
        coverImage={program.image}
        lang={lang}
      />

      {/* ── Main content layout ── */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-10 items-start">

          {/* ── Main content column ── */}
          <div className="flex-1 min-w-0">

            {/* Mobile "Continue Learning" shortcut for users who already own the course.
                The standard "Register & Pay Now" CTA lives inside the hero so it's
                always above the fold; only the post-purchase access shortcut is rendered
                here on mobile. */}
            {hasAccess && (
              <div className="lg:hidden mb-6">
                <Button
                  className="w-full rounded-xl font-bold py-6 text-base bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => navigate(`/courses/${slug}/learn`)}
                >
                  {lang === "ar" ? "ادخل إلى الدورة" : "Continue Learning"}
                </Button>
              </div>
            )}

            {courseData ? (
              <>
                <AudienceSection items={courseData.audienceItems} lang={lang} />
                <OutcomesSection outcomes={courseData.outcomes} lang={lang} />
                <HowItWorks lang={lang} />
                <SessionsAccordion modules={courseData.modules} dbLessons={dbLessons} lang={lang} />
                <PracticeSection practicePoints={courseData.practicePoints} lang={lang} />
                <AccessSection accessSteps={courseData.accessSteps} lang={lang} />
                <WorkbookStructureSection
                  programId={programId}
                  workbookTitle={loc.workbook.title}
                  workbookDescription={loc.workbook.description}
                  lang={lang}
                />
                <TrainerSection lang={lang} />
                <FAQSection faqItems={courseData.faqItems} lang={lang} />
                <FinalCTA
                  title={loc.shortTitle}
                  priceJod={priceJod}
                  slug={slug}
                  lang={lang}
                />
              </>
            ) : (
              <>
                <section className="py-10">
                  <h2 className="text-xl font-bold mb-5">{lang === "ar" ? "ماذا ستتعلم؟" : "What Will You Learn?"}</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {loc.outcomes.map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-primary mt-1">✓</span>
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </section>
                <TrainerSection lang={lang} />
              </>
            )}
          </div>

          {/* ── Desktop sticky sidebar ── */}
          <div className="hidden lg:block w-80 shrink-0">
            {hasAccess ? (
              <div className="sticky top-24 bg-card border border-border rounded-2xl shadow-xl p-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <span className="text-green-600 text-2xl">✓</span>
                </div>
                <p className="text-center font-bold text-foreground">
                  {lang === "ar" ? "لديك وصول كامل لهذه الدورة" : "You have full access to this course"}
                </p>
                <Button
                  className="w-full rounded-xl font-bold py-5 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => navigate(`/courses/${slug}/learn`)}
                >
                  {lang === "ar" ? "ادخل إلى الدورة" : "Continue Learning"}
                </Button>
              </div>
            ) : courseData ? (
              <StickyPurchaseCard
                priceJod={priceJod}
                sessions={program.sessions}
                startDate={courseData.startDate}
                format={courseData.format}
                slug={slug}
                lang={lang}
              />
            ) : (
              <div className="sticky top-24 bg-card border border-border rounded-2xl shadow-xl p-6 space-y-4">
                {typeof priceJod === "number" && (
                  <>
                    <p className="text-3xl font-black text-primary">{priceJod} <span className="text-base font-semibold text-muted-foreground">{lang === "ar" ? "د.أ" : "JOD"}</span></p>
                    <Button
                      className="w-full rounded-xl font-bold py-5"
                      onClick={() => navigate(`/checkout?slug=${slug}`)}
                    >
                      {lang === "ar" ? "احجز مقعدك" : "Reserve Your Spot"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </AppShell>
  );
}
