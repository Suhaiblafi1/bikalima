import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Check, Copy, Linkedin, MessageCircle, Share2 } from "lucide-react";
import { CertificateCard } from "./verify";
import { usePageMeta } from "@/hooks/use-page-meta";

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
  const [copied, setCopied] = useState(false);

  usePageMeta({
    title: cert ? `شهادة ${cert.fullName}` : "التحقق من شهادة",
    description: cert
      ? `تحقق من شهادة ${cert.fullName}${cert.programName ? ` في ${cert.programName}` : ""} الصادرة عن بكلمة.`
      : "صفحة التحقق الرسمية من شهادات بكلمة.",
    canonicalPath: `/certificates/${encodeURIComponent(code)}`,
    ogImage: cert?.graduateImageUrl ?? undefined,
  });

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

  const shareUrl = typeof window === "undefined" ? `https://bikalima.com/certificates/${encodeURIComponent(code)}` : window.location.href;
  const shareText = cert ? `شهادة ${cert.fullName}${cert.programName ? ` — ${cert.programName}` : ""} من بكلمة` : "شهادة موثقة من بكلمة";
  const shareNavigator = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
  const canNativeShare = typeof shareNavigator.share === "function";

  const shareCertificate = async () => {
    if (canNativeShare && shareNavigator.share) {
      await shareNavigator.share({ title: shareText, text: shareText, url: shareUrl }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

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
            <h1 className="sr-only">شهادة {cert.fullName}</h1>
            <CertificateCard cert={cert} />
            <Card className="rounded-2xl border-primary/15 bg-primary/5">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold">شارك إنجازك برابط موثّق</h2>
                  <p className="mt-1 text-xs text-muted-foreground">يمكن لأي جهة فتح الرابط والتحقق من بيانات الشهادة مباشرة.</p>
                </div>
                <div className="flex flex-wrap gap-2" data-testid="certificate-share-actions">
                  <Button type="button" size="sm" onClick={() => void shareCertificate()} className="gap-2 rounded-full">
                    {copied ? <Check className="h-4 w-4" /> : canNativeShare ? <Share2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "تم نسخ الرابط" : "مشاركة"}
                  </Button>
                  <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-bold hover:bg-muted">
                    <Linkedin className="h-4 w-4" /> LinkedIn
                  </a>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-bold hover:bg-muted">
                    <MessageCircle className="h-4 w-4" /> واتساب
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
