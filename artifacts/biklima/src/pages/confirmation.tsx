import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, LayoutDashboard } from "lucide-react";
import { AppShell } from "@/components/app-shell";

type Lang = "ar" | "en";

const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

export default function ConfirmationPage() {
  const [, navigate] = useLocation();
  const [lang, setLang] = useState<Lang>(() => {
    try { return (localStorage.getItem("bk_lang") as Lang) || "ar"; } catch { return "ar"; }
  });
  const switchLang = (l: Lang) => {
    setLang(l);
    try { localStorage.setItem("bk_lang", l); } catch {}
  };

  const steps = lang === "ar"
    ? [
        { num: "1", text: "ستصلك رسالة تأكيد على بريدك الإلكتروني" },
        { num: "2", text: "سيراجع فريقنا طلبك ويتواصل معك لتأكيد الدفع" },
        { num: "3", text: "بعد تأكيد الدفع ستصلك بيانات الدخول للبرنامج" },
      ]
    : [
        { num: "1", text: "A confirmation email will be sent to your inbox" },
        { num: "2", text: "Our team will review your request and contact you to confirm payment" },
        { num: "3", text: "After payment confirmation, your program login credentials will be sent" },
      ];

  return (
    <AppShell lang={lang} onLangChange={switchLang} containerClassName="flex-1 flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              {lang === "ar" ? "تم التسجيل بنجاح ✓" : "Registration Successful ✓"}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {lang === "ar"
                ? "شكراً لاهتمامك بالانضمام لبرنامج بكلمة. سيتواصل معك الفريق قريباً."
                : "Thank you for your interest in joining the Bikalima program. Our team will be in touch soon."}
            </p>
          </div>
        </div>

        <div className="bg-muted/40 border border-border rounded-2xl p-6 text-start space-y-4">
          <h2 className="font-bold text-foreground text-base">
            {lang === "ar" ? "الخطوات التالية:" : "What Happens Next:"}
          </h2>
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.num} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step.num}
                </div>
                <p className="text-sm text-foreground leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            className="w-full rounded-full font-bold py-6 text-base gap-2"
            onClick={() => navigate(`${baseUrl}/dashboard`)}
          >
            <LayoutDashboard className="w-4 h-4" />
            {lang === "ar" ? "الذهاب إلى لوحة التحكم" : "Go to Dashboard"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate(`${baseUrl}/`)}
            className="w-full"
          >
            <Home className="w-4 h-4 me-2" />
            {lang === "ar" ? "العودة للرئيسية" : "Back to Home"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
