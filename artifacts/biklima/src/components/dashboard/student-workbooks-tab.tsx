import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookMarked, Download } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useMyWorkbooks, useMyWorkbookOrders } from "@/hooks/use-dashboard-data";

type Lang = "ar" | "en";

const STATUS_LABELS: Record<string, Record<Lang, string>> = {
  pending: { ar: "قيد المراجعة", en: "Pending" },
  approved: { ar: "مقبول", en: "Approved" },
  rejected: { ar: "مرفوض", en: "Rejected" },
  confirmed: { ar: "مؤكد", en: "Confirmed" },
  shipped: { ar: "تم الشحن", en: "Shipped" },
  delivered: { ar: "تم التوصيل", en: "Delivered" },
  paid: { ar: "مدفوع", en: "Paid" },
  cancelled: { ar: "ملغى", en: "Cancelled" },
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function StudentWorkbooksTab({ lang, heading }: { lang: Lang; heading: string }) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { data: ownedWorkbooks = [], isLoading } = useMyWorkbooks(userId);
  // Pre-warm the workbook-orders cache so the Orders tab snaps in instantly
  // when the user pivots over.
  useMyWorkbookOrders(userId);
  const isRtl = lang === "ar";

  return (
    <Card className="rounded-2xl" data-testid="workbooks-tab">
      <CardContent className="p-6 md:p-8 space-y-4">
        <h3 className="font-bold text-xl flex items-center gap-2">
          <BookMarked className="w-5 h-5 text-primary" />
          {heading}
        </h3>
        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : ownedWorkbooks.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <BookMarked className="w-10 h-10 text-primary/50" />
            </div>
            <p className="text-muted-foreground">
              {isRtl ? "لا توجد كرّاسات في مكتبتك بعد." : "Your library is empty for now."}
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {isRtl
                ? "اطلب أول كرّاسة من متجرنا وستظهر هنا فور تأكيد الطلب."
                : "Order your first workbook — it will appear here once your order is confirmed."}
            </p>
            <Button onClick={() => navigate("/workbooks")} className="rounded-full bg-primary text-white text-sm">
              {isRtl ? "تصفّح الكرّاسات" : "Browse Workbooks"}
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {ownedWorkbooks.map((w) => {
              const title = isRtl ? (w.titleAr || w.titleEn) : (w.titleEn || w.titleAr);
              const desc = isRtl ? (w.descriptionAr || w.descriptionEn) : (w.descriptionEn || w.descriptionAr);
              return (
                <div key={w.orderId} className="border border-border rounded-xl overflow-hidden bg-background flex flex-col" data-testid={`owned-workbook-${w.workbookId}`}>
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {w.coverImageUrl ? (
                      <img src={w.coverImageUrl} alt={title || ""} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookMarked className="w-10 h-10 text-primary/30" />
                      </div>
                    )}
                    <span className={`absolute top-2 ${isRtl ? "start-2" : "end-2"} text-[10px] font-bold px-2 py-0.5 rounded-full ${w.format === "pdf" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                      {w.format === "pdf" ? (isRtl ? "رقمية" : "PDF") : (isRtl ? "مطبوعة" : "Print")}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="font-bold text-sm">{title || (isRtl ? "كرّاسة" : "Workbook")}</p>
                    {desc && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{desc}</p>}
                    <div className="mt-auto pt-3 flex items-center gap-2">
                      {w.samplePdfUrl && (
                        <a
                          href={w.samplePdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 inline-flex items-center gap-1.5 font-medium"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {isRtl ? "تنزيل" : "Download"}
                        </a>
                      )}
                      {w.slug && (
                        <button
                          onClick={() => navigate(`/workbooks/${w.slug}`)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground"
                        >
                          {isRtl ? "التفاصيل" : "Details"}
                        </button>
                      )}
                      <span className={`ms-auto text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[w.status] || "bg-gray-100 text-gray-800"}`}>
                        {STATUS_LABELS[w.status]?.[lang] ?? w.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
