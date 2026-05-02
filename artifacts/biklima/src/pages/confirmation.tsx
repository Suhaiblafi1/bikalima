import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, LayoutDashboard } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useLang } from "@/hooks/useLang";

export default function ConfirmationPage() {
  const [, navigate] = useLocation();
  const { lang } = useLang();

  const steps = lang === "ar"
    ? [
        { num: "1", text: "ستصلك رسالة تأكيد على بريدك الإلكتروني" },
        { num: "2", text: "أكّد بريدك من الرابط في الرسالة لتفعيل حسابك" },
        { num: "3", text: "سيتواصل معك فريقنا لترتيب التفاصيل وتأكيد المقعد" },
      ]
    : [
        { num: "1", text: "A confirmation email will be sent to your inbox" },
        { num: "2", text: "Verify your email via the link to activate your account" },
        { num: "3", text: "Our team will reach out to finalize details and confirm your spot" },
      ];

  return (
    <AppShell
      containerClassName="flex-1 flex items-center justify-center p-6"
      breadcrumb={[{ label: lang === "ar" ? "تأكيد الطلب" : "Confirmation" }]}
    >
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
            onClick={() => navigate(`/dashboard`)}
          >
            <LayoutDashboard className="w-4 h-4" />
            {lang === "ar" ? "الذهاب إلى لوحة التحكم" : "Go to Dashboard"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate(`/`)}
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
