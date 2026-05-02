import { useState } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Search, AlertCircle, CheckCircle2, MessageCircle, ExternalLink } from "lucide-react";

type PublicCert = {
  code: string;
  fullName: string;
  country: string | null;
  certType: string;
  programId: string | null;
  programName: string | null;
  issueDate: string;
  expiryDate: string | null;
  status: string;
  assessorName: string | null;
  certificateFileUrl: string | null;
  graduateImageUrl: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  "trainee": "متدرب مجتاز",
  "trainer": "مدرب معتمد",
  "teacher": "معلم معتمد",
  "child-facilitator": "ميسر برنامج الأطفال",
  "ambassador": "سفير بكلمة",
  "partner-institution": "مؤسسة شريكة معتمدة",
};
const STATUS_LABELS: Record<string, string> = {
  active: "فعالة",
  expired: "منتهية",
  "under-review": "قيد المراجعة",
  suspended: "موقوفة",
  revoked: "ملغاة",
};
const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  expired: "bg-amber-100 text-amber-800 border-amber-200",
  "under-review": "bg-sky-100 text-sky-800 border-sky-200",
  suspended: "bg-orange-100 text-orange-800 border-orange-200",
  revoked: "bg-rose-100 text-rose-800 border-rose-200",
};

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

function formatDate(s: string | null): string {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }); }
  catch { return s; }
}

export function CertificateCard({ cert }: { cert: PublicCert }) {
  const [, navigate] = useLocation();
  const verifyUrl = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/certificates/${encodeURIComponent(cert.code)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encodeURIComponent(verifyUrl)}`;

  return (
    <Card className="rounded-3xl overflow-hidden border-2 border-primary/20 shadow-md">
      <div className="bg-gradient-to-l from-primary to-primary/80 text-white px-6 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7" />
          <div>
            <p className="text-[11px] uppercase tracking-wider opacity-80">شهادة بكلمة موثّقة</p>
            <p className="logo-biklima text-2xl text-accent leading-none">بكلمة</p>
          </div>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border ${STATUS_COLORS[cert.status] || "bg-gray-100 text-gray-700"}`}>
          {STATUS_LABELS[cert.status] || cert.status}
        </span>
      </div>

      <CardContent className="p-6 grid grid-cols-1 md:grid-cols-[1fr_180px] gap-6">
        <div className="space-y-3">
          {cert.graduateImageUrl && (
            <img
              src={cert.graduateImageUrl}
              alt={cert.fullName}
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md -mt-12"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <div>
            <p className="text-xs text-muted-foreground">الاسم الكامل</p>
            <p className="text-xl font-bold">{cert.fullName}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <p className="text-[11px] text-muted-foreground">نوع الاعتماد</p>
              <p className="text-sm font-medium">{TYPE_LABELS[cert.certType] || cert.certType}</p>
            </div>
            {cert.programName && (
              <div>
                <p className="text-[11px] text-muted-foreground">البرنامج</p>
                <p className="text-sm font-medium">{cert.programName}</p>
              </div>
            )}
            <div>
              <p className="text-[11px] text-muted-foreground">رقم الشهادة</p>
              <p className="text-sm font-mono" dir="ltr">{cert.code}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">تاريخ الإصدار</p>
              <p className="text-sm">{formatDate(cert.issueDate)}</p>
            </div>
            {cert.expiryDate && (
              <div>
                <p className="text-[11px] text-muted-foreground">تاريخ الانتهاء</p>
                <p className="text-sm">{formatDate(cert.expiryDate)}</p>
              </div>
            )}
            {cert.country && (
              <div>
                <p className="text-[11px] text-muted-foreground">الدولة</p>
                <p className="text-sm">{cert.country}</p>
              </div>
            )}
            {cert.assessorName && (
              <div className="col-span-2">
                <p className="text-[11px] text-muted-foreground">المدرب أو المقيّم</p>
                <p className="text-sm">{cert.assessorName}</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-3 border-t">
            {cert.certificateFileUrl && (
              <a
                href={cert.certificateFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full bg-primary text-white hover:bg-primary/90 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" /> تحميل الشهادة
              </a>
            )}
            <button
              onClick={() => navigate(`/certificates/${encodeURIComponent(cert.code)}`)}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-border hover:bg-muted transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> صفحة التحقق الدائمة
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 self-start">
          <img
            src={qrUrl}
            alt="QR للتحقق"
            className="w-[160px] h-[160px] rounded-lg border border-border bg-white p-1"
            loading="lazy"
          />
          <p className="text-[10px] text-muted-foreground text-center">امسح الرمز للتحقق المباشر</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VerifyPage() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PublicCert[] | null>(null);
  const [searched, setSearched] = useState(false);

  const onSearch = async () => {
    if (!code.trim() && !name.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (code.trim()) params.set("code", code.trim());
      if (name.trim()) params.set("name", name.trim());
      const res = await fetch(`${getApiBase()}/verify?${params}`, { credentials: "same-origin" });
      const data = await res.json();
      setResults(data.found ? data.results : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell breadcrumb={[{ label: "تحقق من شهادة" }]}>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">تحقق من شهادة أو اعتماد</h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            يمكنك التأكد من صحة شهادات بكلمة واعتمادات المدربين والمعلمين من خلال رقم الشهادة أو اسم الخريج.
          </p>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-5 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium">رقم الشهادة أو الاعتماد</label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
                placeholder="مثال: BK-CERT-2026-0001"
                dir="ltr"
                className="mt-1 text-center font-mono"
                data-testid="verify-code-input"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">أو اسم الخريج (اختياري)</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
                placeholder="ابحث بالاسم"
                className="mt-1"
                data-testid="verify-name-input"
              />
            </div>
            <Button
              onClick={onSearch}
              disabled={loading || (!code.trim() && !name.trim())}
              className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-white gap-2"
              data-testid="verify-submit"
            >
              <Search className="w-4 h-4" />
              {loading ? "جارٍ التحقق..." : "تحقق الآن"}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && !loading && results !== null && (
          <div className="mt-8 space-y-4">
            {results.length > 0 ? (
              <>
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="font-bold">
                    {results.length === 1 ? "تم العثور على شهادة موثّقة" : `تم العثور على ${results.length} نتائج`}
                  </p>
                </div>
                {results.map((c) => <CertificateCard key={c.code} cert={c} />)}
              </>
            ) : (
              <Card className="rounded-2xl border-amber-200 bg-amber-50">
                <CardContent className="p-6 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
                  <p className="font-bold text-amber-900">لم نتمكن من العثور على شهادة بهذا الرقم.</p>
                  <p className="text-sm text-amber-800/80">
                    تأكد من كتابة رقم الشهادة أو الاسم بشكل صحيح، أو تواصل معنا للمساعدة.
                  </p>
                  <a
                    href="https://wa.me/97455377065"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/90 transition"
                  >
                    <MessageCircle className="w-4 h-4" /> تواصل معنا
                  </a>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
