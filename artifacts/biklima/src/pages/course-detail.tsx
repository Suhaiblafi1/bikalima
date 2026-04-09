import React, { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Star, Clock, BookOpen, Users, CheckCircle2, Lock,
  Play, ChevronDown, ChevronRight, ChevronLeft, Award, Globe, Signal, X, ExternalLink,
  Send, CheckCircle, AlertCircle, Phone, Mail, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { programs, getLocalizedProgram, RECORDED_PRICES } from "@/programsData";
import type { Lang } from "@/translations";

// ─── Slug ↔ programId mapping ─────────────────────────────────
const SLUG_TO_ID: Record<string, string> = {
  "influential-speaker": "core",
  "certified-trainer": "tot",
  "educators-program": "teachers",
  "young-speaker": "children",
};

const HERO_COLORS: Record<string, string> = {
  core: "from-primary to-primary/80",
  tot: "from-amber-800 to-amber-700",
  teachers: "from-teal-800 to-teal-700",
  children: "from-sky-800 to-sky-700",
};

// ─── Strings ─────────────────────────────────────────────────
const T = {
  ar: {
    back: "جميع الدورات",
    rating: "٤.٩ (٥٠+ تقييم)",
    students: "طالب",
    instructor: "المدرب",
    instructorBy: "بقلم",
    whatYouLearn: "ماذا ستتعلم؟",
    courseContent: "محتوى الدورة",
    sections: "وحدة",
    lessons: "درس",
    duration: "ساعة",
    requirements: "المتطلبات",
    description: "وصف الدورة",
    targetAudience: "من هذه الدورة؟",
    instructorSection: "عن المدرب",
    reviews: "آراء الطلاب",
    noReviews: "لم تُضف تقييمات بعد — كن أول من يقيّم!",
    faq: "الأسئلة الشائعة",
    enroll: "سجّل الآن",
    enrollCtaNote: "تواصل معنا لتأكيد موعد الدفع والتسجيل",
    priceUnit: "د.أ",
    free: "للمدارس فقط",
    includes: "الدورة تشمل",
    incItems: [
      "جلسات تفاعلية مباشرة",
      "كراسة تدريبية مطبوعة",
      "شهادة إتمام معتمدة",
      "تواصل مع المدرب",
      "مواد داعمة رقمية",
    ],
    freePreview: "معاينة مجانية",
    locked: "محتوى محمي",
    consultBtn: "احجز جلسة استشارية مجانية",
    consultNote: "٢٠ دقيقة مع صهيب الخوالدة",
    level: "المستوى",
    levelAll: "جميع المستويات",
    language: "اللغة",
    langAr: "العربية",
    prereq: "المتطلبات السابقة",
    mins: "د",
    expand: "عرض الكل",
    collapse: "إخفاء",
    hours: "ساعة",
    sessions: "جلسة",
    trainerTitle: "مستشار · باحث دكتوراه · متحدث TEDx · مؤسس بكلمة",
    trainerBio: "مستشار يعمل مع مجموعة من المؤسسات التنموية والخيرية والحكومية في المنطقة، من بينها Qatar Foundation، ووزارة الاقتصاد والسياحة في الإمارات. محاضر في عدد من الجامعات، باحث دكتوراه في Aston University (UK)، ومتحدث TEDx ومؤلف سلسلة كراسات بكلمة.",
    orderModal: {
      title: "طلب التسجيل في الدورة",
      subtitle: "أكمل بياناتك وسنتواصل معك لتأكيد الدفع وتفعيل حسابك",
      name: "الاسم الكامل",
      email: "البريد الإلكتروني",
      phone: "رقم الهاتف (واتساب)",
      notes: "ملاحظات حول الدفع (اختياري)",
      notesPlaceholder: "مثلاً: سأدفع عبر كليك / تحويل بنكي",
      submit: "إرسال الطلب",
      submitting: "جاري الإرسال...",
      successTitle: "تم إرسال طلبك بنجاح!",
      successMsg: "سيتواصل معك فريق بكلمة خلال 24 ساعة لإتمام إجراءات الدفع وتفعيل حسابك.",
      errorMsg: "حدث خطأ أثناء الإرسال — يرجى المحاولة مرة أخرى.",
      close: "إغلاق",
    },
  },
  en: {
    back: "All Courses",
    rating: "4.9 (50+ ratings)",
    students: "students",
    instructor: "Instructor",
    instructorBy: "by",
    whatYouLearn: "What You'll Learn",
    courseContent: "Course Content",
    sections: "sections",
    lessons: "lessons",
    duration: "hrs total",
    requirements: "Requirements",
    description: "Course Description",
    targetAudience: "Who Is This Course For?",
    instructorSection: "About the Instructor",
    reviews: "Student Reviews",
    noReviews: "No reviews yet — be the first to review!",
    faq: "Frequently Asked Questions",
    enroll: "Enroll Now",
    enrollCtaNote: "Contact us to confirm payment and registration",
    priceUnit: "JOD",
    free: "Schools only",
    includes: "This course includes",
    incItems: [
      "Live interactive sessions",
      "Printed training workbook",
      "Certified completion certificate",
      "Direct trainer contact",
      "Supporting digital materials",
    ],
    freePreview: "Free preview",
    locked: "Paid content",
    consultBtn: "Book a Free Consultation",
    consultNote: "20 min with Suhaib Al-Khawaldeh",
    level: "Level",
    levelAll: "All levels",
    language: "Language",
    langAr: "Arabic",
    prereq: "Prerequisites",
    mins: "min",
    expand: "Show all",
    collapse: "Collapse",
    hours: "hrs",
    sessions: "sessions",
    trainerTitle: "Consultant · PhD Researcher · TEDx Speaker · Founder of Bikalima",
    trainerBio: "A consultant working with development, charitable and government organisations across the region, including Qatar Foundation and the UAE Ministry of Economy and Tourism. Lecturer and PhD researcher at Aston University (UK). TEDx speaker and author of the Bikalima training workbook series.",
    orderModal: {
      title: "Course Enrollment Request",
      subtitle: "Complete your details and we'll contact you to confirm payment and activate your account",
      name: "Full Name",
      email: "Email Address",
      phone: "Phone Number (WhatsApp)",
      notes: "Payment Notes (optional)",
      notesPlaceholder: "e.g., I'll pay via bank transfer",
      submit: "Submit Request",
      submitting: "Submitting...",
      successTitle: "Request Submitted Successfully!",
      successMsg: "The Bikalima team will contact you within 24 hours to complete payment and activate your account.",
      errorMsg: "An error occurred — please try again.",
      close: "Close",
    },
  },
};

// ─── Bilingual text type ──────────────────────────────────────
type BilingualText = { ar: string; en: string };
type FaqItem = { q: BilingualText; a: BilingualText };

// ─── Program preview video URLs (real Suhaib videos) ─────────
const PROGRAM_PREVIEW_VIDEOS: Record<string, string> = {
  core:     "https://www.youtube.com/watch?v=QRHnlnwcFXI",
  tot:      "https://www.youtube.com/watch?v=HAnw168huqA",
  teachers: "https://www.youtube.com/watch?v=iG9CE55wbtY",
  children: "https://www.youtube.com/watch?v=R1vskiVDwl4",
};

// ─── Sample FAQ per program ───────────────────────────────────
const FAQ: Record<string, FaqItem[]> = {
  core: [
    { q: { ar: "ما مستوى الدورة؟", en: "What level is the course?" }, a: { ar: "الدورة مفتوحة لجميع المستويات — لا يُشترط أي خبرة سابقة.", en: "The course is open to all levels — no prior experience required." } },
    { q: { ar: "هل الدورة أونلاين أم وجاهية؟", en: "Is the course online or in-person?" }, a: { ar: "نقدمها بالصيغتين: تدريب جماعي أونلاين وتدريب وجاهي في عمّان والمدن الأخرى.", en: "We offer both formats: online group training and in-person in Amman and other cities." } },
    { q: { ar: "هل سأحصل على شهادة؟", en: "Will I receive a certificate?" }, a: { ar: "نعم، شهادة إتمام معتمدة من بكلمة عند إتمام البرنامج.", en: "Yes, a certified completion certificate from Bikalima upon completing the program." } },
  ],
  tot: [
    { q: { ar: "هل يشترط إتمام دورة المتحدث المؤثر؟", en: "Is completing The Influential Speaker course required?" }, a: { ar: "نعم، إتمام الدورة الأساسية شرط إلزامي للالتحاق بهذا البرنامج.", en: "Yes, completing the core course is a mandatory requirement for this program." } },
    { q: { ar: "ماذا يعني الاعتماد من بكلمة؟", en: "What does Bikalima certification mean?" }, a: { ar: "يؤهلك الاعتماد لتقديم برنامج بكلمة رسمياً وبناء مسار تدريبي احترافي.", en: "Certification qualifies you to officially deliver the Bikalima program and build a professional training career." } },
  ],
  teachers: [
    { q: { ar: "هل يشترط إتمام دورة المتحدث المؤثر؟", en: "Is The Influential Speaker course required?" }, a: { ar: "لا يشترط، لكنه يُعزز الاستفادة القصوى من البرنامج.", en: "Not required, but it enhances the benefit of the program." } },
    { q: { ar: "هل البرنامج مناسب لأولياء الأمور؟", en: "Is the program suitable for parents?" }, a: { ar: "نعم، البرنامج موجّه للمعلمين وأولياء الأمور معاً.", en: "Yes, the program is designed for both educators and parents." } },
  ],
  children: [
    { q: { ar: "كيف يصل البرنامج للمدارس؟", en: "How does the program reach schools?" }, a: { ar: "يُقدَّم البرنامج للمدارس حصراً عبر خريجي برنامج المعلمين المعتمدين.", en: "The program is delivered exclusively to schools through certified Educators program graduates." } },
    { q: { ar: "ما الفئة العمرية المستهدفة؟", en: "What is the target age group?" }, a: { ar: "الأطفال من سن ٥ إلى ١٦ سنة.", en: "Children aged 5 to 16 years." } },
  ],
};

// ─── Collapse component ───────────────────────────────────────
function Collapsible({ title, count, children, defaultOpen = false }: { title: string; count?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden mb-3">
      <button
        className="w-full flex items-center justify-between px-5 py-4 bg-muted/30 hover:bg-muted/50 transition-colors text-start"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-semibold text-foreground">{title}</span>
        <div className="flex items-center gap-3">
          {count && <span className="text-xs text-muted-foreground">{count}</span>}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-border/50">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Modal for free preview ───────────────────────────────────
function VideoModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const embedUrl = url.includes("youtu")
    ? url.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/") + "?autoplay=1"
    : url;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="w-full max-w-3xl bg-black rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 bg-zinc-900">
          <span className="text-white text-sm font-medium truncate">{title}</span>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="aspect-video">
          <iframe src={embedUrl} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen title={title} />
        </div>
      </div>
    </div>
  );
}

// ─── Order Form Modal ────────────────────────────────────────
function OrderModal({
  lang, t, courseDbId, courseTitle, price, priceUnit, isChildren, onClose,
}: {
  lang: Lang;
  t: typeof T.ar;
  courseDbId: string;
  courseTitle: string;
  price: number | string;
  priceUnit: string;
  isChildren: boolean;
  onClose: () => void;
}) {
  const isRtl = lang === "ar";
  const mt = t.orderModal;
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${baseUrl}/api/orders`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: courseDbId,
          buyerName: form.name.trim(),
          buyerEmail: form.email.trim(),
          buyerPhone: form.phone.trim(),
          paymentNotes: form.notes.trim() || null,
        }),
      });
      if (res.status === 401) {
        setError(lang === "ar" ? "يجب تسجيل الدخول أولاً لإتمام الطلب." : "You must be logged in to submit a request.");
        return;
      }
      if (!res.ok) throw new Error("Failed");
      setSuccess(true);
    } catch {
      setError(mt.errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" dir={isRtl ? "rtl" : "ltr"} onClick={onClose}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="font-bold text-lg text-foreground">{mt.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{courseTitle}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-lg text-foreground">{mt.successTitle}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{mt.successMsg}</p>
              <Button onClick={onClose} className="w-full rounded-xl mt-2">{mt.close}</Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{mt.subtitle}</p>

              {!isChildren && (
                <div className="mb-5 px-4 py-3 bg-primary/8 border border-primary/20 rounded-xl flex items-center gap-3">
                  <span className="text-2xl font-black text-primary">{price}</span>
                  <span className="text-sm text-primary/80 font-medium">{priceUnit}</span>
                </div>
              )}

              {error && (
                <div className="mb-4 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                    <User className="w-4 h-4 text-primary" />{mt.name}
                  </label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    className="rounded-xl"
                    placeholder={lang === "ar" ? "محمد أحمد" : "John Smith"}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                    <Mail className="w-4 h-4 text-primary" />{mt.email}
                  </label>
                  <Input
                    type="email"
                    required
                    dir="ltr"
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    className="rounded-xl"
                    placeholder="name@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                    <Phone className="w-4 h-4 text-primary" />{mt.phone}
                  </label>
                  <Input
                    type="tel"
                    required
                    dir="ltr"
                    value={form.phone}
                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="rounded-xl"
                    placeholder="+962 7X XXX XXXX"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{mt.notes}</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    rows={2}
                    placeholder={mt.notesPlaceholder}
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full rounded-xl py-3 bg-primary text-primary-foreground font-bold gap-2">
                  <Send className="w-4 h-4" />
                  {submitting ? mt.submitting : mt.submit}
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function CourseDetailPage() {
  const [, params] = useRoute("/courses/:slug");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();
  const [lang, setLang] = useState<Lang>(() => {
    try { return (localStorage.getItem("bk_lang") as Lang) || "ar"; } catch { return "ar"; }
  });
  const [previewModal, setPreviewModal] = useState<{ url: string; title: string } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({ 0: true });
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [courseDbId, setCourseDbId] = useState<string>("");
  const [hasAccess, setHasAccess] = useState(false);
  const [dbLessons, setDbLessons] = useState<{ id: string; titleAr: string; titleEn: string; isFreePreview: boolean; sortOrder: number }[]>([]);

  useEffect(() => {
    if (!slug) return;
    setCourseDbId("");
    setHasAccess(false);
    setDbLessons([]);
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    fetch(`${base}/api/courses/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.course?.id) {
          setCourseDbId(data.course.id);
          if (Array.isArray(data.course.lessons)) {
            setDbLessons(data.course.lessons.map((l: { id: string; titleAr?: string; titleEn?: string; isFreePreview?: boolean; sortOrder?: number }) => ({
              id: l.id,
              titleAr: l.titleAr ?? "",
              titleEn: l.titleEn ?? "",
              isFreePreview: l.isFreePreview ?? false,
              sortOrder: l.sortOrder ?? 0,
            })));
          }
        }
      })
      .catch(() => {});
    fetch(`${base}/api/courses/${slug}/access`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setHasAccess(data?.hasAccess === true); })
      .catch(() => {});
  }, [slug]);

  const isRtl = lang === "ar";
  const t = T[lang];
  const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  const switchLang = (l: Lang) => {
    setLang(l);
    try { localStorage.setItem("bk_lang", l); } catch {}
  };

  const programId = SLUG_TO_ID[slug];
  const program = programs.find((p) => p.id === programId);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [slug]);

  useEffect(() => {
    if (program) {
      const loc = getLocalizedProgram(program, lang);
      document.title = `${loc.shortTitle} — بكلمة`;
    }
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang, isRtl, program]);

  if (!program) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" dir="rtl">
        <p className="text-muted-foreground text-lg">الدورة غير موجودة</p>
        <Button onClick={() => navigate(`${baseUrl}/courses`)}>العودة للدورات</Button>
      </div>
    );
  }

  const loc = getLocalizedProgram(program, lang);
  const price = RECORDED_PRICES[programId as keyof typeof RECORDED_PRICES];
  const heroColor = HERO_COLORS[programId] || "from-primary to-primary/80";
  const faq = FAQ[programId] || [];
  const previewVideoUrl = PROGRAM_PREVIEW_VIDEOS[programId];

  // Build lesson outline: prefer DB lessons when available, fall back to static modules
  const SECTION_SIZE = 3;
  const hasDbLessons = dbLessons.length > 0;
  const lessonOutline: { title: string; isFreePreview: boolean; id?: string }[] = hasDbLessons
    ? dbLessons.map(l => ({ title: lang === "ar" ? l.titleAr || l.titleEn : l.titleEn || l.titleAr, isFreePreview: l.isFreePreview, id: l.id }))
    : loc.modules.map((m, i) => ({ title: m, isFreePreview: i === 0, id: undefined }));
  const syntheticSections: { title: string; isFreePreview: boolean; id?: string }[][] = [];
  for (let i = 0; i < lessonOutline.length; i += SECTION_SIZE) {
    syntheticSections.push(lessonOutline.slice(i, i + SECTION_SIZE));
  }

  const ArrowEnd = isRtl ? ArrowLeft : ArrowRight;
  const ArrowStart = isRtl ? ArrowRight : ArrowLeft;

  // Purchase card
  const PurchaseCard = (
    <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
      <div
        className={`relative h-48 overflow-hidden ${previewVideoUrl ? "cursor-pointer" : ""}`}
        onClick={previewVideoUrl ? () => setPreviewModal({ url: previewVideoUrl, title: `${loc.shortTitle} — ${t.freePreview}` }) : undefined}
        title={previewVideoUrl ? t.freePreview : undefined}
      >
        <img src={program.image} alt={loc.shortTitle} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {previewVideoUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border-2 border-white/60 hover:bg-white/30 transition-colors">
              <Play className={`w-6 h-6 text-white ${isRtl ? "" : "translate-x-0.5"}`} />
            </div>
            <span className="text-white/90 text-xs font-medium bg-black/30 rounded-full px-3 py-1">{t.freePreview}</span>
          </div>
        )}
      </div>
      <div className="p-5">
        {programId === "children" ? (
          <p className="text-center text-muted-foreground font-medium mb-4">{t.free}</p>
        ) : (
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-black text-foreground">{price}</span>
            <span className="text-muted-foreground font-medium">{t.priceUnit}</span>
          </div>
        )}
        <Button
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl py-3 text-base font-bold mb-3"
          onClick={() => setOrderModalOpen(true)}
          disabled={!courseDbId}
        >
          {t.enroll}
        </Button>
        <p className="text-xs text-muted-foreground text-center mb-5">{t.enrollCtaNote}</p>
        <div className="space-y-2 text-sm text-foreground/80">
          <p className="font-semibold text-foreground text-xs uppercase tracking-wide mb-3">{t.includes}</p>
          {t.incItems.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border/50 mt-5 pt-5 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>{t.language}: {t.langAr}</span>
          </div>
          <div className="flex items-center gap-2">
            <Signal className="w-4 h-4" />
            <span>{t.level}: {t.levelAll}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{program.hours} {t.hours} · {program.sessions} {t.sessions}</span>
          </div>
        </div>

        {/* Consultation CTA */}
        <div className="mt-5 pt-5 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground mb-3">{t.consultNote}</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-xl"
            onClick={() => window.open("https://scheduler.zoom.us/suhaib-ahmad-x9pyfc", "_blank")}
          >
            {t.consultBtn}
            <ExternalLink className="w-3.5 h-3.5 ms-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isRtl ? "rtl" : "ltr"} lang={lang}>
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`${baseUrl}/courses`)}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
            >
              <ArrowStart className="w-4 h-4" />
              {t.back}
            </button>
          </div>
          <button onClick={() => navigate(`${baseUrl}/`)} className="logo-biklima text-4xl text-primary leading-none">بكلمة</button>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border border-border rounded-full overflow-hidden">
              {(["ar", "en"] as Lang[]).map((l) => (
                <button key={l} onClick={() => switchLang(l)} className={`px-3 py-1.5 text-xs font-bold transition-colors ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {l === "ar" ? "ع" : "EN"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className={`bg-gradient-to-br ${heroColor} text-white`}>
        <div className="container mx-auto px-6 py-12 lg:py-16">
          <div className="max-w-4xl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-white/60 text-sm mb-6 flex-wrap">
              <button onClick={() => navigate(`${baseUrl}/`)} className="hover:text-white transition-colors">الرئيسية</button>
              <ChevronRight className="w-4 h-4 opacity-60 rtl:rotate-180" />
              <button onClick={() => navigate(`${baseUrl}/courses`)} className="hover:text-white transition-colors">الدورات</button>
              <ChevronRight className="w-4 h-4 opacity-60 rtl:rotate-180" />
              <span className="text-white/80">{loc.shortTitle}</span>
            </nav>

            <span className="inline-block px-3 py-1 bg-white/15 backdrop-blur rounded-full text-xs font-bold mb-4 border border-white/20">
              {loc.role}
            </span>
            <h1 className="text-3xl md:text-5xl font-black mb-3 leading-tight">{loc.shortTitle}</h1>
            {loc.subtitle && (
              <p className="text-xl text-white/85 mb-5 leading-relaxed">{loc.subtitle}</p>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/80 mb-6">
              <div className="flex items-center gap-1.5">
                <div className="flex text-amber-400">
                  {[1,2,3,4,5].map((s) => <Star key={s} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <span className="text-white font-bold">{t.rating}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                +١٠٠ {t.students}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {program.hours} {t.hours} · {program.sessions} {t.sessions}
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                {t.langAr}
              </div>
            </div>

            <div className="flex items-center gap-2 text-white/75 text-sm">
              <Award className="w-4 h-4 text-amber-400" />
              <span>{t.instructorBy}</span>
              <span className="text-white font-semibold">صهيب الخوالدة</span>
            </div>

            {/* Hero trailer CTA */}
            {previewVideoUrl && (
              <button
                className="mt-5 flex items-center gap-2.5 text-sm font-semibold text-white border border-white/40 rounded-full px-5 py-2.5 hover:bg-white/10 transition-colors"
                onClick={() => setPreviewModal({ url: previewVideoUrl, title: `${loc.shortTitle} — ${t.freePreview}` })}
              >
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 text-white translate-x-0.5" />
                </div>
                {lang === "ar" ? "شاهد المعاينة المجانية" : "Watch Free Preview"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content + Sidebar ── */}
      <div className="container mx-auto px-6 py-10">
        <div className="flex gap-10 items-start">
          {/* ── Left: Main content ── */}
          <div className="flex-1 min-w-0 max-w-3xl">

            {/* Mobile purchase card */}
            <div className="lg:hidden mb-8">{PurchaseCard}</div>

            {/* What you'll learn */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-5 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-primary" />
                {t.whatYouLearn}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 border border-border rounded-2xl p-6 bg-muted/20">
                {loc.outcomes.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/85">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Course content */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                {t.courseContent}
              </h2>
              <p className="text-muted-foreground text-sm mb-5">
                {syntheticSections.length} {t.sections} · {lessonOutline.length} {t.lessons} · {program.hours} {t.hours}
              </p>

              <div>
                {syntheticSections.map((section, si) => {
                  const sectionTitle = lang === "ar"
                    ? `الوحدة ${si + 1}`
                    : `Unit ${si + 1}`;
                  const isOpen = expandedSections[si] ?? false;
                  return (
                    <div key={si} className="border border-border rounded-xl overflow-hidden mb-3">
                      <button
                        className="w-full flex items-center justify-between px-5 py-4 bg-muted/30 hover:bg-muted/50 transition-colors text-start"
                        onClick={() => setExpandedSections((prev) => ({ ...prev, [si]: !prev[si] }))}
                      >
                        <span className="font-semibold text-foreground">{sectionTitle}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{section.length} {t.lessons}</span>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </div>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="divide-y divide-border/50">
                              {section.map((lesson, li) => {
                                const isUnlocked = hasAccess || lesson.isFreePreview;
                                const canPlay = isUnlocked && !!previewVideoUrl;
                                return (
                                  <div
                                    key={lesson.id ?? `${si}-${li}`}
                                    className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${canPlay ? "hover:bg-primary/5 cursor-pointer" : "hover:bg-muted/20"}`}
                                    onClick={canPlay ? () => setPreviewModal({ url: previewVideoUrl!, title: lesson.title }) : undefined}
                                    title={canPlay ? t.freePreview : undefined}
                                  >
                                    {isUnlocked ? (
                                      <Play className="w-4 h-4 text-primary shrink-0" />
                                    ) : (
                                      <Lock className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                                    )}
                                    <span className={`text-sm flex-1 ${isUnlocked ? "text-foreground font-medium" : "text-foreground/70"}`}>{lesson.title}</span>
                                    {!hasAccess && lesson.isFreePreview && (
                                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium shrink-0">
                                        {t.freePreview}
                                      </span>
                                    )}
                                    {hasAccess && (
                                      <span className="text-xs bg-green-500/10 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                                        {lang === "ar" ? "مفتوح" : "Unlocked"}
                                      </span>
                                    )}
                                    <span className="text-xs text-muted-foreground shrink-0">٩٠ {t.mins}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Requirements */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">{t.requirements}</h2>
              <ul className="space-y-2">
                {loc.prerequisite ? (
                  <li className="flex items-start gap-3 text-sm text-foreground/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    {loc.prerequisiteLabel}
                  </li>
                ) : (
                  <li className="flex items-start gap-3 text-sm text-foreground/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    {lang === "ar" ? "لا يوجد متطلب سابق — الدورة مفتوحة للجميع." : "No prerequisite — the course is open to everyone."}
                  </li>
                )}
              </ul>
            </section>

            {/* Description */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">{t.description}</h2>
              <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed">
                <p>{loc.description}</p>
                {loc.transformation && (
                  <blockquote className="border-s-4 border-primary ps-4 mt-4 italic text-muted-foreground not-italic">
                    {loc.transformation}
                  </blockquote>
                )}
              </div>
            </section>

            {/* Target audience */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">{t.targetAudience}</h2>
              <div className="space-y-2">
                {loc.delivery.split("—").map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{item.trim()}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Instructor */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-5">{t.instructorSection}</h2>
              <div className="flex gap-5 items-start p-6 border border-border rounded-2xl bg-muted/10">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-black text-primary shrink-0">ص</div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">صهيب الخوالدة</h3>
                  <p className="text-sm text-primary font-medium mb-3">{t.trainerTitle}</p>
                  <p className="text-sm text-foreground/75 leading-relaxed">{t.trainerBio}</p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-500 fill-current" /> ٤.٩</span>
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> +٤٠٠ {t.students}</span>
                    <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> ٤ دورات</span>
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ */}
            {faq.length > 0 && (
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-5">{t.faq}</h2>
                <div className="space-y-3">
                  {faq.map((item, i) => (
                    <Collapsible key={i} title={item.q[lang]}>
                      <div className="px-5 py-4">
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {item.a[lang]}
                        </p>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              </section>
            )}

            {/* Mobile CTA bottom */}
            <div className="lg:hidden mt-8 mb-4">
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl py-4 text-base font-bold"
                onClick={() => setOrderModalOpen(true)}
                disabled={!courseDbId}
              >
                {t.enroll} — {programId !== "children" ? `${price} ${t.priceUnit}` : t.free}
              </Button>
            </div>
          </div>

          {/* ── Desktop sidebar ── */}
          <div className="hidden lg:block w-80 shrink-0 sticky top-24">
            {PurchaseCard}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="py-8 border-t border-border bg-background">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} بكلمة — Bikalima</span>
          <span className="mx-2">·</span>
          <a href="mailto:info@bikalima.com" className="hover:text-primary transition-colors">info@bikalima.com</a>
        </div>
      </footer>

      {/* ── Preview modal ── */}
      {previewModal && (
        <VideoModal url={previewModal.url} title={previewModal.title} onClose={() => setPreviewModal(null)} />
      )}

      {/* ── Order modal ── */}
      <AnimatePresence>
        {orderModalOpen && courseDbId && (
          <OrderModal
            lang={lang}
            t={t}
            courseDbId={courseDbId}
            courseTitle={loc.shortTitle}
            price={price}
            priceUnit={t.priceUnit}
            isChildren={programId === "children"}
            onClose={() => setOrderModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
