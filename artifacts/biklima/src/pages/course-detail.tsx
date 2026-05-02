import React, { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { programs, getLocalizedProgram, RECORDED_PRICES } from "@/programsData";
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

const SLUG_TO_ID: Record<string, string> = {
  "influential-speaker": "core",
  "certified-trainer": "tot",
  "educators-program": "teachers",
  "young-speaker": "children",
};

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

  const programId = SLUG_TO_ID[slug];
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
                      {lang === "ar" ? "سجّل وادفع الآن" : "Register & Pay Now"}
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
