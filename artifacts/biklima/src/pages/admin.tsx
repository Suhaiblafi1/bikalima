import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  Trash2,
  Edit3,
  Save,
  X,
  Home,
  Shield,
  TrendingUp,
  UserPlus,
  Calendar,
  LogOut,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Plus,
  Video,
  FileText,
  ShoppingCart,
  CheckCircle,
  Clock,
  XCircle,
  GraduationCap,
} from "lucide-react";

type UserRecord = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
};

type CourseRecord = {
  id: string;
  titleAr: string;
  titleEn: string;
  titleFr: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  descriptionFr: string | null;
  programId: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  lessons: LessonRecord[];
  enrollmentCount: number;
};

type LessonRecord = {
  id: string;
  courseId: string;
  titleAr: string;
  titleEn: string;
  titleFr: string;
  videoUrl: string | null;
  videoType: string;
  durationMinutes: number | null;
  sortOrder: number;
};

type EnrollmentRecord = {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  enrolledAt: string;
  userEmail: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  courseTitle: string | null;
};

type RequestRecord = {
  id: string;
  applicantType: string;
  fullName: string;
  email: string;
  phone: string;
  programId: string;
  trainingType: string | null;
  status: string;
  createdAt: string;
  formData: any;
};

type OrderRecord = {
  id: string;
  workbookId: string;
  quantity: number;
  format: string;
  buyerName: string;
  buyerEmail: string;
  totalPrice: number | null;
  status: string;
  createdAt: string;
};

type Stats = {
  totalUsers: number;
  todaySignups: number;
  weekSignups: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRequests: number;
  totalOrders: number;
};

type AdminTab = "users" | "courses" | "requests" | "orders";

function getApiBase() {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

export default function AdminPanel() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseForm, setCourseForm] = useState({ titleAr: "", titleEn: "", titleFr: "", descriptionAr: "", descriptionEn: "", descriptionFr: "", programId: "", isPublished: false });
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [showLessonForm, setShowLessonForm] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({ titleAr: "", titleEn: "", titleFr: "", videoUrl: "", durationMinutes: "" });
  const [enrollForm, setEnrollForm] = useState({ userId: "", courseId: "" });
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const apiBase = getApiBase();

  const apiFetch = useCallback(async (path: string, opts?: RequestInit) => {
    return fetch(`${apiBase}${path}`, { credentials: "include", ...opts });
  }, [apiBase]);

  const checkAdmin = useCallback(async () => {
    try {
      const res = await apiFetch("/admin/check");
      const data = await res.json();
      setIsAdmin(data.isAdmin);
    } catch { setIsAdmin(false); }
  }, [apiFetch]);

  const fetchAll = useCallback(async () => {
    const [usersRes, coursesRes, requestsRes, ordersRes, statsRes, enrollRes] = await Promise.all([
      apiFetch("/admin/users"), apiFetch("/admin/courses"), apiFetch("/admin/enrollment-requests"),
      apiFetch("/admin/workbook-orders"), apiFetch("/admin/stats"), apiFetch("/admin/enrollments"),
    ]);
    if (usersRes.ok) { const d = await usersRes.json(); setUsers(d.users); }
    if (coursesRes.ok) { const d = await coursesRes.json(); setCourses(d.courses); }
    if (requestsRes.ok) { const d = await requestsRes.json(); setRequests(d.requests); }
    if (ordersRes.ok) { const d = await ordersRes.json(); setOrders(d.orders); }
    if (statsRes.ok) { const d = await statsRes.json(); setStats(d); }
    if (enrollRes.ok) { const d = await enrollRes.json(); setEnrollments(d.enrollments); }
  }, [apiFetch]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      checkAdmin().then(() => { fetchAll(); setLoading(false); });
    } else if (!isLoading) { setLoading(false); }
  }, [isLoading, isAuthenticated, checkAdmin, fetchAll]);

  const handleDeleteUser = async (id: string) => {
    if (!confirm("حذف هذا المستخدم؟")) return;
    const res = await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) { setUsers(users.filter(u => u.id !== id)); fetchAll(); }
  };

  const startEditUser = (u: UserRecord) => { setEditingId(u.id); setEditForm({ firstName: u.firstName || "", lastName: u.lastName || "", email: u.email }); };

  const saveEditUser = async () => {
    if (!editingId) return;
    const res = await apiFetch(`/admin/users/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    if (res.ok) { const d = await res.json(); setUsers(users.map(u => u.id === editingId ? { ...u, ...d.user } : u)); setEditingId(null); }
  };

  const createCourse = async () => {
    const res = await apiFetch("/admin/courses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(courseForm) });
    if (res.ok) { setShowCourseForm(false); setCourseForm({ titleAr: "", titleEn: "", titleFr: "", descriptionAr: "", descriptionEn: "", descriptionFr: "", programId: "", isPublished: false }); fetchAll(); }
  };

  const updateCourse = async () => {
    if (!editingCourse) return;
    const res = await apiFetch(`/admin/courses/${editingCourse}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(courseForm) });
    if (res.ok) { setEditingCourse(null); fetchAll(); }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("حذف هذه الدورة وجميع دروسها؟")) return;
    await apiFetch(`/admin/courses/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const createLesson = async (courseId: string) => {
    const res = await apiFetch(`/admin/courses/${courseId}/lessons`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...lessonForm, durationMinutes: lessonForm.durationMinutes ? parseInt(lessonForm.durationMinutes) : null }),
    });
    if (res.ok) { setShowLessonForm(null); setLessonForm({ titleAr: "", titleEn: "", titleFr: "", videoUrl: "", durationMinutes: "" }); fetchAll(); }
  };

  const deleteLesson = async (id: string) => {
    if (!confirm("حذف هذا الدرس؟")) return;
    await apiFetch(`/admin/lessons/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const enrollUser = async () => {
    const res = await apiFetch("/admin/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(enrollForm) });
    if (res.ok) { setShowEnrollForm(false); setEnrollForm({ userId: "", courseId: "" }); fetchAll(); }
  };

  const removeEnrollment = async (id: string) => {
    if (!confirm("إلغاء تسجيل هذا الطالب؟")) return;
    await apiFetch(`/admin/enrollments/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const updateRequestStatus = async (id: string, status: string) => {
    await apiFetch(`/admin/enrollment-requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchAll();
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await apiFetch(`/admin/workbook-orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchAll();
  };

  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.email.toLowerCase().includes(q) || (u.firstName || "").toLowerCase().includes(q) || (u.lastName || "").toLowerCase().includes(q);
  });

  if (isLoading || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4"><CardContent className="p-8 text-center">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground mb-6">Please log in to access the admin panel.</p>
          <Button onClick={() => navigate("/dashboard")} className="bg-primary hover:bg-primary/90 text-white">Go to Login</Button>
        </CardContent></Card>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4"><CardContent className="p-8 text-center">
          <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <Button variant="outline" onClick={() => navigate("/")} className="gap-2"><Home className="w-4 h-4" /> Back to Home</Button>
        </CardContent></Card>
      </div>
    );
  }

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "users", label: "المستخدمون", icon: <Users className="w-4 h-4" />, count: stats?.totalUsers },
    { key: "courses", label: "الدورات", icon: <BookOpen className="w-4 h-4" />, count: stats?.totalCourses },
    { key: "requests", label: "طلبات التسجيل", icon: <FileText className="w-4 h-4" />, count: stats?.totalRequests },
    { key: "orders", label: "طلبات الكراسات", icon: <ShoppingCart className="w-4 h-4" />, count: stats?.totalOrders },
  ];

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = { pending: "bg-amber-100 text-amber-800", approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800", confirmed: "bg-blue-100 text-blue-800", shipped: "bg-purple-100 text-purple-800", delivered: "bg-green-100 text-green-800", active: "bg-green-100 text-green-800" };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors[s] || "bg-gray-100 text-gray-800"}`}>{s}</span>;
  };

  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="font-serif text-lg font-bold">لوحة الإدارة — بكلمة</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}><Home className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={logout} className="text-destructive"><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 space-y-6">
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "المستخدمون", value: stats.totalUsers, icon: <Users className="w-5 h-5 text-primary" />, bg: "bg-primary/10" },
              { label: "الدورات", value: stats.totalCourses, icon: <BookOpen className="w-5 h-5 text-blue-600" />, bg: "bg-blue-100" },
              { label: "طلبات التسجيل", value: stats.totalRequests, icon: <FileText className="w-5 h-5 text-amber-600" />, bg: "bg-amber-100" },
              { label: "طلبات الكراسات", value: stats.totalOrders, icon: <ShoppingCart className="w-5 h-5 text-purple-600" />, bg: "bg-purple-100" },
            ].map((s, i) => (
              <Card key={i}><CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>{s.icon}</div>
                <div><p className="text-xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
              </CardContent></Card>
            ))}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${tab === t.key ? "bg-primary text-white" : "bg-background border border-border text-muted-foreground hover:text-foreground"}`}>
              {t.icon} {t.label} {t.count !== undefined && <span className="text-xs opacity-70">({t.count})</span>}
            </button>
          ))}
        </div>

        {tab === "users" && (
          <Card><CardContent className="p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="font-bold flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> المستخدمون</h2>
              <div className="relative w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground">
                  <th className="text-start py-2 px-3 font-medium">الاسم</th>
                  <th className="text-start py-2 px-3 font-medium">البريد</th>
                  <th className="text-start py-2 px-3 font-medium">التسجيل</th>
                  <th className="text-end py-2 px-3 font-medium">إجراءات</th>
                </tr></thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="py-2 px-3">{editingId === u.id ? (
                        <div className="flex gap-1"><Input value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} className="h-7 text-xs w-20" placeholder="الأول" /><Input value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} className="h-7 text-xs w-20" placeholder="العائلة" /></div>
                      ) : <span className="font-medium">{u.firstName || u.lastName ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "—"}</span>}</td>
                      <td className="py-2 px-3 text-muted-foreground">{editingId === u.id ? <Input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="h-7 text-xs w-40" /> : u.email}</td>
                      <td className="py-2 px-3 text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}</td>
                      <td className="py-2 px-3 text-end">
                        {editingId === u.id ? (
                          <><Button variant="ghost" size="sm" onClick={saveEditUser} className="h-7 w-7 p-0 text-green-600"><Save className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="h-7 w-7 p-0"><X className="w-3.5 h-3.5" /></Button></>
                        ) : (
                          <><Button variant="ghost" size="sm" onClick={() => startEditUser(u)} className="h-7 w-7 p-0 text-blue-600"><Edit3 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(u.id)} className="h-7 w-7 p-0 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button></>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        )}

        {tab === "courses" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> الدورات</h2>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setShowEnrollForm(!showEnrollForm)} variant="outline" className="gap-1"><GraduationCap className="w-4 h-4" /> تسجيل طالب</Button>
                <Button size="sm" onClick={() => { setShowCourseForm(true); setEditingCourse(null); setCourseForm({ titleAr: "", titleEn: "", titleFr: "", descriptionAr: "", descriptionEn: "", descriptionFr: "", programId: "", isPublished: false }); }} className="gap-1 bg-primary text-white"><Plus className="w-4 h-4" /> دورة جديدة</Button>
              </div>
            </div>

            {showEnrollForm && (
              <Card><CardContent className="p-4 space-y-3">
                <h3 className="font-bold text-sm">تسجيل طالب في دورة</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select value={enrollForm.userId} onChange={e => setEnrollForm({...enrollForm, userId: e.target.value})} className="border rounded-lg p-2 text-sm bg-background">
                    <option value="">اختر المستخدم...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.email} {u.firstName ? `(${u.firstName})` : ""}</option>)}
                  </select>
                  <select value={enrollForm.courseId} onChange={e => setEnrollForm({...enrollForm, courseId: e.target.value})} className="border rounded-lg p-2 text-sm bg-background">
                    <option value="">اختر الدورة...</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.titleAr}</option>)}
                  </select>
                  <Button onClick={enrollUser} disabled={!enrollForm.userId || !enrollForm.courseId} size="sm" className="bg-primary text-white">تسجيل</Button>
                </div>
                {enrollments.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-xs font-bold text-muted-foreground mb-2">التسجيلات الحالية ({enrollments.length})</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {enrollments.map(e => (
                        <div key={e.id} className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded">
                          <span>{e.userEmail} → {e.courseTitle}</span>
                          <div className="flex items-center gap-2">
                            {statusBadge(e.status)}
                            <button onClick={() => removeEnrollment(e.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent></Card>
            )}

            {showCourseForm && (
              <Card><CardContent className="p-4 space-y-3">
                <h3 className="font-bold">{editingCourse ? "تعديل الدورة" : "دورة جديدة"}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input placeholder="العنوان (عربي) *" value={courseForm.titleAr} onChange={e => setCourseForm({...courseForm, titleAr: e.target.value})} />
                  <Input placeholder="Title (English) *" value={courseForm.titleEn} onChange={e => setCourseForm({...courseForm, titleEn: e.target.value})} />
                  <Input placeholder="Titre (Français) *" value={courseForm.titleFr} onChange={e => setCourseForm({...courseForm, titleFr: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input placeholder="الوصف (عربي)" value={courseForm.descriptionAr} onChange={e => setCourseForm({...courseForm, descriptionAr: e.target.value})} />
                  <Input placeholder="Description (EN)" value={courseForm.descriptionEn} onChange={e => setCourseForm({...courseForm, descriptionEn: e.target.value})} />
                  <Input placeholder="Description (FR)" value={courseForm.descriptionFr} onChange={e => setCourseForm({...courseForm, descriptionFr: e.target.value})} />
                </div>
                <div className="flex items-center gap-3">
                  <Input placeholder="معرّف البرنامج (اختياري)" value={courseForm.programId} onChange={e => setCourseForm({...courseForm, programId: e.target.value})} className="w-48" />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={courseForm.isPublished} onChange={e => setCourseForm({...courseForm, isPublished: e.target.checked})} />
                    منشور
                  </label>
                  <div className="flex gap-2 ms-auto">
                    <Button size="sm" variant="outline" onClick={() => { setShowCourseForm(false); setEditingCourse(null); }}>إلغاء</Button>
                    <Button size="sm" className="bg-primary text-white" onClick={editingCourse ? updateCourse : createCourse}>{editingCourse ? "حفظ" : "إنشاء"}</Button>
                  </div>
                </div>
              </CardContent></Card>
            )}

            {courses.map(course => (
              <Card key={course.id} className={`${course.isPublished ? "border-primary/30" : "border-border opacity-70"}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{course.titleAr}</h3>
                      <p className="text-xs text-muted-foreground">{course.titleEn} • {course.titleFr}</p>
                      {course.descriptionAr && <p className="text-sm text-muted-foreground mt-1">{course.descriptionAr}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {course.isPublished ? <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">منشور</span> : <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">مسودة</span>}
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{course.enrollmentCount} مسجّل</span>
                      <Button variant="ghost" size="sm" onClick={() => { setEditingCourse(course.id); setCourseForm({ titleAr: course.titleAr, titleEn: course.titleEn, titleFr: course.titleFr, descriptionAr: course.descriptionAr || "", descriptionEn: course.descriptionEn || "", descriptionFr: course.descriptionFr || "", programId: course.programId || "", isPublished: course.isPublished }); setShowCourseForm(true); }} className="h-7 w-7 p-0 text-blue-600"><Edit3 className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteCourse(course.id)} className="h-7 w-7 p-0 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold flex items-center gap-1"><Video className="w-4 h-4" /> الدروس ({course.lessons.length})</h4>
                      <Button variant="outline" size="sm" onClick={() => setShowLessonForm(showLessonForm === course.id ? null : course.id)} className="h-7 text-xs gap-1"><Plus className="w-3 h-3" /> درس</Button>
                    </div>

                    {showLessonForm === course.id && (
                      <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Input placeholder="عنوان الدرس (عربي)" value={lessonForm.titleAr} onChange={e => setLessonForm({...lessonForm, titleAr: e.target.value})} className="text-sm" />
                          <Input placeholder="Lesson Title (EN)" value={lessonForm.titleEn} onChange={e => setLessonForm({...lessonForm, titleEn: e.target.value})} className="text-sm" />
                          <Input placeholder="Titre (FR)" value={lessonForm.titleFr} onChange={e => setLessonForm({...lessonForm, titleFr: e.target.value})} className="text-sm" />
                        </div>
                        <div className="flex gap-2">
                          <Input placeholder="رابط الفيديو (YouTube/Vimeo)" value={lessonForm.videoUrl} onChange={e => setLessonForm({...lessonForm, videoUrl: e.target.value})} className="text-sm flex-1" />
                          <Input placeholder="المدة (دقيقة)" value={lessonForm.durationMinutes} onChange={e => setLessonForm({...lessonForm, durationMinutes: e.target.value})} className="text-sm w-28" type="number" />
                          <Button size="sm" onClick={() => createLesson(course.id)} className="bg-primary text-white">إضافة</Button>
                        </div>
                      </div>
                    )}

                    {course.lessons.map((lesson, idx) => (
                      <div key={lesson.id} className="flex items-center gap-3 bg-background border rounded-lg p-3">
                        <span className="text-xs font-bold text-muted-foreground w-6 text-center">{idx + 1}</span>
                        <Video className="w-4 h-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{lesson.titleAr}</p>
                          <p className="text-[10px] text-muted-foreground">{lesson.videoUrl ? "فيديو مرفق" : "بدون فيديو"} {lesson.durationMinutes ? `• ${lesson.durationMinutes} دقيقة` : ""}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteLesson(lesson.id)} className="h-7 w-7 p-0 text-destructive shrink-0"><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {courses.length === 0 && (
              <Card><CardContent className="p-12 text-center text-muted-foreground">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>لا توجد دورات بعد. أنشئ دورة جديدة للبدء.</p>
              </CardContent></Card>
            )}
          </div>
        )}

        {tab === "requests" && (
          <Card><CardContent className="p-5">
            <h2 className="font-bold flex items-center gap-2 mb-4"><FileText className="w-5 h-5 text-primary" /> طلبات التسجيل ({requests.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground">
                  <th className="text-start py-2 px-3 font-medium">الاسم</th>
                  <th className="text-start py-2 px-3 font-medium">البريد</th>
                  <th className="text-start py-2 px-3 font-medium">النوع</th>
                  <th className="text-start py-2 px-3 font-medium">البرنامج</th>
                  <th className="text-start py-2 px-3 font-medium">الحالة</th>
                  <th className="text-start py-2 px-3 font-medium">التاريخ</th>
                  <th className="text-end py-2 px-3 font-medium">إجراءات</th>
                </tr></thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="py-2 px-3 font-medium">{r.fullName}</td>
                      <td className="py-2 px-3 text-muted-foreground">{r.email}</td>
                      <td className="py-2 px-3">{r.applicantType === "institution" ? "مؤسسة" : "فرد"}</td>
                      <td className="py-2 px-3">{r.programId}</td>
                      <td className="py-2 px-3">{statusBadge(r.status)}</td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("ar-SA")}</td>
                      <td className="py-2 px-3 text-end">
                        <div className="flex items-center justify-end gap-1">
                          {r.status === "pending" && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => updateRequestStatus(r.id, "approved")} className="h-7 w-7 p-0 text-green-600"><CheckCircle className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => updateRequestStatus(r.id, "rejected")} className="h-7 w-7 p-0 text-destructive"><XCircle className="w-3.5 h-3.5" /></Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">لا توجد طلبات</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        )}

        {tab === "orders" && (
          <Card><CardContent className="p-5">
            <h2 className="font-bold flex items-center gap-2 mb-4"><ShoppingCart className="w-5 h-5 text-primary" /> طلبات الكراسات ({orders.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground">
                  <th className="text-start py-2 px-3 font-medium">المشتري</th>
                  <th className="text-start py-2 px-3 font-medium">الكراسة</th>
                  <th className="text-start py-2 px-3 font-medium">الصيغة</th>
                  <th className="text-start py-2 px-3 font-medium">الكمية</th>
                  <th className="text-start py-2 px-3 font-medium">المجموع</th>
                  <th className="text-start py-2 px-3 font-medium">الحالة</th>
                  <th className="text-start py-2 px-3 font-medium">التاريخ</th>
                  <th className="text-end py-2 px-3 font-medium">إجراءات</th>
                </tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="py-2 px-3 font-medium">{o.buyerName}</td>
                      <td className="py-2 px-3">{o.workbookId}</td>
                      <td className="py-2 px-3">{o.format === "pdf" ? "رقمية" : "مطبوعة"}</td>
                      <td className="py-2 px-3">{o.quantity}</td>
                      <td className="py-2 px-3 font-bold">{o.totalPrice} JOD</td>
                      <td className="py-2 px-3">{statusBadge(o.status)}</td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("ar-SA")}</td>
                      <td className="py-2 px-3 text-end">
                        <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)} className="text-xs border rounded p-1 bg-background">
                          <option value="pending">قيد المراجعة</option>
                          <option value="confirmed">مؤكد</option>
                          <option value="shipped">تم الشحن</option>
                          <option value="delivered">تم التوصيل</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">لا توجد طلبات</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        )}
      </main>
    </div>
  );
}
