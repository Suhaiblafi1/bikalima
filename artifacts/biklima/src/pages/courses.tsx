import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Star, Clock, BookOpen, Users, ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { programs, getLocalizedProgram, RECORDED_PRICES } from "@/programsData";
import type { Lang } from "@/translations";

const SLUGS: Record<string, string> = {
  core: "influential-speaker",
  tot: "certified-trainer",
  teachers: "educators-program",
  children: "young-speaker",
};

const ACCENT: Record<string, { bg: string; text: string; badge: string }> = {
  core: { bg: "from-primary/10 to-primary/5", text: "text-primary", badge: "bg-primary/10 text-primary border-primary/20" },
  tot: { bg: "from-amber-50 to-amber-50/50", text: "text-amber-700", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  teachers: { bg: "from-teal-50 to-teal-50/50", text: "text-teal-700", badge: "bg-teal-50 text-teal-700 border-teal-200" },
  children: { bg: "from-sky-50 to-sky-50/50", text: "text-sky-700", badge: "bg-sky-50 text-sky-700 border-sky-200" },
};

const T = {
  ar: {
    nav: { home: "الرئيسية", courses: "الدورات" },
    hero: {
      badge: "منصة التعلم",
      h1: "الدورات التدريبية",
      sub: "أربعة برامج متكاملة في فن الخطابة والإلقاء والتأثير — تُقدَّم وجاهياً وعن بعد.",
    },
    card: {
      hours: "ساعة",
      sessions: "جلسة",
      enroll: "سجّل الآن",
      details: "عرض التفاصيل",
      rating: "٤.٩",
      students: "طالب",
    },
    cta: {
      h2: "لا تعرف من أين تبدأ؟",
      sub: "احجز جلسة استشارية مجانية مع صهيب الخوالدة — ٢٠ دقيقة تحدّد فيها المسار الأنسب لك.",
      btn: "احجز جلسة مجانية",
    },
    prereq: "متطلب سابق",
    priceUnit: "د.أ",
    free: "للمدارس فقط",
  },
  en: {
    nav: { home: "Home", courses: "Courses" },
    hero: {
      badge: "Learning Platform",
      h1: "Training Programs",
      sub: "Four comprehensive programs in public speaking, delivery, and influence — delivered in-person and online.",
    },
    card: {
      hours: "hrs",
      sessions: "sessions",
      enroll: "Enroll Now",
      details: "View Details",
      rating: "4.9",
      students: "students",
    },
    cta: {
      h2: "Not sure where to start?",
      sub: "Book a free 20-minute consultation with Suhaib Al-Khawaldeh — and find the right path for you.",
      btn: "Book a Free Session",
    },
    prereq: "Prerequisite",
    priceUnit: "JOD",
    free: "Schools only",
  },
};

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "") + "/api";
}

export default function CoursesPage() {
  const [lang, setLang] = useState<Lang>(() => {
    try { return (localStorage.getItem("bk_lang") as Lang) || "ar"; } catch { return "ar"; }
  });
  const [, navigate] = useLocation();
  const isRtl = lang === "ar";
  const t = T[lang];
  const ArrowEnd = isRtl ? ArrowLeft : ArrowRight;

  const switchLang = (l: Lang) => {
    setLang(l);
    try { localStorage.setItem("bk_lang", l); } catch {}
  };

  useEffect(() => {
    document.title = lang === "ar" ? "الدورات التدريبية — بكلمة" : "Training Courses — Bikalima";
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang, isRtl]);

  const localizedPrograms = programs.map((p) => ({
    ...getLocalizedProgram(p, lang),
    id: p.id,
    image: p.image,
    hours: p.hours,
    sessions: p.sessions,
    accentColor: p.accentColor,
    borderColor: p.borderColor,
    tagColor: p.tagColor,
    slug: SLUGS[p.id],
    price: RECORDED_PRICES[p.id as keyof typeof RECORDED_PRICES],
    accent: ACCENT[p.id],
    samplePdf: p.samplePdf,
  }));

  const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      dir={isRtl ? "rtl" : "ltr"}
      lang={lang}
    >
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`${baseUrl}/`)}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {t.nav.home}
            </button>
            <span className="text-border">·</span>
            <span className="text-foreground font-medium text-sm">{t.nav.courses}</span>
          </div>
          <div className="logo-biklima text-4xl text-primary leading-none">بكلمة</div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border border-border rounded-full overflow-hidden">
              {(["ar", "en"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => switchLang(l)}
                  className={`px-3 py-1.5 text-xs font-bold transition-colors ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {l === "ar" ? "ع" : "EN"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-background border-b border-border">
        <div className="container mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-5">
            <BookOpen className="w-4 h-4" />
            {t.hero.badge}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{t.hero.h1}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">{t.hero.sub}</p>
        </div>
      </section>

      {/* ── Course Cards ── */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
            {localizedPrograms.map((prog, i) => (
              <motion.div
                key={prog.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`group rounded-2xl overflow-hidden border bg-card hover:shadow-xl transition-all duration-300 cursor-pointer ${prog.borderColor}`}
                onClick={() => navigate(`${baseUrl}/courses/${prog.slug}`)}
              >
                {/* Cover image */}
                <div className="relative h-52 overflow-hidden bg-muted">
                  <img
                    src={prog.image}
                    alt={prog.shortTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className={`absolute top-4 ${isRtl ? "right-4" : "left-4"}`}>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${prog.accent.badge}`}>
                      {prog.role}
                    </span>
                  </div>
                  <div className={`absolute bottom-4 ${isRtl ? "right-4" : "left-4"}`}>
                    <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{t.card.rating}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {prog.badge && (
                    <div className={`inline-block px-2 py-0.5 rounded text-xs font-bold mb-2 ${prog.tagColor}`}>
                      {prog.badge}
                    </div>
                  )}
                  <h2 className="text-xl font-bold text-foreground mb-1 leading-tight">{prog.shortTitle}</h2>
                  {prog.subtitle && (
                    <p className="text-sm text-muted-foreground mb-3">{prog.subtitle}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {prog.hours} {t.card.hours}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {prog.sessions} {t.card.sessions}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      +١٠٠ {t.card.students}
                    </span>
                  </div>

                  {/* Prerequisite */}
                  {prog.prerequisite && (
                    <div className="text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2 mb-4">
                      <span className="font-semibold">{t.prereq}: </span>
                      {prog.prerequisiteLabel}
                    </div>
                  )}

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      {prog.id === "children" ? (
                        <span className="text-sm text-muted-foreground font-medium">{t.free}</span>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className={`text-2xl font-black ${prog.accent.text}`}>{prog.price}</span>
                          <span className="text-sm text-muted-foreground font-medium">{t.priceUnit}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${baseUrl}/courses/${prog.slug}`);
                        }}
                      >
                        {t.card.details}
                      </Button>
                      {prog.id !== "children" && (
                        <Button
                          size="sm"
                          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`${baseUrl}/#enroll`);
                          }}
                        >
                          {t.card.enroll}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA: Consultation ── */}
      <section className="py-16 bg-primary/5 border-t border-border">
        <div className="container mx-auto px-6 text-center max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{t.cta.h2}</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">{t.cta.sub}</p>
          <Button
            size="lg"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8"
            onClick={() => window.open("https://scheduler.zoom.us/suhaib-ahmad-x9pyfc", "_blank")}
          >
            {t.cta.btn}
            <ArrowEnd className="w-4 h-4 ms-2" />
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 border-t border-border bg-background">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} بكلمة — Bikalima</span>
          <span className="mx-2">·</span>
          <a href="mailto:info@bikalima.com" className="hover:text-primary transition-colors">info@bikalima.com</a>
        </div>
      </footer>
    </div>
  );
}
