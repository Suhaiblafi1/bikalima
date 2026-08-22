import { useEffect, useState, useCallback } from "react";
import AdminAssignmentsTab from "@/components/admin-assignments-tab";
import { AdminLayout } from "./_layout";
import { useApiFetch, type CourseRecord } from "./_shared";

export default function AdminAssignmentsPage() {
  const apiFetch = useApiFetch();
  const [courses, setCourses] = useState<{ id: string; titleAr: string; titleEn: string }[]>([]);

  const fetchCourses = useCallback(async () => {
    const res = await apiFetch("/admin/courses");
    if (res.ok) {
      const data = (await res.json()) as { courses: CourseRecord[] };
      setCourses(data.courses.map((c) => ({ id: c.id, titleAr: c.titleAr, titleEn: c.titleEn })));
    }
  }, [apiFetch]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  return (
    <AdminLayout activeKey="assignments">
      <header>
        <h1 className="text-xl font-bold">الواجبات والتقييم</h1>
        <p className="mt-1 text-sm text-muted-foreground">أنشئ الواجبات، راجع التسليمات، وأرسل تغذية راجعة واضحة للطلاب.</p>
      </header>
      <AdminAssignmentsTab apiFetch={apiFetch} courses={courses} />
    </AdminLayout>
  );
}
