import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/hooks/useLang";
import { usePageMeta } from "@/hooks/use-page-meta";

type Registration = {
  id: string; fullName: string; email: string; phone: string; note: string | null;
  status: "pending" | "confirmed" | "waitlisted" | "cancelled";
  eventTitleAr: string; eventTitleEn: string; startsAt: string; locationAr: string; locationEn: string;
};

function apiBase() {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

export default function ManageRegistrationPage() {
  const { lang, dir } = useLang();
  const [, navigate] = useLocation();
  const isAr = lang === "ar";
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  usePageMeta({ title: isAr ? "إدارة التسجيل" : "Manage registration", noindex: true });

  useEffect(() => {
    if (!token) { setError(isAr ? "رابط الإدارة غير صالح." : "Invalid management link."); setLoading(false); return; }
    fetch(`${apiBase()}/in-person-registrations/manage/${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "not_found");
        return data.registration as Registration;
      })
      .then((data) => { setRegistration(data); setName(data.fullName); setPhone(data.phone); setNote(data.note ?? ""); })
      .catch(() => setError(isAr ? "الرابط غير صالح أو انتهت صلاحيته." : "This link is invalid or expired."))
      .finally(() => setLoading(false));
  }, [isAr, token]);

  const update = async (cancel = false) => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const response = await fetch(`${apiBase()}/in-person-registrations/manage/${encodeURIComponent(token)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cancel ? { cancel: true } : { fullName: name, phone, note }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "request_failed");
      setRegistration((current) => current ? { ...current, ...data.registration } : current);
      setSaved(true);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : (isAr ? "تعذّر حفظ التعديل." : "Could not save changes."));
    } finally { setSaving(false); }
  };

  return <div className="min-h-screen flex flex-col bg-background" dir={dir}><SiteHeader /><main className="flex-1 container mx-auto max-w-2xl px-4 py-24">
    {loading ? <div className="py-20 flex justify-center" aria-label={isAr ? "جارٍ التحميل" : "Loading"}><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : error && !registration ? <Card><CardContent className="p-10 text-center"><XCircle className="w-12 h-12 text-destructive mx-auto mb-4" /><p className="font-semibold">{error}</p><Button className="mt-6" onClick={() => navigate("/")}>{isAr ? "الصفحة الرئيسية" : "Home"}</Button></CardContent></Card> : registration && <Card><CardContent className="p-6 space-y-5">
      <div><h1 className="text-2xl font-bold">{isAr ? "إدارة تسجيلك" : "Manage your registration"}</h1><p className="text-muted-foreground mt-1">{isAr ? registration.eventTitleAr : registration.eventTitleEn}</p></div>
      <div className="rounded-xl bg-muted/50 p-4 text-sm"><p>{new Date(registration.startsAt).toLocaleString(isAr ? "ar-JO" : "en-GB", { dateStyle: "full", timeStyle: "short" })}</p><p>{isAr ? registration.locationAr : registration.locationEn}</p><p className="mt-2 font-semibold">{isAr ? "الحالة:" : "Status:"} {registration.status}</p></div>
      {registration.status === "cancelled" ? <div className="rounded-xl bg-destructive/5 p-5 text-center text-destructive">{isAr ? "تم إلغاء هذا التسجيل." : "This registration has been cancelled."}</div> : <>
        <label className="space-y-1 block"><span className="text-sm font-medium">{isAr ? "الاسم" : "Name"}</span><Input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="space-y-1 block"><span className="text-sm font-medium">{isAr ? "الهاتف/واتساب" : "Phone/WhatsApp"}</span><Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" /></label>
        <label className="space-y-1 block"><span className="text-sm font-medium">{isAr ? "ملاحظة" : "Note"}</span><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></label>
        {saved && <p className="text-sm text-emerald-700 flex items-center gap-2" role="status"><CheckCircle2 className="w-4 h-4" />{isAr ? "تم حفظ التعديل." : "Changes saved."}</p>}
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <div className="flex flex-col sm:flex-row gap-2"><Button onClick={() => update(false)} disabled={saving}>{saving && <Loader2 className="w-4 h-4 me-2 animate-spin" />}{isAr ? "حفظ التعديل" : "Save changes"}</Button><Button variant="destructive" onClick={() => { if (window.confirm(isAr ? "هل تريد إلغاء التسجيل؟" : "Cancel this registration?")) update(true); }} disabled={saving}>{isAr ? "إلغاء التسجيل" : "Cancel registration"}</Button></div>
      </>}
    </CardContent></Card>}
  </main><SiteFooter /></div>;
}
