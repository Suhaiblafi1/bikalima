import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { useLang } from "@/hooks/useLang";
import {
  CheckCircle, Play, Lock, ChevronDown, Download, FileText,
  ArrowLeft, ArrowRight, Menu, X, BookOpen, BarChart3, Clock,
  StickyNote, Save, Trash2, Award, Sparkles, Mail, MessageCircle, Hourglass,
} from "lucide-react";
import { Certificate } from "@/components/certificate";
import { ActivityPlayer, type Activity, type SubmissionStatus } from "@/components/activity-player";
import { ContentProtection } from "@/components/content-protection";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { programPageSlugFromCourseSlug } from "@/lib/site-config";

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
    notes: "ملاحظاتي",
    notesPlaceholder: "اكتب ملاحظاتك على هذا الدرس...",
    saveNote: "حفظ الملاحظة",
    saving: "جارٍ الحفظ...",
    noteSaveError: "تعذّر حفظ الملاحظة. حاول مرة أخرى.",
    noteDeleteError: "تعذّر حذف الملاحظة. حاول مرة أخرى.",
    noteLoadError: "تعذّر تحميل الملاحظة.",
    saved: "تم الحفظ ✓",
    deleteNote: "حذف",
    notesPrivate: "ملاحظاتك خاصة وتظهر لك فقط.",
    congratsTitle: "تهانينا! لقد أتممت الدورة 🎉",
    congratsBody: "أحسنت! لقد أكملت جميع الدروس. استلم شهادة الإتمام كتقدير لإنجازك.",
    downloadCert: "تحميل الشهادة",
    generatingCert: "جارٍ إعداد الشهادة...",
    certError: "تعذّر إنشاء الشهادة. حاول مرة أخرى.",
    backToCourse: "العودة إلى الدورة",
    completedBadge: "مكتمل",
    reviewLessons: "مراجعة الدروس",
    pendingTitle: "تم استلام طلب الدفع",
    pendingBody: "سنفعّل وصولك إلى الدورة قريبًا بعد تأكيد الدفع. سيصلك بريد إلكتروني عند التفعيل، أو يمكنك التواصل معنا عبر واتساب لتسريع المراجعة.",
    pendingShort: "طلب الدفع قيد المراجعة — سيتم تفعيل وصولك قريبًا.",
    pendingEmail: "راسلنا عبر البريد",
    pendingWhatsapp: "تواصل عبر واتساب",
    pendingSubmittedAt: "تم تقديم الطلب",
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
    notes: "My Notes",
    notesPlaceholder: "Write your notes for this lesson...",
    saveNote: "Save Note",
    saving: "Saving...",
    noteSaveError: "Could not save note. Please try again.",
    noteDeleteError: "Could not delete note. Please try again.",
    noteLoadError: "Could not load note.",
    saved: "Saved ✓",
    deleteNote: "Delete",
    notesPrivate: "Your notes are private and only visible to you.",
    congratsTitle: "Congratulations! You finished the course 🎉",
    congratsBody: "Well done! You've completed every lesson. Download your certificate of completion as a recognition of your achievement.",
    downloadCert: "Download Certificate",
    generatingCert: "Preparing certificate...",
    certError: "Could not generate the certificate. Please try again.",
    backToCourse: "Back to Course",
    completedBadge: "Completed",
    reviewLessons: "Review Lessons",
    pendingTitle: "We received your payment request",
    pendingBody: "Your access will be activated shortly after we confirm the payment. You'll receive an email once it's ready, or you can reach out on WhatsApp to speed things up.",
    pendingShort: "Your payment is being reviewed — access will unlock soon.",
    pendingEmail: "Email us",
    pendingWhatsapp: "Chat on WhatsApp",
    pendingSubmittedAt: "Request submitted",
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

function ActivityList({ lessonId, apiBase, enrolled, onAnyChange }: {
  lessonId: string; apiBase: string; enrolled: boolean; onAnyChange: () => void | Promise<void>;
}) {
  const [acts, setActs] = useState<Activity[]>([]);
  const [progress, setProgress] = useState<Record<string, { status: SubmissionStatus }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [ratingFor, setRatingFor] = useState<{ submissionId: string; activityTitle: string } | null>(null);
  const [savingRating, setSavingRating] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${apiBase}/lessons/${lessonId}/activities`, { credentials: "include" });
      if (r.ok) {
        const d = await r.json();
        setActs(d.activities ?? []);
        const pm: Record<string, { status: SubmissionStatus }> = {};
        for (const k of Object.keys(d.myProgress ?? {})) {
          pm[k] = { status: d.myProgress[k].status as SubmissionStatus };
        }
        setProgress(pm);
      }
    } finally { setLoading(false); }
  }, [apiBase, lessonId]);

  useEffect(() => { reload(); }, [reload]);

  const handleSubmit = async (activityId: string, data: { payload?: Record<string, unknown>; mediaUrl?: string; autoScore?: number }) => {
    setSubmitting(activityId);
    try {
      const r = await fetch(`${apiBase}/activities/${activityId}/submit`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        const act = acts.find(a => a.id === activityId);
        if (d?.submission?.id && act && act.type !== "self_assessment") {
          setRatingFor({ submissionId: d.submission.id, activityTitle: act.titleAr ?? "نشاطك" });
        }
        await reload();
        await onAnyChange();
      }
    } finally { setSubmitting(null); }
  };

  const submitRating = async (rating: number) => {
    if (!ratingFor) return;
    setSavingRating(true);
    try {
      await fetch(`${apiBase}/me/submissions/${ratingFor.submissionId}/self-assessment`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
    } finally {
      setSavingRating(false);
      setRatingFor(null);
    }
  };

  if (loading) return null;
  if (acts.length === 0) return null;

  return (
    <div className="space-y-3 mb-5">
      {acts.map(a => (
        <ActivityPlayer
          key={a.id}
          activity={a}
          status={progress[a.id]?.status ?? null}
          onSubmit={(d) => handleSubmit(a.id, d)}
          isSubmitting={submitting === a.id}
          enrolled={enrolled}
        />
      ))}
      {ratingFor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white dark:bg-card rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
            <h3 className="font-bold text-lg">كيف كان شعورك؟ ⭐</h3>
            <p className="text-sm text-muted-foreground">قيّم تجربتك مع: <span className="font-bold">{ratingFor.activityTitle}</span></p>
            <div className="flex justify-center gap-2 text-3xl">
              {[
                { v: 1, e: "😟", l: "صعب" },
                { v: 2, e: "🙁", l: "غير ممتاز" },
                { v: 3, e: "😐", l: "متوسط" },
                { v: 4, e: "🙂", l: "جيد" },
                { v: 5, e: "🤩", l: "رائع!" },
              ].map(opt => (
                <button
                  key={opt.v}
                  onClick={() => submitRating(opt.v)}
                  disabled={savingRating}
                  aria-label={opt.l}
                  className="w-14 h-14 rounded-2xl border border-border hover:bg-primary/10 hover:scale-110 transition disabled:opacity-50"
                >{opt.e}</button>
              ))}
            </div>
            <button
              onClick={() => setRatingFor(null)}
              className="text-xs text-muted-foreground underline"
            >تخطّي</button>
          </div>
        </div>
      )}
    </div>
  );
}

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

  const { lang } = useLang();
  const t = T[lang];
  const isRtl = lang === "ar";
  const { data: siteSettingsData } = useSiteSettings();
  const settings = siteSettingsData?.settings ?? null;

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [enrolled, setEnrolled] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{ id: string; createdAt: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [autoAdvance, setAutoAdvance] = useState(false);

  // Notes state
  const [noteContent, setNoteContent] = useState("");
  const [noteSavedContent, setNoteSavedContent] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteJustSaved, setNoteJustSaved] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Certificate / congrats state
  const [showCongrats, setShowCongrats] = useState(false);
  const [congratsDismissed, setCongratsDismissed] = useState(false);
  const [certData, setCertData] = useState<{
    studentName: string;
    completedAt: string | null;
    courseTitleAr: string;
    courseTitleEn: string;
  } | null>(null);
  const [downloadingCert, setDownloadingCert] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

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
        const isEnrolled = !!data.enrolled;
        const pending = data.pendingOrder ?? null;

        if (!isEnrolled) {
          const hasFreePreview = allLessons.some(l => l.isFreePreview);
          if (!hasFreePreview && !pending) {
            navigate(`/programs/${programPageSlugFromCourseSlug(slug) ?? slug}`);
            return;
          }
        }

        setSections(data.sections ?? []);
        setLessons(allLessons);
        setProgressMap(data.progressMap ?? {});
        setEnrolled(isEnrolled);
        setPendingOrder(pending);

        const saved = parseInt(localStorage.getItem(lastKey(slug)) ?? "0", 10);
        const savedLesson = allLessons[saved];
        const savedOk = savedLesson && (isEnrolled || savedLesson.isFreePreview);
        const firstFreePreview = allLessons.findIndex(l => l.isFreePreview);
        const idx = savedOk ? saved : (isEnrolled ? 0 : Math.max(0, firstFreePreview));
        setCurrentIdx(Math.min(idx, Math.max(0, allLessons.length - 1)));

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

  const markComplete = useCallback(async (advanceAfter = false) => {
    if (!currentLesson || completing || !enrolled) return;
    setCompleting(true);
    try {
      const r = await fetch(`${base}/api/my/lessons/${currentLesson.id}/complete`, {
        method: "POST",
        credentials: "include",
      });
      if (r.ok) {
        setProgressMap(prev => ({ ...prev, [currentLesson.id]: true }));
        if (advanceAfter && currentIdx < lessons.length - 1) {
          setCurrentIdx(prev => {
            const next = prev + 1;
            try { localStorage.setItem(lastKey(slug ?? ""), String(next)); } catch {}
            return next;
          });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    } catch {}
    setCompleting(false);
  }, [currentLesson, completing, enrolled, base, currentIdx, lessons.length, slug]);

  // Load note when current lesson changes
  useEffect(() => {
    if (!currentLesson || !enrolled) {
      setNoteContent("");
      setNoteSavedContent("");
      return;
    }
    const lessonId = currentLesson.id;
    setNoteLoading(true);
    setNoteJustSaved(false);
    setNoteError(null);
    fetch(`${base}/api/my/lessons/${lessonId}/note`, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const content = data?.note?.content ?? "";
        setNoteContent(content);
        setNoteSavedContent(content);
      })
      .catch(() => {
        setNoteError(t.noteLoadError);
      })
      .finally(() => setNoteLoading(false));
  }, [currentLesson, enrolled, base, t]);

  const saveNote = useCallback(async () => {
    if (!currentLesson || !enrolled || noteSaving) return;
    setNoteSaving(true);
    setNoteError(null);
    try {
      const r = await fetch(`${base}/api/my/lessons/${currentLesson.id}/note`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteContent }),
      });
      if (r.ok) {
        setNoteSavedContent(noteContent);
        setNoteJustSaved(true);
        setTimeout(() => setNoteJustSaved(false), 2000);
      } else {
        setNoteError(t.noteSaveError);
      }
    } catch {
      setNoteError(t.noteSaveError);
    }
    setNoteSaving(false);
  }, [currentLesson, enrolled, noteSaving, noteContent, base, t]);

  const deleteNote = useCallback(async () => {
    if (!currentLesson || !enrolled) return;
    setNoteSaving(true);
    setNoteError(null);
    try {
      const r = await fetch(`${base}/api/my/lessons/${currentLesson.id}/note`, {
        method: "DELETE",
        credentials: "include",
      });
      if (r.ok) {
        setNoteContent("");
        setNoteSavedContent("");
      } else {
        setNoteError(t.noteDeleteError);
      }
    } catch {
      setNoteError(t.noteDeleteError);
    }
    setNoteSaving(false);
  }, [currentLesson, enrolled, base, t]);

  const goToLesson = useCallback((idx: number) => {
    if (idx < 0 || idx >= lessons.length) return;
    const lesson = lessons[idx];
    if (!enrolled && !lesson.isFreePreview) {
      if (pendingOrder) {
        // Stay on the learn page so the pending banner remains visible;
        // the lesson body itself shows a pending-specific locked state.
        setCurrentIdx(idx);
        try { localStorage.setItem(lastKey(slug ?? ""), String(idx)); } catch {}
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      navigate(`/programs/${programPageSlugFromCourseSlug(slug) ?? slug}`);
      return;
    }
    setCurrentIdx(idx);
    try { localStorage.setItem(lastKey(slug ?? ""), String(idx)); } catch {}
    const sectionGroups = buildSectionGroups(sections, lessons);
    const sectionGroup = sectionGroups.find(g => g.lessons.some((l) => lessons.indexOf(l) === idx));
    if (sectionGroup) {
      setExpandedSections(prev => ({ ...prev, [sectionGroup.id ?? "0"]: true }));
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [lessons, enrolled, pendingOrder, sections, slug, navigate]);

  const completedCount = lessons.filter(l => progressMap[l.id]).length;
  const totalCount = lessons.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isCourseComplete = enrolled && totalCount > 0 && completedCount === totalCount;

  // Fetch certificate info once when the course becomes 100% complete and
  // automatically reveal the congrats screen the first time it happens.
  useEffect(() => {
    if (!isCourseComplete || !slug) return;
    let cancelled = false;
    fetch(`${base}/api/my/courses/${slug}/certificate`, { credentials: "include" })
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (cancelled) return;
        if (data?.eligible) {
          setCertData({
            studentName: data.studentName || "",
            completedAt: data.completedAt ?? null,
            courseTitleAr: data.course?.titleAr ?? "",
            courseTitleEn: data.course?.titleEn ?? "",
          });
          const seenKey = `bk_congrats_seen_${slug}`;
          let seen = false;
          try { seen = localStorage.getItem(seenKey) === "1"; } catch {}
          if (!seen && !congratsDismissed) {
            setShowCongrats(true);
            try { localStorage.setItem(seenKey, "1"); } catch {}
          }
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isCourseComplete, slug, base, congratsDismissed]);

  const downloadCertificate = useCallback(async () => {
    if (!certificateRef.current || downloadingCert) return;
    setDownloadingCert(true);
    setCertError(null);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: "#fffaf3",
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      // Fit the image inside the page while preserving aspect ratio.
      const imgRatio = canvas.width / canvas.height;
      const pageRatio = pdfWidth / pdfHeight;
      let renderWidth = pdfWidth;
      let renderHeight = pdfHeight;
      if (imgRatio > pageRatio) {
        renderHeight = pdfWidth / imgRatio;
      } else {
        renderWidth = pdfHeight * imgRatio;
      }
      const offsetX = (pdfWidth - renderWidth) / 2;
      const offsetY = (pdfHeight - renderHeight) / 2;
      pdf.addImage(imgData, "PNG", offsetX, offsetY, renderWidth, renderHeight);
      const safeTitle = (certData?.courseTitleEn || certData?.courseTitleAr || "course")
        .replace(/[^\p{L}\p{N}\s_-]/gu, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 60) || "course";
      pdf.save(`bikalima-certificate-${safeTitle}.pdf`);
    } catch {
      setCertError(t.certError);
    }
    setDownloadingCert(false);
  }, [downloadingCert, certData, t]);

  const sectionGroups = buildSectionGroups(sections, lessons);

  const lessonTitle = (l: Lesson) => lang === "ar" ? l.titleAr || l.titleEn : l.titleEn || l.titleAr;
  const lessonDesc = (l: Lesson) => lang === "ar" ? l.descriptionAr || l.descriptionEn || null : l.descriptionEn || l.descriptionAr || null;
  const sectionTitle = (g: SectionGroup) => lang === "ar" ? g.titleAr : g.titleEn;
  const courseTitle = course ? (lang === "ar" ? course.titleAr || course.titleEn : course.titleEn || course.titleAr) : "";
  const resTitle = (r: Resource) => lang === "ar" ? r.titleAr || r.titleEn : r.titleEn || r.titleAr;

  if (loading) {
    return (
      <AppShell containerClassName="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell containerClassName="flex-1 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl font-bold mb-4">{t.notFound}</p>
          <button onClick={() => navigate(`/programs/${programPageSlugFromCourseSlug(slug) ?? slug}`)} className="text-primary underline">{t.back}</button>
        </div>
      </AppShell>
    );
  }

  const embedUrl = currentLesson && !isLocked ? getEmbedUrl(currentLesson) : null;
  const isCompleted = currentLesson ? !!progressMap[currentLesson.id] : false;
  const ArrowEnd = isRtl ? ArrowLeft : ArrowRight;
  const ArrowStart = isRtl ? ArrowRight : ArrowLeft;
  const resources = currentLesson?.resources ?? [];
  const showPending = !enrolled && !!pendingOrder;
  const contactEmail = settings?.contactEmail ?? null;
  const whatsappNumber = settings?.whatsappNumber ?? null;
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^\d]/g, "")}`
    : null;
  const submittedAtText = (() => {
    if (!pendingOrder?.createdAt) return null;
    try {
      return new Date(pendingOrder.createdAt).toLocaleString(lang === "ar" ? "ar" : "en", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return null;
    }
  })();

  const PendingBanner = showPending ? (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <Hourglass className="w-5 h-5 text-amber-700" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base md:text-lg font-bold text-amber-900">{t.pendingTitle}</h2>
          <p className="text-sm text-amber-900/80 mt-1 leading-relaxed">{t.pendingBody}</p>
          {submittedAtText && (
            <p className="text-xs text-amber-900/70 mt-2">
              {t.pendingSubmittedAt}: <span className="font-medium">{submittedAtText}</span>
            </p>
          )}
          {(contactEmail || whatsappHref) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  {t.pendingWhatsapp}
                </a>
              )}
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {t.pendingEmail}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

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
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{sectionTitle(group)}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">{sectionDone}/{group.lessons.length} {lang === "ar" ? "درس" : "lessons"}</span>
                    {(() => { const dur = group.lessons.reduce((s, l) => s + (l.durationMinutes ?? 0), 0); return dur > 0 ? <span className="text-xs text-muted-foreground/70 flex items-center gap-0.5"><Clock className="w-3 h-3" />{dur} {t.min}</span> : null; })()}
                  </div>
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
    <AppShell
      containerClassName="flex flex-col"
      breadcrumb={[
        { label: lang === "ar" ? "البرامج" : "Programs", href: "/#structure" },
        { label: courseTitle, href: `/programs/${programPageSlugFromCourseSlug(slug) ?? slug}` },
        { label: lang === "ar" ? "تعلم" : "Learn" },
      ]}
    >
      <ContentProtection>
      {/* Lesson sub-header */}
      <div className="sticky top-14 z-30 bg-card border-b border-border shadow-sm">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => navigate(`/programs/${programPageSlugFromCourseSlug(slug) ?? slug}`)}
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
            {enrolled && (
              <button
                onClick={() => setAutoAdvance(a => !a)}
                title={lang === "ar" ? "التقدم التلقائي" : "Auto-advance"}
                className={`hidden sm:flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors ${autoAdvance ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
              >
                <Play className={`w-3 h-3 ${autoAdvance ? "fill-primary" : ""}`} />
                {lang === "ar" ? "تلقائي" : "Auto"}
              </button>
            )}
            <button
              className="p-1.5 rounded hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(o => !o)}
            >
              {sidebarOpen ? <X className="w-5 h-5 text-muted-foreground" /> : <Menu className="w-5 h-5 text-muted-foreground" />}
            </button>
          </div>
        </div>
      </div>

      {/* Body: sidebar + main */}
      <div className="flex flex-1 relative">
        {/* Desktop sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 288, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden lg:block shrink-0 overflow-hidden border-e border-border self-stretch"
            >
              <div className="w-72 sticky top-28 max-h-[calc(100vh-7rem)] overflow-y-auto">{SidebarContent}</div>
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
                className={`lg:hidden fixed top-28 bottom-0 ${isRtl ? "right-0" : "left-0"} w-72 z-40 shadow-xl overflow-hidden`}
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
              {PendingBanner}
              {/* Video player or locked state */}
              <div className="w-full bg-black rounded-xl overflow-hidden mb-6 shadow-lg" style={{ aspectRatio: "16/9" }}>
                {isLocked ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white gap-4 px-4 text-center">
                    {showPending ? (
                      <>
                        <Hourglass className="w-16 h-16 opacity-50 text-amber-300" />
                        <p className="text-lg font-semibold opacity-90">{t.pendingShort}</p>
                      </>
                    ) : (
                      <>
                        <Lock className="w-16 h-16 opacity-40" />
                        <p className="text-lg font-semibold opacity-80">{t.enrollToWatch}</p>
                        <button
                          onClick={() => navigate(`/programs/${programPageSlugFromCourseSlug(slug) ?? slug}`)}
                          className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                        >
                          {t.goToEnroll}
                        </button>
                      </>
                    )}
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
                    onClick={isCompleted ? undefined : () => markComplete(autoAdvance)}
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
                      <><CheckCircle className="w-4 h-4" /> {t.complete}{autoAdvance && currentIdx < lessons.length - 1 ? ` →` : ""}</>
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

              {/* Interactive activities */}
              {!isLocked && currentLesson && (
                <ActivityList
                  lessonId={currentLesson.id}
                  apiBase={`${base}/api`}
                  enrolled={enrolled}
                  onAnyChange={async () => {
                    // Re-fetch lesson progress so the lesson auto-completes when all required done.
                    try {
                      const r = await fetch(`${base}/api/courses/${slug}/learn`, { credentials: "include" });
                      if (r.ok) {
                        const d = await r.json();
                        setProgressMap(d.progressMap ?? {});
                      }
                    } catch {}
                  }}
                />
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

              {/* Notes (enrolled users only) */}
              {enrolled && !isLocked && (
                <div className="rounded-xl border border-border p-4 mb-5 bg-amber-50/30">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <StickyNote className="w-4 h-4 text-amber-600" />
                      {t.notes}
                    </h2>
                    {noteJustSaved && (
                      <span className="text-xs text-green-600 font-medium">{t.saved}</span>
                    )}
                  </div>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder={t.notesPlaceholder}
                    disabled={noteLoading}
                    rows={5}
                    dir={isRtl ? "rtl" : "ltr"}
                    className="w-full bg-background border border-border rounded-lg p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 disabled:opacity-60"
                  />
                  {noteError && (
                    <p className="mt-2 text-xs text-destructive font-medium" role="alert">
                      {noteError}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-3 mt-3">
                    <p className="text-[11px] text-muted-foreground">{t.notesPrivate}</p>
                    <div className="flex items-center gap-2">
                      {noteSavedContent && (
                        <button
                          onClick={deleteNote}
                          disabled={noteSaving}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {t.deleteNote}
                        </button>
                      )}
                      <button
                        onClick={saveNote}
                        disabled={noteSaving || noteContent === noteSavedContent}
                        className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {noteSaving ? (
                          <>
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            {t.saving}
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            {t.saveNote}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Login prompt for non-logged-in free preview watchers */}
              {!enrolled && currentLesson.isFreePreview && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-3">{t.loginToTrack}</p>
                  <button
                    onClick={() => navigate(`/programs/${programPageSlugFromCourseSlug(slug) ?? slug}`)}
                    className="text-sm text-primary font-semibold underline"
                  >
                    {t.goToEnroll}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-6">
              {PendingBanner}
              {!showPending && (
                <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-4">
                  <BookOpen className="w-12 h-12 text-muted-foreground/40" />
                  <p className="text-muted-foreground">
                    {lang === "ar" ? "لا توجد دروس في هذه الدورة بعد." : "No lessons have been added to this course yet."}
                  </p>
                </div>
              )}
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
                  if (enrolled && !isCompleted) await markComplete(false);
                  goToLesson(currentIdx + 1);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90"
              >
                <span className="hidden sm:inline">{t.next}</span>
                <ArrowEnd className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={async () => {
                  if (enrolled && !isCompleted) await markComplete(false);
                  setCongratsDismissed(false);
                  setShowCongrats(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium transition-colors hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline">{t.courseComplete}</span>
              </button>
            )}
          </div>
        </footer>
      )}

      {/* Congrats screen + downloadable certificate */}
      <AnimatePresence>
        {showCongrats && certData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => { setShowCongrats(false); setCongratsDismissed(true); }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 10, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8"
              dir={isRtl ? "rtl" : "ltr"}
            >
              <button
                onClick={() => { setShowCongrats(false); setCongratsDismissed(true); }}
                className="absolute top-3 end-3 z-10 w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                aria-label="close"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="px-6 pt-10 pb-6 text-center">
                <div className="relative inline-flex items-center justify-center mb-4">
                  <div className="absolute inset-0 bg-amber-200/40 rounded-full blur-2xl" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                    <Award className="w-10 h-10 text-white" />
                  </div>
                  <Sparkles className="absolute -top-1 -end-2 w-5 h-5 text-amber-500" />
                  <Sparkles className="absolute -bottom-1 -start-2 w-4 h-4 text-amber-400" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {t.congratsTitle}
                </h2>
                <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                  {t.congratsBody}
                </p>

                {certData.studentName && (
                  <div className="mt-5 inline-flex flex-col items-center gap-1 px-5 py-3 rounded-xl bg-muted/40 border border-border/50">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {lang === "ar" ? "الطالب" : "Student"}
                    </span>
                    <span className="text-base font-semibold text-foreground">{certData.studentName}</span>
                  </div>
                )}

                <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={downloadCertificate}
                    disabled={downloadingCert}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {downloadingCert ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        {t.generatingCert}
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        {t.downloadCert}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => navigate(`/programs/${programPageSlugFromCourseSlug(slug) ?? slug}`)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                  >
                    {t.backToCourse}
                  </button>
                </div>

                {certError && (
                  <p className="mt-3 text-xs text-destructive font-medium" role="alert">{certError}</p>
                )}
              </div>

              {/* Preview of the certificate (scaled down) */}
              <div className="border-t border-border/60 bg-muted/20 p-4 flex items-center justify-center">
                <div
                  className="origin-top"
                  style={{
                    width: "100%",
                    maxWidth: 600,
                    aspectRatio: "1100 / 780",
                    overflow: "hidden",
                    borderRadius: 8,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  }}
                >
                  <div
                    style={{
                      transform: "scale(0.5)",
                      transformOrigin: isRtl ? "top right" : "top left",
                      width: 1100,
                      height: 780,
                    }}
                  >
                    <Certificate
                      studentName={certData.studentName}
                      courseTitle={lang === "ar"
                        ? (certData.courseTitleAr || certData.courseTitleEn)
                        : (certData.courseTitleEn || certData.courseTitleAr)}
                      completedAt={certData.completedAt}
                      lang={lang}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating "View Certificate" button when course is complete */}
      {isCourseComplete && certData && !showCongrats && (
        <button
          onClick={() => { setCongratsDismissed(false); setShowCongrats(true); }}
          className="fixed bottom-20 end-4 z-30 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-lg transition-colors"
        >
          <Award className="w-4 h-4" />
          <span>{t.completedBadge}</span>
        </button>
      )}

      {/* Off-screen full-resolution certificate used for PDF capture */}
      {certData && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: "-10000px",
            pointerEvents: "none",
            opacity: 0,
          }}
        >
          <Certificate
            ref={certificateRef}
            studentName={certData.studentName}
            courseTitle={lang === "ar"
              ? (certData.courseTitleAr || certData.courseTitleEn)
              : (certData.courseTitleEn || certData.courseTitleAr)}
            completedAt={certData.completedAt}
            lang={lang}
          />
        </div>
      )}
      </ContentProtection>
    </AppShell>
  );
}
