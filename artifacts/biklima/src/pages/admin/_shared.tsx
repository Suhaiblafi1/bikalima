import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Video, FileText, ChevronUp, ChevronDown, Edit3, Trash2, X, Plus,
  BarChart3, BookOpen, CheckCircle, Clock, DollarSign, TrendingUp, XCircle,
} from "lucide-react";
import type { Role } from "@/hooks/use-me";

// ── Types ───────────────────────────────────────────────────────────────
export type UserRecord = { id: string; email: string; firstName: string | null; lastName: string | null; role: Role; createdAt: string };
export type CourseTrainerRecord = { id: string; userId: string; courseId: string; assignedAt: string; email: string; firstName: string | null; lastName: string | null; role: Role };
export type SectionRecord = { id: string; courseId: string; titleAr: string; titleEn: string; sortOrder: number; isPublished: boolean };
export type LessonResource = { titleAr: string; titleEn: string; url: string; type: string };
export type LessonRecord = {
  id: string; courseId: string; sectionId: string | null; titleAr: string; titleEn: string;
  videoUrl: string | null; videoType: string; durationMinutes: number | null;
  sortOrder: number; isFreePreview: boolean; isPublished: boolean;
  descriptionAr: string | null; descriptionEn: string | null;
  resources: LessonResource[] | null;
};
export type InstructorRecord = { id: string; nameAr: string; nameEn: string; bioAr: string | null; bioEn: string | null; photoUrl: string | null; email: string | null };
export type CourseRecord = {
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
export type EnrollmentRecord = { id: string; userId: string; courseId: string; status: string; enrolledAt: string; userEmail: string | null; userFirstName: string | null; userLastName: string | null; courseTitle: string | null };
export type RequestRecord = { id: string; applicantType: string; fullName: string; email: string; phone: string; programId: string; trainingType: string | null; status: string; createdAt: string; formData: unknown };
export type OrderRecord = { id: string; workbookId: string; quantity: number; format: string; buyerName: string; buyerEmail: string; totalPrice: number | null; status: string; createdAt: string };
export type LmsOrderRecord = { id: string; userId: string | null; courseId: string | null; courseTitle: string | null; buyerName: string; buyerEmail: string; buyerPhone: string; amount: number | null; currency: string; status: string; paymentNotes: string | null; adminNotes: string | null; createdAt: string };
export type Stats = { totalUsers: number; todaySignups: number; weekSignups: number; totalCourses: number; totalEnrollments: number; totalRequests: number; totalOrders: number; totalLmsOrders?: number };
export type RevenueCourse = { courseId: string | null; courseTitleAr: string | null; courseTitleEn: string | null; revenue: number; orders: number };
export type RevenueDay = { date: string; revenue: number; count: number };
export type TopEnrolled = { courseId: string | null; courseTitleAr: string | null; courseTitleEn: string | null; enrollments: number };
export type RevenueData = { totalRevenue: number; paidOrders: number; pendingRevenue: number; pendingOrders: number; cancelledOrders: number; byCourse: RevenueCourse[]; last30Days: RevenueDay[]; topEnrolled: TopEnrolled[] };
export type LessonEditForm = {
  titleAr: string; titleEn: string; videoUrl: string; videoType: string;
  durationMinutes: string; sectionId: string; isFreePreview: boolean;
  isPublished: boolean; descriptionAr: string; descriptionEn: string;
};
export type StudentProgressRecord = {
  enrollmentId: string; userId: string; courseId: string; status: string; enrolledAt: string;
  userEmail: string | null; userFirstName: string | null; userLastName: string | null;
  courseTitleAr: string | null; courseTitleEn: string | null; courseSlug: string | null;
  totalLessons: number; completedLessons: number; progressPct: number; lastActivityAt: string | null;
};
export type ReviewRecord = {
  id: string; userId: string | null; courseId: string;
  rating: number; commentAr: string | null; commentEn: string | null;
  reviewerName: string | null; createdAt: string;
  userEmail: string | null; userFirstName: string | null; userLastName: string | null;
  courseTitleAr: string | null; courseTitleEn: string | null;
};
export type SiteSettingsRecord = {
  id: string;
  siteNameAr: string | null; siteNameEn: string | null;
  logoUrl: string | null;
  defaultLang: "ar" | "en" | null; defaultCurrency: string | null;
  contactEmail: string | null; contactPhone: string | null; whatsappNumber: string | null;
  facebookUrl: string | null; instagramUrl: string | null; youtubeUrl: string | null; twitterUrl: string | null;
  privacyPolicyAr: string | null; privacyPolicyEn: string | null;
  termsAr: string | null; termsEn: string | null;
  updatedAt: string;
};

// CMS records (Home Page Manager / Workbooks / Field Media)
export type HomeSectionRecord = {
  sectionKey: string;
  contentAr: Record<string, unknown> | null;
  contentEn: Record<string, unknown> | null;
  visible: boolean;
  orderIndex: number;
  status: "draft" | "published";
  publishedAt: string | null;
  updatedAt: string;
};
export type WorkbookRecord = {
  id: string; slug: string;
  titleAr: string; titleEn: string | null;
  descriptionAr: string | null; descriptionEn: string | null;
  priceJod: number | null;
  coverImageUrl: string | null; samplePdfUrl: string | null;
  topicsAr: string[] | null; topicsEn: string[] | null;
  format: "digital" | "printed" | "both";
  linkedCourseId: string | null; linkedProgramId: string | null;
  status: "draft" | "published" | "hidden";
  orderIndex: number;
  createdAt: string; updatedAt: string;
};
export type FieldMediaRecord = {
  id: string;
  mediaType: "youtube" | "upload" | "image" | "instagram" | "tiktok";
  mediaUrl: string; thumbnailUrl: string | null;
  titleAr: string; titleEn: string | null;
  speakerName: string | null; category: string | null; targetSkill: string | null;
  descriptionAr: string | null; descriptionEn: string | null;
  linkedProgramId: string | null; linkedWorkbookId: string | null;
  placement: string[] | null;
  status: "draft" | "published" | "hidden";
  orderIndex: number;
  analysisSkill: string | null;
  analysisObserveAr: string | null; analysisWhyAr: string | null;
  analysisLearnAr: string | null; analysisMistakesAr: string | null;
  analysisExerciseAr: string | null;
  analysisDifficulty: "beginner" | "intermediate" | "advanced" | null;
  analysisLinkedTopic: string | null;
  hasAnalysis: boolean;
  createdAt: string; updatedAt: string;
};
export type AdminActivityRecord = {
  id: string;
  actorUserId: string | null; actorEmail: string | null;
  action: string; entityType: string; entityId: string | null;
  description: string | null;
  createdAt: string;
};
export type TopProgramRecord = { programId: string; requestCount: number };

export type AdminPageKey =
  | "overview" | "users" | "courses" | "enrollments"
  | "workbook-orders" | "assignments" | "reviews"
  | "speech-evaluations" | "home-page" | "workbooks" | "field-media"
  | "certificates" | "settings";

// Per-role page visibility. Admin always sees everything.
export const PAGE_VISIBILITY: Record<AdminPageKey, Role[]> = {
  overview: ["admin", "trainer", "sales"],
  users: ["admin"],
  courses: ["admin", "trainer"],
  enrollments: ["admin", "sales"],
  "workbook-orders": ["admin", "sales"],
  assignments: ["admin", "trainer"],
  reviews: ["admin", "trainer"],
  "speech-evaluations": ["admin", "sales", "trainer"],
  "home-page": ["admin"],
  workbooks: ["admin"],
  "field-media": ["admin", "trainer"],
  // Trainers see only their own students' certs (API-side scoped); sales/support
  // can search but cannot create/edit. Admin/super-admin see and manage everything.
  certificates: ["admin", "trainer", "sales"],
  settings: ["admin"],
};

// Display metadata for the categories used in Field Media (من الميدان).
export const FIELD_MEDIA_CATEGORIES = [
  { value: "opening",  labelAr: "البداية" },
  { value: "closing",  labelAr: "الخاتمة" },
  { value: "voice",    labelAr: "الصوت" },
  { value: "body",     labelAr: "لغة الجسد" },
  { value: "story",    labelAr: "القصة" },
  { value: "humor",    labelAr: "الفكاهة" },
  { value: "presence", labelAr: "الحضور" },
] as const;

export const FIELD_MEDIA_PLACEMENTS = [
  { value: "home",     labelAr: "الصفحة الرئيسية" },
  { value: "gallery",  labelAr: "المعرض" },
  { value: "program",  labelAr: "صفحة برنامج" },
  { value: "workbook", labelAr: "صفحة كراسة" },
] as const;

// Display labels for the home page sections in the admin UI (Arabic).
export const HOME_SECTION_LABELS: Record<string, string> = {
  hero: "الهيرو",
  "about-trainer": "نبذة عن المدرب",
  "why-bikalima": "لماذا بكلمة",
  programs: "البرامج",
  events: "الفعاليات",
  "gallery-preview": "معاينة المعرض",
  "field-videos": "من الميدان",
  testimonials: "آراء الطلاب",
  faq: "الأسئلة الشائعة",
  "enrollment-form": "نموذج التسجيل",
  footer: "التذييل",
};

export type SpeechEvaluationRecord = {
  id: string;
  userId: string | null;
  fullName: string;
  email: string;
  phone: string;
  videoUrl: string | null;
  audioUrl: string | null;
  speechTopic: string | null;
  speechLanguage: string | null;
  notes: string | null;
  transcriptText: string | null;
  trainerScore: number | null;
  trainerFeedback: string | null;
  status: "pending" | "in_review" | "completed" | "converted" | "cancelled";
  leadSource: string | null;
  createdAt: string;
  updatedAt: string;
};

export const SPEECH_EVAL_STATUS_OPTIONS: { value: SpeechEvaluationRecord["status"]; labelAr: string }[] = [
  { value: "pending",   labelAr: "جديد" },
  { value: "in_review", labelAr: "قيد التقييم" },
  { value: "completed", labelAr: "تم الإرسال" },
  { value: "converted", labelAr: "تحوّل إلى طالب" },
  { value: "cancelled", labelAr: "ملغى" },
];

export const ROLE_LABELS_AR: Record<Role, string> = {
  admin: "مدير", trainer: "مدرّب", student: "طالب", sales: "مبيعات/دعم",
};

export const ORDER_STATUS_OPTIONS: { value: string; labelAr: string }[] = [
  { value: "new", labelAr: "جديد" },
  { value: "contacted", labelAr: "تم التواصل" },
  { value: "paid", labelAr: "مدفوع" },
  { value: "completed", labelAr: "مكتمل" },
  { value: "cancelled", labelAr: "ملغى" },
];

// ── Helpers ─────────────────────────────────────────────────────────────
export function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

export function useApiFetch() {
  const apiBase = getApiBase();
  return useCallback(
    (path: string, opts?: RequestInit) =>
      fetch(`${apiBase}${path}`, { credentials: "include", ...opts }),
    [apiBase],
  );
}

// ── Small components ────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    pending: "قيد المراجعة", approved: "مقبول", rejected: "مرفوض",
    confirmed: "مؤكد", shipped: "تم الشحن", delivered: "تم التوصيل",
    active: "نشط", paid: "مدفوع", cancelled: "ملغى", suspended: "موقوف",
    new: "جديد", contacted: "تم التواصل", completed: "مكتمل",
  };
  const colors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800", approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800", confirmed: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800", delivered: "bg-green-100 text-green-800",
    active: "bg-green-100 text-green-800", paid: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800", suspended: "bg-orange-100 text-orange-800",
    new: "bg-blue-100 text-blue-700", contacted: "bg-cyan-100 text-cyan-800",
    completed: "bg-emerald-100 text-emerald-800",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors[status] || "bg-gray-100 text-gray-800"}`}>{labels[status] || status}</span>;
}

export function BulletEditor({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [text, setText] = useState(value.join("\n"));
  const handleBlur = () => onChange(text.split("\n").map((s) => s.trim()).filter(Boolean));
  return (
    <textarea
      className="w-full border rounded-lg p-2 text-sm resize-none bg-background"
      rows={4}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
    />
  );
}

// ── LessonRow component ─────────────────────────────────────────────────
export function LessonRow({
  lesson, idx, allLessons, sections, isEditing, editForm, setEditForm,
  onEdit, onSave, onCancel, onDelete, onMove, onLessonUpdated,
}: {
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
          <Input value={editForm.titleAr} onChange={(e) => setEditForm({ ...editForm, titleAr: e.target.value })} placeholder="العنوان (عربي)" className="text-xs h-7" />
          <Input value={editForm.titleEn} onChange={(e) => setEditForm({ ...editForm, titleEn: e.target.value })} placeholder="Title (EN)" className="text-xs h-7" dir="ltr" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Input value={editForm.videoUrl} onChange={(e) => setEditForm({ ...editForm, videoUrl: e.target.value })} placeholder="رابط الفيديو" className="text-xs h-7" dir="ltr" />
          <select value={editForm.videoType} onChange={(e) => setEditForm({ ...editForm, videoType: e.target.value })} className="border rounded p-1 text-xs bg-background h-7">
            <option value="youtube">YouTube</option>
            <option value="vimeo">Vimeo</option>
            <option value="other">أخرى</option>
          </select>
          <Input value={editForm.durationMinutes} onChange={(e) => setEditForm({ ...editForm, durationMinutes: e.target.value })} placeholder="دقائق" type="number" className="text-xs h-7" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
          <select value={editForm.sectionId} onChange={(e) => setEditForm({ ...editForm, sectionId: e.target.value })} className="border rounded p-1 text-xs bg-background h-7 col-span-2">
            <option value="">بدون قسم</option>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.titleAr}</option>)}
          </select>
          <label className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" checked={editForm.isFreePreview} onChange={(e) => setEditForm({ ...editForm, isFreePreview: e.target.checked })} className="w-3 h-3" /> معاينة مجانية</label>
          <label className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" checked={editForm.isPublished} onChange={(e) => setEditForm({ ...editForm, isPublished: e.target.checked })} className="w-3 h-3" /> منشور</label>
        </div>
        <div className="flex justify-end gap-1">
          <Button size="sm" onClick={onSave} className="h-6 px-2 text-xs bg-primary text-white">حفظ</Button>
          <Button size="sm" variant="outline" onClick={onCancel} className="h-6 px-2 text-xs">إلغاء</Button>
        </div>
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
            <Input value={newResTitle} onChange={(e) => setNewResTitle(e.target.value)} placeholder="اسم المرفق" className="text-xs h-7 flex-1" />
            <Input value={newResUrl} onChange={(e) => setNewResUrl(e.target.value)} placeholder="https://..." className="text-xs h-7 flex-[2]" dir="ltr" />
            <select value={newResType} onChange={(e) => setNewResType(e.target.value)} className="border rounded p-1 text-xs bg-background h-7">
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

// ── RevenueTab component ────────────────────────────────────────────────
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

export function RevenueTab({ revenue, onRefresh }: { revenue: RevenueData | null; onRefresh: () => void }) {
  const [courseSort, setCourseSort] = useState<RevenueSortKey>("revenue");
  const [courseSortDir, setCourseSortDir] = useState<"asc" | "desc">("desc");
  const [daySort, setDaySort] = useState<DaySortKey>("date");
  const [daySortDir, setDaySortDir] = useState<"asc" | "desc">("desc");

  const toggleCourseSort = (key: RevenueSortKey) => {
    if (courseSort === key) setCourseSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setCourseSort(key); setCourseSortDir("desc"); }
  };
  const toggleDaySort = (key: DaySortKey) => {
    if (daySort === key) setDaySortDir((d) => (d === "asc" ? "desc" : "asc"));
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

  const maxRev = Math.max(...revenue.byCourse.map((x) => x.revenue), 1);
  const maxEnroll = Math.max(...revenue.topEnrolled.map((x) => x.enrollments), 1);
  const maxDay = Math.max(...revenue.last30Days.map((x) => x.revenue), 1);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> لوحة الإيرادات</h2>
        <Button size="sm" variant="outline" onClick={onRefresh} className="h-8 text-xs gap-1"><TrendingUp className="w-3.5 h-3.5" /> تحديث</Button>
      </div>

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
