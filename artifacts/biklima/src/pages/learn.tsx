import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Play, Lock, ChevronDown, Download, FileText,
  ArrowLeft, ArrowRight, Menu, X, BookOpen, BarChart3, Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Lang = "ar" | "en";

interface Resource {
  titleAr: string;
  titleEn: string;
  url: string;
  type?: string;
}

interface Lesson {
  id: string;
  courseId: string;
  sectionId: string | null;
  titleAr: string;
  titleEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  videoUrl: string | null;
  videoType: "youtube" | "vimeo" | "other" | null;
  durationMinutes: number | null;
  sortOrder: number;
  isFreePreview: boolean;
  isPublished: boolean;
  resources: Resource[] | null;
}

interface Section {
  id: string;
  courseId: string;
  titleAr: string;
  titleEn: string;
  sortOrder: number;
}

interface Course {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
}

const T = {
  ar: {
    back: "العودة للدورة",
    complete: "تحديد كمكتمل",
    completed: "مكتمل ✓",
    completing: "جارٍ الحفظ...",
    prev: "السابق",
    next: "التالي",
    progress: "تقدمك",
    of: "من",
    noVideo: "لا يوجد فيديو لهذا الدرس بعد.",
    loading: "جارٍ تحميل الدورة...",
    notFound: "الدورة غير موجودة.",
    min: "د",
    sidebarTitle: "محتوى الدورة",
    freePreview: "معاينة مجانية",
    locked: "مقفل",
    lockedMsg: "سجّل في الدورة للوصول إلى هذا الدرس",
    resources: "موارد الدرس",
    downloadAll: "تحميل",
    section: "الوحدة",
    lessonLabel: "الدرس",
    loginToTrack: "سجّل الدخول لمتابعة تقدمك",
    enrollToWatch: "سجّل في الدورة لمشاهدة هذا الدرس",
    goToEnroll: "الاشتراك في الدورة",
    courseComplete: "اكتمل الكورس!",
  },
  en: {
    back: "Back to Course",
    complete: "Mark as Complete",
    completed: "Completed ✓",
    completing: "Saving...",
    prev: "Previous",
    next: "Next",
    progress: "Your Progress",
    of: "of",
    noVideo: "No video available for this lesson yet.",
    loading: "Loading course...",
    notFound: "Course not found.",
    min: "min",
    sidebarTitle: "Course Content",
    freePreview: "Free Preview",
    locked: "Locked",
    lockedMsg: "Enroll in this course to access this lesson",
    resources: "Lesson Resources",
    downloadAll: "Download",
    section: "Unit",
    lessonLabel: "Lesson",
    loginToTrack: "Log in to track your progress",
    enrollToWatch: "Enroll in this course to watch this lesson",
    goToEnroll: "Enroll Now",
    courseComplete: "Course Complete!",
  },
};

const FALLBACK_SECTION_SIZE = 4;

function extractVideoId(url: string, type: string | null): string | null {
  if (!url) return null;
  const t = type ?? "youtube";
  if (t === "youtube") {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }
  if (t === "vimeo") {
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

type SectionGroup = {
  id: string | null;
  titleAr: string;
  titleEn: string;
  lessons: Lesson[];
};

function buildSectionGroups(sections: Section[], lessons: Lesson[]): SectionGroup[] {
  if (sections.length > 0) {
    const groups: SectionGroup[] = sections.map(s => ({
      id: s.id,
      titleAr: s.titleAr,
      titleEn: s.titleEn,
      lessons: lessons.filter(l => l.sectionId === s.id).sort((a, b) => a.sortOrder - b.sortOrder),
    }));
    const unassigned = lessons.filter(l => !l.sectionId || !sections.find(s => s.id === l.sectionId));
    if (unassigned.length > 0) {
      groups.push({ id: null, titleAr: "دروس أخرى", titleEn: "Other Lessons", lessons: unassigned });
    }
    return groups.filter(g => g.lessons.length > 0);
  }
  const groups: SectionGroup[] = [];
  for (let i = 0; i < lessons.length; i += FALLBACK_SECTION_SIZE) {
    const chunk = lessons.slice(i, i + FALLBACK_SECTION_SIZE);
    const sectionNum = Math.floor(i / FALLBACK_SECTION_SIZE) + 1;
    groups.push({ id: null, titleAr: `الوحدة ${sectionNum}`, titleEn: `Unit ${sectionNum}`, lessons: chunk });
  }
  return groups;
}

export default function LearnPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [lang, setLang] = useState<Lang>(() => {
    try { return (localStorage.getItem("bk_lang") as Lang) || "ar"; } catch { return "ar"; }
  });
  const t = T[lang];
  const isRtl = lang === "ar";
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const lastKey = (s: string) => `bk_learn_${s}`;

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    fetch(`${base}/api/courses/${slug}/learn`, { credentials: "include" })
      .then(async r => {
        if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error ?? "failed"); }
        return r.json();
      })
      .then(data => {
        setCourse(data.course);
        const allLessons: Lesson[] = (data.lessons ?? []).filter((l: Lesson) => l.isPublished !== false);
        setSections(data.sections ?? []);
        setLessons(allLessons);
        setProgressMap(data.progressMap ?? {});
        setEnrolled(!!data.enrolled);
        const saved = parseInt(localStorage.getItem(lastKey(slug)) ?? "0", 10);
        const startIdx = Math.min(Math.max(0, saved), Math.max(0, allLessons.length - 1));
        const firstAccessible = allLessons.findIndex((l, i) => i === startIdx && (data.enrolled || l.isFreePreview));
        const idx = firstAccessible >= 0 ? startIdx : (allLessons.findIndex(l => l.isFreePreview || data.enrolled) ?? 0);
        setCurrentIdx(idx < 0 ? 0 : idx);
        const sectionGroups = buildSectionGroups(data.sections ?? [], allLessons);
        const initialExpanded: Record<string, boolean> = {};
        if (sectionGroups.length > 0) initialExpanded[sectionGroups[0].id ?? "0"] = true;
        setExpandedSections(initialExpanded);
      })
      .catch(e => setError(e.message === "Course not found" ? "notFound" : "error"))
      .finally(() => setLoading(false));
  }, [slug, base]);

  const currentLesson = lessons[currentIdx] ?? null;
  const isLocked = currentLesson ? (!enrolled && !currentLesson.isFreePreview) : false;

  const markComplete = useCallback(async () => {
    if (!currentLesson || completing || !enrolled) return;
    setCompleting(true);
    try {
      const r = await fetch(`${base}/api/my/lessons/${currentLesson.id}/complete`, {
        method: "POST",
        credentials: "include",
      });
      if (r.ok) {
        setProgressMap(prev => ({ ...prev, [currentLesson.id]: true }));
      }
    } catch {}
    setCompleting(false);
  }, [currentLesson, completing, enrolled, base]);

  const goToLesson = useCallback((idx: number) => {
    if (idx < 0 || idx >= lessons.length) return;
    const lesson = lessons[idx];
    if (!enrolled && !lesson.isFreePreview) {
      toast({
        title: isRtl ? "الدرس مقفل" : "Lesson Locked",
        description: t.lockedMsg,
        variant: "destructive",
      });
      return;
    }
    setCurrentIdx(idx);
    try { localStorage.setItem(lastKey(slug ?? ""), String(idx)); } catch {}
    const sectionGroups = buildSectionGroups(sections, lessons);
    const sectionGroup = sectionGroups.find(g => g.lessons.some((_, i) => lessons.indexOf(g.lessons[i]) === idx));
    if (sectionGroup) {
      setExpandedSections(prev => ({ ...prev, [sectionGroup.id ?? "0"]: true }));
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [lessons, enrolled, sections, slug, t, isRtl, toast]);

  const completedCount = lessons.filter(l => progressMap[l.id]).length;
  const totalCount = lessons.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const sectionGroups = buildSectionGroups(sections, lessons);

  const switchLang = (l: Lang) => {
    setLang(l);
    try { localStorage.setItem("bk_lang", l); } catch {}
  };

  const lessonTitle = (l: Lesson) => lang === "ar" ? l.titleAr || l.titleEn : l.titleEn || l.titleAr;
  const lessonDesc = (l: Lesson) => lang === "ar" ? l.descriptionAr || l.descriptionEn || null : l.descriptionEn || l.descriptionAr || null;
  const sectionTitle = (g: SectionGroup) => lang === "ar" ? g.titleAr : g.titleEn;
  const courseTitle = course ? (lang === "ar" ? course.titleAr || course.titleEn : course.titleEn || course.titleAr) : "";
  const resTitle = (r: Resource) => lang === "ar" ? r.titleAr || r.titleEn : r.titleEn || r.titleAr;

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
          <p className="text-xl font-bold mb-4">{t.notFound}</p>
          <button onClick={() => navigate(`/courses/${slug}`)} className="text-primary underline">{t.back}</button>
        </div>
      </div>
    );
  }

  const embedUrl = currentLesson && !isLocked ? getEmbedUrl(currentLesson) : null;
  const isCompleted = currentLesson ? !!progressMap[currentLesson.id] : false;
  const ArrowEnd = isRtl ? ArrowLeft : ArrowRight;
  const ArrowStart = isRtl ? ArrowRight : ArrowLeft;
  const resources = currentLesson?.resources ?? [];

  const SidebarContent = (
    <div className="h-full flex flex-col bg-card">
      {enrolled && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-semibold text-primary shrink-0">{pct}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{completedCount} {t.of} {totalCount}</p>
        </div>
      )}
      <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">{t.sidebarTitle}</p>
      <div className="flex-1 overflow-y-auto">
        {sectionGroups.map((group) => {
          const groupKey = group.id ?? group.titleEn;
          const isOpen = expandedSections[groupKey] ?? false;
          const sectionDone = group.lessons.filter(l => progressMap[l.id]).length;
          return (
            <div key={groupKey} className="border-b border-border/50 last:border-b-0">
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-start"
                onClick={() => setExpandedSections(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{sectionTitle(group)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sectionDone}/{group.lessons.length}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ms-2 ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    {group.lessons.map((lesson) => {
                      const globalIdx = lessons.indexOf(lesson);
                      const isCurrent = globalIdx === currentIdx;
                      const isDone = !!progressMap[lesson.id];
                      const isLessonLocked = !enrolled && !lesson.isFreePreview;
                      return (
                        <button
                          key={lesson.id}
                          className={`w-full flex items-start gap-3 px-4 py-3 text-start transition-colors ${isCurrent ? "bg-primary/10 border-s-2 border-primary" : "hover:bg-muted/20"}`}
                          onClick={() => { goToLesson(globalIdx); setSidebarOpen(false); }}
                        >
                          <span className="shrink-0 mt-0.5">
                            {isLessonLocked
                              ? <Lock className="w-4 h-4 text-muted-foreground/50" />
                              : isDone
                                ? <CheckCircle className="w-4 h-4 text-green-500" />
                                : isCurrent
                                  ? <Play className="w-4 h-4 text-primary" />
                                  : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40" />
                            }
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs leading-snug ${isCurrent ? "text-primary font-semibold" : isDone ? "text-muted-foreground" : isLessonLocked ? "text-muted-foreground/60" : "text-foreground"}`}>
                              {lessonTitle(lesson)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {lesson.durationMinutes && (
                                <span className="text-xs text-muted-foreground/70 flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" />{lesson.durationMinutes} {t.min}
                                </span>
                              )}
                              {lesson.isFreePreview && !enrolled && (
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">{t.freePreview}</span>
                              )}
                            </div>
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
      {/* Top header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => navigate(`/courses/${slug}`)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowStart className="w-4 h-4" />
            <span className="hidden sm:inline">{t.back}</span>
          </button>

          <div className="flex-1 min-w-0 mx-2">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">{courseTitle}</p>
            {enrolled && (
              <div className="flex items-center gap-2 mt-0.5">
                <div className="hidden sm:flex w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">
                  <BarChart3 className="w-3 h-3 inline me-1" />{completedCount} {t.of} {totalCount}
                </span>
              </div>
            )}
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
            >
              {sidebarOpen ? <X className="w-5 h-5 text-muted-foreground" /> : <Menu className="w-5 h-5 text-muted-foreground" />}
            </button>
          </div>
        </div>
      </header>

      {/* Body: sidebar + main */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 288, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden lg:block shrink-0 overflow-hidden border-e border-border"
            >
              <div className="w-72 h-full overflow-y-auto">{SidebarContent}</div>
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
                className={`lg:hidden fixed top-14 bottom-0 ${isRtl ? "right-0" : "left-0"} w-72 z-40 shadow-xl overflow-hidden`}
              >
                <div className="h-full overflow-y-auto">{SidebarContent}</div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto pb-24">
          {currentLesson ? (
            <div className="max-w-4xl mx-auto px-4 py-6">
              {/* Video player or locked state */}
              <div className="w-full bg-black rounded-xl overflow-hidden mb-6 shadow-lg" style={{ aspectRatio: "16/9" }}>
                {isLocked ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white gap-4 px-4 text-center">
                    <Lock className="w-16 h-16 opacity-40" />
                    <p className="text-lg font-semibold opacity-80">{t.enrollToWatch}</p>
                    <button
                      onClick={() => navigate(`/courses/${slug}`)}
                      className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                    >
                      {t.goToEnroll}
                    </button>
                  </div>
                ) : embedUrl ? (
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

              {/* Lesson header */}
              <div className="flex flex-wrap items-start gap-4 mb-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs text-muted-foreground font-medium">{t.lessonLabel} {currentIdx + 1}</span>
                    {currentLesson.isFreePreview && !enrolled && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{t.freePreview}</span>
                    )}
                    {isLocked && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3" />{t.locked}
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                    {lessonTitle(currentLesson)}
                  </h1>
                  {currentLesson.durationMinutes && (
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />{currentLesson.durationMinutes} {t.min}
                    </p>
                  )}
                </div>

                {/* Mark complete button (enrolled only) */}
                {enrolled && !isLocked && (
                  <button
                    onClick={isCompleted ? undefined : markComplete}
                    disabled={isCompleted || completing}
                    className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      isCompleted
                        ? "bg-green-500/10 text-green-700 cursor-default"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    }`}
                  >
                    {isCompleted ? (
                      <><CheckCircle className="w-4 h-4" /> {t.completed}</>
                    ) : completing ? (
                      <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> {t.completing}</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> {t.complete}</>
                    )}
                  </button>
                )}
              </div>

              {/* Lesson description */}
              {!isLocked && lessonDesc(currentLesson) && (
                <div className="bg-muted/20 rounded-xl p-4 mb-5 border border-border/40">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {lessonDesc(currentLesson)}
                  </p>
                </div>
              )}

              {/* Progress bar (enrolled users) */}
              {enrolled && totalCount > 0 && (
                <div className="bg-muted/30 rounded-xl p-4 mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t.progress}</span>
                    <span className="text-sm font-bold text-primary">{pct}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{completedCount} {t.of} {totalCount}</p>
                </div>
              )}

              {/* Downloadable resources */}
              {!isLocked && resources.length > 0 && (
                <div className="rounded-xl border border-border p-4 mb-5">
                  <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    {t.resources}
                  </h2>
                  <div className="space-y-2">
                    {resources.map((r, i) => (
                      <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Download className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{resTitle(r)}</p>
                          {r.type && <p className="text-xs text-muted-foreground uppercase">{r.type}</p>}
                        </div>
                        <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Login prompt for non-logged-in free preview watchers */}
              {!enrolled && currentLesson.isFreePreview && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-3">{t.loginToTrack}</p>
                  <button
                    onClick={() => navigate(`/courses/${slug}`)}
                    className="text-sm text-primary font-semibold underline"
                  >
                    {t.goToEnroll}
                  </button>
                </div>
              )}
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
        <footer className="fixed bottom-0 inset-x-0 bg-card border-t border-border shadow-[0_-2px_8px_rgba(0,0,0,0.06)] z-20">
          <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
            <button
              onClick={() => goToLesson(currentIdx - 1)}
              disabled={currentIdx === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowStart className="w-4 h-4" />
              <span className="hidden sm:inline">{t.prev}</span>
            </button>

            <span className="text-xs text-muted-foreground font-medium">{currentIdx + 1} / {lessons.length}</span>

            {currentIdx < lessons.length - 1 ? (
              <button
                onClick={async () => {
                  if (enrolled && !isCompleted) await markComplete();
                  goToLesson(currentIdx + 1);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90"
              >
                <span className="hidden sm:inline">{t.next}</span>
                <ArrowEnd className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => navigate(`/courses/${slug}`)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium transition-colors hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline">{t.courseComplete}</span>
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
