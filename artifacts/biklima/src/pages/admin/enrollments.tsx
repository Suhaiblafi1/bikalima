import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FileText, GraduationCap, TrendingUp, CheckCircle, XCircle, UserPlus,
} from "lucide-react";
import { AdminLayout } from "./_layout";
import { TrainerNotesPanel } from "@/components/trainer-notes-panel";
import { useMe } from "@/hooks/use-me";
import { StickyNote } from "lucide-react";
import {
  useApiFetch, StatusBadge,
  type RequestRecord, type LmsOrderRecord, type StudentProgressRecord, type UserRecord, type CourseRecord,
} from "./_shared";

type SubTab = "requests" | "lms-orders" | "progress";

export default function AdminEnrollmentsPage() {
  const apiFetch = useApiFetch();
  const { user: me, role } = useMe();
  const [subTab, setSubTab] = useState<SubTab>("requests");
  const [openProgressNotes, setOpenProgressNotes] = useState<string | null>(null);

  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [lmsOrders, setLmsOrders] = useState<LmsOrderRecord[]>([]);
  const [progress, setProgress] = useState<StudentProgressRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [courses, setCourses] = useState<{ id: string; titleAr: string }[]>([]);

  const [lmsStatusFilter, setLmsStatusFilter] = useState<string>("all");
  const [progressSearch, setProgressSearch] = useState("");
  const [enrollForm, setEnrollForm] = useState({ userId: "", courseId: "" });
  const [showEnrollForm, setShowEnrollForm] = useState(false);

  const fetchRequests = useCallback(async () => {
    const res = await apiFetch("/admin/enrollment-requests");
    if (res.ok) setRequests((await res.json()).requests);
  }, [apiFetch]);

  const fetchLmsOrders = useCallback(async () => {
    const res = await apiFetch("/admin/lms-orders");
    if (res.ok) setLmsOrders((await res.json()).orders);
  }, [apiFetch]);

  const fetchProgress = useCallback(async () => {
    const res = await apiFetch("/admin/student-progress");
    if (res.ok) setProgress((await res.json()).progress ?? []);
  }, [apiFetch]);

  const fetchUsersAndCourses = useCallback(async () => {
    const [usersRes, coursesRes] = await Promise.all([
      apiFetch("/admin/users"),
      apiFetch("/admin/courses"),
    ]);
    if (usersRes.ok) setUsers((await usersRes.json()).users);
    if (coursesRes.ok) {
      const data = (await coursesRes.json()) as { courses: CourseRecord[] };
      setCourses(data.courses.map((c) => ({ id: c.id, titleAr: c.titleAr })));
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchRequests();
    fetchLmsOrders();
    fetchUsersAndCourses();
  }, [fetchRequests, fetchLmsOrders, fetchUsersAndCourses]);

  useEffect(() => {
    if (subTab === "progress" && progress.length === 0) fetchProgress();
  }, [subTab, progress.length, fetchProgress]);

  const updateRequestStatus = async (id: string, status: string) => {
    await apiFetch(`/admin/enrollment-requests/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchRequests();
  };

  const updateLmsOrderStatus = async (id: string, status: string) => {
    const res = await apiFetch(`/admin/lms-orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setLmsOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const enrollUser = async () => {
    const res = await apiFetch("/admin/enrollments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enrollForm),
    });
    if (res.ok) { setShowEnrollForm(false); setEnrollForm({ userId: "", courseId: "" }); fetchLmsOrders(); }
  };

  const exportCsv = (rows: LmsOrderRecord[]) => {
    const header = ["الاسم", "البريد", "الهاتف", "الدورة", "المبلغ", "الحالة", "التاريخ"];
    const lines = rows.map((o) => [o.buyerName, o.buyerEmail, o.buyerPhone, o.courseTitle || "", o.amount || "", o.status, new Date(o.createdAt).toLocaleDateString("ar-SA")].join(","));
    const blob = new Blob([header.join(",") + "\n" + lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "lms-orders.csv";
    a.click();
  };

  const filteredLmsOrders = lmsOrders.filter((o) => lmsStatusFilter === "all" || o.status === lmsStatusFilter);
  const filteredProgress = progress.filter((p) => {
    if (!progressSearch) return true;
    const q = progressSearch.toLowerCase();
    return (
      (p.userEmail || "").toLowerCase().includes(q) ||
      (p.userFirstName || "").toLowerCase().includes(q) ||
      (p.userLastName || "").toLowerCase().includes(q) ||
      (p.courseTitleAr || "").toLowerCase().includes(q) ||
      (p.courseTitleEn || "").toLowerCase().includes(q)
    );
  });

  const subTabs: { key: SubTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "requests", label: "طلبات التسجيل", icon: <FileText className="w-4 h-4" />, count: requests.length },
    { key: "lms-orders", label: "طلبات الدورات (مدفوعات)", icon: <GraduationCap className="w-4 h-4" />, count: lmsOrders.length },
    { key: "progress", label: "تقدّم الطلاب", icon: <TrendingUp className="w-4 h-4" />, count: progress.length },
  ];

  return (
    <AdminLayout activeKey="enrollments">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {subTabs.map((s) => (
          <button
            key={s.key}
            onClick={() => setSubTab(s.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              subTab === s.key
                ? "bg-primary text-white"
                : "bg-background border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.icon} {s.label} {s.count !== undefined && <span className="text-xs opacity-70">({s.count})</span>}
          </button>
        ))}
      </div>

      {/* REQUESTS */}
      {subTab === "requests" && (
        <Card><CardContent className="p-5">
          <h2 className="font-bold flex items-center gap-2 mb-4"><FileText className="w-5 h-5 text-primary" /> طلبات التسجيل ({requests.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-muted-foreground">
                <th className="text-start py-2 px-3 font-medium">الاسم</th>
                <th className="text-start py-2 px-3 font-medium">البريد</th>
                <th className="text-start py-2 px-3 font-medium">الفئة</th>
                <th className="text-start py-2 px-3 font-medium">الهدف</th>
                <th className="text-start py-2 px-3 font-medium">البرنامج</th>
                <th className="text-start py-2 px-3 font-medium">الحالة</th>
                <th className="text-start py-2 px-3 font-medium">التاريخ</th>
                <th className="text-end py-2 px-3 font-medium">إجراءات</th>
              </tr></thead>
              <tbody>
                {requests.map((r) => {
                  const fd = (r.formData ?? {}) as Record<string, unknown>;
                  const audience = typeof fd.audience === "string" ? fd.audience : null;
                  const goal = typeof fd.goal === "string" ? fd.goal : null;
                  const goalText = typeof fd.goalText === "string" ? fd.goalText : null;
                  // Accept boolean (normalized server-side) OR legacy "true" string for backward compatibility
                  const recommended = fd.recommended === true || fd.recommended === "true";
                  const audienceLabel = audience === "teacher" ? "معلّم"
                    : audience === "parent" ? "ولي أمر"
                    : audience === "institution" ? "مؤسسة"
                    : audience === "individual" ? "فرد"
                    : (r.applicantType === "institution" ? "مؤسسة" : "فرد");
                  // Map canonical wizard enum keys; fallback to the human label
                  // (goalText) if present; otherwise dash.
                  const goalLabel = goal === "goalConfidence" ? "بناء الثقة"
                    : goal === "goalSpeak" ? "تحدّث بثقة"
                    : goal === "goalCareer" ? "تطوير المسيرة"
                    : goal === "goalTrain" ? "تدريب الآخرين"
                    : goal === "goalTeach" ? "تعليم اللغة"
                    : goal === "goalChild" ? "تنمية ابني"
                    : goal === "goalOther" ? (goalText || "أخرى")
                    : (goalText || "—");
                  return (
                    <tr key={r.id} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="py-2 px-3 font-medium">{r.fullName}</td>
                      <td className="py-2 px-3 text-muted-foreground">{r.email}</td>
                      <td className="py-2 px-3 text-xs">{audienceLabel}</td>
                      <td className="py-2 px-3 text-xs">{goalLabel}</td>
                      <td className="py-2 px-3 text-xs">
                        {r.programId}
                        {recommended && <span className="ms-1 inline-block bg-accent/20 text-accent-foreground text-[10px] px-1.5 py-0.5 rounded-full">مُقترح</span>}
                      </td>
                      <td className="py-2 px-3"><StatusBadge status={r.status} /></td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("ar-SA")}</td>
                      <td className="py-2 px-3 text-end">
                        {(r.status === "pending" || r.status === "new") && (
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => updateRequestStatus(r.id, "approved")} className="h-7 w-7 p-0 text-green-600"><CheckCircle className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => updateRequestStatus(r.id, "rejected")} className="h-7 w-7 p-0 text-destructive"><XCircle className="w-3.5 h-3.5" /></Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {requests.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">لا توجد طلبات</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      )}

      {/* LMS ORDERS (course payments) */}
      {subTab === "lms-orders" && (
        <Card><CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-bold flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary" /> طلبات الدورات ({filteredLmsOrders.length})</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {(["all", "pending", "paid", "cancelled"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setLmsStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    lmsStatusFilter === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s === "all" ? "الكل" : s === "pending" ? "قيد المراجعة" : s === "paid" ? "مدفوع" : "ملغى"}
                </button>
              ))}
              <Button size="sm" variant="outline" onClick={() => exportCsv(filteredLmsOrders)} className="h-7 text-xs gap-1">
                <FileText className="w-3 h-3" /> تصدير CSV
              </Button>
            </div>
          </div>

          {/* Manual enroll */}
          <div className="mb-4">
            <Button size="sm" variant="outline" onClick={() => setShowEnrollForm(!showEnrollForm)} className="gap-1 text-xs h-7">
              <UserPlus className="w-3 h-3" /> تسجيل يدوي
            </Button>
            {showEnrollForm && (
              <div className="mt-2 flex flex-wrap gap-2 items-end">
                <select value={enrollForm.userId} onChange={(e) => setEnrollForm({ ...enrollForm, userId: e.target.value })} className="border rounded-lg p-1.5 text-xs bg-background">
                  <option value="">اختر المستخدم...</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
                </select>
                <select value={enrollForm.courseId} onChange={(e) => setEnrollForm({ ...enrollForm, courseId: e.target.value })} className="border rounded-lg p-1.5 text-xs bg-background">
                  <option value="">اختر الدورة...</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.titleAr}</option>)}
                </select>
                <Button size="sm" onClick={enrollUser} disabled={!enrollForm.userId || !enrollForm.courseId} className="bg-primary text-white h-7 text-xs">تسجيل</Button>
                <Button size="sm" variant="outline" onClick={() => setShowEnrollForm(false)} className="h-7 text-xs">إلغاء</Button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-muted-foreground">
                <th className="text-start py-2 px-3 font-medium">التاريخ</th>
                <th className="text-start py-2 px-3 font-medium">الاسم</th>
                <th className="text-start py-2 px-3 font-medium">البريد</th>
                <th className="text-start py-2 px-3 font-medium">الهاتف</th>
                <th className="text-start py-2 px-3 font-medium">الدورة</th>
                <th className="text-start py-2 px-3 font-medium">المبلغ</th>
                <th className="text-start py-2 px-3 font-medium">ملاحظات</th>
                <th className="text-start py-2 px-3 font-medium">الحالة</th>
                <th className="text-end py-2 px-3 font-medium">إجراءات</th>
              </tr></thead>
              <tbody>
                {filteredLmsOrders.map((o) => (
                  <tr key={o.id} className="border-b border-border/30 hover:bg-muted/20">
                    <td className="py-2 px-3 text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("ar-SA")}</td>
                    <td className="py-2 px-3 font-medium">{o.buyerName}</td>
                    <td className="py-2 px-3 text-muted-foreground text-xs" dir="ltr">{o.buyerEmail}</td>
                    <td className="py-2 px-3 text-muted-foreground text-xs" dir="ltr">{o.buyerPhone}</td>
                    <td className="py-2 px-3 text-xs">{o.courseTitle || "—"}</td>
                    <td className="py-2 px-3 font-bold text-primary">{o.amount ? `${o.amount} JOD` : "—"}</td>
                    <td className="py-2 px-3 text-xs text-muted-foreground max-w-[120px] truncate">{o.paymentNotes || "—"}</td>
                    <td className="py-2 px-3"><StatusBadge status={o.status} /></td>
                    <td className="py-2 px-3 text-end">
                      {o.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" onClick={() => updateLmsOrderStatus(o.id, "paid")} className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white gap-1"><CheckCircle className="w-3 h-3" /> قبول</Button>
                          <Button size="sm" variant="outline" onClick={() => updateLmsOrderStatus(o.id, "cancelled")} className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 border-destructive/30 gap-1"><XCircle className="w-3 h-3" /> رفض</Button>
                        </div>
                      ) : (
                        <select value={o.status} onChange={(e) => updateLmsOrderStatus(o.id, e.target.value)} className="text-xs border rounded p-1 bg-background">
                          <option value="pending">قيد المراجعة</option>
                          <option value="paid">مدفوع</option>
                          <option value="cancelled">ملغى</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredLmsOrders.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">لا توجد طلبات</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      )}

      {/* PROGRESS */}
      {subTab === "progress" && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  تقدّم الطلاب في الدورات
                </h2>
                <p className="text-xs text-muted-foreground mt-1">عرض نسبة إكمال كل طالب في كل دورة مسجل بها</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={progressSearch}
                  onChange={(e) => setProgressSearch(e.target.value)}
                  placeholder="بحث بالاسم/الإيميل/الدورة..."
                  className="text-xs h-8 w-full sm:w-64"
                />
                <Button size="sm" variant="outline" onClick={fetchProgress} className="h-8 text-xs gap-1 shrink-0">
                  <TrendingUp className="w-3.5 h-3.5" /> تحديث
                </Button>
              </div>
            </div>

            {filteredProgress.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {progress.length === 0 ? "لا توجد تسجيلات بعد." : "لا توجد نتائج مطابقة."}
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-muted/40 text-right">
                    <tr>
                      <th className="px-3 py-2 font-semibold">الطالب</th>
                      <th className="px-3 py-2 font-semibold">الدورة</th>
                      <th className="px-3 py-2 font-semibold">التقدّم</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap">الدروس</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap">الحالة</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap">آخر نشاط</th>
                      <th className="px-3 py-2 font-semibold text-end">ملاحظاتي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProgress.map((p) => {
                      const fullName = [p.userFirstName, p.userLastName].filter(Boolean).join(" ") || "—";
                      const last = p.lastActivityAt ? new Date(p.lastActivityAt).toLocaleDateString("ar-EG") : "—";
                      return (
                        <>
                        <tr key={p.enrollmentId} className="border-t border-border hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-2.5">
                            <div className="font-medium">{fullName}</div>
                            <div className="text-[11px] text-muted-foreground" dir="ltr">{p.userEmail || "—"}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="font-medium">{p.courseTitleAr || p.courseTitleEn || "—"}</div>
                          </td>
                          <td className="px-3 py-2.5 min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${p.progressPct === 100 ? "bg-green-600" : "bg-primary"}`}
                                  style={{ width: `${p.progressPct}%` }}
                                />
                              </div>
                              <span className="font-bold text-xs w-10 text-end">{p.progressPct}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                            {p.completedLessons} / {p.totalLessons}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              p.status === "active" ? "bg-green-100 text-green-700" :
                              p.status === "completed" ? "bg-blue-100 text-blue-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {p.status === "active" ? "نشط" : p.status === "completed" ? "مكتمل" : "معلّق"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-muted-foreground">{last}</td>
                          <td className="px-3 py-2.5 text-end">
                            {(role === "trainer" || role === "admin") && (
                              <button
                                onClick={() => setOpenProgressNotes(openProgressNotes === p.userId ? null : p.userId)}
                                className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900"
                                data-testid={`progress-notes-toggle-${p.userId}`}
                              >
                                <StickyNote className="w-3 h-3" />
                                {openProgressNotes === p.userId ? "إغلاق" : "ملاحظاتي"}
                              </button>
                            )}
                          </td>
                        </tr>
                        {openProgressNotes === p.userId && (
                          <tr key={`${p.enrollmentId}-notes`} className="bg-amber-50/30">
                            <td colSpan={7} className="px-3 py-3">
                              <TrainerNotesPanel
                                learnerId={p.userId}
                                courseId={p.courseId}
                                currentTrainerId={me?.id ?? null}
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
      )}
    </AdminLayout>
  );
}
