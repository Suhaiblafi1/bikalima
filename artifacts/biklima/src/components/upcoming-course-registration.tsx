import { useState, type FormEvent } from "react";
import { Calendar, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/phone-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Lang } from "@/translations";

export type InPersonCoursePublic = {
  id: string;
  courseId: string | null;
  programId: string | null;
  titleAr: string;
  titleEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  organizationAr: string | null;
  organizationEn: string | null;
  trainerAr: string | null;
  trainerEn: string | null;
  locationAr: string;
  locationEn: string;
  timezone: string;
  startsAt: string;
  endsAt: string;
  registrationDeadline: string | null;
  capacity: number;
  price: number | null;
  currency: string;
  spotsLeft: number;
  registrationOpen: boolean;
  waitlistEnabled: boolean;
};

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

export function UpcomingCourseRegistration({
  course,
  lang,
}: {
  course: InPersonCoursePublic;
  lang: Lang;
}) {
  const isAr = lang === "ar";
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<"pending" | "waitlisted">("pending");
  const [manageToken, setManageToken] = useState("");

  const courseTitle = isAr ? course.titleAr : course.titleEn;

  const reset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setError("");
    setSuccess(false);
    setManageToken("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setError("");
    if (!name.trim() || !email.trim() || phone.replace(/\D/g, "").length < 7) {
      setError(isAr ? "يرجى إدخال الاسم والبريد ورقم هاتف صحيح." : "Enter your name, email, and a valid phone number.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${getApiBase()}/in-person-courses/${encodeURIComponent(course.id)}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          note: message.trim(),
          source: "homepage_inperson_course",
        }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string; status?: "pending" | "waitlisted"; manageToken?: string };
      if (!response.ok) throw new Error(data.error || "request_failed");
      setRegistrationStatus(data.status ?? "pending");
      setManageToken(data.manageToken ?? "");
      setSuccess(true);
    } catch (submitError) {
      setError(submitError instanceof Error && submitError.message !== "request_failed"
        ? submitError.message
        : (isAr ? "تعذّر إرسال طلبك. حاول مرة أخرى." : "We couldn't submit your request. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="mt-1 w-full bg-primary hover:bg-primary/90 text-white rounded-full"
          data-testid={`event-register-${course.id}`}
          disabled={!course.registrationOpen}
          aria-label={isAr ? `التسجيل في ${course.titleAr}` : `Register for ${course.titleEn}`}
        >
          {!course.registrationOpen
            ? (isAr ? "التسجيل مغلق" : "Registration closed")
            : course.spotsLeft <= 0
              ? (isAr ? "انضم لقائمة الانتظار" : "Join the waitlist")
              : (isAr ? "سجّل في هذه الدورة" : "Register for this course")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl" dir={isAr ? "rtl" : "ltr"}>
        {success ? (
          <div className="py-8 text-center space-y-4" data-testid="event-registration-success">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
            <DialogTitle className="text-2xl font-bold">
              {registrationStatus === "waitlisted"
                ? (isAr ? "أضفناك إلى قائمة الانتظار" : "You're on the waitlist")
                : (isAr ? "تم استلام تسجيلك" : "Your registration was received")}
            </DialogTitle>
            <p className="text-muted-foreground leading-relaxed">
              {registrationStatus === "waitlisted"
                ? (isAr ? "اكتملت المقاعد حالياً. سنتواصل معك فور توفر مقعد." : "Seats are currently full. We'll contact you as soon as one becomes available.")
                : (isAr ? "حجزنا طلبك مبدئياً، وسيتواصل معك فريق بكلمة لتأكيد المقعد وتفاصيل الدفع." : "Your request is reserved provisionally. The Bikalima team will contact you to confirm your seat and payment details.")}
            </p>
            {manageToken && (
              <a className="text-sm font-semibold text-primary underline underline-offset-4" href={`/manage-registration?token=${encodeURIComponent(manageToken)}`}>
                {isAr ? "تعديل أو إلغاء التسجيل" : "Edit or cancel registration"}
              </a>
            )}
            <Button className="rounded-full px-8" onClick={() => setOpen(false)}>
              {isAr ? "حسناً" : "Done"}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className={isAr ? "text-right" : "text-left"}>
              <DialogTitle>{isAr ? "التسجيل في دورة وجاهية" : "In-person course registration"}</DialogTitle>
              <DialogDescription>{courseTitle}</DialogDescription>
            </DialogHeader>

            <div className="grid sm:grid-cols-2 gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{new Date(course.startsAt).toLocaleString(isAr ? "ar-JO" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: course.timezone })}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{isAr ? course.locationAr : course.locationEn}<br />{isAr ? course.organizationAr : course.organizationEn}</span>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor={`event-name-${course.id}`} className="text-sm font-medium">{isAr ? "الاسم الكامل" : "Full name"}</label>
                <Input id={`event-name-${course.id}`} value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor={`event-email-${course.id}`} className="text-sm font-medium">{isAr ? "البريد الإلكتروني" : "Email"}</label>
                <Input id={`event-email-${course.id}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor={`event-phone-${course.id}`} className="text-sm font-medium">{isAr ? "رقم الهاتف أو واتساب" : "Phone or WhatsApp"}</label>
                <PhoneInput id={`event-phone-${course.id}`} value={phone} onChange={setPhone} required lang={lang} testId={`event-phone-${course.id}`} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor={`event-message-${course.id}`} className="text-sm font-medium">{isAr ? "ملاحظة (اختياري)" : "Note (optional)"}</label>
                <Textarea id={`event-message-${course.id}`} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={3} />
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full rounded-full" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                {submitting ? (isAr ? "جارٍ إرسال التسجيل..." : "Submitting...") : (isAr ? "تأكيد طلب التسجيل" : "Submit registration")}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {isAr ? "لن يتم الدفع الآن؛ سنتواصل معك لتأكيد المقعد." : "No payment is taken now; we'll contact you to confirm the seat."}
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
