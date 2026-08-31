import { Fragment, useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";
import { useApiFetch } from "@/pages/admin/_shared";
import { AttendanceButton, type LessonRecord } from "@/pages/admin/_shared";
import AdminAssignmentsTab from "@/components/admin-assignments-tab";
import { TrainerWorkbookQueue } from "@/components/trainer/workbook-queue";
import { PlatformIntro } from "@/components/platform-intro";
import { TrainerNotesPanel } from "@/components/trainer-notes-panel";
import { toast } from "@/hooks/use-toast";
import { lazy, Suspense } from "react";
const StudentMessagesTab = lazy(() => import("@/components/dashboard/student-messages-tab"));
import {
  BookOpen, GraduationCap, Mic2, ClipboardList, CalendarCheck, Loader2,
  FileText, AlertTriangle, StickyNote, Megaphone, Send, LayoutDashboard,
  UsersRound, MessagesSquare, LibraryBig, ArrowDown, RefreshCw,
} from "lucide-react";

type CourseRow = { id: string; titleAr: string; titleEn: string; enrollmentCount: number };
type EnrollmentRow = { id: string; userId: string; userEmail: string | null; userFirstName: string | null; userLastName: string | null; courseTitle: string | null; courseId: string };
type SpeechEvalRow = { id: string; fullName: string; status: string; createdAt: string; overallScore: number | null };
type PendingSubmission = {
  id: string; assignmentId: string; assignmentTitleAr: string | null;
  courseId: string | null; courseTitleAr: string | null;
  userId: string; userEmail: string | null; userFirstName: string | null; userLastName: string | null;
  submittedAt: string | null;
};
type LessonNeedingAttendance = {
  id: string; titleAr: string; courseId: string; courseTitleAr: string | null;
  sessionId: string; scheduledAt: string;
};
type UpcomingLesson = {
  id: string; titleAr: string; courseId: string | null; courseTitleAr: string | null;
  sessionId: string; scheduledAt: string; durationMinutes: number;
  status: "scheduled" | "live"; zoomJoinUrl: string; recordingUrl: string | null;
};

function attendanceLesson(lesson: LessonNeedingAttendance): LessonRecord {
  return {
    id: lesson.id,
    courseId: lesson.courseId,
    sectionId: null,
    titleAr: lesson.titleAr,
    titleEn: lesson.titleAr,
    videoUrl: null,
    videoType: "zoom",
    durationMinutes: null,
    sortOrder: 0,
    isFreePreview: false,
    isPublished: true,
    descriptionAr: null,
    descriptionEn: null,
    resources: null,
  };
}

function formatSessionDate(value: string): string {
  return new Intl.DateTimeFormat("ar-JO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Amman",
  }).format(new Date(value));
}

type TrainerTab = "today" | "courses" | "learners" | "messages";

const TRAINER_TABS: Array<{ key: TrainerTab; label: string; icon: typeof LayoutDashboard }> = [
  { key: "today", label: "اليوم", icon: LayoutDashboard },
  { key: "courses", label: "دوراتي", icon: LibraryBig },
  { key: "learners", label: "طلابي", icon: UsersRound },
  { key: "messages", label: "الرسائل", icon: MessagesSquare },
];

/** Which tab owns each deep-linked section, so a jump can open it first. */
const SECTION_TAB: Record<string, TrainerTab> = {
  "trainer-today": "today",
  "trainer-courses-section": "courses",
  "trainer-broadcast-section": "courses",
  "trainer-assignments-section": "courses",
  "trainer-workbooks-section": "courses",
  "trainer-learners-section": "learners",
  "trainer-messages-section": "messages",
};

export default function TrainerDashboardPage() {
  const apiFetch = useApiFetch();
  const { user, role, isLoading } = useMe();
  const [, navigate] = useLocation();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [learners, setLearners] = useState<EnrollmentRow[]>([]);
  const [evals, setEvals] = useState<SpeechEvalRow[]>([]);
  const [pendingSubs, setPendingSubs] = useState<PendingSubmission[]>([]);
  const [lessonsNeed, setLessonsNeed] = useState<LessonNeedingAttendance[]>([]);
  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openLearnerNotes, setOpenLearnerNotes] = useState<string | null>(null);
  const [broadcastCourseId, setBroadcastCourseId] = useState("");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastConfirming, setBroadcastConfirming] = useState(false);
  const [focusedAssignmentId, setFocusedAssignmentId] = useState<string | null>(null);
  const [focusedSubmissionId, setFocusedSubmissionId] = useState<string | null>(null);
  const [focusedCourseId, setFocusedCourseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TrainerTab>("today");

  const scrollToSection = (id: string) => {
    // Panels other than the active one are display:none, so switch to the
    // owning tab first and scroll on the next frame, once it has painted.
    const owner = SECTION_TAB[id];
    if (owner && owner !== activeTab) {
      setActiveTab(owner);
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }),
        ),
      );
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openSubmission = (submission: PendingSubmission) => {
    setFocusedAssignmentId(submission.assignmentId);
    setFocusedSubmissionId(submission.id);
    requestAnimationFrame(() => scrollToSection("trainer-assignments-section"));
  };

  const sendBroadcast = useCallback(async () => {
    if (!broadcastCourseId || !broadcastBody.trim()) return;
    setBroadcastSending(true);
    try {
      const r = await apiFetch(`/messages/courses/${broadcastCourseId}/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: broadcastSubject.trim() || "إعلان من المدرّب",
          body: broadcastBody.trim(),
        }),
      });
      if (r.ok) {
        setBroadcastSubject(""); setBroadcastBody("");
        setBroadcastConfirming(false);
        toast({ title: "تم إرسال الإعلان لجميع طلاب الدورة." });
      } else {
        const d = await r.json().catch(() => ({}));
        toast({ title: d.error ?? "فشل الإرسال", variant: "destructive" });
      }
    } finally { setBroadcastSending(false); }
  }, [apiFetch, broadcastCourseId, broadcastSubject, broadcastBody]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const responses = await Promise.all([
        apiFetch("/admin/courses"),
        apiFetch("/admin/enrollments"),
        apiFetch("/admin/speech-evaluations"),
        apiFetch("/admin/trainer/overview"),
      ]);
      if (responses.some((response) => !response.ok)) throw new Error("dashboard-request-failed");
      const [c, e, sp, ov] = await Promise.all(responses.map((response) => response.json()));
      setCourses(c.courses ?? []);
      setLearners(e.enrollments ?? []);
      setEvals(sp.evaluations ?? []);
      setPendingSubs(ov.pendingSubmissions ?? []);
      setLessonsNeed(ov.lessonsNeedingAttendance ?? []);
      setUpcomingLessons(ov.upcomingLessons ?? []);
    } catch {
      setLoadError("تعذّر تحميل مساحة المدرّب. تحقق من الاتصال ثم أعد المحاولة.");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { navigate("/login?redirect=%2Ftrainer", { replace: true }); return; }
    if (role === "admin") { navigate("/admin/overview", { replace: true }); return; }
    if (role !== "trainer") { navigate("/dashboard", { replace: true }); return; }
    void load();
  }, [user, role, isLoading, load, navigate]);

  if (isLoading || loading) {
    return (
      <AppShell containerClassName="container mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </AppShell>
    );
  }

  if (loadError) {
    return (
      <AppShell containerClassName="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-lg rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center" role="alert">
          <AlertTriangle className="mx-auto mb-3 h-9 w-9 text-rose-600" />
          <h1 className="text-xl font-bold text-rose-950">لم نتمكن من تحميل مساحة المدرّب</h1>
          <p className="mt-2 text-sm leading-relaxed text-rose-800">{loadError}</p>
          <Button type="button" className="mt-5 gap-2" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" /> إعادة المحاولة
          </Button>
        </div>
      </AppShell>
    );
  }

  const uniqueLearners = new Map<string, EnrollmentRow>();
  for (const en of learners) {
    if (focusedCourseId && en.courseId !== focusedCourseId) continue;
    if (!uniqueLearners.has(en.userId)) uniqueLearners.set(en.userId, en);
  }
  const focusedCourse = courses.find((course) => course.id === focusedCourseId) ?? null;

  return (
    <AppShell containerClassName="container mx-auto px-4 py-6" breadcrumb={[{ label: "لوحة المدرّب", href: "/trainer" }]}>
      <div className="space-y-6" dir="rtl" data-testid="trainer-dashboard">
        <PlatformIntro
          tone="trainer"
          eyebrow="اليوم في بكلمة"
          title={<>مرحباً {user?.firstName ?? user?.email}</>}
          description="ابدأ بما يحتاج تدخلك اليوم؛ التقييمات والحضور أولاً، ثم تواصل مع طلابك وأدر محتوى دوراتك."
          icon={<Mic2 />}
        />


        <nav aria-label="أقسام مساحة المدرب" className="sticky top-16 z-20 -mx-4 border-y border-border bg-background/95 px-4 py-2 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border">
          <div role="tablist" aria-label="أقسام مساحة المدرب" className="grid grid-cols-4 gap-1">
            {TRAINER_TABS.map((item) => {
              const Icon = item.icon;
              const selected = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  id={`trainer-tab-${item.key}`}
                  aria-selected={selected}
                  aria-controls={`trainer-panel-${item.key}`}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors ${
                    selected
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div
          role="tabpanel"
          id={`trainer-panel-today`}
          aria-labelledby={`trainer-tab-today`}
          className={activeTab === "today" ? "space-y-6" : "hidden"}
        >
        <section id="trainer-today" className="scroll-mt-36 space-y-3" aria-labelledby="trainer-today-heading">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 id="trainer-today-heading" className="text-xl font-bold">ما يحتاجك الآن</h2>
              <p className="mt-1 text-sm text-muted-foreground">مؤشرات عملية، وليست مجرد أرقام.</p>
            </div>
            <ArrowDown className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={<BookOpen className="w-5 h-5" />} label="دوراتي" value={courses.length} />
          <StatCard icon={<GraduationCap className="w-5 h-5" />} label="طلابي" value={uniqueLearners.size} />
          <StatCard icon={<FileText className="w-5 h-5" />} label="تسليمات بانتظار التقييم" value={pendingSubs.length} testid="stat-pending-subs" />
          <StatCard icon={<CalendarCheck className="w-5 h-5" />} label="حصص بحاجة تسجيل حضور" value={lessonsNeed.length} testid="stat-lessons-need-attendance" />
          </div>
        </section>

          <section className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <h2 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> تسليمات الواجبات بانتظار التقييم</h2>
                {pendingSubs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لا توجد تسليمات تنتظر التقييم.</p>
                ) : (
                  <ul className="space-y-2" data-testid="trainer-pending-submissions">
                    {pendingSubs.slice(0, 8).map((s) => (
                      <li key={s.id} className="flex items-center justify-between border border-border rounded-xl px-3 py-2">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{s.assignmentTitleAr ?? "واجب"}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {[s.userFirstName, s.userLastName].filter(Boolean).join(" ") || s.userEmail || "طالب"}
                            {s.courseTitleAr ? ` · ${s.courseTitleAr}` : ""}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => openSubmission(s)}>تقييم التسليم</Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <h2 className="font-semibold flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-primary" /> حصص بحاجة لتسجيل حضور</h2>
                {lessonsNeed.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لا توجد حصص بحاجة لتسجيل حضور.</p>
                ) : (
                  <ul className="space-y-2" data-testid="trainer-lessons-need-attendance">
                    {lessonsNeed.slice(0, 8).map((l) => (
                      <li key={l.id} className="flex items-center justify-between border border-border rounded-xl px-3 py-2">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{l.titleAr}</div>
                          <div className="text-xs text-muted-foreground truncate">{l.courseTitleAr ?? "—"}</div>
                        </div>
                        <AttendanceButton
                          lesson={attendanceLesson(l)}
                          triggerLabel="تسجيل الحضور"
                          onSaved={() => void load()}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <h2 className="font-semibold flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-primary" /> حصصي القادمة</h2>
                {upcomingLessons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لا توجد حصص قادمة في دوراتك.</p>
                ) : (
                  <ul className="space-y-2" data-testid="trainer-upcoming-lessons">
                    {upcomingLessons.map((l) => (
                      <li key={l.id} className="flex items-center justify-between border border-border rounded-xl px-3 py-2">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{l.titleAr}</div>
                          <div className="text-xs text-muted-foreground truncate">{l.courseTitleAr ?? "—"} · {formatSessionDate(l.scheduledAt)}</div>
                        </div>
                        <Button
                          size="sm"
                          variant={l.status === "live" ? "default" : "outline"}
                          onClick={() => window.open(l.zoomJoinUrl, "_blank", "noopener,noreferrer")}
                        >
                          {l.status === "live" ? "انضم الآن" : "فتح الجلسة"}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <h2 className="font-semibold flex items-center gap-2"><Mic2 className="w-4 h-4 text-primary" /> طلبات تقييم الفيديو من الموقع</h2>
                {evals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لا توجد طلبات بشرية مخصّصة لك حالياً.</p>
                ) : (
                  <ul className="space-y-2" data-testid="trainer-speech-evals">
                    {evals.slice(0, 8).map((e) => (
                      <li key={e.id} className="flex items-center justify-between border border-border rounded-xl px-3 py-2">
                        <div>
                          <div className="font-medium">{e.fullName}</div>
                          <div className="text-xs text-muted-foreground">{e.status}</div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/admin/speech-evaluations`)}>فتح</Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        <div
          role="tabpanel"
          id={`trainer-panel-courses`}
          aria-labelledby={`trainer-tab-courses`}
          className={activeTab === "courses" ? "space-y-6" : "hidden"}
        >
          <section className="grid md:grid-cols-2 gap-4">
            <Card id="trainer-courses-section" className="scroll-mt-36">
              <CardContent className="p-4 space-y-3">
                <h2 className="font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> دوراتي</h2>
                {courses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لم يتم تخصيص أي دورة لك بعد. تواصل مع المشرف.</p>
                ) : (
                  <ul className="space-y-2" data-testid="trainer-courses">
                    {courses.map((c) => (
                      <li key={c.id} className="flex items-center justify-between border border-border rounded-xl px-3 py-2">
                        <div>
                          <div className="font-medium">{c.titleAr}</div>
                          <div className="text-xs text-muted-foreground">{c.enrollmentCount} طلاب مسجلون</div>
                        </div>
                        <Button
                          size="sm"
                          variant={focusedCourseId === c.id ? "default" : "outline"}
                          onClick={() => setFocusedCourseId(c.id)}
                        >
                          {focusedCourseId === c.id ? "محددة" : "إدارة"}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                {focusedCourse && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3" data-testid="trainer-course-workspace">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-primary">مساحة الدورة</p>
                        <p className="mt-0.5 font-semibold">{focusedCourse.titleAr}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => setFocusedCourseId(null)}>عرض الكل</Button>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <Button size="sm" variant="outline" onClick={() => scrollToSection("trainer-learners-section")}>طلاب الدورة</Button>
                      <Button size="sm" variant="outline" onClick={() => scrollToSection("trainer-assignments-section")}>الواجبات والتقييم</Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setBroadcastCourseId(focusedCourse.id);
                          scrollToSection("trainer-broadcast-section");
                        }}
                      >
                        إرسال إعلان
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {courses.length > 0 && (
              <Card id="trainer-broadcast-section" className="scroll-mt-36">
                <CardContent className="p-4 space-y-3">
                  <h2 className="font-semibold flex items-center gap-2"><Megaphone className="w-4 h-4 text-primary" /> إعلان لطلاب الدورة</h2>
                  <p className="text-xs text-muted-foreground">سيتم إرسال الرسالة كمحادثة لكل طالب مسجّل في الدورة المختارة.</p>
                  <label htmlFor="trainer-broadcast-course" className="text-xs font-bold">الدورة</label>
                  <select id="trainer-broadcast-course" value={broadcastCourseId} onChange={(e) => { setBroadcastCourseId(e.target.value); setBroadcastConfirming(false); }}
                    className="min-h-11 w-full p-2 rounded-lg border border-border text-sm bg-card" data-testid="broadcast-course-select">
                    <option value="">اختر الدورة...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.titleAr} ({c.enrollmentCount})</option>
                    ))}
                  </select>
                  <label htmlFor="trainer-broadcast-subject" className="sr-only">موضوع الإعلان</label>
                  <input id="trainer-broadcast-subject" value={broadcastSubject} onChange={(e) => { setBroadcastSubject(e.target.value); setBroadcastConfirming(false); }}
                    placeholder="الموضوع (اختياري)"
                    className="min-h-11 w-full p-2 rounded-lg border border-border text-sm" />
                  <label htmlFor="trainer-broadcast-body" className="sr-only">نص الإعلان</label>
                  <textarea id="trainer-broadcast-body" value={broadcastBody} onChange={(e) => { setBroadcastBody(e.target.value); setBroadcastConfirming(false); }}
                    placeholder="نص الإعلان..."
                    className="w-full min-h-[80px] p-2 rounded-lg border border-border text-sm" />
                  {broadcastConfirming ? (
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4" role="status">
                      <p className="text-sm font-bold">تأكيد جمهور الإعلان</p>
                      <p className="mt-1 text-xs leading-6 text-muted-foreground">
                        سيصل «{broadcastSubject.trim() || "إعلان من المدرّب"}» إلى {courses.find((course) => course.id === broadcastCourseId)?.enrollmentCount ?? 0} طالباً في دورة «{courses.find((course) => course.id === broadcastCourseId)?.titleAr ?? "—"}».
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button onClick={sendBroadcast} disabled={broadcastSending} className="min-h-11" data-testid="broadcast-send">
                          {broadcastSending ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Send className="me-1 h-4 w-4" />}
                          تأكيد الإرسال
                        </Button>
                        <Button variant="outline" onClick={() => setBroadcastConfirming(false)} disabled={broadcastSending} className="min-h-11">مراجعة الرسالة</Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => setBroadcastConfirming(true)}
                      disabled={!broadcastCourseId || !broadcastBody.trim()}
                      className="min-h-11"
                      data-testid="broadcast-preview">
                      معاينة الإرسال والجمهور
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

          </section>

          <section id="trainer-workbooks-section" className="scroll-mt-36 space-y-3" aria-labelledby="trainer-workbooks-heading">
            <div>
              <h2 id="trainer-workbooks-heading" className="text-xl font-bold">تمارين الكرّاسة</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                إجابات طلابك على تمارين صفحات الكرّاسة. الاجتياز يمنح الطالب نقاط المهارة المحدَّدة للصفحة.
              </p>
            </div>
            <TrainerWorkbookQueue />
          </section>

          <section id="trainer-assignments-section" className="scroll-mt-36 space-y-3" aria-labelledby="trainer-assignments-heading">
            <div>
              <h2 id="trainer-assignments-heading" className="text-xl font-bold">الواجبات والتقييم</h2>
              <p className="mt-1 text-sm text-muted-foreground">أنشئ الواجبات وقيّم تسليمات طلاب دوراتك من مساحة المدرب نفسها.</p>
            </div>
            <AdminAssignmentsTab
              apiFetch={apiFetch}
              courses={courses.map((course) => ({ id: course.id, titleAr: course.titleAr, titleEn: course.titleEn }))}
              initialAssignmentId={focusedAssignmentId}
              initialSubmissionId={focusedSubmissionId}
              onEvaluated={() => {
                setFocusedSubmissionId(null);
                void load();
              }}
            />
          </section>
        </div>

        <div
          role="tabpanel"
          id={`trainer-panel-learners`}
          aria-labelledby={`trainer-tab-learners`}
          className={activeTab === "learners" ? "space-y-6" : "hidden"}
        >
          <Card id="trainer-learners-section" className="scroll-mt-36">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary" /> {focusedCourse ? `طلاب ${focusedCourse.titleAr}` : "طلابي"}</h2>
                {focusedCourse && <Button size="sm" variant="ghost" onClick={() => setFocusedCourseId(null)}>كل الطلاب</Button>}
              </div>
              {uniqueLearners.size === 0 ? (
                <p className="text-sm text-muted-foreground">لا يوجد طلاب مسجّلون في دوراتك حاليًا.</p>
              ) : (
                <>
                  <div className="space-y-3 md:hidden" data-testid="trainer-learners-mobile">
                    {Array.from(uniqueLearners.values()).slice(0, 50).map((learner) => {
                      const open = openLearnerNotes === learner.userId;
                      const fullName = [learner.userFirstName, learner.userLastName].filter(Boolean).join(" ") || learner.userEmail || "طالب";
                      return (
                        <article key={learner.userId} className={`rounded-2xl border p-4 ${open ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                              {fullName.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate text-sm font-bold">{fullName}</h3>
                              <p className="truncate text-xs text-muted-foreground" dir="ltr">{learner.userEmail ?? "—"}</p>
                              <p className="mt-1 truncate text-xs font-medium text-primary">{learner.courseTitle ?? "—"}</p>
                            </div>
                            <Button
                              size="sm"
                              variant={open ? "default" : "outline"}
                              className="min-h-11 gap-1.5"
                              onClick={() => setOpenLearnerNotes(open ? null : learner.userId)}
                              aria-expanded={open}
                            >
                              <StickyNote className="h-3.5 w-3.5" />
                              {open ? "إغلاق" : "ملاحظاتي"}
                            </Button>
                          </div>
                          {open && (
                            <div className="mt-4 border-t border-primary/10 pt-4">
                              <TrainerNotesPanel
                                learnerId={learner.userId}
                                courseId={learner.courseId}
                                currentTrainerId={user?.id ?? null}
                              />
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                  <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-sm" data-testid="trainer-learners">
                    <thead className="text-xs text-muted-foreground border-b border-border">
                      <tr>
                        <th className="text-start py-2 px-2">الاسم</th>
                        <th className="text-start py-2 px-2">البريد</th>
                        <th className="text-start py-2 px-2">الدورة</th>
                        <th className="text-end py-2 px-2">ملاحظاتي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(uniqueLearners.values()).slice(0, 50).map((l) => {
                        const open = openLearnerNotes === l.userId;
                        return (
                          <Fragment key={l.userId}>
                            <tr key={l.id} className="border-b border-border/40">
                              <td className="py-2 px-2">{[l.userFirstName, l.userLastName].filter(Boolean).join(" ") || "—"}</td>
                              <td className="py-2 px-2 text-muted-foreground">{l.userEmail ?? "—"}</td>
                              <td className="py-2 px-2">{l.courseTitle ?? "—"}</td>
                              <td className="py-2 px-2 text-end">
                                <Button
                                  size="sm"
                                  variant={open ? "default" : "outline"}
                                  className="h-7 text-xs gap-1"
                                  onClick={() => setOpenLearnerNotes(open ? null : l.userId)}
                                  data-testid={`toggle-notes-${l.userId}`}
                                >
                                  <StickyNote className="w-3 h-3" /> {open ? "إغلاق" : "ملاحظاتي"}
                                </Button>
                              </td>
                            </tr>
                            {open && (
                              <tr key={`${l.id}-notes`} className="bg-amber-50/30">
                                <td colSpan={4} className="py-3 px-2">
                                  <TrainerNotesPanel
                                    learnerId={l.userId}
                                    courseId={l.courseId}
                                    currentTrainerId={user?.id ?? null}
                                  />
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div
          role="tabpanel"
          id={`trainer-panel-messages`}
          aria-labelledby={`trainer-tab-messages`}
          className={activeTab === "messages" ? "space-y-6" : "hidden"}
        >
          <section id="trainer-messages-section" className="scroll-mt-36" aria-labelledby="trainer-messages-heading">
            <div className="mb-3">
              <h2 id="trainer-messages-heading" className="text-xl font-bold">رسائل الطلاب</h2>
              <p className="mt-1 text-sm text-muted-foreground">جميع المحادثات داخل المنصة وفي مكان واحد.</p>
            </div>
            <Suspense fallback={<div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>}>
              <StudentMessagesTab lang="ar" currentUserId={user?.id ?? null} />
            </Suspense>
          </section>
        </div>

      </div>
    </AppShell>
  );
}

function StatCard({ icon, label, value, sub, testid }: { icon: React.ReactNode; label: string; value: number | string; sub?: string; testid?: string }) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <CardContent className="p-4 sm:p-5" data-testid={testid}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>
        <div className="mt-3 text-2xl font-bold">{value}</div>
        <div className="mt-1 text-xs font-medium leading-relaxed text-muted-foreground">{label}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}
