import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";
import { useApiFetch } from "@/pages/admin/_shared";
import { BookOpen, GraduationCap, Mic2, ClipboardList, CalendarCheck, Loader2 } from "lucide-react";

type CourseRow = { id: string; titleAr: string; titleEn: string; enrollmentCount: number };
type EnrollmentRow = { id: string; userId: string; userEmail: string | null; userFirstName: string | null; userLastName: string | null; courseTitle: string | null };
type SpeechEvalRow = { id: string; fullName: string; status: string; createdAt: string; overallScore: number | null };

export default function TrainerDashboardPage() {
  const apiFetch = useApiFetch();
  const { user, role, isLoading } = useMe();
  const [, navigate] = useLocation();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [learners, setLearners] = useState<EnrollmentRow[]>([]);
  const [evals, setEvals] = useState<SpeechEvalRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, e, sp] = await Promise.all([
      apiFetch("/admin/courses").then((r) => (r.ok ? r.json() : { courses: [] })),
      apiFetch("/admin/enrollments").then((r) => (r.ok ? r.json() : { enrollments: [] })),
      apiFetch("/admin/speech-evaluations").then((r) => (r.ok ? r.json() : { evaluations: [] })),
    ]);
    setCourses(c.courses ?? []);
    setLearners(e.enrollments ?? []);
    setEvals(sp.evaluations ?? []);
    setLoading(false);
  }, [apiFetch]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate("/dashboard", { replace: true });
      return;
    }
    if (role === "admin") {
      navigate("/admin/overview", { replace: true });
      return;
    }
    if (role !== "trainer") {
      navigate("/dashboard", { replace: true });
      return;
    }
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

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<BookOpen className="w-5 h-5" />} label="دوراتي" value={courses.length} />
          <StatCard icon={<GraduationCap className="w-5 h-5" />} label="طلابي" value={uniqueLearners.size} />
          <StatCard icon={<Mic2 className="w-5 h-5" />} label="تقييمات صوتية" value={evals.length} sub={`${pendingEvals.length} بانتظار المراجعة`} />
          <StatCard icon={<ClipboardList className="w-5 h-5" />} label="إجراءات سريعة" value={"—"} sub="من القائمة الجانبية" />
        </section>

        <section className="grid md:grid-cols-2 gap-4">
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
                    <tr><th className="text-start py-2 px-2">الاسم</th><th className="text-start py-2 px-2">البريد</th><th className="text-start py-2 px-2">الدورة</th></tr>
                  </thead>
                  <tbody>
                    {Array.from(uniqueLearners.values()).slice(0, 50).map((l) => (
                      <tr key={l.id} className="border-b border-border/40">
                        <td className="py-2 px-2">{[l.userFirstName, l.userLastName].filter(Boolean).join(" ") || "—"}</td>
                        <td className="py-2 px-2 text-muted-foreground">{l.userEmail ?? "—"}</td>
                        <td className="py-2 px-2">{l.courseTitle ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3 text-sm">
            <CalendarCheck className="w-5 h-5 text-primary" />
            <span>لإدارة الحضور والواجبات والشهادات استخدم القائمة الجانبية في لوحة الإدارة.</span>
            <Button size="sm" variant="outline" className="ms-auto" onClick={() => navigate("/admin/courses")}>فتح لوحة الإدارة</Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number | string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">{icon}{label}</div>
        <div className="text-2xl font-bold mt-1">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}
