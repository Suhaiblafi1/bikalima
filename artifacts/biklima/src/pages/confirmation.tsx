import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, LayoutDashboard, GraduationCap, AlertCircle, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useLang } from "@/hooks/useLang";
import { usePageMeta } from "@/hooks/use-page-meta";

const REDIRECT_SECONDS = 6;

function getApiBase() {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

type VerifyState =
  | { kind: "idle" }
  | { kind: "verifying" }
  | { kind: "paid" }
  | { kind: "manual" }
  | { kind: "unpaid" }
  | { kind: "error"; message: string };

export default function ConfirmationPage() {
  usePageMeta({ title: "تأكيد الطلب", noindex: true, canonicalPath: "/confirmation" });
  const [, navigate] = useLocation();
  const { lang } = useLang();
  const apiBase = getApiBase();

  const params = (() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  })();

  const slug = params.get("slug") || "";
  const sessionId = params.get("session_id") || "";
  const orderId = params.get("order_id") || "";
  const isManual = params.get("manual") === "1";

  const learnPath = slug ? `/courses/${slug}/learn` : null;

  const [verify, setVerify] = useState<VerifyState>(() => {
    if (sessionId) return { kind: "verifying" };
    if (isManual) return { kind: "manual" };
    return { kind: "idle" };
  });

  // Verify the Stripe session (if any) and ensure the enrollment was created.
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/orders/verify-session`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, orderId }),
        });
        if (cancelled) return;
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setVerify({
            kind: "error",
            message:
              data?.error ||
              (lang === "ar"
                ? "تعذّر التحقق من الدفع. يرجى التواصل مع الدعم."
                : "Could not verify payment. Please contact support."),
          });
          return;
        }
        const data = await res.json();
        if (data?.paid) {
          setVerify({ kind: "paid" });
        } else {
          setVerify({ kind: "unpaid" });
        }
      } catch {
        if (cancelled) return;
        setVerify({
          kind: "error",
          message:
            lang === "ar"
              ? "حدث خطأ في الاتصال أثناء التحقق من الدفع."
              : "Connection error while verifying payment.",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, orderId, apiBase, lang]);

  const showLearnRedirect = verify.kind === "paid" && !!learnPath;

  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (!showLearnRedirect || !learnPath) return;
    setSecondsLeft(REDIRECT_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          navigate(learnPath);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showLearnRedirect, learnPath, navigate]);

  // ── Verifying state ───────────────────────────────────────────────
  if (verify.kind === "verifying") {
    return (
      <AppShell
        containerClassName="flex-1 flex items-center justify-center p-6"
        breadcrumb={[{ label: lang === "ar" ? "تأكيد الدفع" : "Confirming Payment" }]}
      >
        <div className="max-w-md w-full text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <h1 className="text-xl font-bold">
            {lang === "ar" ? "جاري التحقق من الدفع…" : "Verifying your payment…"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {lang === "ar"
              ? "لحظات من فضلك، نتأكد من إتمام عملية الدفع وتفعيل وصولك للدورة."
              : "Hang tight — we're confirming your payment and activating your course access."}
          </p>
        </div>
      </AppShell>
    );
  }

  // ── Error / unpaid state ──────────────────────────────────────────
  if (verify.kind === "error" || verify.kind === "unpaid") {
    const message =
      verify.kind === "error"
        ? verify.message
        : lang === "ar"
        ? "لم يكتمل الدفع. لم يتم تفعيل وصولك بعد."
        : "Your payment was not completed. Access has not been granted yet.";
    return (
      <AppShell
        containerClassName="flex-1 flex items-center justify-center p-6"
        breadcrumb={[{ label: lang === "ar" ? "تعذّر تأكيد الدفع" : "Payment Issue" }]}
      >
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-black text-foreground">
            {lang === "ar" ? "تعذّر تأكيد الدفع" : "Payment Not Confirmed"}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>
          <div className="flex flex-col gap-3">
            {slug && (
              <Button
                className="w-full rounded-full font-bold py-6 text-base"
                onClick={() => navigate(`/checkout?slug=${encodeURIComponent(slug)}`)}
              >
                {lang === "ar" ? "إعادة المحاولة" : "Try Again"}
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full rounded-full font-bold py-6 text-base gap-2"
              onClick={() => navigate(`/dashboard`)}
            >
              <LayoutDashboard className="w-4 h-4" />
              {lang === "ar" ? "الذهاب إلى لوحة التحكم" : "Go to Dashboard"}
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/`)} className="w-full">
              <Home className="w-4 h-4 me-2" />
              {lang === "ar" ? "العودة للرئيسية" : "Back to Home"}
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Paid (instant access) state ───────────────────────────────────
  if (verify.kind === "paid") {
    return (
      <AppShell
        containerClassName="flex-1 flex items-center justify-center p-6"
        breadcrumb={[{ label: lang === "ar" ? "تم الدفع بنجاح" : "Payment Successful" }]}
      >
        <div className="max-w-lg w-full space-y-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                {lang === "ar" ? "تم الدفع بنجاح ✓" : "Payment Successful ✓"}
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {lang === "ar"
                  ? "تم تفعيل وصولك للدورة فوراً. ابدأ التعلم الآن."
                  : "Your course access has been activated instantly. Start learning now."}
              </p>
            </div>
          </div>

          {learnPath && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-sm text-foreground">
              {lang === "ar" ? (
                <>
                  سيتم تحويلك إلى صفحة الدورة خلال{" "}
                  <span className="font-bold text-primary">{secondsLeft}</span> ثانية…
                </>
              ) : (
                <>
                  Redirecting you to your course in{" "}
                  <span className="font-bold text-primary">{secondsLeft}</span> seconds…
                </>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {learnPath && (
              <Button
                className="w-full rounded-full font-bold py-6 text-base gap-2"
                onClick={() => navigate(learnPath)}
              >
                <GraduationCap className="w-4 h-4" />
                {lang === "ar" ? "الذهاب إلى الدورة الآن" : "Go to Course Now"}
              </Button>
            )}
            <Button
              variant={learnPath ? "outline" : "default"}
              className="w-full rounded-full font-bold py-6 text-base gap-2"
              onClick={() => navigate(`/dashboard`)}
            >
              <LayoutDashboard className="w-4 h-4" />
              {lang === "ar" ? "الذهاب إلى لوحة التحكم" : "Go to Dashboard"}
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/`)} className="w-full">
              <Home className="w-4 h-4 me-2" />
              {lang === "ar" ? "العودة للرئيسية" : "Back to Home"}
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Fallback / legacy manual-confirmation state ──────────────────
  const steps =
    lang === "ar"
      ? [
          { num: "1", text: "ستصلك رسالة تأكيد على بريدك الإلكتروني" },
          { num: "2", text: "سيتواصل معك فريقنا لتأكيد الدفع وتفعيل وصولك للدورة" },
          { num: "3", text: "ابدأ التعلم فور تفعيل حسابك" },
        ]
      : [
          { num: "1", text: "A confirmation email will be sent to your inbox" },
          { num: "2", text: "Our team will reach out to confirm payment and activate your course access" },
          { num: "3", text: "Start learning as soon as your account is activated" },
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
              {lang === "ar" ? "تم استلام طلبك ✓" : "Request Received ✓"}
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
          <Button variant="ghost" onClick={() => navigate(`/`)} className="w-full">
            <Home className="w-4 h-4 me-2" />
            {lang === "ar" ? "العودة للرئيسية" : "Back to Home"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
