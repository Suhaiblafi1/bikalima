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
import type { UpcomingEvent } from "@/programsData";

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

export function UpcomingCourseRegistration({
  course,
  courseTitle,
  lang,
}: {
  course: UpcomingEvent;
  courseTitle: string;
  lang: Lang;
}) {
  const isAr = lang === "ar";
  const locale = isAr ? "ar" : "en";
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setError("");
    setSuccess(false);
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
      const response = await fetch(`${getApiBase()}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "individual",
          lang,
          name: name.trim(),
          contactPerson: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          program: courseTitle,
          programId: course.programId,
          mode: "group-inperson",
          eventId: course.id,
          eventStartDate: course.startDate,
          eventEndDate: course.endDate,
          eventLocation: course.location[locale],
          reason: message.trim(),
          message: message.trim(),
          leadSource: "upcoming_inperson_course",
        }),
      });
      if (!response.ok) throw new Error("request_failed");
      setSuccess(true);
    } catch {
      setError(isAr ? "تعذّر إرسال طلبك. حاول مرة أخرى." : "We couldn't submit your request. Please try again.");
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
        >
          {isAr ? "سجّل في هذه الدورة" : "Register for this course"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl" dir={isAr ? "rtl" : "ltr"}>
        {success ? (
          <div className="py-8 text-center space-y-4" data-testid="event-registration-success">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
            <DialogTitle className="text-2xl font-bold">
              {isAr ? "تم استلام تسجيلك" : "Your registration was received"}
            </DialogTitle>
            <p className="text-muted-foreground leading-relaxed">
              {isAr
                ? "حجزنا طلبك مبدئياً، وسيتواصل معك فريق بكلمة لتأكيد المقعد وتفاصيل الدفع."
                : "Your request is reserved provisionally. The Bikalima team will contact you to confirm your seat and payment details."}
            </p>
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
                <span>{course.startDate} – {course.endDate}<br />{course.days[locale]} · {course.timeSlot[locale]}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{course.location[locale]}<br />{course.organization[locale]}</span>
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
