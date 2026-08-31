import { useEffect, useState, useCallback } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useMe } from "@/hooks/use-me";
import { AppShell } from "@/components/app-shell";
import { useLang } from "@/hooks/useLang";
import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, Trophy, GraduationCap, Loader2, KeyRound, AlertTriangle, RefreshCw } from "lucide-react";
import { lazy, Suspense } from "react";
import { Video, Clock, ExternalLink, Star, Award } from "lucide-react";
import { PlatformIntro } from "@/components/platform-intro";
const StudentMessagesTab = lazy(() => import("@/components/dashboard/student-messages-tab"));

interface ChildDashboard {
  linkId: string;
  studentUserId: string;
  name: string | null;
  email: string | null;
  relationshipAr: string | null;
  recentReviews: Array<{
    id: string; decision: string | null; totalScore: number | null;
    createdAt: string; activityTitleAr: string | null; activityType: string | null;
  }>;
  certificates: Array<{
    id: string; code: string; programName: string | null; certType: string;
    status: string; issueDate: string; certificateFileUrl: string | null;
  }>;
}

interface LiveSession {
  id: string; zoomJoinUrl: string; titleAr: string | null; scheduledAt: string;
  durationMinutes: number; status: string; recordingUrl: string | null;
  lessonTitleAr: string | null; courseTitleAr: string | null;
  studentUserIds: string[];
}

interface ChildSummary {
  linkId: string;
  relationshipAr: string | null;
  student: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  enrolledCourses: number;
  completedLessons: number;
  completedActivities: number;
  weekly: {
    completedLessons: number;
    completedActivities: number;
    attendance: { present: number; absent: number; excused: number };
  };
  courseProgress: Array<{
    courseId: string;
    titleAr: string;
    completedLessons: number;
    totalLessons: number;
    progressPct: number;
  }>;
  nextAssignment: {
    id: string;
    titleAr: string;
    dueAt: string | null;
    status: "pending" | "submitted" | "reviewed";
  } | null;
}

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

export default function ParentPage() {
  const { lang } = useLang();
  const isRtl = lang === "ar";
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { user } = useMe();
  const apiBase = getApiBase();
  const [children, setChildren] = useState<ChildSummary[] | null>(null);
  const [liveSessions, setLiveSessions] = useState<LiveSession[] | null>(null);
  const [dashboard, setDashboard] = useState<ChildDashboard[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [redeemMsg, setRedeemMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [linkPanelOpen, setLinkPanelOpen] = useState(true);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const responses = await Promise.all([
        fetch(`${apiBase}/parent/children`, { credentials: "include" }),
        fetch(`${apiBase}/parent/live-sessions`, { credentials: "include" }),
        fetch(`${apiBase}/parent/dashboard`, { credentials: "include" }),
      ]);
      if (responses.some((response) => !response.ok)) throw new Error("parent-request-failed");
      const [childrenData, sessionData, dashboardData] = await Promise.all(
        responses.map((response) => response.json()),
      );
      setChildren(childrenData.children ?? []);
      setLiveSessions(sessionData.sessions ?? []);
      setDashboard(dashboardData.children ?? []);
    } catch {
      setLoadError("تعذّر تحميل بيانات الأبناء الآن. لم نستبدل الخطأ بحالة فارغة؛ أعد المحاولة بعد التحقق من الاتصال.");
    }
  }, [apiBase]);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  useEffect(() => {
    if (!children?.length) return;
    setLinkPanelOpen(false);
    if (!selectedChildId || !children.some((child) => child.student.id === selectedChildId)) {
      setSelectedChildId(children[0].student.id);
    }
  }, [children, selectedChildId]);

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeeming(true);
    setRedeemMsg(null);
    try {
      const r = await fetch(`${apiBase}/parent/redeem`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code.trim().toUpperCase() }),
      });
      if (r.ok) {
        setRedeemMsg({ type: "ok", text: "تمّ ربط حسابك بحساب الطالب بنجاح." });
        setCode("");
        load();
      } else {
        const d = await r.json().catch(() => ({}));
        setRedeemMsg({ type: "err", text: d?.error === "Invite not found" ? "الرمز غير صحيح" : d?.error === "Already redeemed" ? "تمّ استخدام هذا الرمز سابقاً" : "تعذّر التفعيل" });
      }
    } catch {
      setRedeemMsg({ type: "err", text: "تعذّر الاتصال بالخادم" });
    } finally {
      setRedeeming(false);
    }
  };

  if (authLoading) {
    return (
      <AppShell breadcrumb={[{ label: isRtl ? "متابعة ابني" : "Parent" }]} containerClassName="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </AppShell>
    );
  }
  if (!isAuthenticated) return <Redirect to="/login?redirect=%2Fparent" replace />;

  const selectedChild = children?.find((child) => child.student.id === selectedChildId) ?? null;
  const selectedLiveSessions = liveSessions?.filter((session) => (
    !selectedChildId || session.studentUserIds.includes(selectedChildId)
  )) ?? null;

  return (
    <AppShell breadcrumb={[{ label: isRtl ? "متابعة ابني" : "Parent" }]}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6" dir="rtl">
        <PlatformIntro
          tone="family"
          eyebrow="ملخص الأسرة"
          title={<>أهلاً {user?.firstName ?? "بك"}</>}
          description="تابع تقدّم أبنائك وجلساتهم وإنجازاتهم بهدوء، واعرف ما يحتاج انتباهك هذا الأسبوع."
          icon={<Users />}
        />

        {loadError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center" role="alert">
            <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-rose-600" />
            <p className="text-sm font-medium leading-relaxed text-rose-900">{loadError}</p>
            <button type="button" onClick={() => void load()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-700 px-4 py-2 text-sm font-bold text-white">
              <RefreshCw className="h-4 w-4" /> إعادة المحاولة
            </button>
          </div>
        )}

        <details
          className="group rounded-2xl border border-border bg-card shadow-xs"
          open={linkPanelOpen}
          onToggle={(event) => setLinkPanelOpen(event.currentTarget.open)}
        >
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-bold marker:hidden sm:px-5">
            <KeyRound className="h-4 w-4 text-primary" />
            ربط حساب طفل جديد
            <span className="ms-auto text-xs font-normal text-muted-foreground group-open:hidden">إظهار</span>
            <span className="ms-auto hidden text-xs font-normal text-muted-foreground group-open:inline">إخفاء</span>
          </summary>
          <div className="border-t border-border px-4 py-4 sm:px-5">
            <form onSubmit={redeem} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="أدخل رمز الدعوة"
                className="flex-1 p-3 rounded-lg border border-border font-mono tracking-widest text-center"
                maxLength={16}
              />
              <button
                type="submit"
                disabled={redeeming || code.trim().length < 4}
                className="px-6 py-3 rounded-lg bg-primary text-white font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {redeeming && <Loader2 className="w-4 h-4 animate-spin" />}
                تفعيل الربط
              </button>
            </form>
            {redeemMsg && (
              <p className={`mt-2 text-sm ${redeemMsg.type === "ok" ? "text-emerald-600" : "text-rose-600"}`}>
                {redeemMsg.text}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              يمكن لطفلك إنشاء رمز الدعوة من تبويب "أهلي وأولياء أمري" في لوحة التحكم الخاصة به.
            </p>
          </div>
        </details>

        <Card className="rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <h2 className="font-bold text-lg mb-4">أبنائي المربوطون</h2>
            {children === null ? (
              loadError ? null : <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
            ) : children.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                لم يتم ربط أي حساب طفل بعد. اطلب من طفلك رمز الدعوة من حسابه.
              </p>
            ) : (
              <ul className="grid sm:grid-cols-2 gap-3">
                {children.map(c => {
                  const fullName = [c.student.firstName, c.student.lastName].filter(Boolean).join(" ") || c.student.email;
                  return (
                    <li key={c.linkId}>
                      <button
                        type="button"
                        onClick={() => setSelectedChildId(c.student.id)}
                        aria-pressed={selectedChildId === c.student.id}
                        className={`w-full rounded-2xl border p-4 text-start transition-all ${selectedChildId === c.student.id ? "border-primary/40 bg-primary/5 shadow-sm ring-2 ring-primary/10" : "border-border bg-card hover:border-primary/25"}`}
                      >
                      <div className="flex items-center gap-3 mb-3">
                        {c.student.profileImageUrl ? (
                          <img src={c.student.profileImageUrl} alt={fullName} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {fullName.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold truncate">{fullName}</p>
                          {c.relationshipAr && <p className="text-xs text-muted-foreground">{c.relationshipAr}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-muted/40 rounded-lg p-2">
                          <BookOpen className="w-4 h-4 mx-auto text-primary" />
                          <p className="text-lg font-bold mt-1">{c.enrolledCourses}</p>
                          <p className="text-[10px] text-muted-foreground">دورات</p>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-2">
                          <GraduationCap className="w-4 h-4 mx-auto text-emerald-600" />
                          <p className="text-lg font-bold mt-1">{c.completedLessons}</p>
                          <p className="text-[10px] text-muted-foreground">دروس مكتملة</p>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-2">
                          <Trophy className="w-4 h-4 mx-auto text-amber-600" />
                          <p className="text-lg font-bold mt-1">{c.completedActivities}</p>
                          <p className="text-[10px] text-muted-foreground">أنشطة</p>
                        </div>
                      </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {selectedChild && (
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-primary/15 bg-primary/5 p-3 sm:gap-3 sm:p-4" aria-label={`الملخص العام لـ ${selectedChild.student.firstName ?? "الطفل"}`}>
            <div className="text-center">
              <p className="text-xl font-bold text-primary">{selectedChild.enrolledCourses}</p>
              <p className="text-xs text-muted-foreground">برامج نشطة</p>
            </div>
            <div className="border-x border-primary/10 text-center">
              <p className="text-xl font-bold text-primary">{selectedChild.completedLessons}</p>
              <p className="text-xs text-muted-foreground">دروس مكتملة</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary">{selectedChild.completedActivities}</p>
              <p className="text-xs text-muted-foreground">أنشطة منجزة</p>
            </div>
          </div>
        )}

        {selectedChild && (
          <Card className="overflow-hidden rounded-2xl border-primary/15">
            <CardContent className="p-0">
              <div className="bg-gradient-to-l from-primary/10 via-primary/5 to-transparent p-4 sm:p-6">
                <p className="text-xs font-bold text-primary">خلال آخر 7 أيام</p>
                <h2 className="mt-1 text-lg font-bold">ملخص أسبوع {selectedChild.student.firstName || "الطالب"}</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {selectedChild.weekly.completedLessons + selectedChild.weekly.completedActivities > 0
                    ? `أنجز ${selectedChild.weekly.completedLessons} من الدروس و${selectedChild.weekly.completedActivities} من الأنشطة هذا الأسبوع.`
                    : "لا يوجد نشاط تعليمي مكتمل مسجّل هذا الأسبوع حتى الآن."}
                  {selectedChild.weekly.attendance.absent > 0
                    ? ` توجد ${selectedChild.weekly.attendance.absent} حالة غياب تحتاج المتابعة.`
                    : selectedChild.weekly.attendance.present > 0 ? " الحضور المسجّل منتظم." : " لم تُسجّل جلسات حضور خلال الفترة."}
                </p>
              </div>
              <div className="grid grid-cols-3 border-y border-border bg-card text-center">
                <div className="p-3 sm:p-4"><p className="text-xl font-bold text-primary">{selectedChild.weekly.completedLessons}</p><p className="text-xs text-muted-foreground">دروس هذا الأسبوع</p></div>
                <div className="border-x border-border p-3 sm:p-4"><p className="text-xl font-bold text-primary">{selectedChild.weekly.completedActivities}</p><p className="text-xs text-muted-foreground">أنشطة منجزة</p></div>
                <div className="p-3 sm:p-4"><p className={`text-xl font-bold ${selectedChild.weekly.attendance.absent > 0 ? "text-rose-600" : "text-emerald-600"}`}>{selectedChild.weekly.attendance.present}/{selectedChild.weekly.attendance.present + selectedChild.weekly.attendance.absent + selectedChild.weekly.attendance.excused}</p><p className="text-xs text-muted-foreground">جلسات حضرها</p></div>
              </div>
              <div className="space-y-5 p-4 sm:p-6">
                <div>
                  <h3 className="text-sm font-bold">تقدم البرامج</h3>
                  {selectedChild.courseProgress.length === 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">لا توجد برامج نشطة حالياً.</p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {selectedChild.courseProgress.map((course) => (
                        <li key={course.courseId}>
                          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="truncate font-bold">{course.titleAr}</span><span className="shrink-0 text-primary">{course.progressPct}%</span></div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${course.progressPct}%` }} /></div>
                          <p className="mt-1 text-xs text-muted-foreground">{course.completedLessons} من {course.totalLessons} درس</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-xs font-bold text-muted-foreground">الواجب القادم</p>
                  {selectedChild.nextAssignment ? (
                    <div className="mt-1 flex items-center justify-between gap-3"><p className="truncate text-sm font-bold">{selectedChild.nextAssignment.titleAr}</p><span className="shrink-0 text-xs text-primary">{selectedChild.nextAssignment.status === "pending" ? "بانتظار التسليم" : selectedChild.nextAssignment.status === "submitted" ? "تم التسليم" : "تمت المراجعة"}</span></div>
                  ) : <p className="mt-1 text-sm text-muted-foreground">لا يوجد واجب قادم.</p>}
                  {selectedChild.nextAssignment?.dueAt && <p className="mt-1 text-xs text-muted-foreground">الموعد: {new Date(selectedChild.nextAssignment.dueAt).toLocaleString("ar-SA")}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              الحصص المباشرة لأبنائي
            </h2>
            {selectedLiveSessions === null ? (
              loadError ? null : <div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
            ) : selectedLiveSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد حصص مباشرة قادمة للطفل المحدد.</p>
            ) : (
              <ul className="space-y-3">
                {selectedLiveSessions.map(s => {
                  const when = new Date(s.scheduledAt);
                  const isLive = s.status === "live";
                  return (
                    <li key={s.id} className="border border-border rounded-xl p-3 flex flex-wrap items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLive ? "bg-rose-100 text-rose-600" : "bg-primary/10 text-primary"}`}>
                        <Video className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{s.titleAr || s.lessonTitleAr || "حصة مباشرة"}</p>
                        <p className="text-xs text-muted-foreground">{s.courseTitleAr ?? "—"}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />{when.toLocaleString("ar-SA")} • {s.durationMinutes} د
                        </p>
                      </div>
                      {isLive && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">مباشر الآن</span>}
                      {s.status !== "ended" && s.status !== "cancelled" && (
                        <a href={s.zoomJoinUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white font-bold inline-flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5" />الانضمام
                        </a>
                      )}
                      {s.recordingUrl && (
                        <a href={s.recordingUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground">التسجيل</a>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {dashboard && dashboard.length > 0 && (
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-5 sm:p-6 sm:space-y-6">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                تقييمات وإنجازات أبنائي
              </h2>
              {dashboard.filter((child) => !selectedChildId || child.studentUserId === selectedChildId).map(child => (
                <div key={child.linkId} className="border border-border rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{child.name ?? child.email ?? "—"}</span>
                    {child.relationshipAr && <span className="text-xs text-muted-foreground">({child.relationshipAr})</span>}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-2">آخر تقييمات المدرّب</p>
                    {child.recentReviews.length === 0 ? (
                      <p className="text-xs text-muted-foreground">لا توجد تقييمات بعد.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {child.recentReviews.map(r => (
                          <li key={r.id} className="flex items-center gap-2 text-xs">
                            <span className={`px-2 py-0.5 rounded-full font-bold ${r.decision === "pass" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                              {r.decision === "pass" ? "ناجح" : "بحاجة مراجعة"}
                            </span>
                            <span className="flex-1 truncate">{r.activityTitleAr ?? "نشاط"}</span>
                            {r.totalScore != null && <span className="text-muted-foreground">{r.totalScore}/100</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5"><Award className="w-3.5 h-3.5" />الشهادات</p>
                    {child.certificates.length === 0 ? (
                      <p className="text-xs text-muted-foreground">لا توجد شهادات صادرة بعد.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {child.certificates.map(c => (
                          <li key={c.id} className="flex items-center gap-2 text-xs">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            <span className="flex-1 truncate">{c.programName ?? c.certType} • <span dir="ltr" className="text-muted-foreground">{c.code}</span></span>
                            {c.certificateFileUrl && (
                              <a href={c.certificateFileUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-bold">عرض</a>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Suspense fallback={<div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>}>
          <StudentMessagesTab lang="ar" currentUserId={user?.id ?? null} />
        </Suspense>
      </div>
    </AppShell>
  );
}
