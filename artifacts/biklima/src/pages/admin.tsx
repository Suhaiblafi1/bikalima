import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/app-shell";
import AdminAssignmentsTab from "@/components/admin-assignments-tab";
import { useLang } from "@/hooks/useLang";
import { useMe, type Role } from "@/hooks/use-me";
import {
  Users, Search, Trash2, Edit3, Save, X, Home, Shield, UserPlus,
  ChevronDown, ChevronUp, BookOpen, Plus, Video, FileText, ClipboardList,
  ShoppingCart, CheckCircle, Clock, XCircle, GraduationCap,
  BarChart3, DollarSign, TrendingUp, Copy,
  Star, UserCircle, Layers,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type UserRecord = { id: string; email: string; firstName: string | null; lastName: string | null; role: Role; createdAt: string };

type CourseTrainerRecord = { id: string; userId: string; courseId: string; assignedAt: string; email: string; firstName: string | null; lastName: string | null; role: Role };

type SectionRecord = { id: string; courseId: string; titleAr: string; titleEn: string; sortOrder: number; isPublished: boolean };

type LessonResource = { titleAr: string; titleEn: string; url: string; type: string };
type LessonRecord = {
  id: string; courseId: string; sectionId: string | null; titleAr: string; titleEn: string;
  videoUrl: string | null; videoType: string; durationMinutes: number | null;
  sortOrder: number; isFreePreview: boolean; isPublished: boolean;
  descriptionAr: string | null; descriptionEn: string | null;
  resources: LessonResource[] | null;
};

type InstructorRecord = { id: string; nameAr: string; nameEn: string; bioAr: string | null; bioEn: string | null; photoUrl: string | null; email: string | null };

type CourseRecord = {
  id: string; slug: string | null; titleAr: string; titleEn: string; titleFr: string;
  subtitleAr: string | null; subtitleEn: string | null;
  descriptionAr: string | null; descriptionEn: string | null;
  imageUrl: string | null; trailerUrl: string | null;
  price: number | null; discountPrice: number | null;
  level: string | null; language: string | null; category: string | null;
  instructorId: string | null; programId: string | null;
  whatYouLearnAr: string[] | null; whatYouLearnEn: string[] | null;
  requirementsAr: string[] | null; requirementsEn: string[] | null;
  targetAudienceAr: string | null; targetAudienceEn: string | null;
  seoTitle: string | null; seoDescription: string | null;
  isPublished: boolean; isFeatured: boolean;
  lessons: LessonRecord[]; sections: SectionRecord[]; enrollmentCount: number;
};

type EnrollmentRecord = { id: string; userId: string; courseId: string; status: string; enrolledAt: string; userEmail: string | null; userFirstName: string | null; userLastName: string | null; courseTitle: string | null };
type RequestRecord = { id: string; applicantType: string; fullName: string; email: string; phone: string; programId: string; trainingType: string | null; status: string; createdAt: string; formData: any };
type OrderRecord = { id: string; workbookId: string; quantity: number; format: string; buyerName: string; buyerEmail: string; totalPrice: number | null; status: string; createdAt: string };
type LmsOrderRecord = { id: string; userId: string | null; courseId: string | null; courseTitle: string | null; buyerName: string; buyerEmail: string; buyerPhone: string; amount: number | null; currency: string; status: string; paymentNotes: string | null; adminNotes: string | null; createdAt: string };

type Stats = { totalUsers: number; todaySignups: number; weekSignups: number; totalCourses: number; totalEnrollments: number; totalRequests: number; totalOrders: number; totalLmsOrders?: number };

type RevenueCourse = { courseId: string | null; courseTitleAr: string | null; courseTitleEn: string | null; revenue: number; orders: number };
type RevenueDay = { date: string; revenue: number; count: number };
type TopEnrolled = { courseId: string | null; courseTitleAr: string | null; courseTitleEn: string | null; enrollments: number };
type RevenueData = { totalRevenue: number; paidOrders: number; pendingRevenue: number; pendingOrders: number; cancelledOrders: number; byCourse: RevenueCourse[]; last30Days: RevenueDay[]; topEnrolled: TopEnrolled[] };

type LessonEditForm = {
  titleAr: string; titleEn: string; videoUrl: string; videoType: string;
  durationMinutes: string; sectionId: string; isFreePreview: boolean;
  isPublished: boolean; descriptionAr: string; descriptionEn: string;
};

type AdminTab = "users" | "courses" | "requests" | "orders" | "lms-orders" | "revenue" | "instructors" | "student-progress" | "assignments" | "trainers";

// Which roles can see each tab. Admin sees all by default.
const TAB_VISIBILITY: Record<AdminTab, Role[]> = {
  users: ["admin"],
  courses: ["admin", "trainer"],
  trainers: ["admin"],
  instructors: ["admin"],
  requests: ["admin", "sales"],
  orders: ["admin", "sales"],
  "lms-orders": ["admin", "sales"],
  "student-progress": ["admin", "trainer"],
  assignments: ["admin", "trainer"],
  revenue: ["admin"],
};

const ROLE_LABELS_AR: Record<Role, string> = {
  admin: "مدير", trainer: "مدرّب", student: "طالب", sales: "مبيعات/دعم",
};

// Standardized order/request status set going forward.
const ORDER_STATUS_OPTIONS: { value: string; labelAr: string }[] = [
  { value: "new", labelAr: "جديد" },
  { value: "contacted", labelAr: "تم التواصل" },
  { value: "paid", labelAr: "مدفوع" },
  { value: "completed", labelAr: "مكتمل" },
  { value: "cancelled", labelAr: "ملغى" },
];

type StudentProgressRecord = {
  enrollmentId: string;
  userId: string;
  courseId: string;
  status: string;
  enrolledAt: string;
  userEmail: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  courseTitleAr: string | null;
  courseTitleEn: string | null;
  courseSlug: string | null;
  totalLessons: number;
  completedLessons: number;
  progressPct: number;
  lastActivityAt: string | null;
};

function getApiBase() {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

// ── Helpers ────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    pending: "قيد المراجعة", approved: "مقبول", rejected: "مرفوض",
    confirmed: "مؤكد", shipped: "تم الشحن", delivered: "تم التوصيل",
    active: "نشط", paid: "مدفوع", cancelled: "ملغى", suspended: "موقوف",
  };
  const colors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800", approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800", confirmed: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800", delivered: "bg-green-100 text-green-800",
    active: "bg-green-100 text-green-800", paid: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800", suspended: "bg-orange-100 text-orange-800",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors[status] || "bg-gray-100 text-gray-800"}`}>{labels[status] || status}</span>;
}

function BulletEditor({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [text, setText] = useState(value.join("\n"));
  const handleBlur = () => onChange(text.split("\n").map(s => s.trim()).filter(Boolean));
  return (
    <textarea
      className="w-full border rounded-lg p-2 text-sm resize-none bg-background"
      rows={4}
      value={text}
      onChange={e => setText(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
    />
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const { user: me, role: myRole, refresh: refreshMe } = useMe();
  const [tab, setTab] = useState<AdminTab>("users");
  const { lang } = useLang();
  const isAdminRole = myRole === "admin";

  // Trainer assignment state (admin-only "trainers" tab)
  const [trainerAssignCourseId, setTrainerAssignCourseId] = useState("");
  const [trainerAssignUserId, setTrainerAssignUserId] = useState("");
  const [courseTrainersByCourse, setCourseTrainersByCourse] = useState<Record<string, CourseTrainerRecord[]>>({});

  // Data state
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [lmsOrders, setLmsOrders] = useState<LmsOrderRecord[]>([]);
  const [instructors, setInstructors] = useState<InstructorRecord[]>([]);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgressRecord[]>([]);
  const [progressSearch, setProgressSearch] = useState("");

  // UI state
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "" });
  const [lmsOrderStatusFilter, setLmsOrderStatusFilter] = useState("all");

  // Course builder state
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const blankCourse = () => ({
    titleAr: "", titleEn: "", titleFr: "", slug: "", subtitleAr: "", subtitleEn: "",
    descriptionAr: "", descriptionEn: "", imageUrl: "", trailerUrl: "",
    price: "", discountPrice: "", level: "", language: "ar", category: "", instructorId: "",
    programId: "", whatYouLearnAr: [] as string[], whatYouLearnEn: [] as string[],
    requirementsAr: [] as string[], requirementsEn: [] as string[],
    targetAudienceAr: "", targetAudienceEn: "", seoTitle: "", seoDescription: "",
    isPublished: false, isFeatured: false,
  });
  const [courseForm, setCourseForm] = useState(blankCourse());

  // Section/lesson state
  const [showSectionForm, setShowSectionForm] = useState<string | null>(null);
  const [sectionForm, setSectionForm] = useState({ titleAr: "", titleEn: "" });
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingSectionForm, setEditingSectionForm] = useState({ titleAr: "", titleEn: "" });
  const [showLessonForm, setShowLessonForm] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({ titleAr: "", titleEn: "", videoUrl: "", videoType: "youtube", durationMinutes: "", sectionId: "", isFreePreview: false, isPublished: true, descriptionAr: "", descriptionEn: "" });
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [editingLessonForm, setEditingLessonForm] = useState<LessonEditForm>({ titleAr: "", titleEn: "", videoUrl: "", videoType: "youtube", durationMinutes: "", sectionId: "", isFreePreview: false, isPublished: true, descriptionAr: "", descriptionEn: "" });

  // Enroll form
  const [enrollForm, setEnrollForm] = useState({ userId: "", courseId: "" });
  const [showEnrollForm, setShowEnrollForm] = useState(false);

  // Instructor form
  const [showInstructorForm, setShowInstructorForm] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<string | null>(null);
  const blankInstructor = () => ({ nameAr: "", nameEn: "", bioAr: "", bioEn: "", photoUrl: "", email: "" });
  const [instructorForm, setInstructorForm] = useState(blankInstructor());

  const apiBase = getApiBase();
  const apiFetch = useCallback(async (path: string, opts?: RequestInit) =>
    fetch(`${apiBase}${path}`, { credentials: "include", ...opts }), [apiBase]);

  const checkAdmin = useCallback(async () => {
    try {
      const res = await apiFetch("/admin/check");
      const data = await res.json();
      // Allow trainer/sales staff into the page; the per-tab role filter
      // (TAB_VISIBILITY) handles what each role can actually see.
      setIsAdmin(!!(data.canAccessAdminArea ?? data.isAdmin));
    } catch { setIsAdmin(false); }
  }, [apiFetch]);

  const fetchAll = useCallback(async () => {
    const [usersRes, coursesRes, requestsRes, ordersRes, statsRes, enrollRes, lmsOrdersRes, instructorsRes] = await Promise.all([
      apiFetch("/admin/users"), apiFetch("/admin/courses"), apiFetch("/admin/enrollment-requests"),
      apiFetch("/admin/workbook-orders"), apiFetch("/admin/stats"), apiFetch("/admin/enrollments"),
      apiFetch("/admin/lms-orders"), apiFetch("/admin/instructors"),
    ]);
    if (usersRes.ok) setUsers((await usersRes.json()).users);
    if (coursesRes.ok) setCourses((await coursesRes.json()).courses);
    if (requestsRes.ok) setRequests((await requestsRes.json()).requests);
    if (ordersRes.ok) setOrders((await ordersRes.json()).orders);
    if (statsRes.ok) setStats(await statsRes.json());
    if (enrollRes.ok) setEnrollments((await enrollRes.json()).enrollments);
    if (lmsOrdersRes.ok) setLmsOrders((await lmsOrdersRes.json()).orders);
    if (instructorsRes.ok) setInstructors((await instructorsRes.json()).instructors);
  }, [apiFetch]);

  const fetchRevenue = useCallback(async () => {
    const res = await apiFetch("/admin/revenue");
    if (res.ok) setRevenue(await res.json());
  }, [apiFetch]);

  const fetchStudentProgress = useCallback(async () => {
    const res = await apiFetch("/admin/student-progress");
    if (res.ok) {
      const data = await res.json();
      setStudentProgress(data.progress ?? []);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      checkAdmin().then(() => { fetchAll(); setLoading(false); });
    } else if (!isLoading) { setLoading(false); }
  }, [isLoading, isAuthenticated, checkAdmin, fetchAll]);

  useEffect(() => {
    if (tab === "revenue" && !revenue) fetchRevenue();
    if (tab === "student-progress" && studentProgress.length === 0) fetchStudentProgress();
  }, [tab, revenue, fetchRevenue, studentProgress.length, fetchStudentProgress]);

  // ── User handlers ──────────────────────────────────────────────────────
  const handleDeleteUser = async (id: string) => {
    if (!confirm("حذف هذا المستخدم؟")) return;
    const res = await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) { setUsers(u => u.filter(u => u.id !== id)); }
  };
  const startEditUser = (u: UserRecord) => { setEditingId(u.id); setEditForm({ firstName: u.firstName || "", lastName: u.lastName || "", email: u.email }); };
  const saveEditUser = async () => {
    if (!editingId) return;
    const res = await apiFetch(`/admin/users/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    if (res.ok) { const d = await res.json(); setUsers(u => u.map(x => x.id === editingId ? { ...x, ...d.user } : x)); setEditingId(null); }
  };

  // ── Course handlers ────────────────────────────────────────────────────
  const startEditCourse = (c: CourseRecord) => {
    setEditingCourse(c.id);
    setCourseForm({
      titleAr: c.titleAr, titleEn: c.titleEn, titleFr: c.titleFr || "",
      slug: c.slug || "", subtitleAr: c.subtitleAr || "", subtitleEn: c.subtitleEn || "",
      descriptionAr: c.descriptionAr || "", descriptionEn: c.descriptionEn || "",
      imageUrl: c.imageUrl || "", trailerUrl: c.trailerUrl || "",
      price: c.price?.toString() || "", discountPrice: c.discountPrice?.toString() || "",
      level: c.level || "", language: c.language || "ar", category: c.category || "",
      instructorId: c.instructorId || "", programId: c.programId || "",
      whatYouLearnAr: c.whatYouLearnAr || [], whatYouLearnEn: c.whatYouLearnEn || [],
      requirementsAr: c.requirementsAr || [], requirementsEn: c.requirementsEn || [],
      targetAudienceAr: c.targetAudienceAr || "", targetAudienceEn: c.targetAudienceEn || "",
      seoTitle: c.seoTitle || "", seoDescription: c.seoDescription || "",
      isPublished: c.isPublished, isFeatured: c.isFeatured,
    });
    setShowCourseForm(true);
  };

  const coursePayload = () => ({
    ...courseForm,
    price: courseForm.price ? parseInt(courseForm.price) : null,
    discountPrice: courseForm.discountPrice ? parseInt(courseForm.discountPrice) : null,
    instructorId: courseForm.instructorId || null,
    slug: courseForm.slug || null,
  });

  const createCourse = async () => {
    const res = await apiFetch("/admin/courses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(coursePayload()) });
    if (res.ok) { setShowCourseForm(false); setCourseForm(blankCourse()); fetchAll(); }
  };

  const updateCourse = async () => {
    if (!editingCourse) return;
    const res = await apiFetch(`/admin/courses/${editingCourse}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(coursePayload()) });
    if (res.ok) { setEditingCourse(null); setShowCourseForm(false); fetchAll(); }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("حذف هذه الدورة وجميع دروسها؟")) return;
    await apiFetch(`/admin/courses/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const duplicateCourse = async (id: string) => {
    const res = await apiFetch(`/admin/courses/${id}/duplicate`, { method: "POST" });
    if (res.ok) fetchAll();
  };

  // ── Section handlers ───────────────────────────────────────────────────
  const createSection = async (courseId: string) => {
    if (!sectionForm.titleAr || !sectionForm.titleEn) return;
    const res = await apiFetch(`/admin/courses/${courseId}/sections`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...sectionForm, sortOrder: courses.find(c => c.id === courseId)?.sections.length ?? 0 }),
    });
    if (res.ok) { setShowSectionForm(null); setSectionForm({ titleAr: "", titleEn: "" }); fetchAll(); }
  };

  const updateSection = async (id: string) => {
    const res = await apiFetch(`/admin/sections/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingSectionForm),
    });
    if (res.ok) { setEditingSection(null); fetchAll(); }
  };

  const deleteSection = async (id: string) => {
    if (!confirm("حذف هذا القسم؟")) return;
    await apiFetch(`/admin/sections/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const moveSectionOrder = async (section: SectionRecord, dir: -1 | 1, allSections: SectionRecord[]) => {
    const newOrder = section.sortOrder + dir;
    const swap = allSections.find(s => s.sortOrder === newOrder);
    await apiFetch(`/admin/sections/${section.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: newOrder }) });
    if (swap) await apiFetch(`/admin/sections/${swap.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: section.sortOrder }) });
    fetchAll();
  };

  // ── Lesson handlers ────────────────────────────────────────────────────
  const createLesson = async (courseId: string) => {
    const res = await apiFetch(`/admin/courses/${courseId}/lessons`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...lessonForm,
        durationMinutes: lessonForm.durationMinutes ? parseInt(lessonForm.durationMinutes) : null,
        sectionId: lessonForm.sectionId || null,
      }),
    });
    if (res.ok) { setShowLessonForm(null); setLessonForm({ titleAr: "", titleEn: "", videoUrl: "", videoType: "youtube", durationMinutes: "", sectionId: "", isFreePreview: false, isPublished: true, descriptionAr: "", descriptionEn: "" }); fetchAll(); }
  };

  const saveLesson = async (id: string) => {
    const res = await apiFetch(`/admin/lessons/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editingLessonForm, durationMinutes: editingLessonForm.durationMinutes ? parseInt(editingLessonForm.durationMinutes) : null, sectionId: editingLessonForm.sectionId || null }),
    });
    if (res.ok) { setEditingLesson(null); fetchAll(); }
  };

  const deleteLesson = async (id: string) => {
    if (!confirm("حذف هذا الدرس؟")) return;
    await apiFetch(`/admin/lessons/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const updateLessonInState = (updatedLesson: LessonRecord) => {
    setCourses(prev => prev.map(c => c.id === updatedLesson.courseId
      ? { ...c, lessons: c.lessons.map(l => l.id === updatedLesson.id ? updatedLesson : l) }
      : c
    ));
  };

  const moveLessonOrder = async (lesson: LessonRecord, dir: -1 | 1, allLessons: LessonRecord[]) => {
    const newOrder = lesson.sortOrder + dir;
    const swap = allLessons.find(l => l.sortOrder === newOrder);
    await apiFetch(`/admin/lessons/${lesson.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: newOrder }) });
    if (swap) await apiFetch(`/admin/lessons/${swap.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: lesson.sortOrder }) });
    fetchAll();
  };

  // ── Enrollment handlers ────────────────────────────────────────────────
  const enrollUser = async () => {
    const res = await apiFetch("/admin/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(enrollForm) });
    if (res.ok) { setShowEnrollForm(false); setEnrollForm({ userId: "", courseId: "" }); fetchAll(); }
  };
  const removeEnrollment = async (id: string) => {
    if (!confirm("إلغاء تسجيل هذا الطالب؟")) return;
    await apiFetch(`/admin/enrollments/${id}`, { method: "DELETE" });
    fetchAll();
  };

  // ── Request / order handlers ───────────────────────────────────────────
  const updateRequestStatus = async (id: string, status: string) => {
    await apiFetch(`/admin/enrollment-requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchAll();
  };
  const updateOrderStatus = async (id: string, status: string) => {
    await apiFetch(`/admin/workbook-orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchAll();
  };
  const updateLmsOrderStatus = async (id: string, status: string) => {
    const res = await apiFetch(`/admin/lms-orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (res.ok) { setLmsOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o)); fetchAll(); }
  };

  // ── Instructor handlers ────────────────────────────────────────────────
  const createInstructor = async () => {
    const res = await apiFetch("/admin/instructors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(instructorForm) });
    if (res.ok) { setShowInstructorForm(false); setInstructorForm(blankInstructor()); fetchAll(); }
  };
  const saveInstructor = async () => {
    if (!editingInstructor) return;
    const res = await apiFetch(`/admin/instructors/${editingInstructor}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(instructorForm) });
    if (res.ok) { setEditingInstructor(null); fetchAll(); }
  };
  const deleteInstructor = async (id: string) => {
    if (!confirm("حذف هذا المدرّب؟")) return;
    await apiFetch(`/admin/instructors/${id}`, { method: "DELETE" });
    fetchAll();
  };

  // ── CSV Export ─────────────────────────────────────────────────────────
  const exportCsv = (rows: LmsOrderRecord[]) => {
    const header = ["الاسم", "البريد", "الهاتف", "الدورة", "المبلغ", "الحالة", "التاريخ"];
    const lines = rows.map(o => [o.buyerName, o.buyerEmail, o.buyerPhone, o.courseTitle || "", o.amount || "", o.status, new Date(o.createdAt).toLocaleDateString("ar-SA")].join(","));
    const blob = new Blob([header.join(",") + "\n" + lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "lms-orders.csv"; a.click();
  };

  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.email.toLowerCase().includes(q) || (u.firstName || "").toLowerCase().includes(q) || (u.lastName || "").toLowerCase().includes(q);
  });
  const filteredLmsOrders = lmsOrders.filter(o => lmsOrderStatusFilter === "all" || o.status === lmsOrderStatusFilter);

  // ── Guards ─────────────────────────────────────────────────────────────
  if (isLoading || loading) return (
    <AppShell containerClassName="flex-1 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </AppShell>
  );
  if (!isAuthenticated) return (
    <AppShell containerClassName="flex-1 flex items-center justify-center p-4">
      <Card className="max-w-md w-full"><CardContent className="p-8 text-center">
        <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
        <Button onClick={() => navigate("/dashboard")} className="bg-primary hover:bg-primary/90 text-white">تسجيل الدخول</Button>
      </CardContent></Card>
    </AppShell>
  );
  if (isAdmin === false) return (
    <AppShell containerClassName="flex-1 flex items-center justify-center p-4">
      <Card className="max-w-md w-full"><CardContent className="p-8 text-center">
        <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <Button variant="outline" onClick={() => navigate("/")} className="gap-2"><Home className="w-4 h-4" /> Back to Home</Button>
      </CardContent></Card>
    </AppShell>
  );

  const allTabs: { key: AdminTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "users", label: "المستخدمون", icon: <Users className="w-4 h-4" />, count: stats?.totalUsers },
    { key: "courses", label: "الدورات", icon: <BookOpen className="w-4 h-4" />, count: stats?.totalCourses },
    { key: "trainers", label: "تعيين المدرّبين", icon: <Shield className="w-4 h-4" /> },
    { key: "instructors", label: "المدربون", icon: <UserCircle className="w-4 h-4" />, count: instructors.length },
    { key: "requests", label: "طلبات التسجيل", icon: <FileText className="w-4 h-4" />, count: stats?.totalRequests },
    { key: "orders", label: "طلبات الكراسات", icon: <ShoppingCart className="w-4 h-4" />, count: stats?.totalOrders },
    { key: "lms-orders", label: "طلبات الدورات", icon: <GraduationCap className="w-4 h-4" />, count: stats?.totalLmsOrders },
    { key: "student-progress", label: "تقدّم الطلاب", icon: <TrendingUp className="w-4 h-4" />, count: stats?.totalEnrollments },
    { key: "assignments", label: "الواجبات والتقييم", icon: <ClipboardList className="w-4 h-4" /> },
    { key: "revenue", label: "الإيرادات", icon: <BarChart3 className="w-4 h-4" /> },
  ];

  // Filter tabs by the current user's role. Admin sees everything; otherwise
  // we only show tabs whose visibility list includes their role.
  const tabs = allTabs.filter((t) => {
    if (!myRole) return false;
    if (myRole === "admin") return true;
    return TAB_VISIBILITY[t.key]?.includes(myRole);
  });

  // If the current tab is no longer visible to this role, snap to the first
  // visible one. Done in an effect so we don't mutate state during render.
  useEffect(() => {
    if (!myRole || tabs.length === 0) return;
    if (!tabs.some((t) => t.key === tab)) {
      setTab(tabs[0].key);
    }
  }, [myRole, tab, tabs]);

  // ── Role + trainer-assignment actions (admin only) ─────────────────────
  const updateUserRole = useCallback(async (userId: string, newRole: Role) => {
    try {
      const res = await apiFetch(`/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "تعذّر تحديث الدور");
        return;
      }
      const data = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: data.user.role } : u)));
      // If the admin changed their own role, reflect it immediately.
      if (me?.id === userId) refreshMe();
    } catch {
      alert("تعذّر تحديث الدور");
    }
  }, [apiFetch, me?.id, refreshMe]);

  const fetchCourseTrainers = useCallback(async (courseId: string) => {
    const res = await apiFetch(`/admin/courses/${courseId}/trainers`);
    if (!res.ok) return;
    const data = await res.json();
    setCourseTrainersByCourse((prev) => ({ ...prev, [courseId]: data.trainers ?? [] }));
  }, [apiFetch]);

  const assignTrainer = useCallback(async () => {
    if (!trainerAssignCourseId || !trainerAssignUserId) return;
    const res = await apiFetch(`/admin/courses/${trainerAssignCourseId}/trainers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: trainerAssignUserId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "تعذّر التعيين");
      return;
    }
    // Refresh list + users (assignment may have auto-promoted to trainer).
    await fetchCourseTrainers(trainerAssignCourseId);
    const usersRes = await apiFetch("/admin/users");
    if (usersRes.ok) setUsers((await usersRes.json()).users);
    setTrainerAssignUserId("");
  }, [apiFetch, fetchCourseTrainers, trainerAssignCourseId, trainerAssignUserId]);

  const removeTrainer = useCallback(async (courseId: string, userId: string) => {
    const res = await apiFetch(`/admin/courses/${courseId}/trainers/${userId}`, { method: "DELETE" });
    if (res.ok) await fetchCourseTrainers(courseId);
  }, [apiFetch, fetchCourseTrainers]);

  // Auto-load the assigned trainers for the selected course.
  useEffect(() => {
    if (tab === "trainers" && trainerAssignCourseId && !courseTrainersByCourse[trainerAssignCourseId]) {
      fetchCourseTrainers(trainerAssignCourseId);
    }
  }, [tab, trainerAssignCourseId, courseTrainersByCourse, fetchCourseTrainers]);

  const filteredProgress = studentProgress.filter(p => {
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

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <AppShell
      containerClassName="bg-muted/30 flex-1"
      breadcrumb={[{ label: lang === "ar" ? "لوحة الإدارة" : "Admin Panel" }]}
    >
      <div className="container mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="font-serif text-lg font-bold">{lang === "ar" ? "لوحة الإدارة" : "Admin Panel"}</h1>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "المستخدمون", value: stats.totalUsers, icon: <Users className="w-5 h-5 text-primary" />, bg: "bg-primary/10" },
              { label: "الدورات", value: stats.totalCourses, icon: <BookOpen className="w-5 h-5 text-blue-600" />, bg: "bg-blue-100" },
              { label: "التسجيلات", value: stats.totalEnrollments, icon: <GraduationCap className="w-5 h-5 text-teal-600" />, bg: "bg-teal-100" },
              { label: "طلبات التسجيل", value: stats.totalRequests, icon: <FileText className="w-5 h-5 text-amber-600" />, bg: "bg-amber-100" },
              { label: "طلبات الكراسات", value: stats.totalOrders, icon: <ShoppingCart className="w-5 h-5 text-purple-600" />, bg: "bg-purple-100" },
              { label: "طلبات الدورات", value: stats.totalLmsOrders ?? 0, icon: <DollarSign className="w-5 h-5 text-green-600" />, bg: "bg-green-100" },
            ].map((s, i) => (
              <Card key={i}><CardContent className="p-3 flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>{s.icon}</div>
                <div><p className="text-lg font-bold leading-none">{s.value}</p><p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p></div>
              </CardContent></Card>
            ))}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${tab === t.key ? "bg-primary text-white" : "bg-background border border-border text-muted-foreground hover:text-foreground"}`}>
              {t.icon} {t.label} {t.count !== undefined && <span className="text-xs opacity-70">({t.count})</span>}
            </button>
          ))}
        </div>

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <Card><CardContent className="p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="font-bold flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> المستخدمون</h2>
              <div className="relative w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground">
                  <th className="text-start py-2 px-3 font-medium">الاسم</th>
                  <th className="text-start py-2 px-3 font-medium">البريد</th>
                  <th className="text-start py-2 px-3 font-medium">الدور</th>
                  <th className="text-start py-2 px-3 font-medium">التسجيل</th>
                  <th className="text-end py-2 px-3 font-medium">إجراءات</th>
                </tr></thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="py-2 px-3">{editingId === u.id ? (
                        <div className="flex gap-1">
                          <Input value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} className="h-7 text-xs w-20" placeholder="الأول" />
                          <Input value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} className="h-7 text-xs w-20" placeholder="العائلة" />
                        </div>
                      ) : <span className="font-medium">{u.firstName || u.lastName ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "—"}</span>}</td>
                      <td className="py-2 px-3 text-muted-foreground">{editingId === u.id ? <Input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="h-7 text-xs w-40" /> : u.email}</td>
                      <td className="py-2 px-3">
                        <select
                          value={u.role}
                          onChange={(e) => updateUserRole(u.id, e.target.value as Role)}
                          className="text-xs border rounded p-1 bg-background"
                          aria-label="الدور"
                        >
                          {(Object.keys(ROLE_LABELS_AR) as Role[]).map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS_AR[r]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString("ar-SA")}</td>
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
                  {filteredUsers.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">لا يوجد مستخدمون</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        )}

        {/* ── COURSES TAB ── */}
        {tab === "courses" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-bold flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> الدورات</h2>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setShowEnrollForm(!showEnrollForm)} variant="outline" className="gap-1"><GraduationCap className="w-4 h-4" /> تسجيل طالب</Button>
                <Button size="sm" onClick={() => { setShowCourseForm(true); setEditingCourse(null); setCourseForm(blankCourse()); }} className="gap-1 bg-primary text-white"><Plus className="w-4 h-4" /> دورة جديدة</Button>
              </div>
            </div>

            {/* Enroll form */}
            {showEnrollForm && (
              <Card><CardContent className="p-4 space-y-3">
                <h3 className="font-bold text-sm">تسجيل طالب في دورة</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select value={enrollForm.userId} onChange={e => setEnrollForm({ ...enrollForm, userId: e.target.value })} className="border rounded-lg p-2 text-sm bg-background">
                    <option value="">اختر المستخدم...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.email} {u.firstName ? `(${u.firstName})` : ""}</option>)}
                  </select>
                  <select value={enrollForm.courseId} onChange={e => setEnrollForm({ ...enrollForm, courseId: e.target.value })} className="border rounded-lg p-2 text-sm bg-background">
                    <option value="">اختر الدورة...</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.titleAr}</option>)}
                  </select>
                  <Button onClick={enrollUser} disabled={!enrollForm.userId || !enrollForm.courseId} size="sm" className="bg-primary text-white">تسجيل</Button>
                </div>
                {enrollments.length > 0 && (
                  <div className="mt-3 max-h-40 overflow-y-auto space-y-1">
                    {enrollments.map(e => (
                      <div key={e.id} className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded">
                        <span>{e.userEmail} → {e.courseTitle}</span>
                        <div className="flex items-center gap-2"><StatusBadge status={e.status} /><button onClick={() => removeEnrollment(e.id)} className="text-destructive"><Trash2 className="w-3 h-3" /></button></div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent></Card>
            )}

            {/* Course form */}
            {showCourseForm && (
              <Card><CardContent className="p-5 space-y-4">
                <h3 className="font-bold text-base border-b pb-2">{editingCourse ? "تعديل الدورة" : "دورة جديدة"}</h3>

                {/* Basic */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">العنوان والمعرّف</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input placeholder="العنوان (عربي) *" value={courseForm.titleAr} onChange={e => setCourseForm({ ...courseForm, titleAr: e.target.value })} />
                    <Input placeholder="Title (English) *" value={courseForm.titleEn} onChange={e => setCourseForm({ ...courseForm, titleEn: e.target.value })} dir="ltr" />
                    <Input placeholder="العنوان الفرعي (عربي)" value={courseForm.subtitleAr} onChange={e => setCourseForm({ ...courseForm, subtitleAr: e.target.value })} />
                    <Input placeholder="Subtitle (English)" value={courseForm.subtitleEn} onChange={e => setCourseForm({ ...courseForm, subtitleEn: e.target.value })} dir="ltr" />
                    <Input placeholder="slug (e.g. influential-speaker)" value={courseForm.slug} onChange={e => setCourseForm({ ...courseForm, slug: e.target.value })} dir="ltr" />
                    <Input placeholder="معرّف البرنامج (اختياري)" value={courseForm.programId} onChange={e => setCourseForm({ ...courseForm, programId: e.target.value })} />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">الوصف</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <textarea className="border rounded-lg p-2 text-sm resize-none bg-background" rows={3} placeholder="الوصف (عربي)" value={courseForm.descriptionAr} onChange={e => setCourseForm({ ...courseForm, descriptionAr: e.target.value })} />
                    <textarea className="border rounded-lg p-2 text-sm resize-none bg-background" rows={3} placeholder="Description (English)" value={courseForm.descriptionEn} onChange={e => setCourseForm({ ...courseForm, descriptionEn: e.target.value })} dir="ltr" />
                  </div>
                </div>

                {/* Media */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">الصور والروابط</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input placeholder="رابط الصورة الغلاف" value={courseForm.imageUrl} onChange={e => setCourseForm({ ...courseForm, imageUrl: e.target.value })} dir="ltr" />
                    <Input placeholder="رابط الفيديو التعريفي (Trailer URL)" value={courseForm.trailerUrl} onChange={e => setCourseForm({ ...courseForm, trailerUrl: e.target.value })} dir="ltr" />
                  </div>
                </div>

                {/* Pricing + meta */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">السعر والتصنيف</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="relative"><Input placeholder="السعر (JOD)" value={courseForm.price} onChange={e => setCourseForm({ ...courseForm, price: e.target.value })} type="number" /><span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">JOD</span></div>
                    <div className="relative"><Input placeholder="سعر بعد الخصم" value={courseForm.discountPrice} onChange={e => setCourseForm({ ...courseForm, discountPrice: e.target.value })} type="number" /><span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">JOD</span></div>
                    <select value={courseForm.level} onChange={e => setCourseForm({ ...courseForm, level: e.target.value })} className="border rounded-lg p-2 text-sm bg-background">
                      <option value="">المستوى...</option>
                      <option value="beginner">مبتدئ</option>
                      <option value="intermediate">متوسط</option>
                      <option value="advanced">متقدم</option>
                    </select>
                    <select value={courseForm.language} onChange={e => setCourseForm({ ...courseForm, language: e.target.value })} className="border rounded-lg p-2 text-sm bg-background">
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <Input placeholder="التصنيف (category)" value={courseForm.category} onChange={e => setCourseForm({ ...courseForm, category: e.target.value })} />
                    <select value={courseForm.instructorId} onChange={e => setCourseForm({ ...courseForm, instructorId: e.target.value })} className="border rounded-lg p-2 text-sm bg-background">
                      <option value="">اختر المدرّب...</option>
                      {instructors.map(i => <option key={i.id} value={i.id}>{i.nameAr} ({i.nameEn})</option>)}
                    </select>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={courseForm.isPublished} onChange={e => setCourseForm({ ...courseForm, isPublished: e.target.checked })} className="w-4 h-4 accent-primary" />
                        منشور
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={courseForm.isFeatured} onChange={e => setCourseForm({ ...courseForm, isFeatured: e.target.checked })} className="w-4 h-4 accent-primary" />
                        مميّز
                      </label>
                    </div>
                  </div>
                </div>

                {/* What you learn */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">ماذا ستتعلم (سطر لكل نقطة)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <BulletEditor value={courseForm.whatYouLearnAr} onChange={v => setCourseForm({ ...courseForm, whatYouLearnAr: v })} placeholder="نقطة باللغة العربية..." />
                    <BulletEditor value={courseForm.whatYouLearnEn} onChange={v => setCourseForm({ ...courseForm, whatYouLearnEn: v })} placeholder="Point in English..." />
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">المتطلبات</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <BulletEditor value={courseForm.requirementsAr} onChange={v => setCourseForm({ ...courseForm, requirementsAr: v })} placeholder="متطلب..." />
                    <BulletEditor value={courseForm.requirementsEn} onChange={v => setCourseForm({ ...courseForm, requirementsEn: v })} placeholder="Requirement..." />
                  </div>
                </div>

                {/* Target audience */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">الجمهور المستهدف</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <textarea className="border rounded-lg p-2 text-sm resize-none bg-background" rows={2} placeholder="الجمهور المستهدف (عربي)" value={courseForm.targetAudienceAr} onChange={e => setCourseForm({ ...courseForm, targetAudienceAr: e.target.value })} />
                    <textarea className="border rounded-lg p-2 text-sm resize-none bg-background" rows={2} placeholder="Target audience (English)" value={courseForm.targetAudienceEn} onChange={e => setCourseForm({ ...courseForm, targetAudienceEn: e.target.value })} dir="ltr" />
                  </div>
                </div>

                {/* SEO */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">SEO</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input placeholder="SEO Title" value={courseForm.seoTitle} onChange={e => setCourseForm({ ...courseForm, seoTitle: e.target.value })} dir="ltr" />
                    <Input placeholder="SEO Description" value={courseForm.seoDescription} onChange={e => setCourseForm({ ...courseForm, seoDescription: e.target.value })} dir="ltr" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" onClick={() => { setShowCourseForm(false); setEditingCourse(null); }}>إلغاء</Button>
                  <Button size="sm" className="bg-primary text-white" onClick={editingCourse ? updateCourse : createCourse}>{editingCourse ? "حفظ التغييرات" : "إنشاء الدورة"}</Button>
                </div>
              </CardContent></Card>
            )}

            {/* Course cards */}
            {courses.map(course => {
              const isExpanded = expandedCourse === course.id;
              const instructor = instructors.find(i => i.id === course.instructorId);
              return (
                <Card key={course.id} className={`${course.isPublished ? "border-primary/30" : "border-border opacity-80"}`}>
                  <CardContent className="p-4">
                    {/* Course header */}
                    <div className="flex items-start gap-3">
                      {course.imageUrl && <img src={course.imageUrl} alt={course.titleAr} className="w-16 h-16 rounded-lg object-cover shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-base leading-snug">{course.titleAr}</h3>
                            <p className="text-xs text-muted-foreground">{course.titleEn}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {course.slug && <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-mono">{course.slug}</span>}
                              {course.price && <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">{course.price} JOD</span>}
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${course.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{course.isPublished ? "منشور" : "مسودة"}</span>
                              {course.isFeatured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{course.enrollmentCount} مسجّل</span>
                              <span className="text-[10px] text-muted-foreground">{course.sections.length} قسم · {course.lessons.length} درس</span>
                              {instructor && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><UserCircle className="w-3 h-3" />{instructor.nameAr}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => setExpandedCourse(isExpanded ? null : course.id)} className="h-7 w-7 p-0 text-muted-foreground">{isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</Button>
                            <Button variant="ghost" size="sm" onClick={() => startEditCourse(course)} className="h-7 w-7 p-0 text-blue-600"><Edit3 className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => duplicateCourse(course.id)} title="تكرار الدورة" className="h-7 w-7 p-0 text-muted-foreground"><Copy className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteCourse(course.id)} className="h-7 w-7 p-0 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded: sections + lessons */}
                    {isExpanded && (
                      <div className="mt-4 border-t pt-4 space-y-4">
                        {/* Sections */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold flex items-center gap-1"><Layers className="w-4 h-4 text-primary" /> الأقسام ({course.sections.length})</h4>
                            <Button variant="outline" size="sm" onClick={() => setShowSectionForm(showSectionForm === course.id ? null : course.id)} className="h-7 text-xs gap-1"><Plus className="w-3 h-3" /> قسم</Button>
                          </div>

                          {showSectionForm === course.id && (
                            <div className="bg-muted/30 p-3 rounded-lg mb-3 flex gap-2 flex-wrap">
                              <Input placeholder="اسم القسم (عربي)" value={sectionForm.titleAr} onChange={e => setSectionForm({ ...sectionForm, titleAr: e.target.value })} className="text-sm flex-1 min-w-32" />
                              <Input placeholder="Section Name (EN)" value={sectionForm.titleEn} onChange={e => setSectionForm({ ...sectionForm, titleEn: e.target.value })} className="text-sm flex-1 min-w-32" dir="ltr" />
                              <Button size="sm" onClick={() => createSection(course.id)} className="bg-primary text-white">إضافة</Button>
                              <Button size="sm" variant="outline" onClick={() => setShowSectionForm(null)}>إلغاء</Button>
                            </div>
                          )}

                          {course.sections.map((section, si) => {
                            const sectionLessons = course.lessons.filter(l => l.sectionId === section.id).sort((a, b) => a.sortOrder - b.sortOrder);
                            return (
                              <div key={section.id} className="border rounded-lg mb-2 overflow-hidden">
                                <div className="bg-muted/30 px-3 py-2 flex items-center gap-2">
                                  <div className="flex flex-col gap-0.5">
                                    <button onClick={() => moveSectionOrder(section, -1, course.sections)} disabled={si === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                                    <button onClick={() => moveSectionOrder(section, 1, course.sections)} disabled={si === course.sections.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                                  </div>
                                  {editingSection === section.id ? (
                                    <>
                                      <Input value={editingSectionForm.titleAr} onChange={e => setEditingSectionForm({ ...editingSectionForm, titleAr: e.target.value })} className="h-6 text-xs flex-1" />
                                      <Input value={editingSectionForm.titleEn} onChange={e => setEditingSectionForm({ ...editingSectionForm, titleEn: e.target.value })} className="h-6 text-xs flex-1" dir="ltr" />
                                      <Button size="sm" onClick={() => updateSection(section.id)} className="h-6 px-2 text-xs bg-primary text-white">حفظ</Button>
                                      <Button size="sm" variant="outline" onClick={() => setEditingSection(null)} className="h-6 px-2 text-xs">إلغاء</Button>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-sm font-semibold flex-1">{section.titleAr}</span>
                                      <span className="text-xs text-muted-foreground flex-1" dir="ltr">{section.titleEn}</span>
                                      <span className="text-xs text-muted-foreground">{sectionLessons.length} درس</span>
                                      <Button variant="ghost" size="sm" onClick={() => { setEditingSection(section.id); setEditingSectionForm({ titleAr: section.titleAr, titleEn: section.titleEn }); }} className="h-6 w-6 p-0 text-blue-600"><Edit3 className="w-3 h-3" /></Button>
                                      <Button variant="ghost" size="sm" onClick={() => deleteSection(section.id)} className="h-6 w-6 p-0 text-destructive"><Trash2 className="w-3 h-3" /></Button>
                                    </>
                                  )}
                                </div>
                                {/* Lessons in section */}
                                <div className="divide-y divide-border/30">
                                  {sectionLessons.map((lesson, li) => (
                                    <LessonRow key={lesson.id} lesson={lesson} idx={li} allLessons={sectionLessons} sections={course.sections}
                                      isEditing={editingLesson === lesson.id}
                                      editForm={editingLessonForm}
                                      setEditForm={setEditingLessonForm}
                                      onEdit={() => { setEditingLesson(lesson.id); setEditingLessonForm({ titleAr: lesson.titleAr, titleEn: lesson.titleEn, videoUrl: lesson.videoUrl || "", videoType: lesson.videoType, durationMinutes: lesson.durationMinutes?.toString() || "", sectionId: lesson.sectionId || "", isFreePreview: lesson.isFreePreview, isPublished: lesson.isPublished, descriptionAr: lesson.descriptionAr || "", descriptionEn: lesson.descriptionEn || "" }); }}
                                      onSave={() => saveLesson(lesson.id)}
                                      onCancel={() => setEditingLesson(null)}
                                      onDelete={() => deleteLesson(lesson.id)}
                                      onMove={(dir) => moveLessonOrder(lesson, dir, sectionLessons)}
                                      onLessonUpdated={updateLessonInState}
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          })}

                          {/* Unsectioned lessons */}
                          {(() => {
                            const unsectioned = course.lessons.filter(l => !l.sectionId).sort((a, b) => a.sortOrder - b.sortOrder);
                            if (unsectioned.length === 0) return null;
                            return (
                              <div className="border rounded-lg overflow-hidden">
                                <div className="bg-muted/20 px-3 py-2"><span className="text-sm font-semibold text-muted-foreground">دروس بدون قسم ({unsectioned.length})</span></div>
                                <div className="divide-y divide-border/30">
                                  {unsectioned.map((lesson, li) => (
                                    <LessonRow key={lesson.id} lesson={lesson} idx={li} allLessons={unsectioned} sections={course.sections}
                                      isEditing={editingLesson === lesson.id}
                                      editForm={editingLessonForm}
                                      setEditForm={setEditingLessonForm}
                                      onEdit={() => { setEditingLesson(lesson.id); setEditingLessonForm({ titleAr: lesson.titleAr, titleEn: lesson.titleEn, videoUrl: lesson.videoUrl || "", videoType: lesson.videoType, durationMinutes: lesson.durationMinutes?.toString() || "", sectionId: lesson.sectionId || "", isFreePreview: lesson.isFreePreview, isPublished: lesson.isPublished, descriptionAr: lesson.descriptionAr || "", descriptionEn: lesson.descriptionEn || "" }); }}
                                      onSave={() => saveLesson(lesson.id)}
                                      onCancel={() => setEditingLesson(null)}
                                      onDelete={() => deleteLesson(lesson.id)}
                                      onMove={(dir) => moveLessonOrder(lesson, dir, unsectioned)}
                                      onLessonUpdated={updateLessonInState}
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Add lesson form */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold flex items-center gap-1"><Video className="w-4 h-4 text-primary" /> إضافة درس جديد</h4>
                            <Button variant="outline" size="sm" onClick={() => setShowLessonForm(showLessonForm === course.id ? null : course.id)} className="h-7 text-xs gap-1"><Plus className="w-3 h-3" /> درس</Button>
                          </div>
                          {showLessonForm === course.id && (
                            <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input placeholder="عنوان الدرس (عربي) *" value={lessonForm.titleAr} onChange={e => setLessonForm({ ...lessonForm, titleAr: e.target.value })} className="text-sm" />
                                <Input placeholder="Lesson Title (EN) *" value={lessonForm.titleEn} onChange={e => setLessonForm({ ...lessonForm, titleEn: e.target.value })} className="text-sm" dir="ltr" />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Input placeholder="رابط الفيديو" value={lessonForm.videoUrl} onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} className="text-sm" dir="ltr" />
                                <select value={lessonForm.videoType} onChange={e => setLessonForm({ ...lessonForm, videoType: e.target.value })} className="border rounded-lg p-2 text-sm bg-background">
                                  <option value="youtube">YouTube</option>
                                  <option value="vimeo">Vimeo</option>
                                  <option value="other">أخرى</option>
                                </select>
                                <Input placeholder="المدة (دقيقة)" value={lessonForm.durationMinutes} onChange={e => setLessonForm({ ...lessonForm, durationMinutes: e.target.value })} className="text-sm" type="number" />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <select value={lessonForm.sectionId} onChange={e => setLessonForm({ ...lessonForm, sectionId: e.target.value })} className="border rounded-lg p-2 text-sm bg-background">
                                  <option value="">بدون قسم</option>
                                  {course.sections.map(s => <option key={s.id} value={s.id}>{s.titleAr}</option>)}
                                </select>
                                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={lessonForm.isFreePreview} onChange={e => setLessonForm({ ...lessonForm, isFreePreview: e.target.checked })} className="w-4 h-4 accent-primary" /> معاينة مجانية</label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={lessonForm.isPublished} onChange={e => setLessonForm({ ...lessonForm, isPublished: e.target.checked })} className="w-4 h-4 accent-primary" /> منشور</label>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => setShowLessonForm(null)}>إلغاء</Button>
                                <Button size="sm" className="bg-primary text-white" onClick={() => createLesson(course.id)} disabled={!lessonForm.titleAr || !lessonForm.titleEn}>إضافة الدرس</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {courses.length === 0 && !showCourseForm && (
              <Card><CardContent className="p-12 text-center text-muted-foreground">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>لا توجد دورات بعد. أنشئ دورة جديدة للبدء.</p>
              </CardContent></Card>
            )}
          </div>
        )}

        {/* ── INSTRUCTORS TAB ── */}
        {tab === "instructors" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2"><UserCircle className="w-5 h-5 text-primary" /> المدربون</h2>
              <Button size="sm" onClick={() => { setShowInstructorForm(true); setEditingInstructor(null); setInstructorForm(blankInstructor()); }} className="gap-1 bg-primary text-white"><Plus className="w-4 h-4" /> مدرّب جديد</Button>
            </div>

            {(showInstructorForm || editingInstructor) && (
              <Card><CardContent className="p-4 space-y-3">
                <h3 className="font-bold text-sm">{editingInstructor ? "تعديل بيانات المدرّب" : "مدرّب جديد"}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input placeholder="الاسم (عربي) *" value={instructorForm.nameAr} onChange={e => setInstructorForm({ ...instructorForm, nameAr: e.target.value })} />
                  <Input placeholder="Name (English) *" value={instructorForm.nameEn} onChange={e => setInstructorForm({ ...instructorForm, nameEn: e.target.value })} dir="ltr" />
                  <Input placeholder="البريد الإلكتروني" value={instructorForm.email} onChange={e => setInstructorForm({ ...instructorForm, email: e.target.value })} dir="ltr" />
                  <Input placeholder="رابط الصورة" value={instructorForm.photoUrl} onChange={e => setInstructorForm({ ...instructorForm, photoUrl: e.target.value })} dir="ltr" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <textarea className="border rounded-lg p-2 text-sm resize-none bg-background" rows={3} placeholder="السيرة الذاتية (عربي)" value={instructorForm.bioAr} onChange={e => setInstructorForm({ ...instructorForm, bioAr: e.target.value })} />
                  <textarea className="border rounded-lg p-2 text-sm resize-none bg-background" rows={3} placeholder="Bio (English)" value={instructorForm.bioEn} onChange={e => setInstructorForm({ ...instructorForm, bioEn: e.target.value })} dir="ltr" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setShowInstructorForm(false); setEditingInstructor(null); }}>إلغاء</Button>
                  <Button size="sm" className="bg-primary text-white" onClick={editingInstructor ? saveInstructor : createInstructor} disabled={!instructorForm.nameAr || !instructorForm.nameEn}>{editingInstructor ? "حفظ" : "إضافة"}</Button>
                </div>
              </CardContent></Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {instructors.map(inst => (
                <Card key={inst.id}><CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {inst.photoUrl ? <img src={inst.photoUrl} alt={inst.nameAr} className="w-14 h-14 rounded-full object-cover shrink-0" /> : <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><UserCircle className="w-7 h-7 text-primary" /></div>}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{inst.nameAr}</p>
                      <p className="text-xs text-muted-foreground truncate" dir="ltr">{inst.nameEn}</p>
                      {inst.email && <p className="text-[11px] text-muted-foreground truncate" dir="ltr">{inst.email}</p>}
                      {inst.bioAr && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{inst.bioAr}</p>}
                    </div>
                  </div>
                  <div className="flex justify-end gap-1 mt-3">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingInstructor(inst.id); setShowInstructorForm(false); setInstructorForm({ nameAr: inst.nameAr, nameEn: inst.nameEn, bioAr: inst.bioAr || "", bioEn: inst.bioEn || "", photoUrl: inst.photoUrl || "", email: inst.email || "" }); }} className="h-7 w-7 p-0 text-blue-600"><Edit3 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteInstructor(inst.id)} className="h-7 w-7 p-0 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent></Card>
              ))}
              {instructors.length === 0 && <div className="col-span-full text-center text-muted-foreground py-8">لا يوجد مدربون بعد.</div>}
            </div>
          </div>
        )}

        {/* ── REQUESTS TAB ── */}
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
                      <td className="py-2 px-3"><StatusBadge status={r.status} /></td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("ar-SA")}</td>
                      <td className="py-2 px-3 text-end">
                        {r.status === "pending" && (
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => updateRequestStatus(r.id, "approved")} className="h-7 w-7 p-0 text-green-600"><CheckCircle className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => updateRequestStatus(r.id, "rejected")} className="h-7 w-7 p-0 text-destructive"><XCircle className="w-3.5 h-3.5" /></Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">لا توجد طلبات</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        )}

        {/* ── WORKBOOK ORDERS TAB ── */}
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
                      <td className="py-2 px-3"><StatusBadge status={o.status} /></td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("ar-SA")}</td>
                      <td className="py-2 px-3 text-end">
                        <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)} className="text-xs border rounded p-1 bg-background">
                          {ORDER_STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.labelAr}</option>)}
                          {/* Show legacy values inline if the row was created before standardization. */}
                          {!ORDER_STATUS_OPTIONS.some(s => s.value === o.status) && <option value={o.status}>{o.status}</option>}
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

        {/* ── LMS ORDERS TAB ── */}
        {tab === "lms-orders" && (
          <Card><CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-bold flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary" /> طلبات الدورات ({lmsOrders.length})</h2>
              <div className="flex items-center gap-2 flex-wrap">
                {(["all", "pending", "paid", "cancelled"] as const).map(s => (
                  <button key={s} onClick={() => setLmsOrderStatusFilter(s)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${lmsOrderStatusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:bg-muted"}`}>
                    {s === "all" ? "الكل" : s === "pending" ? "قيد المراجعة" : s === "paid" ? "مدفوع" : "ملغى"}
                  </button>
                ))}
                <Button size="sm" variant="outline" onClick={() => exportCsv(filteredLmsOrders)} className="h-7 text-xs gap-1"><FileText className="w-3 h-3" /> تصدير CSV</Button>
              </div>
            </div>

            {/* Enroll manual */}
            <div className="mb-4">
              <Button size="sm" variant="outline" onClick={() => setShowEnrollForm(!showEnrollForm)} className="gap-1 text-xs h-7"><UserPlus className="w-3 h-3" /> تسجيل يدوي</Button>
              {showEnrollForm && (
                <div className="mt-2 flex flex-wrap gap-2 items-end">
                  <select value={enrollForm.userId} onChange={e => setEnrollForm({ ...enrollForm, userId: e.target.value })} className="border rounded-lg p-1.5 text-xs bg-background">
                    <option value="">اختر المستخدم...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                  </select>
                  <select value={enrollForm.courseId} onChange={e => setEnrollForm({ ...enrollForm, courseId: e.target.value })} className="border rounded-lg p-1.5 text-xs bg-background">
                    <option value="">اختر الدورة...</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.titleAr}</option>)}
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
                  {filteredLmsOrders.map(o => (
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
                          <select value={o.status} onChange={e => updateLmsOrderStatus(o.id, e.target.value)} className="text-xs border rounded p-1 bg-background">
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

        {/* ── TRAINERS TAB (admin only) ── */}
        {tab === "trainers" && isAdminRole && (
          <Card><CardContent className="p-5 space-y-5">
            <h2 className="font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> تعيين المدرّبين للدورات
            </h2>
            <p className="text-xs text-muted-foreground">
              عيّن المستخدمين كمدرّبين لدورات محدّدة. سيتم ترقية الدور تلقائياً عند التعيين، ويمكن للمدرّب إدارة الواجبات والتقييمات لدوراته فقط.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end p-3 border rounded-lg bg-muted/30">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">الدورة</label>
                <select
                  value={trainerAssignCourseId}
                  onChange={(e) => setTrainerAssignCourseId(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm bg-background"
                >
                  <option value="">اختر الدورة...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.titleAr}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">المستخدم</label>
                <select
                  value={trainerAssignUserId}
                  onChange={(e) => setTrainerAssignUserId(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm bg-background"
                >
                  <option value="">اختر المستخدم...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.email} — {ROLE_LABELS_AR[u.role]}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={assignTrainer}
                disabled={!trainerAssignCourseId || !trainerAssignUserId}
                className="bg-primary text-white gap-1"
              >
                <Plus className="w-4 h-4" /> تعيين كمدرّب
              </Button>
            </div>

            {trainerAssignCourseId && (
              <div>
                <h3 className="text-sm font-bold mb-2">المدرّبون المعيّنون</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-muted-foreground">
                      <th className="text-start py-2 px-3 font-medium">الاسم</th>
                      <th className="text-start py-2 px-3 font-medium">البريد</th>
                      <th className="text-start py-2 px-3 font-medium">التعيين</th>
                      <th className="text-end py-2 px-3 font-medium">إجراءات</th>
                    </tr></thead>
                    <tbody>
                      {(courseTrainersByCourse[trainerAssignCourseId] ?? []).map(t => (
                        <tr key={t.id} className="border-b border-border/30">
                          <td className="py-2 px-3 font-medium">{`${t.firstName || ""} ${t.lastName || ""}`.trim() || "—"}</td>
                          <td className="py-2 px-3 text-muted-foreground" dir="ltr">{t.email}</td>
                          <td className="py-2 px-3 text-xs text-muted-foreground">{new Date(t.assignedAt).toLocaleDateString("ar-SA")}</td>
                          <td className="py-2 px-3 text-end">
                            <Button variant="ghost" size="sm" onClick={() => removeTrainer(trainerAssignCourseId, t.userId)} className="h-7 w-7 p-0 text-destructive">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {(courseTrainersByCourse[trainerAssignCourseId] ?? []).length === 0 && (
                        <tr><td colSpan={4} className="py-6 text-center text-muted-foreground text-xs">لا يوجد مدرّبون معيّنون لهذه الدورة</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent></Card>
        )}

        {/* ── REVENUE TAB ── */}
        {tab === "student-progress" && (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    تقدّم الطلاب في الدورات
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    عرض نسبة إكمال كل طالب في كل دورة مسجل بها
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={progressSearch}
                    onChange={(e) => setProgressSearch(e.target.value)}
                    placeholder="بحث بالاسم/الإيميل/الدورة..."
                    className="text-xs h-8 w-full sm:w-64"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchStudentProgress}
                    className="h-8 text-xs gap-1 shrink-0"
                  >
                    <TrendingUp className="w-3.5 h-3.5" /> تحديث
                  </Button>
                </div>
              </div>

              {filteredProgress.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {studentProgress.length === 0 ? "لا توجد تسجيلات بعد." : "لا توجد نتائج مطابقة."}
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
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProgress.map((p) => {
                        const fullName = [p.userFirstName, p.userLastName].filter(Boolean).join(" ") || "—";
                        const last = p.lastActivityAt ? new Date(p.lastActivityAt).toLocaleDateString("ar-EG") : "—";
                        return (
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
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      p.progressPct === 100 ? "bg-green-600" : "bg-primary"
                                    }`}
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
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "assignments" && (
          <AdminAssignmentsTab
            apiFetch={apiFetch}
            courses={courses.map(c => ({ id: c.id, titleAr: c.titleAr, titleEn: c.titleEn }))}
          />
        )}

        {tab === "revenue" && (
          <RevenueTab revenue={revenue} onRefresh={fetchRevenue} />
        )}
      </div>
    </AppShell>
  );
}

// ── LessonRow sub-component ────────────────────────────────────────────────
function LessonRow({ lesson, idx, allLessons, sections, isEditing, editForm, setEditForm, onEdit, onSave, onCancel, onDelete, onMove, onLessonUpdated }: {
  lesson: LessonRecord; idx: number; allLessons: LessonRecord[]; sections: SectionRecord[];
  isEditing: boolean; editForm: LessonEditForm; setEditForm: (f: LessonEditForm) => void;
  onEdit: () => void; onSave: () => void; onCancel: () => void; onDelete: () => void;
  onMove: (dir: -1 | 1) => void; onLessonUpdated: (l: LessonRecord) => void;
}) {
  const apiBase = getApiBase();
  const [newResTitle, setNewResTitle] = useState("");
  const [newResUrl, setNewResUrl] = useState("");
  const [newResType, setNewResType] = useState("link");
  const [resLoading, setResLoading] = useState(false);

  const addResource = async () => {
    if (!newResTitle.trim() || !newResUrl.trim()) return;
    setResLoading(true);
    try {
      const r = await fetch(`${apiBase}/admin/lessons/${lesson.id}/resources`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleAr: newResTitle, titleEn: newResTitle, url: newResUrl, type: newResType }),
      });
      if (r.ok) { const d = await r.json(); onLessonUpdated(d.lesson); setNewResTitle(""); setNewResUrl(""); }
    } finally { setResLoading(false); }
  };

  const removeResource = async (resIdx: number) => {
    setResLoading(true);
    try {
      const r = await fetch(`${apiBase}/admin/lessons/${lesson.id}/resources/${resIdx}`, { method: "DELETE", credentials: "include" });
      if (r.ok) { const d = await r.json(); onLessonUpdated(d.lesson); }
    } finally { setResLoading(false); }
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-blue-50/50 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input value={editForm.titleAr} onChange={e => setEditForm({ ...editForm, titleAr: e.target.value })} placeholder="العنوان (عربي)" className="text-xs h-7" />
          <Input value={editForm.titleEn} onChange={e => setEditForm({ ...editForm, titleEn: e.target.value })} placeholder="Title (EN)" className="text-xs h-7" dir="ltr" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Input value={editForm.videoUrl} onChange={e => setEditForm({ ...editForm, videoUrl: e.target.value })} placeholder="رابط الفيديو" className="text-xs h-7" dir="ltr" />
          <select value={editForm.videoType} onChange={e => setEditForm({ ...editForm, videoType: e.target.value })} className="border rounded p-1 text-xs bg-background h-7">
            <option value="youtube">YouTube</option>
            <option value="vimeo">Vimeo</option>
            <option value="other">أخرى</option>
          </select>
          <Input value={editForm.durationMinutes} onChange={e => setEditForm({ ...editForm, durationMinutes: e.target.value })} placeholder="دقائق" type="number" className="text-xs h-7" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
          <select value={editForm.sectionId} onChange={e => setEditForm({ ...editForm, sectionId: e.target.value })} className="border rounded p-1 text-xs bg-background h-7 col-span-2">
            <option value="">بدون قسم</option>
            {sections.map(s => <option key={s.id} value={s.id}>{s.titleAr}</option>)}
          </select>
          <label className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" checked={editForm.isFreePreview} onChange={e => setEditForm({ ...editForm, isFreePreview: e.target.checked })} className="w-3 h-3" /> معاينة مجانية</label>
          <label className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" checked={editForm.isPublished} onChange={e => setEditForm({ ...editForm, isPublished: e.target.checked })} className="w-3 h-3" /> منشور</label>
        </div>
        <div className="flex justify-end gap-1">
          <Button size="sm" onClick={onSave} className="h-6 px-2 text-xs bg-primary text-white">حفظ</Button>
          <Button size="sm" variant="outline" onClick={onCancel} className="h-6 px-2 text-xs">إلغاء</Button>
        </div>
        {/* Resources Section */}
        <div className="border-t pt-2 mt-1 space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><FileText className="w-3 h-3" /> الملفات والروابط المرفقة</p>
          {(lesson.resources ?? []).length > 0 && (
            <ul className="space-y-1">
              {(lesson.resources ?? []).map((r, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs bg-white rounded px-2 py-1 border">
                  <span className="flex-1 truncate" dir="ltr">{r.titleAr} — <a href={r.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{r.url}</a></span>
                  <span className="text-[9px] bg-gray-100 px-1 rounded">{r.type}</span>
                  <button onClick={() => removeResource(i)} disabled={resLoading} className="text-destructive hover:text-red-700 shrink-0"><X className="w-3 h-3" /></button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-1 items-center">
            <Input value={newResTitle} onChange={e => setNewResTitle(e.target.value)} placeholder="اسم المرفق" className="text-xs h-7 flex-1" />
            <Input value={newResUrl} onChange={e => setNewResUrl(e.target.value)} placeholder="https://..." className="text-xs h-7 flex-[2]" dir="ltr" />
            <select value={newResType} onChange={e => setNewResType(e.target.value)} className="border rounded p-1 text-xs bg-background h-7">
              <option value="link">رابط</option>
              <option value="pdf">PDF</option>
              <option value="file">ملف</option>
            </select>
            <Button size="sm" onClick={addResource} disabled={resLoading || !newResTitle.trim() || !newResUrl.trim()} className="h-7 px-2 text-xs"><Plus className="w-3 h-3" /></Button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/10">
      <div className="flex flex-col gap-0.5 shrink-0">
        <button onClick={() => onMove(-1)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20"><ChevronUp className="w-3 h-3" /></button>
        <button onClick={() => onMove(1)} disabled={idx === allLessons.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20"><ChevronDown className="w-3 h-3" /></button>
      </div>
      <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{idx + 1}</span>
      <Video className="w-3.5 h-3.5 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{lesson.titleAr}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {lesson.isFreePreview && <span className="text-[9px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-bold">مجاني</span>}
          {!lesson.isPublished && <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">مخفي</span>}
          {lesson.videoUrl && <span className="text-[9px] text-muted-foreground">▶ فيديو</span>}
          {lesson.durationMinutes && <span className="text-[9px] text-muted-foreground">{lesson.durationMinutes} دق</span>}
          {(lesson.resources ?? []).length > 0 && <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><FileText className="w-2.5 h-2.5" />{(lesson.resources ?? []).length} مرفق</span>}
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onEdit} className="h-6 w-6 p-0 text-blue-600 shrink-0"><Edit3 className="w-3 h-3" /></Button>
      <Button variant="ghost" size="sm" onClick={onDelete} className="h-6 w-6 p-0 text-destructive shrink-0"><Trash2 className="w-3 h-3" /></Button>
    </div>
  );
}

// ── RevenueTab component ────────────────────────────────────────────────────
type RevenueSortKey = "revenue" | "orders" | "courseTitleAr";
type DaySortKey = "date" | "revenue" | "count";

function SortButton({ col, sort, dir, onSort }: { col: string; sort: string; dir: "asc" | "desc"; onSort: () => void }) {
  const active = col === sort;
  return (
    <button onClick={onSort} className={`flex items-center gap-0.5 hover:text-foreground transition-colors ${active ? "text-primary font-bold" : "text-muted-foreground"}`}>
      {col === "revenue" ? "الإيراد" : col === "orders" ? "الطلبات" : col === "courseTitleAr" ? "الدورة" : col === "date" ? "التاريخ" : col === "count" ? "عدد الطلبات" : col === "enrollments" ? "التسجيلات" : col}
      {active ? (dir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronDown className="w-3 h-3 opacity-30" />}
    </button>
  );
}

function RevenueTab({ revenue, onRefresh }: { revenue: RevenueData | null; onRefresh: () => void }) {
  const [courseSort, setCourseSort] = useState<RevenueSortKey>("revenue");
  const [courseSortDir, setCourseSortDir] = useState<"asc" | "desc">("desc");
  const [daySort, setDaySort] = useState<DaySortKey>("date");
  const [daySortDir, setDaySortDir] = useState<"asc" | "desc">("desc");

  const toggleCourseSort = (key: RevenueSortKey) => {
    if (courseSort === key) setCourseSortDir(d => d === "asc" ? "desc" : "asc");
    else { setCourseSort(key); setCourseSortDir("desc"); }
  };
  const toggleDaySort = (key: DaySortKey) => {
    if (daySort === key) setDaySortDir(d => d === "asc" ? "desc" : "asc");
    else { setDaySort(key); setDaySortDir("desc"); }
  };

  if (!revenue) {
    return <div className="flex items-center justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  const sortedByCourse = [...revenue.byCourse].sort((a, b) => {
    let va: string | number = 0, vb: string | number = 0;
    if (courseSort === "revenue") { va = a.revenue; vb = b.revenue; }
    else if (courseSort === "orders") { va = a.orders; vb = b.orders; }
    else { va = a.courseTitleAr || ""; vb = b.courseTitleAr || ""; }
    if (va < vb) return courseSortDir === "asc" ? -1 : 1;
    if (va > vb) return courseSortDir === "asc" ? 1 : -1;
    return 0;
  });

  const sortedDays = [...revenue.last30Days].sort((a, b) => {
    let va: string | number = 0, vb: string | number = 0;
    if (daySort === "date") { va = a.date; vb = b.date; }
    else if (daySort === "revenue") { va = a.revenue; vb = b.revenue; }
    else { va = a.count; vb = b.count; }
    if (va < vb) return daySortDir === "asc" ? -1 : 1;
    if (va > vb) return daySortDir === "asc" ? 1 : -1;
    return 0;
  });

  const maxRev = Math.max(...revenue.byCourse.map(x => x.revenue), 1);
  const maxEnroll = Math.max(...revenue.topEnrolled.map(x => x.enrollments), 1);
  const maxDay = Math.max(...revenue.last30Days.map(x => x.revenue), 1);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> لوحة الإيرادات</h2>
        <Button size="sm" variant="outline" onClick={onRefresh} className="h-8 text-xs gap-1"><TrendingUp className="w-3.5 h-3.5" /> تحديث</Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الإيرادات", value: `${revenue.totalRevenue} JOD`, icon: <DollarSign className="w-5 h-5 text-green-600" />, bg: "bg-green-100", bold: true },
          { label: "أوامر مدفوعة", value: revenue.paidOrders, icon: <CheckCircle className="w-5 h-5 text-blue-600" />, bg: "bg-blue-100", bold: false },
          { label: "إيرادات معلّقة", value: `${revenue.pendingRevenue} JOD`, icon: <Clock className="w-5 h-5 text-amber-600" />, bg: "bg-amber-100", bold: false },
          { label: "طلبات ملغاة", value: revenue.cancelledOrders, icon: <XCircle className="w-5 h-5 text-red-500" />, bg: "bg-red-100", bold: false },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>{s.icon}</div>
            <div>
              <p className={`text-xl ${s.bold ? "font-extrabold text-green-700" : "font-bold"}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </CardContent></Card>
        ))}
      </div>

      {/* Revenue by course — sortable table */}
      <Card><CardContent className="p-5">
        <h3 className="font-bold mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> الإيرادات حسب الدورة</h3>
        {sortedByCourse.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-xs">
                <th className="text-start py-2 px-3"><SortButton col="courseTitleAr" sort={courseSort} dir={courseSortDir} onSort={() => toggleCourseSort("courseTitleAr")} /></th>
                <th className="text-start py-2 px-3"><SortButton col="revenue" sort={courseSort} dir={courseSortDir} onSort={() => toggleCourseSort("revenue")} /></th>
                <th className="text-start py-2 px-3"><SortButton col="orders" sort={courseSort} dir={courseSortDir} onSort={() => toggleCourseSort("orders")} /></th>
                <th className="text-start py-2 px-3 w-32 hidden sm:table-cell">الشريط</th>
              </tr></thead>
              <tbody>
                {sortedByCourse.map((c, i) => (
                  <tr key={i} className="border-b border-border/20 hover:bg-muted/10">
                    <td className="py-2 px-3 font-medium max-w-[200px] truncate">{c.courseTitleAr || c.courseTitleEn || "غير معروف"}</td>
                    <td className="py-2 px-3 font-bold text-primary">{c.revenue} JOD</td>
                    <td className="py-2 px-3">{c.orders} طلب</td>
                    <td className="py-2 px-3 hidden sm:table-cell">
                      <div className="h-2 bg-muted rounded-full overflow-hidden w-24">
                        <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${(c.revenue / maxRev) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent></Card>

      {/* Top enrolled */}
      <Card><CardContent className="p-5">
        <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> أكثر الدورات تسجيلاً</h3>
        {revenue.topEnrolled.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات بعد</p>
        ) : (
          <div className="space-y-3">
            {revenue.topEnrolled.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">{c.courseTitleAr || c.courseTitleEn || "غير معروف"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(c.enrollments / maxEnroll) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{c.enrollments} طالب</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent></Card>

      {/* Last 30 days — sortable table */}
      <Card><CardContent className="p-5">
        <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> الإيرادات — آخر 30 يوم</h3>
        {sortedDays.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">لا توجد مبيعات في آخر 30 يوم</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-xs">
                <th className="text-start py-2 px-3"><SortButton col="date" sort={daySort} dir={daySortDir} onSort={() => toggleDaySort("date")} /></th>
                <th className="text-start py-2 px-3"><SortButton col="revenue" sort={daySort} dir={daySortDir} onSort={() => toggleDaySort("revenue")} /></th>
                <th className="text-start py-2 px-3"><SortButton col="count" sort={daySort} dir={daySortDir} onSort={() => toggleDaySort("count")} /></th>
                <th className="text-start py-2 px-3 w-32 hidden sm:table-cell">الشريط</th>
              </tr></thead>
              <tbody>
                {sortedDays.map((d, i) => (
                  <tr key={i} className="border-b border-border/20 hover:bg-muted/10">
                    <td className="py-2 px-3">{d.date}</td>
                    <td className="py-2 px-3 font-bold text-primary">{d.revenue} JOD</td>
                    <td className="py-2 px-3">{d.count}</td>
                    <td className="py-2 px-3 hidden sm:table-cell">
                      <div className="h-2 bg-muted rounded-full overflow-hidden w-24">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(d.revenue / maxDay) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent></Card>
    </div>
  );
}
