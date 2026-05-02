import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  BookOpen, Plus, Edit3, Trash2, ChevronDown, ChevronUp, Star,
  Layers, Video, Copy, UserCircle, Shield, GraduationCap,
} from "lucide-react";
import { AdminLayout } from "./_layout";
import {
  useApiFetch, BulletEditor, LessonRow, ROLE_LABELS_AR,
  type CourseRecord, type SectionRecord, type LessonRecord,
  type LessonEditForm, type InstructorRecord, type UserRecord, type CourseTrainerRecord,
  type EnrollmentRecord,
} from "./_shared";
import { useMe } from "@/hooks/use-me";

type SubTab = "courses" | "instructors" | "trainers";

export default function AdminCoursesPage() {
  const apiFetch = useApiFetch();
  const { role } = useMe();
  const isAdminRole = role === "admin";
  const [subTab, setSubTab] = useState<SubTab>("courses");

  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [instructors, setInstructors] = useState<InstructorRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);

  // Course builder
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

  // Section/lesson
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

  // Trainer assignment
  const [trainerAssignCourseId, setTrainerAssignCourseId] = useState("");
  const [trainerAssignUserId, setTrainerAssignUserId] = useState("");
  const [courseTrainersByCourse, setCourseTrainersByCourse] = useState<Record<string, CourseTrainerRecord[]>>({});

  const fetchCourses = useCallback(async () => {
    const res = await apiFetch("/admin/courses");
    if (res.ok) setCourses((await res.json()).courses);
  }, [apiFetch]);

  const fetchInstructors = useCallback(async () => {
    const res = await apiFetch("/admin/instructors");
    if (res.ok) setInstructors((await res.json()).instructors);
  }, [apiFetch]);

  const fetchUsers = useCallback(async () => {
    const res = await apiFetch("/admin/users");
    if (res.ok) setUsers((await res.json()).users);
  }, [apiFetch]);

  const fetchEnrollments = useCallback(async () => {
    const res = await apiFetch("/admin/enrollments");
    if (res.ok) setEnrollments((await res.json()).enrollments);
  }, [apiFetch]);

  useEffect(() => {
    fetchCourses();
    fetchInstructors();
    if (isAdminRole) {
      fetchUsers();
      fetchEnrollments();
    }
  }, [fetchCourses, fetchInstructors, fetchUsers, fetchEnrollments, isAdminRole]);

  // Course handlers
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
    if (res.ok) { setShowCourseForm(false); setCourseForm(blankCourse()); fetchCourses(); }
  };

  const updateCourse = async () => {
    if (!editingCourse) return;
    const res = await apiFetch(`/admin/courses/${editingCourse}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(coursePayload()) });
    if (res.ok) { setEditingCourse(null); setShowCourseForm(false); fetchCourses(); }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("حذف هذه الدورة وجميع دروسها؟")) return;
    await apiFetch(`/admin/courses/${id}`, { method: "DELETE" });
    fetchCourses();
  };

  const duplicateCourse = async (id: string) => {
    const res = await apiFetch(`/admin/courses/${id}/duplicate`, { method: "POST" });
    if (res.ok) fetchCourses();
  };

  // Section handlers
  const createSection = async (courseId: string) => {
    if (!sectionForm.titleAr || !sectionForm.titleEn) return;
    const res = await apiFetch(`/admin/courses/${courseId}/sections`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...sectionForm, sortOrder: courses.find((c) => c.id === courseId)?.sections.length ?? 0 }),
    });
    if (res.ok) { setShowSectionForm(null); setSectionForm({ titleAr: "", titleEn: "" }); fetchCourses(); }
  };

  const updateSection = async (id: string) => {
    const res = await apiFetch(`/admin/sections/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingSectionForm),
    });
    if (res.ok) { setEditingSection(null); fetchCourses(); }
  };

  const deleteSection = async (id: string) => {
    if (!confirm("حذف هذا القسم؟")) return;
    await apiFetch(`/admin/sections/${id}`, { method: "DELETE" });
    fetchCourses();
  };

  const moveSectionOrder = async (section: SectionRecord, dir: -1 | 1, allSections: SectionRecord[]) => {
    const newOrder = section.sortOrder + dir;
    const swap = allSections.find((s) => s.sortOrder === newOrder);
    await apiFetch(`/admin/sections/${section.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: newOrder }) });
    if (swap) await apiFetch(`/admin/sections/${swap.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: section.sortOrder }) });
    fetchCourses();
  };

  // Lesson handlers
  const createLesson = async (courseId: string) => {
    const res = await apiFetch(`/admin/courses/${courseId}/lessons`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...lessonForm,
        durationMinutes: lessonForm.durationMinutes ? parseInt(lessonForm.durationMinutes) : null,
        sectionId: lessonForm.sectionId || null,
      }),
    });
    if (res.ok) { setShowLessonForm(null); setLessonForm({ titleAr: "", titleEn: "", videoUrl: "", videoType: "youtube", durationMinutes: "", sectionId: "", isFreePreview: false, isPublished: true, descriptionAr: "", descriptionEn: "" }); fetchCourses(); }
  };

  const saveLesson = async (id: string) => {
    const res = await apiFetch(`/admin/lessons/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editingLessonForm, durationMinutes: editingLessonForm.durationMinutes ? parseInt(editingLessonForm.durationMinutes) : null, sectionId: editingLessonForm.sectionId || null }),
    });
    if (res.ok) { setEditingLesson(null); fetchCourses(); }
  };

  const deleteLesson = async (id: string) => {
    if (!confirm("حذف هذا الدرس؟")) return;
    await apiFetch(`/admin/lessons/${id}`, { method: "DELETE" });
    fetchCourses();
  };

  const updateLessonInState = (updatedLesson: LessonRecord) => {
    setCourses((prev) => prev.map((c) => c.id === updatedLesson.courseId
      ? { ...c, lessons: c.lessons.map((l) => l.id === updatedLesson.id ? updatedLesson : l) }
      : c
    ));
  };

  const moveLessonOrder = async (lesson: LessonRecord, dir: -1 | 1, allLessons: LessonRecord[]) => {
    const newOrder = lesson.sortOrder + dir;
    const swap = allLessons.find((l) => l.sortOrder === newOrder);
    await apiFetch(`/admin/lessons/${lesson.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: newOrder }) });
    if (swap) await apiFetch(`/admin/lessons/${swap.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: lesson.sortOrder }) });
    fetchCourses();
  };

  // Enrollment
  const enrollUser = async () => {
    const res = await apiFetch("/admin/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(enrollForm) });
    if (res.ok) { setShowEnrollForm(false); setEnrollForm({ userId: "", courseId: "" }); fetchEnrollments(); }
  };
  const removeEnrollment = async (id: string) => {
    if (!confirm("إلغاء تسجيل هذا الطالب؟")) return;
    await apiFetch(`/admin/enrollments/${id}`, { method: "DELETE" });
    fetchEnrollments();
  };

  // Instructor
  const createInstructor = async () => {
    const res = await apiFetch("/admin/instructors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(instructorForm) });
    if (res.ok) { setShowInstructorForm(false); setInstructorForm(blankInstructor()); fetchInstructors(); }
  };
  const saveInstructor = async () => {
    if (!editingInstructor) return;
    const res = await apiFetch(`/admin/instructors/${editingInstructor}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(instructorForm) });
    if (res.ok) { setEditingInstructor(null); fetchInstructors(); }
  };
  const deleteInstructor = async (id: string) => {
    if (!confirm("حذف هذا المدرّب؟")) return;
    await apiFetch(`/admin/instructors/${id}`, { method: "DELETE" });
    fetchInstructors();
  };

  // Trainer assignment
  const fetchCourseTrainers = useCallback(async (courseId: string) => {
    const res = await apiFetch(`/admin/courses/${courseId}/trainers`);
    if (!res.ok) return;
    const data = await res.json();
    setCourseTrainersByCourse((prev) => ({ ...prev, [courseId]: data.trainers ?? [] }));
  }, [apiFetch]);

  const assignTrainer = async () => {
    if (!trainerAssignCourseId || !trainerAssignUserId) return;
    const res = await apiFetch(`/admin/courses/${trainerAssignCourseId}/trainers`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: trainerAssignUserId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "تعذّر التعيين");
      return;
    }
    await fetchCourseTrainers(trainerAssignCourseId);
    fetchUsers();
    setTrainerAssignUserId("");
  };

  const removeTrainer = async (courseId: string, userId: string) => {
    const res = await apiFetch(`/admin/courses/${courseId}/trainers/${userId}`, { method: "DELETE" });
    if (res.ok) await fetchCourseTrainers(courseId);
  };

  useEffect(() => {
    if (subTab === "trainers" && trainerAssignCourseId && !courseTrainersByCourse[trainerAssignCourseId]) {
      fetchCourseTrainers(trainerAssignCourseId);
    }
  }, [subTab, trainerAssignCourseId, courseTrainersByCourse, fetchCourseTrainers]);

  const subTabs: { key: SubTab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { key: "courses", label: "الدورات", icon: <BookOpen className="w-4 h-4" /> },
    { key: "instructors", label: "المدربون", icon: <UserCircle className="w-4 h-4" />, adminOnly: true },
    { key: "trainers", label: "تعيين المدرّبين", icon: <Shield className="w-4 h-4" />, adminOnly: true },
  ];
  const visibleSubTabs = subTabs.filter((s) => isAdminRole || !s.adminOnly);

  return (
    <AdminLayout activeKey="courses">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {visibleSubTabs.map((s) => (
          <button
            key={s.key}
            onClick={() => setSubTab(s.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              subTab === s.key
                ? "bg-primary text-white"
                : "bg-background border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* COURSES SUB-TAB */}
      {subTab === "courses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> الدورات ({courses.length})</h2>
            <div className="flex gap-2">
              {isAdminRole && (
                <Button size="sm" onClick={() => setShowEnrollForm(!showEnrollForm)} variant="outline" className="gap-1">
                  <GraduationCap className="w-4 h-4" /> تسجيل طالب
                </Button>
              )}
              <Button size="sm" onClick={() => { setShowCourseForm(true); setEditingCourse(null); setCourseForm(blankCourse()); }} className="gap-1 bg-primary text-white">
                <Plus className="w-4 h-4" /> دورة جديدة
              </Button>
            </div>
          </div>

          {/* Enroll form */}
          {showEnrollForm && isAdminRole && (
            <Card><CardContent className="p-4 space-y-3">
              <h3 className="font-bold text-sm">تسجيل طالب في دورة</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select value={enrollForm.userId} onChange={(e) => setEnrollForm({ ...enrollForm, userId: e.target.value })} className="border rounded-lg p-2 text-sm bg-background">
                  <option value="">اختر المستخدم...</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.email} {u.firstName ? `(${u.firstName})` : ""}</option>)}
                </select>
                <select value={enrollForm.courseId} onChange={(e) => setEnrollForm({ ...enrollForm, courseId: e.target.value })} className="border rounded-lg p-2 text-sm bg-background">
                  <option value="">اختر الدورة...</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.titleAr}</option>)}
                </select>
                <Button onClick={enrollUser} disabled={!enrollForm.userId || !enrollForm.courseId} size="sm" className="bg-primary text-white">تسجيل</Button>
              </div>
              {enrollments.length > 0 && (
                <div className="mt-3 max-h-40 overflow-y-auto space-y-1">
                  {enrollments.map((e) => (
                    <div key={e.id} className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded">
                      <span>{e.userEmail} → {e.courseTitle}</span>
                      <button onClick={() => removeEnrollment(e.id)} className="text-destructive"><Trash2 className="w-3 h-3" /></button>
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

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">العنوان والمعرّف</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input placeholder="العنوان (عربي) *" value={courseForm.titleAr} onChange={(e) => setCourseForm({ ...courseForm, titleAr: e.target.value })} />
                  <Input placeholder="Title (English) *" value={courseForm.titleEn} onChange={(e) => setCourseForm({ ...courseForm, titleEn: e.target.value })} dir="ltr" />
                  <Input placeholder="العنوان الفرعي (عربي)" value={courseForm.subtitleAr} onChange={(e) => setCourseForm({ ...courseForm, subtitleAr: e.target.value })} />
                  <Input placeholder="Subtitle (English)" value={courseForm.subtitleEn} onChange={(e) => setCourseForm({ ...courseForm, subtitleEn: e.target.value })} dir="ltr" />
                  <Input placeholder="slug (e.g. influential-speaker)" value={courseForm.slug} onChange={(e) => setCourseForm({ ...courseForm, slug: e.target.value })} dir="ltr" />
                  <Input placeholder="معرّف البرنامج (اختياري)" value={courseForm.programId} onChange={(e) => setCourseForm({ ...courseForm, programId: e.target.value })} />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">الوصف</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <textarea className="border rounded-lg p-2 text-sm resize-none bg-background" rows={3} placeholder="الوصف (عربي)" value={courseForm.descriptionAr} onChange={(e) => setCourseForm({ ...courseForm, descriptionAr: e.target.value })} />
                  <textarea className="border rounded-lg p-2 text-sm resize-none bg-background" rows={3} placeholder="Description (English)" value={courseForm.descriptionEn} onChange={(e) => setCourseForm({ ...courseForm, descriptionEn: e.target.value })} dir="ltr" />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">الصور والروابط</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input placeholder="رابط الصورة الغلاف" value={courseForm.imageUrl} onChange={(e) => setCourseForm({ ...courseForm, imageUrl: e.target.value })} dir="ltr" />
                  <Input placeholder="رابط الفيديو التعريفي (Trailer URL)" value={courseForm.trailerUrl} onChange={(e) => setCourseForm({ ...courseForm, trailerUrl: e.target.value })} dir="ltr" />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">السعر والتصنيف</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="relative"><Input placeholder="السعر (JOD)" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })} type="number" /><span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">JOD</span></div>
                  <div className="relative"><Input placeholder="سعر بعد الخصم" value={courseForm.discountPrice} onChange={(e) => setCourseForm({ ...courseForm, discountPrice: e.target.value })} type="number" /><span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">JOD</span></div>
                  <select value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })} className="border rounded-lg p-2 text-sm bg-background">
                    <option value="">المستوى...</option>
                    <option value="beginner">مبتدئ</option>
                    <option value="intermediate">متوسط</option>
                    <option value="advanced">متقدم</option>
                  </select>
                  <select value={courseForm.language} onChange={(e) => setCourseForm({ ...courseForm, language: e.target.value })} className="border rounded-lg p-2 text-sm bg-background">
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <Input placeholder="التصنيف (category)" value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} />
                  <select value={courseForm.instructorId} onChange={(e) => setCourseForm({ ...courseForm, instructorId: e.target.value })} className="border rounded-lg p-2 text-sm bg-background">
                    <option value="">اختر المدرّب...</option>
                    {instructors.map((i) => <option key={i.id} value={i.id}>{i.nameAr} ({i.nameEn})</option>)}
                  </select>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={courseForm.isPublished} onChange={(e) => setCourseForm({ ...courseForm, isPublished: e.target.checked })} className="w-4 h-4 accent-primary" />
                      منشور
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={courseForm.isFeatured} onChange={(e) => setCourseForm({ ...courseForm, isFeatured: e.target.checked })} className="w-4 h-4 accent-primary" />
                      مميّز
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">ماذا ستتعلم (سطر لكل نقطة)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <BulletEditor value={courseForm.whatYouLearnAr} onChange={(v) => setCourseForm({ ...courseForm, whatYouLearnAr: v })} placeholder="نقطة باللغة العربية..." />
                  <BulletEditor value={courseForm.whatYouLearnEn} onChange={(v) => setCourseForm({ ...courseForm, whatYouLearnEn: v })} placeholder="Point in English..." />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">المتطلبات</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <BulletEditor value={courseForm.requirementsAr} onChange={(v) => setCourseForm({ ...courseForm, requirementsAr: v })} placeholder="متطلب..." />
                  <BulletEditor value={courseForm.requirementsEn} onChange={(v) => setCourseForm({ ...courseForm, requirementsEn: v })} placeholder="Requirement..." />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">الجمهور المستهدف</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <textarea className="border rounded-lg p-2 text-sm resize-none bg-background" rows={2} placeholder="الجمهور المستهدف (عربي)" value={courseForm.targetAudienceAr} onChange={(e) => setCourseForm({ ...courseForm, targetAudienceAr: e.target.value })} />
                  <textarea className="border rounded-lg p-2 text-sm resize-none bg-background" rows={2} placeholder="Target audience (English)" value={courseForm.targetAudienceEn} onChange={(e) => setCourseForm({ ...courseForm, targetAudienceEn: e.target.value })} dir="ltr" />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">SEO</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input placeholder="SEO Title" value={courseForm.seoTitle} onChange={(e) => setCourseForm({ ...courseForm, seoTitle: e.target.value })} dir="ltr" />
                  <Input placeholder="SEO Description" value={courseForm.seoDescription} onChange={(e) => setCourseForm({ ...courseForm, seoDescription: e.target.value })} dir="ltr" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button size="sm" variant="outline" onClick={() => { setShowCourseForm(false); setEditingCourse(null); }}>إلغاء</Button>
                <Button size="sm" className="bg-primary text-white" onClick={editingCourse ? updateCourse : createCourse}>{editingCourse ? "حفظ التغييرات" : "إنشاء الدورة"}</Button>
              </div>
            </CardContent></Card>
          )}

          {/* Course cards */}
          {courses.map((course) => {
            const isExpanded = expandedCourse === course.id;
            const instructor = instructors.find((i) => i.id === course.instructorId);
            return (
              <Card key={course.id} className={`${course.isPublished ? "border-primary/30" : "border-border opacity-80"}`}>
                <CardContent className="p-4">
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

                  {isExpanded && (
                    <div className="mt-4 border-t pt-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold flex items-center gap-1"><Layers className="w-4 h-4 text-primary" /> الأقسام ({course.sections.length})</h4>
                          <Button variant="outline" size="sm" onClick={() => setShowSectionForm(showSectionForm === course.id ? null : course.id)} className="h-7 text-xs gap-1"><Plus className="w-3 h-3" /> قسم</Button>
                        </div>

                        {showSectionForm === course.id && (
                          <div className="bg-muted/30 p-3 rounded-lg mb-3 flex gap-2 flex-wrap">
                            <Input placeholder="اسم القسم (عربي)" value={sectionForm.titleAr} onChange={(e) => setSectionForm({ ...sectionForm, titleAr: e.target.value })} className="text-sm flex-1 min-w-32" />
                            <Input placeholder="Section Name (EN)" value={sectionForm.titleEn} onChange={(e) => setSectionForm({ ...sectionForm, titleEn: e.target.value })} className="text-sm flex-1 min-w-32" dir="ltr" />
                            <Button size="sm" onClick={() => createSection(course.id)} className="bg-primary text-white">إضافة</Button>
                            <Button size="sm" variant="outline" onClick={() => setShowSectionForm(null)}>إلغاء</Button>
                          </div>
                        )}

                        {course.sections.map((section, si) => {
                          const sectionLessons = course.lessons.filter((l) => l.sectionId === section.id).sort((a, b) => a.sortOrder - b.sortOrder);
                          return (
                            <div key={section.id} className="border rounded-lg mb-2 overflow-hidden">
                              <div className="bg-muted/30 px-3 py-2 flex items-center gap-2">
                                <div className="flex flex-col gap-0.5">
                                  <button onClick={() => moveSectionOrder(section, -1, course.sections)} disabled={si === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                                  <button onClick={() => moveSectionOrder(section, 1, course.sections)} disabled={si === course.sections.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                                </div>
                                {editingSection === section.id ? (
                                  <>
                                    <Input value={editingSectionForm.titleAr} onChange={(e) => setEditingSectionForm({ ...editingSectionForm, titleAr: e.target.value })} className="h-6 text-xs flex-1" />
                                    <Input value={editingSectionForm.titleEn} onChange={(e) => setEditingSectionForm({ ...editingSectionForm, titleEn: e.target.value })} className="h-6 text-xs flex-1" dir="ltr" />
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
                              <div className="divide-y divide-border/30">
                                {sectionLessons.map((lesson, li) => (
                                  <LessonRow
                                    key={lesson.id}
                                    lesson={lesson} idx={li} allLessons={sectionLessons} sections={course.sections}
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

                        {(() => {
                          const unsectioned = course.lessons.filter((l) => !l.sectionId).sort((a, b) => a.sortOrder - b.sortOrder);
                          if (unsectioned.length === 0) return null;
                          return (
                            <div className="border rounded-lg overflow-hidden">
                              <div className="bg-muted/20 px-3 py-2"><span className="text-sm font-semibold text-muted-foreground">دروس بدون قسم ({unsectioned.length})</span></div>
                              <div className="divide-y divide-border/30">
                                {unsectioned.map((lesson, li) => (
                                  <LessonRow
                                    key={lesson.id}
                                    lesson={lesson} idx={li} allLessons={unsectioned} sections={course.sections}
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

                      {/* Add lesson */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold flex items-center gap-1"><Video className="w-4 h-4 text-primary" /> إضافة درس جديد</h4>
                          <Button variant="outline" size="sm" onClick={() => setShowLessonForm(showLessonForm === course.id ? null : course.id)} className="h-7 text-xs gap-1"><Plus className="w-3 h-3" /> درس</Button>
                        </div>
                        {showLessonForm === course.id && (
                          <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <Input placeholder="عنوان الدرس (عربي) *" value={lessonForm.titleAr} onChange={(e) => setLessonForm({ ...lessonForm, titleAr: e.target.value })} className="text-sm" />
                              <Input placeholder="Lesson Title (EN) *" value={lessonForm.titleEn} onChange={(e) => setLessonForm({ ...lessonForm, titleEn: e.target.value })} className="text-sm" dir="ltr" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <Input placeholder="رابط الفيديو" value={lessonForm.videoUrl} onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} className="text-sm" dir="ltr" />
                              <select value={lessonForm.videoType} onChange={(e) => setLessonForm({ ...lessonForm, videoType: e.target.value })} className="border rounded-lg p-2 text-sm bg-background">
                                <option value="youtube">YouTube</option>
                                <option value="vimeo">Vimeo</option>
                                <option value="other">أخرى</option>
                              </select>
                              <Input placeholder="المدة (دقيقة)" value={lessonForm.durationMinutes} onChange={(e) => setLessonForm({ ...lessonForm, durationMinutes: e.target.value })} className="text-sm" type="number" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <select value={lessonForm.sectionId} onChange={(e) => setLessonForm({ ...lessonForm, sectionId: e.target.value })} className="border rounded-lg p-2 text-sm bg-background">
                                <option value="">بدون قسم</option>
                                {course.sections.map((s) => <option key={s.id} value={s.id}>{s.titleAr}</option>)}
                              </select>
                              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={lessonForm.isFreePreview} onChange={(e) => setLessonForm({ ...lessonForm, isFreePreview: e.target.checked })} className="w-4 h-4 accent-primary" /> معاينة مجانية</label>
                              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={lessonForm.isPublished} onChange={(e) => setLessonForm({ ...lessonForm, isPublished: e.target.checked })} className="w-4 h-4 accent-primary" /> منشور</label>
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

      {/* INSTRUCTORS SUB-TAB */}
      {subTab === "instructors" && isAdminRole && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2"><UserCircle className="w-5 h-5 text-primary" /> المدربون ({instructors.length})</h2>
            <Button size="sm" onClick={() => { setShowInstructorForm(true); setEditingInstructor(null); setInstructorForm(blankInstructor()); }} className="gap-1 bg-primary text-white"><Plus className="w-4 h-4" /> مدرّب جديد</Button>
          </div>

          {(showInstructorForm || editingInstructor) && (
            <Card><CardContent className="p-4 space-y-3">
              <h3 className="font-bold text-sm">{editingInstructor ? "تعديل بيانات المدرّب" : "مدرّب جديد"}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="الاسم (عربي) *" value={instructorForm.nameAr} onChange={(e) => setInstructorForm({ ...instructorForm, nameAr: e.target.value })} />
                <Input placeholder="Name (English) *" value={instructorForm.nameEn} onChange={(e) => setInstructorForm({ ...instructorForm, nameEn: e.target.value })} dir="ltr" />
                <Input placeholder="البريد الإلكتروني" value={instructorForm.email} onChange={(e) => setInstructorForm({ ...instructorForm, email: e.target.value })} dir="ltr" />
                <Input placeholder="رابط الصورة" value={instructorForm.photoUrl} onChange={(e) => setInstructorForm({ ...instructorForm, photoUrl: e.target.value })} dir="ltr" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <textarea className="border rounded-lg p-2 text-sm resize-none bg-background" rows={3} placeholder="السيرة الذاتية (عربي)" value={instructorForm.bioAr} onChange={(e) => setInstructorForm({ ...instructorForm, bioAr: e.target.value })} />
                <textarea className="border rounded-lg p-2 text-sm resize-none bg-background" rows={3} placeholder="Bio (English)" value={instructorForm.bioEn} onChange={(e) => setInstructorForm({ ...instructorForm, bioEn: e.target.value })} dir="ltr" />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => { setShowInstructorForm(false); setEditingInstructor(null); }}>إلغاء</Button>
                <Button size="sm" className="bg-primary text-white" onClick={editingInstructor ? saveInstructor : createInstructor} disabled={!instructorForm.nameAr || !instructorForm.nameEn}>{editingInstructor ? "حفظ" : "إضافة"}</Button>
              </div>
            </CardContent></Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {instructors.map((inst) => (
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

      {/* TRAINERS SUB-TAB */}
      {subTab === "trainers" && isAdminRole && (
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
              <select value={trainerAssignCourseId} onChange={(e) => setTrainerAssignCourseId(e.target.value)} className="w-full border rounded-lg p-2 text-sm bg-background">
                <option value="">اختر الدورة...</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.titleAr}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">المستخدم</label>
              <select value={trainerAssignUserId} onChange={(e) => setTrainerAssignUserId(e.target.value)} className="w-full border rounded-lg p-2 text-sm bg-background">
                <option value="">اختر المستخدم...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email} — {ROLE_LABELS_AR[u.role]}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={assignTrainer} disabled={!trainerAssignCourseId || !trainerAssignUserId} className="bg-primary text-white gap-1">
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
                    {(courseTrainersByCourse[trainerAssignCourseId] ?? []).map((t) => (
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
    </AdminLayout>
  );
}
