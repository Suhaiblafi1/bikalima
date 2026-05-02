import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/phone-input";
import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, Phone, AlertCircle, ArrowRight, Home } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useLang } from "@/hooks/useLang";

function getApiBase() {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { lang } = useLang();
  const isRtl = lang === "ar";
  const apiBase = getApiBase();

  const slug = new URLSearchParams(window.location.search).get("slug") || "";

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

  useEffect(() => {
    if (!slug) return;
    setCourseLoading(true);
    setCourseError("");
    fetch(`${apiBase}/courses/${slug}`)
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
  }, [slug, apiBase, lang]);

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
    if (!courseId) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/orders`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          buyerName: form.buyerName.trim(),
          buyerEmail: form.buyerEmail.trim(),
          buyerPhone: form.buyerPhone.trim(),
        }),
      });
      if (res.status === 401) {
        setError(lang === "ar" ? "يجب تسجيل الدخول أولاً لإتمام الطلب." : "You must be logged in to complete the request.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || (lang === "ar" ? "حدث خطأ — يرجى المحاولة مرة أخرى." : "An error occurred — please try again."));
        return;
      }
      navigate(`/confirmation`);
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6" dir={isRtl ? "rtl" : "ltr"}>
        <Card className="max-w-md w-full">
          <CardContent className="p-8 space-y-6 text-center">
            <div className="logo-biklima text-5xl text-primary">بكلمة</div>
            <h1 className="text-2xl font-bold">
              {lang === "ar" ? "يجب تسجيل الدخول أولاً" : "Login Required"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {lang === "ar"
                ? "يجب أن تكون مسجلاً للمتابعة في إتمام طلبك."
                : "You must be logged in to complete your order."}
            </p>
            <Button
              className="w-full rounded-full font-bold"
              onClick={() => navigate(`/dashboard`)}
            >
              {lang === "ar" ? "تسجيل الدخول / إنشاء حساب" : "Sign In / Create Account"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate(`/`)}
              className="w-full"
            >
              <Home className="w-4 h-4 me-2" />
              {lang === "ar" ? "العودة للرئيسية" : "Back to Home"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <Button
              variant="ghost"
              onClick={() => navigate(`/`)}
              className="w-full"
            >
              <Home className="w-4 h-4 me-2" />
              {lang === "ar" ? "العودة للرئيسية" : "Back to Home"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const courseTitle = lang === "ar" ? courseTitleAr : (courseTitleEn || courseTitleAr);

  return (
    <AppShell
      containerClassName=""
      breadcrumb={[
        { label: lang === "ar" ? "البرامج" : "Programs", href: `/#structure` },
        { label: courseTitle, href: `/courses/${slug}` },
        { label: lang === "ar" ? "إتمام التسجيل" : "Checkout" },
      ]}
    >
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/courses/${slug}`)}
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

        {courseLoading ? (
          <div className="h-20 bg-muted/40 rounded-xl animate-pulse" />
        ) : courseError ? (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {courseError}
          </div>
        ) : (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {lang === "ar" ? "الدورة المختارة" : "Selected Course"}
              </p>
              <p className="font-bold text-foreground">{courseTitle}</p>
            </div>
            {coursePrice !== null && (
              <div className="text-end shrink-0">
                <p className="text-xs text-muted-foreground mb-1">
                  {lang === "ar" ? "الرسوم" : "Fee"}
                </p>
                <p className="font-black text-primary text-xl">
                  {coursePrice} <span className="text-sm font-semibold text-muted-foreground">{lang === "ar" ? "د.أ" : "JOD"}</span>
                </p>
              </div>
            )}
          </div>
        )}

        <Card>
          <CardContent className="p-6 space-y-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {lang === "ar"
                ? "أكمل بياناتك وسيتواصل معك فريق بكلمة لتأكيد الدفع وتفعيل حسابك."
                : "Complete your details and the Bikalima team will contact you to confirm payment and activate your account."}
            </p>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                  <User className="w-4 h-4 text-primary" />
                  {lang === "ar" ? "الاسم الكامل" : "Full Name"}
                </label>
                <Input
                  required
                  value={form.buyerName}
                  onChange={(e) => setForm(f => ({ ...f, buyerName: e.target.value }))}
                  className="rounded-xl"
                  placeholder={lang === "ar" ? "محمد أحمد" : "John Smith"}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                  <Mail className="w-4 h-4 text-primary" />
                  {lang === "ar" ? "البريد الإلكتروني" : "Email Address"}
                </label>
                <Input
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
                <label className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                  <Phone className="w-4 h-4 text-primary" />
                  {lang === "ar" ? "رقم الهاتف" : "Phone Number"}
                </label>
                <PhoneInput
                  required
                  lang={lang}
                  value={form.buyerPhone}
                  onChange={(v) => setForm((f) => ({ ...f, buyerPhone: v }))}
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || courseLoading || !!courseError || !courseId}
                className="w-full rounded-xl py-6 font-bold text-base gap-2"
              >
                {submitting
                  ? (lang === "ar" ? "جاري الإرسال..." : "Submitting...")
                  : (lang === "ar" ? "إرسال الطلب" : "Submit Request")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Button
          variant="ghost"
          onClick={() => navigate(`/`)}
          className="w-full"
        >
          <Home className="w-4 h-4 me-2" />
          {lang === "ar" ? "العودة للرئيسية" : "Back to Home"}
        </Button>
      </div>
    </AppShell>
  );
}
