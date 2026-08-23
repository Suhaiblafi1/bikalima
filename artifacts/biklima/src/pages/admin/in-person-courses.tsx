import { useCallback, useEffect, useState, type ReactNode } from "react";
import { CalendarDays, ChevronDown, ChevronUp, Loader2, Plus, Users } from "lucide-react";
import { AdminLayout } from "./_layout";
import { useApiFetch, type CourseRecord } from "./_shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type EventStatus = "draft" | "published" | "closed" | "cancelled";
type RegistrationStatus = "pending" | "confirmed" | "waitlisted" | "cancelled";
type InPersonCourse = {
  id: string; courseId: string | null; programId: string | null;
  titleAr: string; titleEn: string; descriptionAr: string | null; descriptionEn: string | null;
  organizationAr: string | null; organizationEn: string | null; trainerAr: string | null; trainerEn: string | null;
  locationAr: string; locationEn: string; countryCode: string | null; timezone: string;
  startsAt: string; endsAt: string; registrationDeadline: string | null;
  capacity: number; price: number | null; currency: string; status: EventStatus;
  waitlistEnabled: boolean; courseTitleAr: string | null; registrationsCount: number;
};
type Registration = {
  id: string; fullName: string; email: string; phone: string; note: string | null;
  status: RegistrationStatus; createdAt: string;
};

const EMPTY = {
  courseId: "", programId: "", titleAr: "", titleEn: "", descriptionAr: "", descriptionEn: "",
  organizationAr: "", organizationEn: "", trainerAr: "", trainerEn: "", locationAr: "", locationEn: "",
  countryCode: "JO", timezone: "Asia/Amman", startsAt: "", endsAt: "", registrationDeadline: "",
  capacity: "20", price: "", currency: "JOD", status: "draft" as EventStatus, waitlistEnabled: true,
};

function localInputValue(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function AdminInPersonCoursesPage() {
  const apiFetch = useApiFetch();
  const [events, setEvents] = useState<InPersonCourse[]>([]);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<Record<string, Registration[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [eventsResponse, coursesResponse] = await Promise.all([
        apiFetch("/admin/in-person-courses"),
        apiFetch("/admin/courses"),
      ]);
      if (!eventsResponse.ok) throw new Error("تعذّر تحميل المواعيد الوجاهية.");
      setEvents((await eventsResponse.json()).courses ?? []);
      if (coursesResponse.ok) setCourses((await coursesResponse.json()).courses ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذّر تحميل البيانات.");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { load(); }, [load]);

  const startEdit = (event: InPersonCourse) => {
    setEditingId(event.id);
    setForm({
      courseId: event.courseId ?? "", programId: event.programId ?? "", titleAr: event.titleAr, titleEn: event.titleEn,
      descriptionAr: event.descriptionAr ?? "", descriptionEn: event.descriptionEn ?? "",
      organizationAr: event.organizationAr ?? "", organizationEn: event.organizationEn ?? "",
      trainerAr: event.trainerAr ?? "", trainerEn: event.trainerEn ?? "",
      locationAr: event.locationAr, locationEn: event.locationEn, countryCode: event.countryCode ?? "JO", timezone: event.timezone,
      startsAt: localInputValue(event.startsAt), endsAt: localInputValue(event.endsAt), registrationDeadline: localInputValue(event.registrationDeadline),
      capacity: String(event.capacity), price: event.price == null ? "" : String(event.price), currency: event.currency,
      status: event.status, waitlistEnabled: event.waitlistEnabled,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const payload = () => ({
    ...form,
    courseId: form.courseId || null,
    programId: form.programId || null,
    startsAt: new Date(form.startsAt).toISOString(),
    endsAt: new Date(form.endsAt).toISOString(),
    registrationDeadline: form.registrationDeadline ? new Date(form.registrationDeadline).toISOString() : null,
    capacity: Number(form.capacity),
    price: form.price ? Number(form.price) : null,
  });

  const save = async () => {
    setError("");
    if (!form.titleAr || !form.titleEn || !form.locationAr || !form.locationEn || !form.startsAt || !form.endsAt) {
      setError("أكمل العناوين والموقع وتاريخ البداية والنهاية.");
      return;
    }
    setSaving(true);
    try {
      const response = await apiFetch(editingId ? `/admin/in-person-courses/${editingId}` : "/admin/in-person-courses", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "تعذّر حفظ الموعد.");
      setForm(EMPTY); setEditingId(null); setShowForm(false); await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "تعذّر حفظ الموعد.");
    } finally {
      setSaving(false);
    }
  };

  const loadRegistrations = async (eventId: string) => {
    const response = await apiFetch(`/admin/in-person-courses/${eventId}/registrations`);
    const data = await response.json().catch(() => ({})) as { registrations?: Registration[]; error?: string };
    if (!response.ok) throw new Error(data.error || "تعذّر تحميل التسجيلات.");
    setRegistrations((previous) => ({ ...previous, [eventId]: data.registrations ?? [] }));
  };

  const toggleRegistrations = async (eventId: string) => {
    if (expandedId === eventId) { setExpandedId(null); return; }
    setExpandedId(eventId);
    if (registrations[eventId]) return;
    try { await loadRegistrations(eventId); } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذّر تحميل التسجيلات.");
    }
  };

  const setRegistrationStatus = async (eventId: string, registrationId: string, status: RegistrationStatus) => {
    const response = await apiFetch(`/admin/in-person-registrations/${registrationId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    const data = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) { setError(data.error || "تعذّر تحديث التسجيل."); return; }
    setError("");
    await Promise.all([loadRegistrations(eventId), load()]);
  };

  return (
    <AdminLayout activeKey="in-person-courses">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-xl font-bold flex items-center gap-2"><CalendarDays className="w-5 h-5 text-primary" /> الدورات الحضورية</h1><p className="text-sm text-muted-foreground mt-1">إدارة المواعيد والسعة والتسجيل وقائمة الانتظار من دون تعديل الكود.</p></div>
        <Button onClick={() => { setEditingId(null); setForm(EMPTY); setShowForm((value) => !value); }}><Plus className="w-4 h-4 me-2" /> موعد جديد</Button>
      </div>

      {showForm && <Card><CardContent className="p-5 space-y-4">
        <h2 className="font-bold">{editingId ? "تعديل الموعد" : "إضافة موعد وجاهي"}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="العنوان بالعربية"><Input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} /></Field>
          <Field label="العنوان بالإنجليزية"><Input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} dir="ltr" /></Field>
          <Field label="ربط بدورة (اختياري)"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}><option value="">بلا ربط</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.titleAr}</option>)}</select></Field>
          <Field label="الجهة/المكان بالعربية"><Input value={form.organizationAr} onChange={(e) => setForm({ ...form, organizationAr: e.target.value })} /></Field>
          <Field label="الجهة/المكان بالإنجليزية"><Input value={form.organizationEn} onChange={(e) => setForm({ ...form, organizationEn: e.target.value })} dir="ltr" /></Field>
          <Field label="اسم المدرب بالعربية"><Input value={form.trainerAr} onChange={(e) => setForm({ ...form, trainerAr: e.target.value })} /></Field>
          <Field label="الموقع بالعربية"><Input value={form.locationAr} onChange={(e) => setForm({ ...form, locationAr: e.target.value })} /></Field>
          <Field label="الموقع بالإنجليزية"><Input value={form.locationEn} onChange={(e) => setForm({ ...form, locationEn: e.target.value })} dir="ltr" /></Field>
          <Field label="المنطقة الزمنية"><Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} dir="ltr" /></Field>
          <Field label="البداية"><Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></Field>
          <Field label="النهاية"><Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></Field>
          <Field label="إغلاق التسجيل (اختياري)"><Input type="datetime-local" value={form.registrationDeadline} onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })} /></Field>
          <Field label="السعة"><Input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></Field>
          <Field label="السعر (اختياري)"><Input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
          <Field label="الحالة"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}><option value="draft">مسودة</option><option value="published">منشور</option><option value="closed">مغلق</option><option value="cancelled">ملغي</option></select></Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-3"><Field label="الوصف بالعربية"><Textarea value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} /></Field><Field label="الوصف بالإنجليزية"><Textarea value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} dir="ltr" /></Field></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.waitlistEnabled} onChange={(e) => setForm({ ...form, waitlistEnabled: e.target.checked })} /> تفعيل قائمة الانتظار عند اكتمال السعة</label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2"><Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 me-2 animate-spin" />} حفظ</Button><Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>إلغاء</Button></div>
      </CardContent></Card>}

      {error && !showForm && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex items-center justify-between"><span>{error}</span><Button variant="outline" size="sm" onClick={load}>إعادة المحاولة</Button></div>}
      {loading ? <div className="py-16 flex justify-center" aria-label="جارٍ التحميل"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div> : events.length === 0 ? <Card><CardContent className="p-10 text-center text-muted-foreground">لا توجد دورات وجاهية بعد.</CardContent></Card> : <div className="space-y-3">{events.map((event) => <Card key={event.id}><CardContent className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div><div className="flex items-center gap-2 flex-wrap"><h2 className="font-bold">{event.titleAr}</h2><span className="text-xs rounded-full bg-muted px-2 py-0.5">{event.status}</span></div><p className="text-sm text-muted-foreground mt-1">{new Date(event.startsAt).toLocaleString("ar-JO")} · {event.locationAr}</p><p className="text-xs text-muted-foreground mt-1">{event.registrationsCount} تسجيل · السعة {event.capacity}</p></div>
          <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => startEdit(event)}>تعديل</Button><Button variant="outline" size="sm" onClick={() => toggleRegistrations(event.id)}><Users className="w-4 h-4 me-1" /> التسجيلات {expandedId === event.id ? <ChevronUp className="w-4 h-4 ms-1" /> : <ChevronDown className="w-4 h-4 ms-1" />}</Button></div>
        </div>
        {expandedId === event.id && <div className="border-t pt-4 space-y-2">{!registrations[event.id] ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : registrations[event.id].length === 0 ? <p className="text-sm text-muted-foreground">لا توجد تسجيلات.</p> : registrations[event.id].map((registration) => <div key={registration.id} className="rounded-xl border p-3 flex flex-col md:flex-row md:items-center justify-between gap-3"><div><p className="font-semibold">{registration.fullName}</p><p className="text-xs text-muted-foreground" dir="ltr">{registration.email} · {registration.phone}</p>{registration.note && <p className="text-xs mt-1">{registration.note}</p>}</div><select className="h-9 rounded-md border bg-background px-2 text-sm" value={registration.status} onChange={(e) => setRegistrationStatus(event.id, registration.id, e.target.value as RegistrationStatus)}><option value="pending">بانتظار التأكيد</option><option value="confirmed">مؤكد</option><option value="waitlisted">قائمة انتظار</option><option value="cancelled">ملغي</option></select></div>)}</div>}
      </CardContent></Card>)}</div>}
    </AdminLayout>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="space-y-1"><span className="text-xs font-medium text-muted-foreground">{label}</span>{children}</label>;
}
