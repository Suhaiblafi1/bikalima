import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/phone-input";
import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, Phone, AlertCircle, ArrowRight, Home, LogIn } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useLang } from "@/hooks/useLang";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { programPageSlugFromCourseSlug } from "@/lib/site-config";
import { apiFetch } from "@/lib/api-fetch";
import { usePageMeta } from "@/hooks/use-page-meta";

export default function CheckoutPage() {
  const paymentsEnabled = useFeatureFlag("payments");
  const [, navigate] = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { lang } = useLang();
  const isRtl = lang === "ar";

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug") || "";
  const paymentCancelled = params.get("payment") === "cancelled";

  // Checkout pages are user-private — never index them, never list them in
  // the sitemap. Title still updates so the browser tab is meaningful.
  usePageMeta({
    title: lang === "ar" ? "إتمام التسجيل" : "Checkout",
    noindex: true,
  });

  const [courseId, setCourseId] = useState<string>("");
  const [courseTitleAr, setCourseTitleAr] = useState<string>("");
  const [courseTitleEn, setCourseTitleEn] = useState<string>("");
  const [coursePrice, setCoursePrice] = useState<number | null>(null);
  const [courseLoading, setCourseLoading] = useState(!!slug);
  const [courseError, setCourseError] = useState(
    !slug ? (lang === "ar" ? "لم يتم تحديد دورة. يرجى العودة واختيار دورة." : "No course selected. Please go back and choose a course.") : ""
  );

  const [form, setForm] = useState({ buyerName: "", buyerEmail: "", buyerPhone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Always load course details, even when not authenticated, so visitors
  // can see exactly what they're about to buy before being asked to log in.
  useEffect(() => {
    if (!slug) return;
    setCourseLoading(true);
    setCourseError("");
    apiFetch(`/courses/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.course) {
          setCourseId(data.course.id);
          setCourseTitleAr(data.course.titleAr || "");
          setCourseTitleEn(data.course.titleEn || "");
          setCoursePrice(data.course.price ?? null);
        } else {
          setCourseError(lang === "ar" ? "لم يتم العثور على الدورة." : "Course not found.");
        }
      })
      .catch(() => {
        setCourseError(lang === "ar" ? "تعذّر تحميل بيانات الدورة." : "Could not load course data.");
      })
      .finally(() => setCourseLoading(false));
  }, [slug, lang]);

  useEffect(() => {
    if (user) {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
      setForm(f => ({
        ...f,
        buyerEmail: user.email ?? f.buyerEmail,
        buyerName: fullName || f.buyerName,
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await apiFetch(`/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          buyerName: form.buyerName.trim(),
          buyerEmail: form.buyerEmail.trim(),
          buyerPhone: form.buyerPhone.trim(),
        }),
      });
      if (res.status === 401) {
        // Session expired between page load and submit — bounce back to login.
        navigate(`/login?redirect=${encodeURIComponent(`/checkout?slug=${slug}`)}`);
        return;
      }
      if (res.status === 429) {
        setError(lang === "ar" ? "محاولات كثيرة. يرجى الانتظار قليلاً ثم المحاولة." : "Too many attempts. Please wait a moment and try again.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || (lang === "ar" ? "حدث خطأ — يرجى المحاولة مرة أخرى." : "An error occurred — please try again."));
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      navigate(`/confirmation?slug=${encodeURIComponent(slug)}${data?.orderId ? `&order_id=${encodeURIComponent(data.orderId)}` : ""}${data?.manualReview ? "&manual=1" : ""}`);
    } catch {
      setError(lang === "ar" ? "حدث خطأ في الاتصال — يرجى المحاولة مرة أخرى." : "Connection error — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Reusable: course summary card the visitor sees regardless of auth state.
  const programPage = `/programs/${programPageSlugFromCourseSlug(slug) ?? slug}`;
  const courseTitle = lang === "ar" ? courseTitleAr : (courseTitleEn || courseTitleAr);

  const courseSummary = courseLoading ? (
    <div className="h-20 bg-muted/40 rounded-xl animate-pulse" />
  ) : courseError ? (
    <div role="alert" className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-destructive text-sm flex items-center gap-2">
      <AlertCircle className="w-4 h-4 shrink-0" />
      {courseError}
    </div>
  ) : (
    <div
      data-testid="checkout-course-summary"
      className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start justify-between gap-4"
    >
      <div>
        <p className="text-xs text-muted-foreground mb-1">
          {lang === "ar" ? "الدورة المختارة" : "Selected Course"}
        </p>
        <p className="font-bold text-foreground" data-testid="checkout-course-title">{courseTitle}</p>
      </div>
      {coursePrice !== null && (
        <div className="text-end shrink-0">
          <p className="text-xs text-muted-foreground mb-1">
            {lang === "ar" ? "الرسوم" : "Fee"}
          </p>
          <p className="font-black text-primary text-xl" data-testid="checkout-course-price">
            {coursePrice} <span className="text-sm font-semibold text-muted-foreground">{lang === "ar" ? "د.أ" : "JOD"}</span>
          </p>
        </div>
      )}
    </div>
  );

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6" dir={isRtl ? "rtl" : "ltr"}>
        <Card className="max-w-md w-full">
          <CardContent className="p-8 space-y-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="text-xl font-bold">
              {lang === "ar" ? "لم يتم تحديد دورة" : "No Course Selected"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {lang === "ar"
                ? "يرجى العودة إلى صفحة الدورات واختيار دورة للتسجيل فيها."
                : "Please go back to the courses page and select a course to enroll in."}
            </p>
            <Button
              className="w-full rounded-full font-bold"
              onClick={() => navigate(`/courses`)}
            >
              {lang === "ar" ? "عرض الدورات" : "Browse Courses"}
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/`)} className="w-full">
              <Home className="w-4 h-4 me-2" />
              {lang === "ar" ? "العودة للرئيسية" : "Back to Home"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const loginRedirect = `/login?redirect=${encodeURIComponent(`/checkout?slug=${slug}`)}`;

  return (
    <AppShell
      containerClassName=""
      breadcrumb={[
        { label: lang === "ar" ? "البرامج" : "Programs", href: `/#structure` },
        { label: courseTitle, href: programPage },
        { label: lang === "ar" ? "إتمام التسجيل" : "Checkout" },
      ]}
    >
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-6" data-testid="checkout-root">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(programPage)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isRtl ? <ArrowRight className="w-4 h-4" /> : null}
            {lang === "ar" ? "العودة للدورة" : "Back to Course"}
            {!isRtl ? <ArrowRight className="w-4 h-4 rotate-180" /> : null}
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
            {lang === "ar" ? "إتمام التسجيل" : "Complete Registration"}
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">
            {lang === "ar" ? "طلب التسجيل في الدورة" : "Course Enrollment Request"}
          </h1>
        </div>

        {courseSummary}

        {!isAuthenticated ? (
          <Card data-testid="checkout-login-gate">
            <CardContent className="p-6 sm:p-8 space-y-5 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <LogIn className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">
                {lang === "ar" ? "خطوة واحدة قبل الدفع" : "One step before payment"}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {lang === "ar"
                  ? "سجّل الدخول أو أنشئ حسابك لإتمام التسجيل في هذه الدورة. سنُعيدك إلى نفس الصفحة فورًا بعد الدخول."
                  : "Sign in or create your account to complete enrollment. We'll bring you right back to this page after login."}
              </p>
              <Button
                className="w-full rounded-full font-bold"
                onClick={() => navigate(loginRedirect)}
                data-testid="checkout-login-cta"
              >
                {lang === "ar" ? "تسجيل الدخول لإكمال الطلب" : "Sign in to complete order"}
              </Button>
              <Button variant="ghost" onClick={() => navigate(programPage)} className="w-full">
                {lang === "ar" ? "العودة للدورة" : "Back to course"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 space-y-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {lang === "ar"
                  ? "أكمل بياناتك وسيتواصل معك فريق بكلمة لتأكيد الدفع وتفعيل حسابك."
                  : "Complete your details and the Bikalima team will contact you to confirm payment and activate your account."}
              </p>

              {paymentCancelled && !error && (
                <div role="status" className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {lang === "ar"
                    ? "تم إلغاء عملية الدفع. يمكنك المحاولة مرة أخرى."
                    : "Payment was cancelled. You can try again."}
                </div>
              )}

              {error && (
                <div role="alert" id="checkout-error" className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" aria-describedby={error ? "checkout-error" : undefined}>
                <div className="space-y-1.5">
                  <label htmlFor="checkout-name" className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                    <User className="w-4 h-4 text-primary" />
                    {lang === "ar" ? "الاسم الكامل" : "Full Name"}
                  </label>
                  <Input
                    id="checkout-name"
                    name="name"
                    autoComplete="name"
                    required
                    value={form.buyerName}
                    onChange={(e) => setForm(f => ({ ...f, buyerName: e.target.value }))}
                    className="rounded-xl"
                    placeholder={lang === "ar" ? "محمد أحمد" : "John Smith"}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="checkout-email" className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                    <Mail className="w-4 h-4 text-primary" />
                    {lang === "ar" ? "البريد الإلكتروني" : "Email Address"}
                  </label>
                  <Input
                    id="checkout-email"
                    name="email"
                    autoComplete="email"
                    type="email"
                    required
                    dir="ltr"
                    value={form.buyerEmail}
                    onChange={(e) => setForm(f => ({ ...f, buyerEmail: e.target.value }))}
                    className="rounded-xl"
                    placeholder="name@example.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="checkout-phone" className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                    <Phone className="w-4 h-4 text-primary" />
                    {lang === "ar" ? "رقم الهاتف" : "Phone Number"}
                  </label>
                  <PhoneInput
                    id="checkout-phone"
                    required
                    lang={lang}
                    value={form.buyerPhone}
                    onChange={(v) => setForm((f) => ({ ...f, buyerPhone: v }))}
                  />
                </div>

                {!paymentsEnabled && (
                  <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-sm p-3" data-testid="checkout-payments-disabled">
                    {lang === "ar"
                      ? "خدمة الدفع متوقفة مؤقتاً. يرجى المحاولة لاحقاً أو التواصل معنا."
                      : "Payments are temporarily disabled. Please try again later or contact us."}
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={submitting || courseLoading || !!courseError || !courseId || !paymentsEnabled}
                  className="w-full rounded-xl py-6 font-bold text-base gap-2"
                  data-testid="checkout-submit"
                >
                  {submitting
                    ? (lang === "ar" ? "جاري الإرسال..." : "Submitting...")
                    : (lang === "ar" ? "إرسال الطلب" : "Submit Request")}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Button variant="ghost" onClick={() => navigate(`/`)} className="w-full">
          <Home className="w-4 h-4 me-2" />
          {lang === "ar" ? "العودة للرئيسية" : "Back to Home"}
        </Button>
      </div>
    </AppShell>
  );
}
