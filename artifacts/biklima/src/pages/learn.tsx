import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Play, Lock, ChevronDown, ChevronLeft, ChevronRight,
  ArrowLeft, ArrowRight, Menu, X, BookOpen, BarChart3, Clock,
} from "lucide-react";

type Lang = "ar" | "en";

interface Lesson {
  id: string;
  courseId: string;
  titleAr: string;
  titleEn: string;
  videoUrl: string | null;
  videoType: "youtube" | "vimeo" | "other" | null;
  durationMinutes: number | null;
  sortOrder: number;
  isFreePreview: boolean;
  isPublished: boolean;
}

interface Course {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  programId: string | null;
}

const T = {
  ar: {
    back: "العودة للدورة",
    lessons: "الدروس",
    complete: "تحديد كمكتمل",
    completed: "مكتمل",
    completing: "جارٍ الحفظ...",
    prev: "الدرس السابق",
    next: "الدرس التالي",
    progress: "تقدمك",
    of: "من",
    noVideo: "لا يوجد فيديو لهذا الدرس بعد.",
    loading: "جارٍ تحميل الدورة...",
    notEnrolled: "يجب الاشتراك في هذه الدورة أولاً.",
    notFound: "الدورة غير موجودة.",
    section: "الوحدة",
    min: "د",
    sidebarTitle: "محتوى الدورة",
    unit: "وحدة",
    units: "وحدات",
    lessonLabel: "درس",
  },
  en: {
    back: "Back to Course",
    lessons: "Lessons",
    complete: "Mark as Complete",
    completed: "Completed",
    completing: "Saving...",
    prev: "Previous Lesson",
    next: "Next Lesson",
    progress: "Your Progress",
    of: "of",
    noVideo: "No video available for this lesson yet.",
    loading: "Loading course...",
    notEnrolled: "You must enroll in this course first.",
    notFound: "Course not found.",
    section: "Unit",
    min: "min",
    sidebarTitle: "Course Content",
    unit: "Unit",
    units: "Units",
    lessonLabel: "lesson",
  },
};

function extractVideoId(url: string, type: string): string | null {
  if (!url) return null;
  if (type === "youtube" || !type) {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }
  if (type === "vimeo") {
    const m = url.match(/vimeo\.com\/(\d+)/);
    return m ? m[1] : null;
  }
  return null;
}

function getEmbedUrl(lesson: Lesson): string | null {
  if (!lesson.videoUrl) return null;
  const type = lesson.videoType ?? "youtube";
  const id = extractVideoId(lesson.videoUrl, type);
  if (!id) return lesson.videoUrl;
  if (type === "youtube") return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
  if (type === "vimeo") return `https://player.vimeo.com/video/${id}?dnt=1`;
  return lesson.videoUrl;
}

const SECTION_SIZE = 4;

export default function LearnPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();

  const [lang, setLang] = useState<Lang>(() => {
    try { return (localStorage.getItem("bk_lang") as Lang) || "ar"; } catch { return "ar"; }
  });
  const t = T[lang];
  const isRtl = lang === "ar";

  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({ 0: true });

  const lastKey = (s: string) => `bk_learn_${s}`;

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    fetch(`${base}/api/courses/${slug}/learn`, { credentials: "include" })
      .then(async r => {
        if (r.status === 401) { navigate(`/dashboard`); return null; }
        if (r.status === 403) { navigate(`/courses/${slug}`); return null; }
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then(data => {
        if (!data) return;
        setCourse(data.course);
        setLessons(data.lessons ?? []);
        setProgressMap(data.progressMap ?? {});
        const saved = parseInt(localStorage.getItem(lastKey(slug)) ?? "0", 10);
        const idx = Math.max(0, Math.min(saved, (data.lessons?.length ?? 1) - 1));
        setCurrentIdx(idx);
        const si = Math.floor(idx / SECTION_SIZE);
        setExpandedSections({ [si]: true });
      })
      .catch(() => setError("notFound"))
      .finally(() => setLoading(false));
  }, [slug, base]);

  const currentLesson = lessons[currentIdx] ?? null;

  const saveProgress = useCallback(async () => {
    if (!currentLesson || completing) return;
    setCompleting(true);
    try {
      await fetch(`${base}/api/my/lessons/${currentLesson.id}/complete`, {
        method: "POST",
        credentials: "include",
      });
      setProgressMap(prev => ({ ...prev, [currentLesson.id]: true }));
    } catch {}
    setCompleting(false);
  }, [currentLesson, completing, base]);

  const goToLesson = useCallback((idx: number) => {
    if (idx < 0 || idx >= lessons.length) return;
    setCurrentIdx(idx);
    try { localStorage.setItem(lastKey(slug ?? ""), String(idx)); } catch {}
    const si = Math.floor(idx / SECTION_SIZE);
    setExpandedSections(prev => ({ ...prev, [si]: true }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [lessons.length, slug]);

  const completedCount = lessons.filter(l => progressMap[l.id]).length;
  const totalCount = lessons.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const sections: Lesson[][] = [];
  for (let i = 0; i < lessons.length; i += SECTION_SIZE) {
    sections.push(lessons.slice(i, i + SECTION_SIZE));
  }

  const switchLang = (l: Lang) => {
    setLang(l);
    try { localStorage.setItem("bk_lang", l); } catch {}
  };

  const lessonTitle = (l: Lesson) => lang === "ar" ? l.titleAr || l.titleEn : l.titleEn || l.titleAr;
  const courseTitle = course ? (lang === "ar" ? course.titleAr || course.titleEn : course.titleEn || course.titleAr) : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={isRtl ? "rtl" : "ltr"}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={isRtl ? "rtl" : "ltr"}>
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl font-bold mb-2">{t.notFound}</p>
          <button onClick={() => navigate(`/courses/${slug}`)} className="text-primary underline">{t.back}</button>
        </div>
      </div>
    );
  }

  const embedUrl = currentLesson ? getEmbedUrl(currentLesson) : null;
  const isCompleted = currentLesson ? !!progressMap[currentLesson.id] : false;
  const ArrowEnd = isRtl ? ArrowLeft : ArrowRight;
  const ArrowStart = isRtl ? ArrowRight : ArrowLeft;

  const Sidebar = (
    <div className="h-full flex flex-col bg-card border-e border-border">
      <div className="px-4 py-4 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t.sidebarTitle}</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-medium text-muted-foreground shrink-0">{completedCount}/{totalCount}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {sections.map((section, si) => {
          const isOpen = expandedSections[si] ?? false;
          const sectionDone = section.filter(l => progressMap[l.id]).length;
          return (
            <div key={si} className="border-b border-border/50 last:border-b-0">
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-start"
                onClick={() => setExpandedSections(prev => ({ ...prev, [si]: !prev[si] }))}
              >
                <div>
                  <span className="text-sm font-semibold text-foreground">{t.section} {si + 1}</span>
                  <span className="text-xs text-muted-foreground ms-2">{sectionDone}/{section.length}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    {section.map((lesson) => {
                      const globalIdx = lessons.indexOf(lesson);
                      const isCurrent = globalIdx === currentIdx;
                      const isDone = !!progressMap[lesson.id];
                      return (
                        <button
                          key={lesson.id}
                          className={`w-full flex items-start gap-3 px-4 py-3 text-start transition-colors ${isCurrent ? "bg-primary/10 border-s-2 border-primary" : "hover:bg-muted/20"}`}
                          onClick={() => { goToLesson(globalIdx); setSidebarOpen(false); }}
                        >
                          <span className="shrink-0 mt-0.5">
                            {isDone
                              ? <CheckCircle className="w-4 h-4 text-green-500" />
                              : isCurrent
                                ? <Play className="w-4 h-4 text-primary" />
                                : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40" />
                            }
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs leading-snug ${isCurrent ? "text-primary font-semibold" : isDone ? "text-muted-foreground" : "text-foreground"}`}>
                              {lessonTitle(lesson)}
                            </p>
                            {lesson.durationMinutes && (
                              <p className="text-xs text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />{lesson.durationMinutes} {t.min}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRtl ? "rtl" : "ltr"}>
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => navigate(`/courses/${slug}`)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowStart className="w-4 h-4" />
            <span className="hidden sm:inline">{t.back}</span>
          </button>

          <div className="flex-1 min-w-0 mx-3">
            <p className="text-sm font-semibold text-foreground truncate">{courseTitle}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="hidden sm:flex flex-1 max-w-40 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">
                <BarChart3 className="w-3 h-3 inline me-1" />
                {completedCount} {t.of} {totalCount}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => switchLang(lang === "ar" ? "en" : "ar")}
              className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              {lang === "ar" ? "EN" : "AR"}
            </button>
            <button
              className="p-1.5 rounded hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(o => !o)}
              title={t.sidebarTitle}
            >
              {sidebarOpen ? <X className="w-5 h-5 text-muted-foreground" /> : <Menu className="w-5 h-5 text-muted-foreground" />}
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 288, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="hidden lg:block shrink-0 overflow-hidden border-e border-border"
              style={{ minHeight: 0 }}
            >
              <div className="w-72 h-full overflow-y-auto">{Sidebar}</div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-black/50 z-30"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: isRtl ? "100%" : "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: isRtl ? "100%" : "-100%" }}
                transition={{ duration: 0.25 }}
                className={`lg:hidden fixed top-14 bottom-0 ${isRtl ? "right-0" : "left-0"} w-72 z-40 overflow-hidden shadow-xl`}
              >
                <div className="h-full overflow-y-auto">{Sidebar}</div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {currentLesson ? (
            <div className="max-w-4xl mx-auto px-4 py-6">
              {/* Video player */}
              <div className="w-full bg-black rounded-xl overflow-hidden mb-6 shadow-lg" style={{ aspectRatio: "16/9" }}>
                {embedUrl ? (
                  <iframe
                    key={currentLesson.id}
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    title={lessonTitle(currentLesson)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-white/60">
                      <Play className="w-16 h-16 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">{t.noVideo}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Lesson info */}
              <div className="flex flex-wrap items-start gap-4 mb-6">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                    {t.lessonLabel} {currentIdx + 1}
                  </p>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                    {lessonTitle(currentLesson)}
                  </h1>
                  {currentLesson.durationMinutes && (
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />{currentLesson.durationMinutes} {t.min}
                    </p>
                  )}
                </div>

                {/* Mark complete button */}
                <button
                  onClick={isCompleted ? undefined : saveProgress}
                  disabled={isCompleted || completing}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    isCompleted
                      ? "bg-green-500/10 text-green-700 cursor-default"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                  }`}
                >
                  {isCompleted
                    ? <><CheckCircle className="w-4 h-4" /> {t.completed}</>
                    : completing
                      ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> {t.completing}</>
                      : <><CheckCircle className="w-4 h-4" /> {t.complete}</>
                  }
                </button>
              </div>

              {/* Progress indicator */}
              <div className="bg-muted/30 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{t.progress}</span>
                  <span className="text-sm font-bold text-primary">{pct}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                    initial={false}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{completedCount} {t.of} {totalCount} {lang === "ar" ? "دروس مكتملة" : "lessons completed"}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">{t.notFound}</p>
            </div>
          )}
        </main>
      </div>

      {/* Bottom nav bar */}
      {lessons.length > 0 && (
        <footer className="sticky bottom-0 bg-card border-t border-border shadow-[0_-1px_3px_rgba(0,0,0,0.05)] z-20">
          <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
            <button
              onClick={() => goToLesson(currentIdx - 1)}
              disabled={currentIdx === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowStart className="w-4 h-4" />
              <span className="hidden sm:inline">{t.prev}</span>
            </button>

            <div className="text-xs text-muted-foreground font-medium">
              {currentIdx + 1} / {lessons.length}
            </div>

            {currentIdx < lessons.length - 1 ? (
              <button
                onClick={() => { if (!isCompleted) saveProgress().then(() => goToLesson(currentIdx + 1)); else goToLesson(currentIdx + 1); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90"
              >
                <span className="hidden sm:inline">{t.next}</span>
                <ArrowEnd className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => navigate(`/courses/${slug}`)}
                disabled={pct === 100}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium transition-colors hover:bg-green-700 disabled:opacity-60"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline">{lang === "ar" ? "اكتمل الكورس!" : "Course Complete!"}</span>
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
