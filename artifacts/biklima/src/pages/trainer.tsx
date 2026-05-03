import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";
import { useApiFetch } from "@/pages/admin/_shared";
import { TrainerNotesPanel } from "@/components/trainer-notes-panel";
import { lazy, Suspense } from "react";
const StudentMessagesTab = lazy(() => import("@/components/dashboard/student-messages-tab"));
import {
  BookOpen, GraduationCap, Mic2, ClipboardList, CalendarCheck, Loader2,
  FileText, AlertTriangle, StickyNote, Megaphone, Send,
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
};
type UpcomingLesson = {
  id: string; titleAr: string; courseId: string | null; courseTitleAr: string | null;
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
  const [openLearnerNotes, setOpenLearnerNotes] = useState<string | null>(null);
  const [broadcastCourseId, setBroadcastCourseId] = useState("");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);

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
        alert("تم إرسال الإعلان لجميع طلاب الدورة.");
      } else {
        const d = await r.json().catch(() => ({}));
        alert(d.error ?? "فشل الإرسال");
      }
    } finally { setBroadcastSending(false); }
  }, [apiFetch, broadcastCourseId, broadcastSubject, broadcastBody]);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, e, sp, ov] = await Promise.all([
      apiFetch("/admin/courses").then((r) => (r.ok ? r.json() : { courses: [] })),
      apiFetch("/admin/enrollments").then((r) => (r.ok ? r.json() : { enrollments: [] })),
      apiFetch("/admin/speech-evaluations").then((r) => (r.ok ? r.json() : { evaluations: [] })),
      apiFetch("/admin/trainer/overview").then((r) => (r.ok ? r.json() : { pendingSubmissions: [], lessonsNeedingAttendance: [], upcomingLessons: [] })),
    ]);
    setCourses(c.courses ?? []);
    setLearners(e.enrollments ?? []);
    setEvals(sp.evaluations ?? []);
    setPendingSubs(ov.pendingSubmissions ?? []);
    setLessonsNeed(ov.lessonsNeedingAttendance ?? []);
    setUpcomingLessons(ov.upcomingLessons ?? []);
    setLoading(false);
  }, [apiFetch]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { navigate("/dashboard", { replace: true }); return; }
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

  const pendingEvals = evals.filter((e) => e.status === "pending" || e.status === "in_review");
  const uniqueLearners = new Map<string, EnrollmentRow>();
  for (const en of learners) if (!uniqueLearners.has(en.userId)) uniqueLearners.set(en.userId, en);

  return (
    <AppShell containerClassName="container mx-auto px-4 py-6" breadcrumb={[{ labelAr: "لوحة المدرّب", href: "/trainer" }]}>
      <div className="space-y-6" dir="rtl" data-testid="trainer-dashboard">
        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">لوحة المدرّب</h1>
            <p className="text-sm text-muted-foreground mt-1">
              مرحبًا {user?.firstName ?? user?.email}، هذه دوراتك وطلابك المخصّصون لك فقط.
            </p>
          </div>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={<BookOpen className="w-5 h-5" />} label="دوراتي" value={courses.length} />
          <StatCard icon={<GraduationCap className="w-5 h-5" />} label="طلابي" value={uniqueLearners.size} />
          <StatCard icon={<FileText className="w-5 h-5" />} label="تسليمات بانتظار التقييم" value={pendingSubs.length} testid="stat-pending-subs" />
          <StatCard icon={<CalendarCheck className="w-5 h-5" />} label="حصص بحاجة تسجيل حضور" value={lessonsNeed.length} testid="stat-lessons-need-attendance" />
          <StatCard icon={<Mic2 className="w-5 h-5" />} label="تقييمات صوتية" value={evals.length} sub={`${pendingEvals.length} بانتظار المراجعة`} />
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
                      <Button size="sm" variant="outline" onClick={() => navigate("/admin/assignments")}>تقييم</Button>
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
                      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/courses`)}>
                        <AlertTriangle className="w-3 h-3 ms-1" /> تسجيل
                      </Button>
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
                        <div className="text-xs text-muted-foreground truncate">{l.courseTitleAr ?? "—"}</div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/courses`)}>فتح</Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
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
                      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/courses`)}>إدارة</Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {courses.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h2 className="font-semibold flex items-center gap-2"><Megaphone className="w-4 h-4 text-primary" /> إعلان لطلاب الدورة</h2>
                <p className="text-xs text-muted-foreground">سيتم إرسال الرسالة كمحادثة لكل طالب مسجّل في الدورة المختارة.</p>
                <select value={broadcastCourseId} onChange={(e) => setBroadcastCourseId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-border text-sm bg-card" data-testid="broadcast-course-select">
                  <option value="">اختر الدورة...</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.titleAr} ({c.enrollmentCount})</option>
                  ))}
                </select>
                <input value={broadcastSubject} onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder="الموضوع (اختياري)"
                  className="w-full p-2 rounded-lg border border-border text-sm" />
                <textarea value={broadcastBody} onChange={(e) => setBroadcastBody(e.target.value)}
                  placeholder="نص الإعلان..."
                  className="w-full min-h-[80px] p-2 rounded-lg border border-border text-sm" />
                <Button size="sm" onClick={sendBroadcast}
                  disabled={broadcastSending || !broadcastCourseId || !broadcastBody.trim()}
                  data-testid="broadcast-send">
                  {broadcastSending ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Send className="w-4 h-4 me-1" />}
                  إرسال الإعلان
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4 space-y-3">
              <h2 className="font-semibold flex items-center gap-2"><Mic2 className="w-4 h-4 text-primary" /> طلبات التقييم الصوتي</h2>
              {evals.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد تقييمات مخصّصة لك حاليًا.</p>
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

        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="font-semibold flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary" /> طلابي</h2>
            {uniqueLearners.size === 0 ? (
              <p className="text-sm text-muted-foreground">لا يوجد طلاب مسجّلون في دوراتك حاليًا.</p>
            ) : (
              <div className="overflow-x-auto">
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
                        <>
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
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Suspense fallback={<div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>}>
          <StudentMessagesTab lang="ar" currentUserId={user?.id ?? null} />
        </Suspense>

        <Card>
          <CardContent className="p-4 flex items-center gap-3 text-sm">
            <ClipboardList className="w-5 h-5 text-primary" />
            <span>لإدارة الحضور والواجبات والشهادات استخدم القائمة الجانبية في لوحة الإدارة.</span>
            <Button size="sm" variant="outline" className="ms-auto" onClick={() => navigate("/admin/courses")}>فتح لوحة الإدارة</Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function StatCard({ icon, label, value, sub, testid }: { icon: React.ReactNode; label: string; value: number | string; sub?: string; testid?: string }) {
  return (
    <Card>
      <CardContent className="p-4" data-testid={testid}>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">{icon}{label}</div>
        <div className="text-2xl font-bold mt-1">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}
