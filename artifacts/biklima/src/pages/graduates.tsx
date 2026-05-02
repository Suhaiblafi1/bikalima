import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap, ShieldCheck, Search } from "lucide-react";

type Graduate = {
  code: string;
  fullName: string;
  country: string | null;
  certType: string;
  programId: string | null;
  programName: string | null;
  issueDate: string;
  status: string;
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

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

export default function GraduatesPage() {
  const [, navigate] = useLocation();
  const [items, setItems] = useState<Graduate[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [country, setCountry] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("");
  const [program, setProgram] = useState("");

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (country) params.set("country", country);
    if (year) params.set("year", year);
    if (status) params.set("status", status);
    if (program) params.set("program", program);
    const res = await fetch(`${getApiBase()}/graduates?${params}`, { credentials: "same-origin" });
    if (res.ok) {
      const d = await res.json();
      setItems(d.graduates || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const years = useMemo(() => {
    const ys = new Set<number>();
    const now = new Date().getFullYear();
    for (let y = now; y >= now - 5; y--) ys.add(y);
    items.forEach((g) => { try { ys.add(new Date(g.issueDate).getFullYear()); } catch { /* skip */ } });
    return Array.from(ys).sort((a, b) => b - a);
  }, [items]);

  const countries = useMemo(() => {
    const c = new Set<string>();
    items.forEach((g) => { if (g.country) c.add(g.country); });
    return Array.from(c).sort();
  }, [items]);

  return (
    <AppShell breadcrumb={[{ label: "سجل خريجي بكلمة" }]}>
      <div className="container mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">سجل خريجي بكلمة</h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            خريجو وشركاء بكلمة المعتمدون. اضغط على أي بطاقة للتحقق من الشهادة الكاملة.
          </p>
        </div>

        {/* Filters */}
        <Card className="rounded-2xl mb-6">
          <CardContent className="p-3 flex flex-wrap items-center gap-2">
            <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-xs">
              <option value="">كل أنواع الاعتماد</option>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <Input
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              placeholder="معرّف البرنامج"
              className="w-40 h-9 text-xs"
              dir="ltr"
            />
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-xs">
              <option value="">كل الدول</option>
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-xs">
              <option value="">كل السنوات</option>
              {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-xs">
              <option value="">كل الحالات</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <Button onClick={load} size="sm" variant="outline" className="gap-1">
              <Search className="w-4 h-4" /> تطبيق
            </Button>
          </CardContent>
        </Card>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : items.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-10 text-center text-muted-foreground">
              لا يوجد خريجون منشورون بهذه التصفية بعد.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((g) => (
              <Card key={g.code} className="rounded-2xl overflow-hidden hover:shadow-md transition">
                <CardContent className="p-4 text-center space-y-3">
                  {g.graduateImageUrl ? (
                    <img
                      src={g.graduateImageUrl}
                      alt={g.fullName}
                      className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-primary/10"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold mx-auto">
                      {g.fullName.trim().charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-bold">{g.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {TYPE_LABELS[g.certType] || g.certType}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-1 text-[11px]">
                    {g.country && <span className="px-2 py-0.5 rounded-full bg-muted">{g.country}</span>}
                    {g.programName && <span className="px-2 py-0.5 rounded-full bg-muted">{g.programName}</span>}
                    <span className="px-2 py-0.5 rounded-full bg-muted">
                      {(() => { try { return new Date(g.issueDate).getFullYear(); } catch { return ""; } })()}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1 rounded-full"
                    onClick={() => navigate(`/certificates/${encodeURIComponent(g.code)}`)}
                    data-testid={`grad-verify-${g.code}`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> تحقق من الشهادة
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
