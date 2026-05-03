import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarCheck, MessageCircle, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";

type Settings = {
  whatsappNumber?: string | null;
  contactEmail?: string | null;
  siteNameAr?: string | null;
};

const apiBase = (() => {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
})();

export default function ConsultationPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [programTitle, setProgramTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${apiBase}/site-settings`).then((r) => r.ok ? r.json() : null).then((d) => {
      if (d) setSettings(d);
    }).catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !phone.trim() || !email.trim() || !date || !time) {
      setError("الرجاء تعبئة الحقول المطلوبة (الاسم، البريد، الواتساب، التاريخ، الوقت).");
      return;
    }
    setSubmitting(true);
    const r = await fetch(`${apiBase}/book-consultation`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name, phone, email, date, time,
        notes: notes + (programTitle ? `\n\nالبرنامج المهتم به: ${programTitle}` : ""),
        lang: "ar",
      }),
    });
    setSubmitting(false);
    if (r.ok) {
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error === "rate_limited" ? "تم استلام طلب مماثل مؤخراً. حاول لاحقاً." : "حدث خطأ في الإرسال. حاول مرة أخرى.");
    }
  };

  if (success) {
    const wa = settings?.whatsappNumber?.replace(/\D/g, "");
    const waText = encodeURIComponent(`مرحباً، حجزت جلسة استشارة بتاريخ ${date} الساعة ${time}. اسمي ${name}.`);
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-12 max-w-xl">
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold">تم استلام حجزك ✓</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                وصلتك رسالة تأكيد على بريدك. سيتواصل معك فريقنا قريباً لتأكيد الموعد.
              </p>
              <div className="bg-muted/40 rounded-lg p-3 text-sm text-start">
                <p><strong>التاريخ:</strong> {date}</p>
                <p><strong>الوقت:</strong> {time}</p>
                <p><strong>الاسم:</strong> {name}</p>
              </div>
              {wa && (
                <a href={`https://wa.me/${wa}?text=${waText}`} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-700 transition">
                  <MessageCircle className="w-5 h-5" />
                  أرسل تأكيد على واتساب
                </a>
              )}
              <div>
                <a href="/" className="text-xs text-primary hover:underline">العودة للصفحة الرئيسية</a>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-10 max-w-xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <CalendarCheck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">احجز جلسة استشارة مجانية</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {settings?.siteNameAr ?? "بكلمة"} — جلسة 20 دقيقة لمعرفة أنسب برنامج لك ولأهدافك
          </p>
        </div>

        <Card>
          <CardContent className="p-5">
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground/80">الاسم الكامل *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً: محمد أحمد" className="mt-1" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground/80">رقم الواتساب *</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+962 7 0000 0000" dir="ltr" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground/80">البريد الإلكتروني</label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="name@example.com" dir="ltr" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground/80">التاريخ المفضّل *</label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground/80">الوقت المفضّل *</label>
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-foreground/80">البرنامج الذي يهمّك</label>
                <select value={programTitle} onChange={(e) => setProgramTitle(e.target.value)} className="w-full border rounded-md p-2 text-sm bg-background mt-1 h-10">
                  <option value="">— اختياري —</option>
                  <option value="البرنامج الأساسي">البرنامج الأساسي</option>
                  <option value="تدريب المدرّبين">تدريب المدرّبين (TOT)</option>
                  <option value="المعلمون وأولياء الأمور">المعلمون وأولياء الأمور</option>
                  <option value="الخطيب الصغير">الخطيب الصغير</option>
                  <option value="غير متأكّد">غير متأكّد — أحتاج توجيهاً</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-foreground/80">ملاحظاتك</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                  placeholder="ما الذي تريد تحقيقه من البرنامج؟"
                  className="w-full border rounded-md p-2 text-sm bg-background mt-1 resize-none" />
              </div>
              {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>}
              <Button type="submit" disabled={submitting} className="w-full bg-primary text-white h-11 text-sm font-bold">
                {submitting ? "جاري الإرسال..." : "احجز الجلسة"}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                بإرسال طلبك توافق على تواصل فريق بكلمة معك عبر الواتساب أو البريد لتأكيد الموعد.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
