import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, MessageCircle } from "lucide-react";
import { CertificateCard } from "./verify";

type PublicCert = Parameters<typeof CertificateCard>[0]["cert"];

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

export default function CertificateDetailPage() {
  const [, params] = useRoute<{ code: string }>("/certificates/:code");
  const [, navigate] = useLocation();
  const code = params?.code ?? "";
  const [cert, setCert] = useState<PublicCert | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    fetch(`${getApiBase()}/certificates/${encodeURIComponent(code)}`, { credentials: "same-origin" })
      .then(async (r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (data?.certificate) setCert(data.certificate);
      })
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <AppShell breadcrumb={[
      { label: "تحقق من شهادة", href: `${import.meta.env.BASE_URL.replace(/\/$/, "")}/verify` },
      { label: code },
    ]}>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : notFound || !cert ? (
          <Card className="rounded-2xl border-amber-200 bg-amber-50">
            <CardContent className="p-8 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
              <h1 className="text-xl font-bold text-amber-900">لم نتمكن من العثور على شهادة بهذا الرقم</h1>
              <p className="text-sm text-amber-800/80" dir="ltr">{code}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => navigate("/verify")} variant="outline" className="gap-2 rounded-full">
                  <ArrowLeft className="w-4 h-4" /> العودة للتحقق
                </Button>
                <a
                  href="https://wa.me/97455377065"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/90 transition"
                >
                  <MessageCircle className="w-4 h-4" /> تواصل معنا
                </a>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <CertificateCard cert={cert} />
            <p className="text-xs text-center text-muted-foreground">
              صفحة تحقق دائمة — يمكنك مشاركة الرابط أعلاه مع جهات العمل أو المؤسسات للتحقق من الشهادة.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
