import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/phone-input";
import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, Phone, AlertCircle, ArrowRight, Home, BadgePercent, CheckCircle2, Loader2, Lock, ShieldCheck, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useLang } from "@/hooks/useLang";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { programPageSlugFromCourseSlug, formatMoney } from "@/lib/site-config";
import { apiFetch } from "@/lib/api-fetch";
import { usePageMeta } from "@/hooks/use-page-meta";
import { track } from "@/lib/analytics";

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
  const [deliveryFormat, setDeliveryFormat] = useState<"recorded" | "zoom" | "blended">("recorded");
  const [availableFormats, setAvailableFormats] = useState<Array<"recorded" | "zoom" | "blended">>(["recorded"]);
  const [courseLoading, setCourseLoading] = useState(!!slug);
  const [courseError, setCourseError] = useState(
    !slug ? (lang === "ar" ? "لم يتم تحديد دورة. يرجى العودة واختيار دورة." : "No course selected. Please go back and choose a course.") : ""
  );

  const [form, setForm] = useState({ buyerName: "", buyerEmail: "", buyerPhone: "" });
  const [discountCode, setDiscountCode] = useState("");
  const [checkingDiscount, setCheckingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Unauthenticated visitors are redirected immediately to /login with a
  // safe internal redirect param so they return to the same checkout URL
  // after signing in.
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) return;
    if (!slug) return;
    navigate(`/login?redirect=${encodeURIComponent(`/checkout?slug=${slug}`)}`);
  }, [isLoading, isAuthenticated, slug, navigate]);

  // Always load course details, even when not authenticated, so visitors
  // can see exactly what they're about to buy before being asked to log in
  // (in cases where the redirect above is delayed by slow auth resolution).
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
          const formats: Array<"recorded" | "zoom" | "blended"> = data.course.deliveryFormats?.length ? data.course.deliveryFormats : ["recorded"];
          const requestedFormat = params.get("format") as "recorded" | "zoom" | "blended" | null;
          const initialFormat: "recorded" | "zoom" | "blended" = requestedFormat && formats.includes(requestedFormat) ? requestedFormat : formats[0];
          const prices: Record<"recorded" | "zoom" | "blended", number | null> = {
            recorded: data.course.recordedPrice ?? data.course.discountPrice ?? data.course.price ?? null,
            zoom: data.course.zoomPrice ?? data.course.price ?? null,
            blended: data.course.blendedPrice ?? data.course.price ?? null,
          };
          setAvailableFormats(formats);
          setDeliveryFormat(initialFormat);
          setCoursePrice(prices[initialFormat]);
          setAppliedDiscount(null);
          setDiscountCode("");
          track("checkout_started", { courseSlug: slug, deliveryFormat: initialFormat });
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

  const applyDiscount = async () => {
    const code = discountCode.trim().toUpperCase();
    setDiscountError("");
    if (!code || !courseId) {
      setDiscountError(lang === "ar" ? "أدخل كود الخصم أولاً." : "Enter a discount code first.");
      return;
    }
    setCheckingDiscount(true);
    try {
      const response = await apiFetch("/discount-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, deliveryFormat, code }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.valid) {
        setAppliedDiscount(null);
        setDiscountError(data.error || (lang === "ar" ? "الكود غير صالح." : "This code is not valid."));
        return;
      }
      setDiscountCode(data.code);
      setAppliedDiscount({
        code: data.code,
        originalAmount: data.originalAmount,
        discountAmount: data.discountAmount,
        finalAmount: data.finalAmount,
      });
      track("discount_applied", { courseSlug: slug, deliveryFormat });
    } catch {
      setDiscountError(lang === "ar" ? "تعذّر التحقق من الكود." : "We couldn't validate the code.");
    } finally {
      setCheckingDiscount(false);
    }
  };

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
          deliveryFormat,
          buyerName: form.buyerName.trim(),
          buyerEmail: form.buyerEmail.trim(),
          buyerPhone: form.buyerPhone.trim(),
          discountCode: appliedDiscount?.code,
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
        track("payment_redirect", { courseSlug: slug, deliveryFormat });
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

  // What the button says it will take is what the order is for, discount
  // included — a button reading "ادفع ٧٠" beside a discounted total of ٥٦ is
  // the kind of mismatch that stops a purchase.
  const payableAmount = appliedDiscount?.finalAmount ?? coursePrice;

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
          {appliedDiscount && <p className="text-sm text-muted-foreground line-through">{formatMoney(appliedDiscount.originalAmount)} {lang === "ar" ? "د.أ" : "JOD"}</p>}
          <p className="font-black text-primary text-xl" data-testid="checkout-course-price">
            {formatMoney(appliedDiscount?.finalAmount ?? coursePrice)} <span className="text-sm font-semibold text-muted-foreground">{lang === "ar" ? "د.أ" : "JOD"}</span>
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

  if (!courseLoading && courseError) {
    return (
      <AppShell
        containerClassName=""
        breadcrumb={[
          { label: lang === "ar" ? "البرامج" : "Programs", href: "/#structure" },
          { label: lang === "ar" ? "التسجيل" : "Registration" },
        ]}
      >
        <div className="mx-auto flex min-h-[55dvh] max-w-lg items-center px-4 py-10" dir={isRtl ? "rtl" : "ltr"}>
          <Card className="w-full border-border/70 shadow-sm">
            <CardContent className="space-y-4 p-6 text-center sm:p-8">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  {lang === "ar" ? "التسجيل غير متاح لهذه الدورة حالياً" : "Registration is not available for this course yet"}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {lang === "ar"
                    ? "يمكنك مراجعة تفاصيل البرنامج أو إرسال طلب اهتمام، وسنتواصل معك عند فتح التسجيل."
                    : "Review the programme details or send an interest request and we will contact you when registration opens."}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button className="rounded-full" onClick={() => navigate(programPage)}>
                  {lang === "ar" ? "تفاصيل البرنامج" : "Programme details"}
                </Button>
                <Button variant="outline" className="rounded-full" onClick={() => navigate("/#enroll")}>
                  {lang === "ar" ? "أرسل طلب اهتمام" : "Send an interest request"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

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

        {isAuthenticated && (
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

                <div className="space-y-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4" data-testid="checkout-discount-section">
                  <label htmlFor="checkout-discount" className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                    <BadgePercent className="w-4 h-4 text-primary" />
                    {lang === "ar" ? "هل لديك كود خصم؟" : "Have a discount code?"}
                  </label>
                  {appliedDiscount ? (
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-800">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span><strong dir="ltr">{appliedDiscount.code}</strong> — {lang === "ar" ? `وفّرت ${formatMoney(appliedDiscount.discountAmount)} د.أ` : `You saved ${formatMoney(appliedDiscount.discountAmount)} JOD`}</span>
                      </div>
                      <button type="button" aria-label={lang === "ar" ? "إزالة الكود" : "Remove code"} onClick={() => { setAppliedDiscount(null); setDiscountCode(""); setDiscountError(""); }}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        id="checkout-discount"
                        value={discountCode}
                        onChange={(e) => { setDiscountCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "")); setDiscountError(""); }}
                        placeholder="WELCOME20"
                        dir="ltr"
                        maxLength={32}
                        data-testid="checkout-discount-code"
                      />
                      <Button type="button" variant="outline" onClick={applyDiscount} disabled={checkingDiscount || !discountCode.trim()} data-testid="checkout-apply-discount">
                        {checkingDiscount && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                        {lang === "ar" ? "تطبيق" : "Apply"}
                      </Button>
                    </div>
                  )}
                  {discountError && <p role="alert" className="text-xs text-destructive">{discountError}</p>}
                </div>

                {!paymentsEnabled && (
                  <div role="status" className="rounded-xl border border-border bg-muted/50 text-muted-foreground text-sm p-3" data-testid="checkout-payments-disabled">
                    {lang === "ar"
                      ? "الدفع الإلكتروني قيد التفعيل. سجّل الآن ويصلك رابط الدفع الآمن على بريدك."
                      : "Online payment is being switched on. Enrol now and a secure payment link will reach you by email."}
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={submitting || courseLoading || !!courseError || !courseId || !paymentsEnabled}
                  className="w-full rounded-xl py-6 font-bold text-base gap-2"
                  data-testid="checkout-submit"
                >
                  {submitting ? (
                    lang === "ar" ? "جارٍ التحويل إلى الدفع…" : "Taking you to payment…"
                  ) : (
                    <>
                      <Lock className="w-4 h-4" aria-hidden />
                      {payableAmount !== null && payableAmount > 0
                        ? (lang === "ar" ? `ادفع ${formatMoney(payableAmount)} د.أ` : `Pay ${formatMoney(payableAmount)} JOD`)
                        : payableAmount === 0
                          ? (lang === "ar" ? "أكمل التسجيل مجاناً" : "Complete free enrolment")
                          : (lang === "ar" ? "متابعة الدفع" : "Continue to payment")}
                    </>
                  )}
                </Button>

                {/* Where the card is actually entered, said plainly. The card
                    number is never typed on this page and there is no field
                    here that could take one — Stripe's own hosted page
                    collects it, which is what keeps this site out of scope for
                    handling card data at all. */}
                <div className="flex flex-col items-center gap-2 pt-1">
                  <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <ShieldCheck className="w-3.5 h-3.5 text-success" aria-hidden />
                    {lang === "ar"
                      ? "الدفع يتم على صفحة Stripe الآمنة — لا نرى رقم بطاقتك ولا نحفظه."
                      : "Payment is completed on Stripe's secure page — we never see or store your card number."}
                  </p>
                  <div className="flex items-center gap-2 opacity-70" aria-hidden>
                    {["VISA", "Mastercard", "Click to Pay"].map((brand) => (
                      <span
                        key={brand}
                        className="rounded border border-border bg-card px-2 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground"
                      >
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
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
