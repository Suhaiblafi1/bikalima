import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, ExternalLink, Copy } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useMyCertificates } from "@/hooks/use-dashboard-data";

type Lang = "ar" | "en";

const CERT_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  "trainee": { ar: "متدرب مجتاز", en: "Graduated Trainee" },
  "trainer": { ar: "مدرب معتمد", en: "Certified Trainer" },
  "teacher": { ar: "معلم معتمد", en: "Certified Teacher" },
  "child-facilitator": { ar: "ميسر برنامج الأطفال", en: "Children's Program Facilitator" },
  "ambassador": { ar: "سفير بكلمة", en: "Bikalima Ambassador" },
  "partner-institution": { ar: "مؤسسة شريكة معتمدة", en: "Accredited Partner Institution" },
};
const CERT_STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  active: { ar: "فعالة", en: "Active" },
  expired: { ar: "منتهية", en: "Expired" },
  "under-review": { ar: "قيد المراجعة", en: "Under review" },
  suspended: { ar: "موقوفة", en: "Suspended" },
  revoked: { ar: "ملغاة", en: "Revoked" },
};
const CERT_STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  expired: "bg-amber-100 text-amber-800",
  "under-review": "bg-sky-100 text-sky-800",
  suspended: "bg-orange-100 text-orange-800",
  revoked: "bg-rose-100 text-rose-800",
};

export default function StudentCertificatesTab({ lang }: { lang: Lang }) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: items = [], isLoading } = useMyCertificates(user?.id ?? null);
  const isAr = lang === "ar";

  const copyLink = async (code: string) => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/certificates/${encodeURIComponent(code)}`;
    try {
      await navigator.clipboard.writeText(url);
      alert(isAr ? "تم نسخ رابط التحقق" : "Verification link copied");
    } catch {
      prompt(isAr ? "انسخ الرابط:" : "Copy the link:", url);
    }
  };

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6 md:p-8 space-y-4">
        <h3 className="font-bold text-xl flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          {isAr ? "شهاداتي واعتماداتي" : "My Certificates"}
        </h3>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-10 h-10 text-primary/50" />
            </div>
            <p className="text-muted-foreground">
              {isAr ? "لا توجد شهادات بعد." : "No certificates yet."}
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {isAr
                ? "تظهر هنا شهاداتك واعتماداتك الصادرة من بكلمة بمجرد إصدارها."
                : "Your Bikalima certificates and accreditations will appear here once issued."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((c) => (
              <div key={c.id} className="border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-0.5 rounded" dir="ltr">{c.code}</code>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${CERT_STATUS_COLORS[c.status] || "bg-gray-100 text-gray-700"}`}>
                      {CERT_STATUS_LABELS[c.status]?.[lang] ?? c.status}
                    </span>
                  </div>
                  <p className="font-bold mt-1">
                    {(CERT_TYPE_LABELS[c.certType]?.[lang]) ?? c.certType}
                    {c.programName ? <span className="text-muted-foreground font-normal"> · {c.programName}</span> : null}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isAr ? "صدرت في: " : "Issued: "}
                    {(() => { try { return new Date(c.issueDate).toLocaleDateString(isAr ? "ar-EG" : "en-US"); } catch { return c.issueDate; } })()}
                    {c.expiryDate && (
                      <>
                        {isAr ? " · تنتهي في: " : " · Expires: "}
                        {(() => { try { return new Date(c.expiryDate!).toLocaleDateString(isAr ? "ar-EG" : "en-US"); } catch { return c.expiryDate; } })()}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.certificateFileUrl && (
                    <a
                      href={c.certificateFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-border hover:bg-muted transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {isAr ? "تحميل" : "Download"}
                    </a>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyLink(c.code)}
                    className="rounded-full gap-1.5 h-9"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {isAr ? "نسخ رابط التحقق" : "Copy verify link"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/certificates/${encodeURIComponent(c.code)}`)}
                    className="rounded-full gap-1.5 h-9 bg-primary hover:bg-primary/90 text-white"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isAr ? "صفحة التحقق" : "Verify page"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
