import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Trash2, Search, MessageSquare } from "lucide-react";
import { AdminLayout } from "./_layout";
import { useApiFetch, type ReviewRecord } from "./_shared";

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= count ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const apiFetch = useApiFetch();
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/reviews");
      if (res.ok) setReviews((await res.json()).reviews ?? []);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذا التقييم نهائياً؟")) return;
    const res = await apiFetch(`/admin/reviews/${id}`, { method: "DELETE" });
    if (res.ok) setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const courseOptions = useMemo(() => {
    const map = new Map<string, string>();
    reviews.forEach((r) => {
      if (!map.has(r.courseId)) {
        map.set(r.courseId, r.courseTitleAr || r.courseTitleEn || r.courseId);
      }
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [reviews]);

  const filtered = reviews.filter((r) => {
    if (courseFilter !== "all" && r.courseId !== courseFilter) return false;
    if (ratingFilter !== "all" && r.rating !== ratingFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.userEmail || "").toLowerCase().includes(q) ||
      (r.reviewerName || "").toLowerCase().includes(q) ||
      (r.commentAr || "").toLowerCase().includes(q) ||
      (r.commentEn || "").toLowerCase().includes(q)
    );
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <AdminLayout activeKey="reviews">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">إجمالي التقييمات</p>
          <p className="text-2xl font-bold">{reviews.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">متوسط التقييم</p>
          <p className="text-2xl font-bold flex items-center gap-1">
            {avgRating} <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          </p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">5 نجوم</p>
          <p className="text-2xl font-bold text-green-600">{reviews.filter((r) => r.rating === 5).length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">≤ 3 نجوم</p>
          <p className="text-2xl font-bold text-amber-600">{reviews.filter((r) => r.rating <= 3).length}</p>
        </CardContent></Card>
      </div>

      <Card><CardContent className="p-5">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> تقييمات الطلاب ({filtered.length})
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="text-sm border rounded-lg p-2 bg-background"
              aria-label="تصفية حسب الدورة"
            >
              <option value="all">كل الدورات</option>
              {courseOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="text-sm border rounded-lg p-2 bg-background"
              aria-label="تصفية حسب التقييم"
            >
              <option value="all">كل التقييمات</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} نجوم</option>
              ))}
            </select>
            <div className="relative w-56">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {reviews.length === 0 ? "لا توجد تقييمات بعد." : "لا توجد تقييمات مطابقة."}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const reviewer = r.reviewerName
                || [r.userFirstName, r.userLastName].filter(Boolean).join(" ")
                || r.userEmail
                || "زائر";
              const comment = r.commentAr || r.commentEn || "—";
              return (
                <div key={r.id} className="border border-border rounded-xl p-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{reviewer}</span>
                        {r.userEmail && (
                          <span className="text-xs text-muted-foreground" dir="ltr">{r.userEmail}</span>
                        )}
                        <StarRow count={r.rating} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {r.courseTitleAr || r.courseTitleEn || "—"}
                        <span className="mx-2">·</span>
                        {new Date(r.createdAt).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(r.id)}
                      className="h-7 w-7 p-0 text-destructive shrink-0"
                      aria-label="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90">{comment}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent></Card>
    </AdminLayout>
  );
}
