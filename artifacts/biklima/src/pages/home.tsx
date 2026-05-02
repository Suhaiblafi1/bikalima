import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Mic2,
  Users,
  GraduationCap,
  CheckCircle2,
  Quote,
  Star,
  MessageCircle,
  X,
  Lock,
  Sparkles,
  School,
  ArrowDown,
  AlertCircle,
  Clock,
  Wifi,
  UserCheck,
  Globe,
  Feather,
  Heart,
  Lightbulb,
  Layers,
  Building2,
  User,
  Youtube,
  Tag,
  MapPin,
  Calendar,
  Video,
  Linkedin,
  Instagram,
  ShoppingCart,
  Mail,
  PlayCircle,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import { useLocation } from "wouter";
import { T, type Lang } from "../translations";
import { programs, testimonials as testimonialsData, getLocalizedProgram, RECORDED_PRICES, WORKBOOK_PRICES, upcomingEvents, EVENT_COUNTRIES } from "../programsData";
import { galleryPhotos, speechPhotos, allPhotos, videoLibrary, type VideoCategory } from "../galleryData";
import { useAuth } from "@workspace/replit-auth-web";
import { useLang } from "@/hooks/useLang";
import { useCurrency, PROGRAM_SLUGS, PROGRAM_PAGE_SLUGS, getBaseUrl } from "@/lib/site-config";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProgramQuiz } from "@/components/program-quiz";
import { SpeechEvaluationForm } from "@/components/speech-evaluation-form";
import { StatsSection } from "@/components/stats-section";
import { trackProgramDetailsClick } from "@/lib/analytics";
import { Star as StarIcon } from "lucide-react";
import { TestimonialsSection } from "@/components/testimonials-section";
import { BeforeAfterSection } from "@/components/before-after-section";
import { JourneySection } from "@/components/journey-section";
import { JourneyCta } from "@/components/journey-cta";
import { EnrollmentWizard } from "@/components/enrollment-wizard";
import { ExternalLinkDialog } from "@/components/external-link-dialog";

import imgHeroCollage from "@assets/speeches_1774983233277.jpeg";
import imgTedx from "@assets/42267697_10160981969510644_1547980864304971776_n_1774982322778.jpg";
import imgZoom from "@assets/image_1775134223693.png";

type WisdomArticle = {
  source: string;
  category: string;
  icon: React.ReactNode;
  quote: string;
  body: string;
};

const wisdomArticles: Record<Lang, WisdomArticle[]> = {
  ar: [
    { source: "كراسة المتدرب", category: "النطاق الذهني", icon: <Lightbulb className="w-5 h-5" />, quote: "الثقة لا تُعطى، تُبنى.", body: "وبناؤها يبدأ من أعمق نقطة في الداخل — من صورتك عن نفسك لحظة الكلام. كثيرون يبحثون عن تقنيات الإلقاء وينسون أن المشكلة الحقيقية ليست في اللسان بل في العقل. قبل أن تُصلح ما يسمعه الجمهور، أصلح ما تسمعه أنت من نفسك." },
    { source: "كراسة المتدرب", category: "النطاق اللفظي", icon: <Mic2 className="w-5 h-5" />, quote: "رَبِّ اشْرَحْ لِي صَدْرِي، وَيَسِّرْ لِي أَمْرِي، وَاحْلُلْ عُقْدَةً مِن لِّسَانِي يَفْقَهُوا قَوْلِي.", body: "حتى الأنبياء دعوا الله أن يُيسّر لهم البيان. اللسان الفصيح دعوة قبل أن يكون مهارة — طلبها موسى عليه السلام حين أُرسل. فإن كان أكلم البشر وأعظمهم رسالةً قد طلب من ربه أن يُحلّ عقدة لسانه، فلا عيب في أن تطلب أنت أيضاً أن يُيسّر الله لك الكلمة." },
    { source: "برنامج المعلمين وأولياء الأمور", category: "الفجوة بين الأجيال", icon: <Heart className="w-5 h-5" />, quote: "٧٠٪ من الناس يعانون من رهاب التحدث.", body: "والسبب الأول ليس الجمهور، بل البيئة التي نشأوا فيها. كل طفل خجول كان يوماً طفلاً لم يُتَح له أن يُسمع بشكل صحيح. الخوف من الكلام لا يُولد مع الإنسان — بل يُزرع." },
    { source: "برنامج المعلمين وأولياء الأمور", category: "دور المربّي", icon: <Users className="w-5 h-5" />, quote: "الكلمة التي تقولها لطفل في لحظة الحاجة قد تُشكّل صوته طوال حياته — أو تُصمته.", body: "لا يحتاج الطفل مدرباً فصيحاً فقط، بل بيئة تؤمن بأن صوته يستحق أن يُسمع. المربّي الواعي لا يصحح فقط، بل يفتح مساحة للتعبير دون خوف." },
    { source: "كراسة الخطيب الصغير", category: "فلسفة التعليم", icon: <Star className="w-5 h-5" />, quote: "الطفل الذي يتعلم الكلام بثقة اليوم هو القائد الذي يُغيّر غرفته غداً.", body: "الخطابة للأطفال ليست نشاطاً إضافياً، هي استثمار في شخصية كاملة. الطفل الذي يتعلم أن يُعبّر عن فكرة بوضوح يكتسب أكثر من مهارة — يكتسب شجاعة اجتماعية وثقة داخلية." },
    { source: "برنامج المدرب المعتمد", category: "رسالة المدرب", icon: <Feather className="w-5 h-5" />, quote: "المدرب الحقيقي لا يُعلّم الناس كيف يتكلمون — بل يُعيد إليهم الإيمان بأن ما يقولونه يستحق أن يُسمع.", body: "حين تصبح مدرباً، تتضاعف مسؤوليتك: أنت تصنع أثراً ثم توكّله لآخرين ليصنعوا أثراً من بعدك." },
    { source: "كراسة المتدرب", category: "الخوف وقوة الكلام", icon: <Sparkles className="w-5 h-5" />, quote: "الخوف من الكلام ليس عدوك — إنه إشارة إلى أن ما تقوله مهم.", body: "التوتر قبل الخطاب ليس ضعفاً — بل إشعال. الجسم يُعبّئ طاقة لأن اللحظة مهمة. المتحدثون المحترفون لا يتخلصون من الخوف بل يُحوّلونه." },
    { source: "برنامج المدرب المعتمد", category: "الصوت والهوية", icon: <Globe className="w-5 h-5" />, quote: "صوتك هو أكثر من أداة — إنه توقيعك في كل غرفة تدخلها.", body: "لا يوجد صوتان متطابقان في العالم. صوتك يحمل تاريخك، وثقافتك، ورؤيتك للعالم. لذلك التدريب على الخطابة ليس عن تقليد الآخرين — بل عن اكتشاف نسختك الأقوى." },
  ],
  en: [
    { source: "The Trainee's Workbook", category: "The Mental Domain", icon: <Lightbulb className="w-5 h-5" />, quote: "Confidence is not given — it is built.", body: "And it begins from the deepest point inside — from the image you hold of yourself in the moment of speaking. Many search for delivery techniques and forget that the real problem is not in the tongue but in the mind." },
    { source: "The Trainee's Workbook", category: "The Verbal Domain", icon: <Mic2 className="w-5 h-5" />, quote: "Even the greatest of prophets sought ease of articulation.", body: "Public speaking is a calling before it is a skill — a gift worth asking for from above. An eloquent tongue is not merely a rhetorical tool — it is a bridge between the heart and the world." },
    { source: "Educators & Parents Program", category: "The Generational Gap", icon: <Heart className="w-5 h-5" />, quote: "70% of people suffer from the fear of public speaking.", body: "And the primary cause is not the audience — it is the environment they grew up in. Every shy child was once a child who was never properly heard." },
    { source: "Educators & Parents Program", category: "The Educator's Role", icon: <Users className="w-5 h-5" />, quote: "The word you say to a child in their moment of need may shape their voice for life — or silence it.", body: "A child doesn't need just an eloquent trainer — they need an environment that believes their voice deserves to be heard." },
    { source: "The Young Speaker's Workbook", category: "Philosophy of Education", icon: <Star className="w-5 h-5" />, quote: "The child who learns to speak with confidence today is the leader who changes the room tomorrow.", body: "Public speaking for children is not an extra-curricular activity — it is an investment in a complete personality." },
    { source: "The Certified Trainer Program", category: "The Trainer's Mission", icon: <Feather className="w-5 h-5" />, quote: "The real trainer doesn't teach people how to speak — they restore their belief that what they say deserves to be heard.", body: "When you become a trainer, your responsibility multiplies: you create impact and then entrust it to others to create impact after you." },
    { source: "The Trainee's Workbook", category: "Fear and the Power of Words", icon: <Sparkles className="w-5 h-5" />, quote: "Fear of speaking is not your enemy — it is a signal that what you have to say matters.", body: "Nervousness before a speech is not weakness — it is ignition. The body mobilizes energy because the moment is important. Professional speakers don't eliminate fear — they transform it." },
    { source: "The Certified Trainer Program", category: "Voice and Identity", icon: <Globe className="w-5 h-5" />, quote: "Your voice is more than a tool — it is your signature in every room you enter.", body: "No two voices in the world are identical. Your voice carries your history, your culture, and your worldview. That is why public speaking training is not about imitating others — it's about discovering your strongest version." },
  ],
};

const AR_DAYS = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const EN_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function MiniCalendar({ lang }: { lang: Lang }) {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const year = nextMonth.getFullYear();
  const month = nextMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = nextMonth.getDay();

  const monthName = nextMonth.toLocaleDateString(
    lang === "ar" ? "ar-SA" : "en-US",
    { month: "long", year: "numeric" }
  );
  const dayHeaders = lang === "ar" ? AR_DAYS : EN_DAYS;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-sm max-w-xs mx-auto">
      <div className="text-center mb-2">
        <h3 className="font-serif text-sm font-bold text-foreground">{monthName}</h3>
      </div>
      <div className="grid grid-cols-7 gap-px text-center">
        {dayHeaders.map((d) => (
          <div key={d} className="text-[8px] font-bold text-muted-foreground uppercase py-0.5">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className={`w-6 h-6 flex items-center justify-center text-[10px] rounded ${day ? "text-foreground/50" : ""}`}>
            {day || ""}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { toast } = useToast();
  const { format: formatPrice, currency, currencyKey, setCurrencyKey } = useCurrency();
  const { lang, switchLang, dir } = useLang();
  const t = T[lang];
  const { user: _user, isLoading: _authLoading, isAuthenticated: _isAuthenticated, logout: _logout } = useAuth();
  const [, navigate] = useLocation();
  const articles = wisdomArticles[lang];
  const faqItems = t.faq.items;
  const localizedPrograms = programs.map((p) => getLocalizedProgram(p, lang));
  const localizedTestimonials = testimonialsData[lang];

  const [selectedProgram, setSelectedProgram] = useState<ReturnType<typeof getLocalizedProgram> | null>(null);
  const [galleryTab, setGalleryTab] = useState<"cohorts" | "speeches">("cohorts");
  const [faqPage, setFaqPage] = useState(0);
  const [trainingMode, setTrainingMode] = useState<"combined" | "group-inperson" | "private">("combined");
  const [applicantType, setApplicantType] = useState<"individual" | "institution">("individual");
  const [heroQuoteIdx, setHeroQuoteIdx] = useState(0);
  const [bioPageIdx, setBioPageIdx] = useState(0);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [consultDate, setConsultDate] = useState<string | null>(null);
  const [consultTime, setConsultTime] = useState<string | null>(null);
  const [consultName, setConsultName] = useState("");
  const [consultEmail, setConsultEmail] = useState("");
  const [consultPhone, setConsultPhone] = useState("");
  const [consultNotes, setConsultNotes] = useState("");
  const [consultLoading, setConsultLoading] = useState(false);
  const [consultBooked, setConsultBooked] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", category: "", program: "",
    mode: "combined", reason: "", youtube: "",
  });
  const [orgFormData, setOrgFormData] = useState({
    orgName: "", contactPerson: "", phone: "", email: "",
    studentCount: "", teacherCount: "", workbookCount: "",
    program: "", message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState<{ name: string; program: string } | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [videoModalId, setVideoModalId] = useState<string | null>(null);
  const [videoTab, setVideoTab] = useState<VideoCategory | "all">("opening");

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [dir, lang]);

  useEffect(() => {
    const total = t.hero.imageQuotes.length;
    if (!total) return;
    setHeroQuoteIdx(0);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    const timer = setInterval(() => setHeroQuoteIdx((i) => (i + 1) % total), 5000);
    return () => clearInterval(timer);
  }, [t.hero.imageQuotes.length, lang]);

  useEffect(() => {
    if (showZoomModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showZoomModal]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxOpen(false);
        setVideoModalId(null);
        setShowZoomModal(false);
      }
      if (lightboxOpen) {
        if (e.key === "ArrowLeft") setLightboxIndex((i) => (i + 1) % allPhotos.length);
        if (e.key === "ArrowRight") setLightboxIndex((i) => (i - 1 + allPhotos.length) % allPhotos.length);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen]);

  // Handle hash on initial mount + when hash changes (so /#structure scrolls to that section)
  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) return;
      // Wait one frame so target sections (which mount lazily) are present
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
        }
      }, 60);
    };
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
    }
  };

  const getConsultAvailableDays = () => {
    const result: { date: string; dayName: string; dayNum: string; month: string }[] = [];
    const d = new Date();
    d.setDate(d.getDate() + 1);
    let count = 0;
    while (result.length < 8 && count < 30) {
      const dow = d.getDay();
      if (dow >= 0 && dow <= 4) {
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        const dayNames = lang === "ar"
          ? ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس"]
          : ["Sun","Mon","Tue","Wed","Thu"];
        const monthNames = lang === "ar"
          ? ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]
          : ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        result.push({ date: `${dd}/${mm}/${yyyy}`, dayName: dayNames[dow], dayNum: dd, month: monthNames[d.getMonth()] });
      }
      d.setDate(d.getDate() + 1);
      count++;
    }
    return result;
  };

  const handleBookConsultation = async () => {
    if (!consultDate || !consultTime || !consultName.trim() || !consultEmail.trim()) {
      toast({ title: lang === "ar" ? "يرجى تعبئة الحقول المطلوبة" : "Please fill in required fields", variant: "destructive" });
      return;
    }
    setConsultLoading(true);
    try {
      const base = import.meta.env.BASE_URL || "/";
      const apiBase = base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
      const res = await fetch(`${apiBase}/book-consultation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: consultName, email: consultEmail, phone: consultPhone, date: consultDate, time: consultTime, notes: consultNotes, lang }),
      });
      if (!res.ok) throw new Error("server_error");
      setConsultBooked(true);
    } catch {
      toast({ title: lang === "ar" ? "حدث خطأ، يرجى المحاولة مجدداً" : "Something went wrong, please try again", variant: "destructive" });
    } finally {
      setConsultLoading(false);
    }
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = applicantType === "individual"
      ? { type: "individual", ...formData, mode: trainingMode, lang }
      : { type: "institution", ...orgFormData, lang };
    try {
      const base = import.meta.env.BASE_URL || "/";
      const apiBase = base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
      const res = await fetch(`${apiBase}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Server error");
      setIsSubmitting(false);
      const submittedName = applicantType === "individual" ? formData.name : orgFormData.contactPerson || orgFormData.orgName;
      const submittedProgram = applicantType === "individual" ? formData.program : orgFormData.program;
      if (applicantType === "individual") {
        setFormData({ name: "", email: "", phone: "", category: "", program: "", mode: "combined", reason: "", youtube: "" });
      } else {
        setOrgFormData({ orgName: "", contactPerson: "", phone: "", email: "", studentCount: "", teacherCount: "", workbookCount: "", program: "", message: "" });
      }
      setEnrollSuccess({ name: submittedName, program: submittedProgram });
    } catch {
      setIsSubmitting(false);
      toast({ title: lang === "ar" ? "حدث خطأ" : "Something went wrong", description: lang === "ar" ? "يرجى المحاولة مرة أخرى" : "Please try again later", variant: "destructive" });
    }
  };

  const coreProgram = localizedPrograms.find((p) => p.id === "core")!;
  const branchPrograms = localizedPrograms.filter((p) => p.id !== "core");

  const baseUrl = getBaseUrl();

  const prereqBadgeClass = (id: string) =>
    id === "tot" ? "bg-red-50 text-red-600 border border-red-200"
    : id === "teachers" ? "bg-amber-50 text-amber-700 border border-amber-200"
    : "bg-blue-50 text-blue-700 border border-blue-200";

  const prereqLabel = (id: string) => {
    const labels = t.structure.prereqLabels as Record<string, string>;
    return labels[id] ?? "";
  };

  const getEnrollPrice = (programId: string, mode: string): string | null => {
    const base = RECORDED_PRICES[programId as keyof typeof RECORDED_PRICES];
    if (!base) return null;
    if (mode === "combined") return `${Math.round(base * 1.5)}`;
    if (mode === "group-inperson") return null;
    if (mode === "private") return `${base * 4}`;
    return null;
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden relative" dir={dir}>
      <SiteHeader />

      <main>
        {/* ── HERO ── */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex items-center min-h-[90vh]">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-secondary/60 blur-[100px] opacity-70 -z-10" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px] opacity-70 -z-10" />
          <div className="w-full px-3 md:px-6 flex">
            <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="max-w-2xl">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-6">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {t.hero.badge}
                  </div>
                  <h1 className="font-serif text-5xl md:text-7xl font-bold leading-[1.2] text-foreground mb-6">
                    {t.hero.h1a} <br />
                    <span className="text-primary">{t.hero.h1b}</span>
                  </h1>
                  <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-10 max-w-lg">{t.hero.sub}</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" onClick={() => scrollTo("enroll")} className="bg-primary hover:bg-primary/90 text-white rounded-full text-lg h-14 px-8">{t.hero.ctaPrimary}</Button>
                    <Button size="lg" variant="outline" onClick={() => scrollTo("structure")} className="rounded-full text-lg h-14 px-8">{t.hero.ctaSecondary}</Button>
                  </div>
                  <div className="mt-8 lg:hidden bg-primary/5 border border-primary/10 p-4 rounded-2xl">
                    <Quote className="text-primary w-4 h-4 mb-2 opacity-50" />
                    <AnimatePresence mode="wait">
                      <motion.div key={`m-${heroQuoteIdx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                        <p className="font-serif text-sm leading-relaxed text-foreground/80">"{t.hero.imageQuotes[heroQuoteIdx]?.text}"</p>
                        <p className="text-primary font-bold mt-2 text-xs">— {t.hero.imageQuotes[heroQuoteIdx]?.author}</p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative hidden lg:block">
                <div className="aspect-[5/4] rounded-[2rem] overflow-hidden relative shadow-2xl w-full mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/80 to-accent/60 mix-blend-multiply z-10" />
                  <img src={imgTedx} alt={t.hero.h1a} className="w-full h-full object-cover" loading="eager" fetchPriority="high" decoding="async" />
                  <div className="absolute bottom-6 left-6 right-6 z-20">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-2xl border border-white/40">
                      <AnimatePresence mode="wait">
                        <motion.div key={heroQuoteIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5 }}>
                          <div className="flex gap-3">
                            <div className="text-primary/20 text-4xl font-serif self-start">✦</div>
                            <div className="flex-1">
                              <p className="text-foreground/90 text-sm font-medium leading-relaxed italic">"{t.hero.imageQuotes[heroQuoteIdx]?.text}"</p>
                              <p className="text-primary font-bold mt-3 text-xs tracking-wide">— {t.hero.imageQuotes[heroQuoteIdx]?.author}</p>
                            </div>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── TRUST STRIP — early social proof immediately under hero ── */}
        <section
          aria-label="Trust strip"
          className="py-3 md:py-4 bg-background border-y border-border/60"
          data-testid="section-trust-strip"
        >
          <div className="container mx-auto px-3 md:px-6">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs md:text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 font-semibold text-foreground/80">
                <Users className="w-4 h-4 text-primary" aria-hidden />
                {(t.hero as any).trustStrip?.trainees}
              </span>
              <span className="hidden sm:inline opacity-30">·</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-foreground/80">
                <Globe className="w-4 h-4 text-primary" aria-hidden />
                {(t.hero as any).trustStrip?.countries}
              </span>
              <span className="hidden sm:inline opacity-30">·</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-foreground/80">
                <StarIcon className="w-4 h-4 text-accent fill-accent" aria-hidden />
                {(t.hero as any).trustStrip?.rating}
              </span>
              <span className="hidden sm:inline opacity-30">·</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-foreground/80">
                <GraduationCap className="w-4 h-4 text-primary" aria-hidden />
                {(t.hero as any).trustStrip?.years}
              </span>
            </div>
          </div>
        </section>

        {/* ── TRAINER BIO ── */}
        <section className="py-12 md:py-20 bg-secondary/20 border-y border-border">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-xl relative">
                  <img src={imgHeroCollage} alt={t.trainerBio.name} className="w-full h-full object-cover object-[8%_15%]" loading="lazy" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-4">
                <h2 className="font-serif text-3xl md:text-4xl font-bold">{t.trainerBio.heading}</h2>
                <h3 className="font-serif text-2xl font-bold text-primary">{t.trainerBio.name}</h3>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t.trainerBio.title}</p>
                {(() => {
                  const bioPages = t.trainerBio.bio.split("\n\n");
                  return (
                    <div className="relative">
                      <AnimatePresence mode="wait">
                        <motion.div key={bioPageIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.35 }} className="min-h-[120px]">
                          <p className="text-base text-muted-foreground leading-relaxed">{bioPages[bioPageIdx]}</p>
                        </motion.div>
                      </AnimatePresence>
                      <div className="flex items-center gap-3 mt-5">
                        <button onClick={() => setBioPageIdx((p) => Math.max(0, p - 1))} disabled={bioPageIdx === 0} className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-30 transition-all">
                          <ChevronRight className={`w-4 h-4 ${lang === "ar" ? "" : "rotate-180"}`} />
                        </button>
                        <div className="flex gap-2">
                          {bioPages.map((_, i) => (
                            <button key={i} onClick={() => setBioPageIdx(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === bioPageIdx ? "bg-primary scale-125" : "bg-border hover:bg-primary/40"}`} />
                          ))}
                        </div>
                        <button onClick={() => setBioPageIdx((p) => Math.min(bioPages.length - 1, p + 1))} disabled={bioPageIdx === bioPages.length - 1} className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-30 transition-all">
                          <ChevronLeft className={`w-4 h-4 ${lang === "ar" ? "" : "rotate-180"}`} />
                        </button>
                        <span className="text-xs text-muted-foreground ms-auto">{bioPageIdx + 1}/{bioPages.length}</span>
                      </div>
                    </div>
                  );
                })()}
                <div className="flex items-center gap-4 mt-4">
                  <a href="https://www.linkedin.com/in/suhaiblafi/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors">
                    <Linkedin className="w-5 h-5" />
                    LinkedIn
                  </a>
                  <a href="https://www.instagram.com/suhaiblafi/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors">
                    <Instagram className="w-5 h-5" />
                    Instagram
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── AUTHOR'S MESSAGE ── */}
        <section className="py-14 md:py-24 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
              <div className="text-5xl mb-6 opacity-30">✦</div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-10 opacity-90">{t.author.sectionTitle}</h2>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-8">
              {t.author.cards.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="bg-primary-foreground/10 backdrop-blur-sm p-7 rounded-3xl border border-primary-foreground/20">
                  <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center mb-4">
                    {i === 0 ? <GraduationCap className="w-6 h-6" /> : i === 1 ? <Mic2 className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3">{msg.to}</div>
                  <p className="font-serif text-base leading-relaxed opacity-90">{msg.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY BIKLIMA ── */}
        <section className="py-14 bg-secondary/30">
          <div className="container mx-auto px-6">
            <div className="text-center mb-10">
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3"
              >
                {t.why.heading}
              </motion.h2>
              <p className="text-muted-foreground text-base max-w-xl mx-auto">{(t.why as any).sub}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {(t.why as any).items.map((item: { title: string; desc: string }, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                  className="bg-background rounded-2xl p-6 border border-border hover:border-primary/40 hover:shadow-md transition-all duration-300 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-base mb-2 leading-snug">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <StatsSection />

        {/* ── PROGRAM QUIZ ── */}
        <ProgramQuiz lang={lang} />

        {/* ── 60-SECOND SPEECH EVALUATION ── */}
        <SpeechEvaluationForm lang={lang} />

        {/* ── BRANCHING DIAGRAM ── */}
        <section id="structure" className="py-14 md:py-24 bg-background relative overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">{t.structure.heading}</h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t.structure.sub}</p>
              </motion.div>
            </div>
            <div className="flex flex-col items-center">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="w-full max-w-2xl">
                <div className="rounded-3xl overflow-hidden shadow-2xl border-2 border-primary group cursor-pointer" onClick={() => { trackProgramDetailsClick("core", "structure_core_card"); navigate(`/courses/${PROGRAM_SLUGS.core}`); }}>
                  <div className="relative">
                    <div className="aspect-[21/8] relative">
                      <img src={coreProgram.image} alt={coreProgram.shortTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold mb-3">
                        <Star className="w-4 h-4 text-accent" />{t.structure.coreBadge}
                      </div>
                      <h3 className="font-serif text-2xl md:text-3xl font-bold mb-1">{coreProgram.shortTitle}</h3>
                      <p className="text-white/80 text-sm italic mb-2">{coreProgram.subtitle ?? t.structure.coreSubtitle}</p>
                      <div className="flex items-center gap-4 text-white/80 text-sm">
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{coreProgram.hours} {t.structure.hoursUnit}</span>
                        <span>·</span>
                        <span>{coreProgram.sessions} {t.structure.sessionsUnit}</span>
                        <span>·</span>
                        <span className="font-bold text-white">{formatPrice(RECORDED_PRICES.core)} <span className="font-normal text-white/60 text-xs">{t.structure.priceUnit}</span></span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-card px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-1 flex-1 min-w-[200px]">{coreProgram.hook}</p>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="rounded-full" onClick={(e) => { e.stopPropagation(); trackProgramDetailsClick("core", "structure_core_button"); navigate(`/courses/${PROGRAM_SLUGS.core}`); }}>
                        {t.structure.viewDetails}
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-full text-primary hover:bg-primary/10" onClick={(e) => { e.stopPropagation(); navigate(`/programs/${PROGRAM_PAGE_SLUGS.core}`); }} data-testid="link-program-page-core">
                        {t.structure.viewProgramPage}
                      </Button>
                      <Button size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={(e) => { e.stopPropagation(); scrollTo("enroll"); }}>
                        {t.structure.enrollNow}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
              <div className="flex flex-col items-center py-3 gap-0">
                <div className="w-px h-10 bg-primary/40" />
                <ArrowDown className="w-5 h-5 text-primary/60" />
              </div>
              <div className="w-full relative">
                <div className="hidden md:block absolute top-0 left-[16.66%] right-[16.66%] h-px bg-border" />
                <div className="grid md:grid-cols-3 gap-6">
                  {branchPrograms.map((program, i) => (
                    <motion.div key={program.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="flex flex-col items-center">
                      <div className="hidden md:flex flex-col items-center mb-4">
                        <div className="w-px h-8 bg-border" />
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <Card className={`w-full flex flex-col overflow-hidden border-2 ${program.borderColor} shadow-md hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 cursor-pointer`} onClick={() => { trackProgramDetailsClick(program.id, "structure_branch_card"); navigate(`/courses/${PROGRAM_SLUGS[program.id]}`); }}>
                        <div className="aspect-[4/3.2] relative overflow-hidden">
                          <img src={program.image} alt={program.shortTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-transparent to-transparent" />
                          <div className="absolute bottom-4 right-4 left-4">
                            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold mb-2 ${program.tagColor}`}>{program.role}</div>
                            <h3 className="font-serif text-lg font-bold text-white leading-tight">
                              {program.shortTitle}
                              {program.badge && <span className="font-normal text-xs text-white/65 ms-1.5">{program.badge}</span>}
                            </h3>
                            <div className="flex items-center gap-2 text-white/70 text-xs mt-1">
                              <Clock className="w-3 h-3" />
                              <span>{program.hours} {t.structure.hoursUnit}</span>
                              <span>·</span>
                              <span>{program.sessions} {t.structure.sessionsUnit}</span>
                              <span>·</span>
                              {program.id === "children"
                                ? <span className="font-bold text-white/80">{lang === "ar" ? "للمدارس فقط" : "Schools only"}</span>
                                : <span className="font-bold text-white">{formatPrice(RECORDED_PRICES[program.id as keyof typeof RECORDED_PRICES])} <span className="font-normal text-white/60 text-[10px]">{t.structure.priceUnit}</span></span>
                              }
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-5 flex flex-col flex-1">
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2 flex-1">{program.hook}</p>
                          <div className="flex gap-2 mb-2">
                            <Button variant="outline" size="sm" className="flex-1 rounded-full text-primary border-primary/30 hover:bg-primary hover:text-white" onClick={(e) => { e.stopPropagation(); trackProgramDetailsClick(program.id, "structure_branch_button"); navigate(`/courses/${PROGRAM_SLUGS[program.id]}`); }}>
                              {t.structure.viewDetails}
                            </Button>
                            {program.id !== "children" && (
                              <Button size="sm" className="flex-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={(e) => { e.stopPropagation(); scrollTo("enroll"); }}>
                                {t.structure.enrollNow}
                              </Button>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" className="w-full rounded-full text-primary hover:bg-primary/10 mb-2 text-xs" onClick={(e) => { e.stopPropagation(); navigate(`/programs/${PROGRAM_PAGE_SLUGS[program.id]}`); }} data-testid={`link-program-page-${program.id}`}>
                            {t.structure.viewProgramPage}
                          </Button>
                          {program.prerequisiteLabel && (
                            <div className={`flex items-center justify-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full ${prereqBadgeClass(program.id)}`}>
                              {program.id === "tot" ? <Lock className="w-2.5 h-2.5" /> : program.id === "children" ? <School className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                              {prereqLabel(program.id)}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ── REPEATING CTA ── */}
        <JourneyCta testIdSuffix="after-structure" />

        {/* ── BEFORE / AFTER ── */}
        <BeforeAfterSection />

        {/* ── STUDENT JOURNEY ── */}
        <JourneySection />

        {/* ── REPEATING CTA (primary) ── */}
        <JourneyCta variant="primary" testIdSuffix="after-journey" />

        {/* ── START HELP ── */}
        <section className="py-12 md:py-16 bg-primary/5 border-y border-border">
          <div className="container mx-auto px-6 text-center max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-5">
                <MessageCircle className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{t.structure.startHelpHeading}</h2>
              <p className="text-muted-foreground mb-7 leading-relaxed">{t.structure.startHelpSub}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="https://scheduler.zoom.us/suhaib-ahmad-x9pyfc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button
                    size="lg"
                    className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8"
                  >
                    {t.structure.startHelpBtn}
                  </Button>
                </a>
                <a href="mailto:info@bikalima.com" className="inline-block">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full px-8"
                  >
                    {t.structure.startHelpContact}
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── UPCOMING EVENTS ── */}
        <section id="events" className="py-10 bg-gradient-to-b from-primary/5 to-background border-b border-border">
          <div className="container mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-4 text-sm">
                <Calendar className="w-4 h-4" />{t.structure.upcomingEventsHeading}
              </div>
              <p className="text-muted-foreground">{t.structure.upcomingEventsSub}</p>
            </motion.div>
            <div className="flex flex-wrap justify-center gap-4 mb-8 max-w-2xl mx-auto">
              {EVENT_COUNTRIES.map((c) => {
                const hasEvent = upcomingEvents.some(ev => ev.country === c.key);
                return (
                  <div key={c.key} className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all ${hasEvent ? "border-primary bg-primary/10 shadow-md" : "border-border bg-muted/30 opacity-40"}`}>
                    <span className="text-2xl">{c.flag}</span>
                    <span className={`text-sm font-bold ${hasEvent ? "text-primary" : "text-muted-foreground"}`}>{t.structure.countries[c.key]}</span>
                    {hasEvent && <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />}
                  </div>
                );
              })}
            </div>
            {upcomingEvents.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
                {upcomingEvents.map((ev) => {
                  const prog = programs.find(p => p.id === ev.programId);
                  const lp = prog ? getLocalizedProgram(prog, lang) : null;
                  const isOnline = ev.type === "online";
                  const l = lang as "ar" | "en";
                  return (
                    <Card key={ev.id} className={`border-2 hover:shadow-lg transition-all duration-300 overflow-hidden ${isOnline ? "border-blue-200 hover:border-blue-400" : "border-primary/20 hover:border-primary/40"}`}>
                      <CardContent className="p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2">
                          {lp && <span className="text-xs font-bold text-primary uppercase tracking-wide">{lp.shortTitle}</span>}
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${isOnline ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                            {isOnline ? <Wifi className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                            {isOnline ? (lang === "ar" ? "أونلاين" : "Online") : (lang === "ar" ? "وجاهي" : "In-person")}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-foreground">{ev.organization[l] || ev.organization.ar}</div>
                        <div className="space-y-1.5 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{ev.trainer[l] || ev.trainer.ar}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{ev.days[l] || ev.days.ar} · {ev.timeSlot[l] || ev.timeSlot.ar}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="font-semibold text-foreground">{ev.startDate} ← {ev.endDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span>{ev.location[l] || ev.location.ar}</span>
                          </div>
                        </div>
                        {ev.spotsLeft && ev.spotsLeft <= 15 && (
                          <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            {ev.spotsLeft} {t.structure.spotsLeft}
                          </span>
                        )}
                        <ExternalLinkDialog href={ev.registrationLink}>
                          <Button
                            size="sm"
                            className="mt-1 w-full bg-primary hover:bg-primary/90 text-white rounded-full"
                            data-testid={`event-register-${ev.id}`}
                          >
                            {lang === "ar" ? "سجّل عبر الموقع الرسمي" : "Register at Official Site"} ↗
                          </Button>
                        </ExternalLinkDialog>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="max-w-lg mx-auto relative">
                <MiniCalendar lang={lang} />
                <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
                  <div className="text-center px-6">
                    <Calendar className="w-8 h-8 text-primary/40 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground/70">{t.structure.noUpcomingEvents}</p>
                  </div>
                </div>
              </div>
            )}
            {/* ── FREE CONSULTATION BOOKING ── */}
            <div className="mt-12 max-w-2xl mx-auto">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <div className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 border-2 border-primary/20 rounded-3xl p-6 overflow-hidden">
                  <div className="absolute top-0 end-0 w-32 h-32 bg-primary/5 rounded-full -mr-12 -mt-12" />
                  <div className="relative z-10 flex flex-col items-center text-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold mb-1">{lang === "ar" ? "احجز جلسة استشارية مجانية" : "Book a Free Consultation"}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                        {lang === "ar"
                          ? "جلسة فردية مع صهيب الخوالدة مدّتها ٢٠ دقيقة — اختر الموعد المناسب وسيصلك تأكيد فوري برابط Zoom ودعوة التقويم."
                          : "A 20-minute one-on-one session with Suhaib. Pick your slot and you'll instantly receive a Zoom link and calendar invite."}
                      </p>
                    </div>
                    <a
                      href="https://scheduler.zoom.us/suhaib-ahmad-x9pyfc"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-[#2D8CFF] hover:bg-[#1a7de8] text-white font-bold px-8 py-3.5 rounded-full text-base transition-colors shadow-lg shadow-blue-500/20 w-full max-w-xs"
                    >
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h10.667A2.667 2.667 0 0 1 17.333 6.667v6.666A2.667 2.667 0 0 1 14.667 16H4a2.667 2.667 0 0 1-2.667-2.667V6.667A2.667 2.667 0 0 1 4 4zm15.333 2.72 2.774-1.664A.667.667 0 0 1 23.333 5.627v12.746a.667.667 0 0 1-1.226.37l-2.774-1.663V6.72z"/></svg>
                      {lang === "ar" ? "احجز موعدك الآن" : "Book Your Slot Now"}
                    </a>
                    <p className="text-[11px] text-muted-foreground">
                      {lang === "ar" ? "ستصلك دعوة Zoom ودعوة التقويم تلقائياً فور الحجز" : "Zoom invite & calendar confirmation sent automatically on booking"}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>


        {/* ── GALLERY ── */}
        <section id="gallery" className="py-14 md:py-24 bg-secondary/20 border-y border-border">
          <div className="container mx-auto px-6">
            <div className="text-center mb-10">
              <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {lang === "ar" ? "مسيرة بكلمة منذ ٢٠١٩" : "Bikalima's Journey since 2019"}
                </div>
                <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">{t.gallery.heading}</h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t.gallery.sub}</p>
              </motion.div>
            </div>
            {/* Tab buttons */}
            <div className="flex justify-center gap-3 mb-8">
              {(["cohorts", "speeches"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setGalleryTab(tab)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    galleryTab === tab
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  {tab === "cohorts"
                    ? (lang === "ar" ? "صور الدورات" : "Cohort Photos")
                    : (lang === "ar" ? "صور المحاضرات" : "Speech Photos")}
                </button>
              ))}
            </div>
            <div className="columns-2 md:columns-3 gap-3 md:gap-4">
              {(galleryTab === "cohorts" ? galleryPhotos : speechPhotos).map((photo, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 3) * 0.05, duration: 0.4 }}
                  className="break-inside-avoid mb-3 md:mb-4 relative group cursor-pointer overflow-hidden rounded-xl"
                  onClick={() => {
                    const offset = galleryTab === "speeches" ? galleryPhotos.length : 0;
                    setLightboxIndex(offset + i);
                    setLightboxOpen(true);
                  }}
                >
                  <img src={photo.src} alt={photo.country[lang as keyof typeof photo.country] || photo.country.en} className="w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute top-2 end-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                      <ZoomIn className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  {photo.flag && (
                    <div className="absolute bottom-2 start-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white text-xs font-medium">
                        <span>{photo.flag}</span>
                        <span>{photo.country[lang as keyof typeof photo.country] || photo.country.en}</span>
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── VIDEOS ── */}
        <section id="videos" className="py-14 md:py-24 bg-background">
          <div className="container mx-auto px-6">
            <div className="text-center mb-10">
              <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-5">
                  <PlayCircle className="w-4 h-4" />
                  {lang === "ar" ? "مكتبة تعليمية شاملة" : "Comprehensive Learning Library"}
                </div>
                <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">{t.videos.heading}</h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t.videos.sub}</p>
              </motion.div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none snap-x">
              {([
                ["all", t.videos.tabs.all],
                ["opening", t.videos.tabs.opening],
                ["closing", t.videos.tabs.closing],
                ["storytelling", t.videos.tabs.storytelling],
                ["humor", t.videos.tabs.humor],
                ["voice", t.videos.tabs.voice],
                ["body", t.videos.tabs.body],
              ] as [string, string][]).map(([key, label]) => {
                const count = key === "all" ? videoLibrary.length : videoLibrary.filter((v) => v.category === key).length;
                const active = videoTab === key;
                return (
                  <button key={key} onClick={() => setVideoTab(key as VideoCategory | "all")} className={`snap-start shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${active ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/60"}`}>
                    {label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-muted"}`}>{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoLibrary
                .filter((v) => videoTab === "all" || v.category === videoTab)
                .map((video, i) => {
                  const title = video.title[lang as keyof typeof video.title] || video.title.en;
                  const speaker = video.speaker[lang as keyof typeof video.speaker] || video.speaker.en;
                  const skill = video.skill[lang as keyof typeof video.skill] || video.skill.en;
                  const learn = video.learn[lang as keyof typeof video.learn] || video.learn.en;
                  const thumbUrl = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
                  const isSuhaib = video.type === "suhaib";
                  return (
                    <motion.div
                      key={`${video.youtubeId}-${video.category}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: (i % 3) * 0.08, duration: 0.45 }}
                      className={`bg-card border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group ${isSuhaib ? "border-primary/40 ring-1 ring-primary/20 hover:ring-primary/40" : "border-border hover:border-primary/20"}`}
                      onClick={() => setVideoModalId(video.youtubeId)}
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <img src={thumbUrl} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <PlayCircle className="w-8 h-8 text-primary fill-primary" />
                          </div>
                        </div>
                        {isSuhaib && (
                          <div className="absolute top-3 start-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-md">
                              ✦ {t.videos.suhaibBadge}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3 border border-accent/20">
                          <Lightbulb className="w-3 h-3 shrink-0" />
                          {skill}
                        </div>
                        <h3 className="font-serif text-base font-bold leading-snug mb-1">{title}</h3>
                        <p className="text-muted-foreground text-sm mb-4">{speaker}</p>
                        <div className="bg-secondary/40 rounded-xl p-3 border border-border/60">
                          <p className="text-xs font-bold text-foreground/70 mb-1">{t.videos.skillLabel}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{learn}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <TestimonialsSection />

        {/* ── REPEATING CTA ── */}
        <JourneyCta testIdSuffix="after-testimonials" />

        {/* ── FAQ ── */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl font-bold mb-4">{t.faq.heading}</h2>
              <p className="text-xl text-muted-foreground">{t.faq.sub}</p>
            </div>
            {(() => {
              const perPage = 5;
              const totalPages = Math.ceil(faqItems.length / perPage);
              const paginated = faqItems.slice(faqPage * perPage, (faqPage + 1) * perPage);
              return (
                <>
                  <div className="space-y-3">
                    {paginated.map((faq, idx) => {
                      const globalIdx = faqPage * perPage + idx;
                      return (
                        <motion.div key={globalIdx} className="bg-card border border-border rounded-2xl overflow-hidden">
                          <button
                            onClick={() => setExpandedFaq(expandedFaq === globalIdx ? null : globalIdx)}
                            className="w-full flex items-center justify-between p-5 cursor-pointer font-serif text-base font-medium hover:bg-secondary/30 transition-colors text-left"
                          >
                            {faq.q}
                            <motion.span animate={{ rotate: expandedFaq === globalIdx ? 180 : 0 }} transition={{ duration: 0.3 }} className="shrink-0 ms-4">
                              <ChevronDown className="text-muted-foreground w-5 h-5" />
                            </motion.span>
                          </button>
                          <AnimatePresence>
                            {expandedFaq === globalIdx && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
                                <div className="p-5 pt-0 text-sm text-muted-foreground leading-relaxed border-t border-border/50">{faq.a}</div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      {Array.from({ length: totalPages }, (_, p) => (
                        <button key={p} onClick={() => { setFaqPage(p); setExpandedFaq(null); }} className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${p === faqPage ? "bg-primary text-white shadow-md" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
                          {p + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </section>

        {/* ── ENROLLMENT FORM ── */}
        <section id="enroll" className="py-14 md:py-24 bg-secondary/20 border-t border-border">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto bg-card rounded-[2.5rem] shadow-xl overflow-hidden border border-border/50 grid lg:grid-cols-5">
              <div className="lg:col-span-3 p-8 md:p-12">
                <AnimatePresence mode="wait">
                  {enrollSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="flex flex-col items-center justify-center text-center py-8 gap-6"
                    >
                      {/* Animated glow orb */}
                      <div className="relative">
                        <motion.div
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.1 }}
                          className="relative w-32 h-32 flex items-center justify-center"
                        >
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 blur-2xl animate-pulse" />
                          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-2xl">
                            <span className="text-5xl">🎙️</span>
                          </div>
                        </motion.div>
                        {/* Orbiting sparkles */}
                        {["-top-2 start-1", "-top-3 end-2", "top-2 -end-3", "bottom-1 -start-3", "-bottom-3 end-4"].map((pos, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [0, 1.3, 1], opacity: 1 }}
                            transition={{ delay: 0.35 + i * 0.08, type: "spring", stiffness: 260 }}
                            className={`absolute ${pos} text-sm`}
                          >{["✨", "⭐", "🌟", "💫", "✨"][i]}</motion.div>
                        ))}
                      </div>

                      {/* Personalized heading */}
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
                        <h3 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
                          {lang === "ar" ? `أهلاً ${enrollSuccess.name}! 🎉` : `Welcome, ${enrollSuccess.name}! 🎉`}
                        </h3>
                        <p className="text-xl text-primary font-bold">
                          {lang === "ar" ? "رحلتك بدأت للتو 🚀" : "Your journey starts now 🚀"}
                        </p>
                      </motion.div>

                      {/* Program summary box */}
                      {enrollSuccess.program && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="bg-primary/5 border border-primary/20 rounded-2xl px-7 py-5 w-full max-w-sm">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                            {lang === "ar" ? "البرنامج المختار" : "Selected Program"}
                          </p>
                          <p className="text-primary font-bold text-lg">{enrollSuccess.program}</p>
                        </motion.div>
                      )}

                      {/* Inspiring body */}
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-muted-foreground max-w-xs leading-relaxed text-sm italic">
                        {lang === "ar"
                          ? "\"الكلمة الواحدة قادرة على تغيير مسار حياتك.\" — استلمنا طلبك وسيصلك إيميل التأكيد قريباً."
                          : "\"One word can change the course of your life.\" — Check your inbox for confirmation."}
                      </motion.p>

                      {/* Action buttons */}
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex flex-col sm:flex-row gap-3">
                        <a
                          href={`https://wa.me/97455377065?text=${encodeURIComponent(lang === "ar" ? `السلام عليكم، أنا ${enrollSuccess.name} وقدمت طلب تسجيل في برنامج ${enrollSuccess.program || "بكلمة"}. أودّ الاستفسار عن التفاصيل.` : `Hello, I'm ${enrollSuccess.name} and I submitted an enrollment request for ${enrollSuccess.program || "Bikalima"}. I'd like to know more.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5c] text-white font-bold px-7 py-3 rounded-full text-sm transition-colors shadow-lg"
                        >
                          <span>💬</span>
                          {lang === "ar" ? "تواصل عبر واتساب" : "Chat on WhatsApp"}
                        </a>
                        <Button variant="outline" className="rounded-full px-7 border-primary/30 text-primary hover:bg-primary/5" onClick={() => setEnrollSuccess(null)}>
                          {lang === "ar" ? "تقديم طلب آخر" : "Submit another"}
                        </Button>
                      </motion.div>
                    </motion.div>
                  ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EnrollmentWizard
                  lang={lang}
                  onSuccess={(info) => setEnrollSuccess(info)}
                />
                </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Legacy form removed — replaced by EnrollmentWizard above */}
              <div className="lg:col-span-2 bg-primary text-primary-foreground p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent rounded-full blur-[100px] opacity-20 -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground/5 rounded-full blur-[80px] -ml-16 -mb-16" />
                <div className="relative z-10">
                  <div className="mb-2">
                    <span className="text-xs font-semibold tracking-widest uppercase text-primary-foreground/50 border border-primary-foreground/20 rounded-full px-3 py-1">
                      {lang === "ar" ? "رحلة التحويل" : "Transformation Journey"}
                    </span>
                  </div>
                  <h3 className="font-serif text-3xl md:text-4xl font-bold mb-5 leading-tight whitespace-pre-line">{t.enroll.sidePanelTitle}</h3>
                  <p className="text-primary-foreground/75 text-base leading-relaxed mb-8">{t.enroll.sidePanelText}</p>

                  <div className="mb-8 space-y-0">
                    {[
                      { num: "01", label: t.enroll.sidePanelStep1, desc: t.enroll.sidePanelStep1Desc },
                      { num: "02", label: t.enroll.sidePanelStep2, desc: t.enroll.sidePanelStep2Desc },
                      { num: "03", label: t.enroll.sidePanelStep3, desc: t.enroll.sidePanelStep3Desc },
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-4 py-3 border-b border-primary-foreground/10 last:border-0">
                        <span className="text-2xl font-bold font-serif text-primary-foreground/20 leading-none shrink-0 mt-0.5">{step.num}</span>
                        <div>
                          <p className="font-semibold text-primary-foreground text-sm">{step.label}</p>
                          <p className="text-primary-foreground/55 text-xs mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <a href="https://wa.me/97455377065" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center shrink-0 group-hover:bg-[#25D366]/30 transition-colors">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      </div>
                      <p className="text-sm text-primary-foreground/70 group-hover:text-primary-foreground transition-colors">{lang === "ar" ? "تواصل عبر واتساب" : "Chat on WhatsApp"}</p>
                    </a>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center shrink-0"><MessageCircle className="w-5 h-5" /></div>
                      <div>
                        <p className="text-xs text-primary-foreground/50">{t.enroll.quickQ}</p>
                        <p className="font-bold text-sm" dir="ltr">info@bikalima.com</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative z-10 mt-10 bg-primary-foreground/10 p-6 rounded-2xl border border-primary-foreground/20">
                  <div className="text-primary-foreground/30 text-4xl font-serif leading-none mb-2 select-none">"</div>
                  <p className="font-serif font-medium leading-relaxed text-base text-center px-2">{t.enroll.sideQuote}</p>
                  <div className="text-primary-foreground/30 text-4xl font-serif leading-none mt-1 text-right select-none">"</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      {/* ── PHOTO LIGHTBOX ── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              aria-label={t.gallery.lightboxClose}
              onClick={() => setLightboxOpen(false)}
              className="absolute top-5 end-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <>
                  <button
                    aria-label={t.gallery.lightboxPrev}
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i - 1 + allPhotos.length) % allPhotos.length); }}
                    className="absolute start-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                  <button
                    aria-label={t.gallery.lightboxNext}
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i + 1) % allPhotos.length); }}
                    className="absolute end-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={lightboxIndex}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      src={allPhotos[lightboxIndex]?.src}
                      alt=""
                      className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </AnimatePresence>
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
                    {allPhotos[lightboxIndex] && (
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm backdrop-blur-sm border border-white/10">
                        {allPhotos[lightboxIndex].flag && (
                          <>
                            <span>{allPhotos[lightboxIndex].flag}</span>
                            <span>{allPhotos[lightboxIndex].country[lang as keyof typeof allPhotos[0]["country"]]}</span>
                            <span className="text-white/50">·</span>
                          </>
                        )}
                        <span className="text-white/60">{lightboxIndex + 1} / {allPhotos.length}</span>
                      </span>
                    )}
                  </div>
                </>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VIDEO MODAL ── */}
      <AnimatePresence>
        {videoModalId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setVideoModalId(null)}
          >
            <button
              aria-label={t.gallery.lightboxClose}
              onClick={() => setVideoModalId(null)}
              className="absolute top-5 end-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                key={videoModalId}
                src={`https://www.youtube.com/embed/${videoModalId}?autoplay=1&cc_load_policy=1&cc_lang_pref=ar&hl=ar`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PROGRAM DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedProgram && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedProgram(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-card w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl relative z-10 border border-border">
              <button aria-label="Close" onClick={() => setSelectedProgram(null)} className="absolute top-6 end-6 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-foreground hover:bg-white transition-colors z-20 shadow-sm"><X className="w-5 h-5" /></button>
              <div className="relative aspect-[21/8] overflow-hidden rounded-t-[2rem]">
                <img src={selectedProgram.image} alt={selectedProgram.shortTitle} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                <div className={`absolute inset-0 bg-gradient-to-br ${selectedProgram.accentColor} opacity-75 mix-blend-multiply`} />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full mb-3">{selectedProgram.role}</div>
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-2">
                    {selectedProgram.shortTitle}
                    {selectedProgram.badge && <span className="font-normal text-base text-white/65 ms-2">{selectedProgram.badge}</span>}
                  </h2>
                  {selectedProgram.subtitle && <p className="text-white/75 text-sm italic mt-1 mb-1">{selectedProgram.subtitle}</p>}
                  <div className="flex flex-wrap gap-4 text-white/80 text-sm">
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{selectedProgram.hours} {t.modal.hoursUnit}</span>
                    <span>·</span>
                    <span>{selectedProgram.sessions} {t.structure.sessionsUnit}</span>
                    <span>·</span>
                    <span className="font-bold text-white text-base">{formatPrice(Math.round(RECORDED_PRICES[selectedProgram.id as keyof typeof RECORDED_PRICES] * 1.5))} <span className="font-normal text-white/60 text-xs">({t.enroll.modeCombined})</span></span>
                  </div>
                  {selectedProgram.prerequisite && (
                    <div className={`mt-3 inline-flex items-center gap-2 text-[10px] font-medium px-3 py-1 rounded-full ${selectedProgram.id === "tot" ? "bg-red-100 text-red-700" : selectedProgram.id === "children" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                      {selectedProgram.id === "tot" ? <Lock className="w-2.5 h-2.5" /> : selectedProgram.id === "children" ? <School className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                      {selectedProgram.prerequisite}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-8 md:p-12 grid md:grid-cols-3 gap-10">
                <div className="md:col-span-2 space-y-8">
                  <section>
                    <div className="bg-secondary/30 p-5 rounded-2xl border border-border mb-6">
                      <Quote className="w-5 h-5 text-primary mb-2 opacity-50" />
                      <p className="font-serif text-sm font-medium italic">{selectedProgram.hook}</p>
                    </div>
                    <h3 className="font-bold text-2xl mb-4 border-b border-border pb-4">{t.modal.aboutHeading}</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">{selectedProgram.description}</p>
                  </section>
                  <section>
                    <h3 className="font-bold text-xl mb-4 border-b border-border pb-4 flex items-center gap-2">
                      <PlayCircle className="w-5 h-5 text-primary" />{t.modal.introVideoHeading}
                    </h3>
                    {selectedProgram.introVideo ? (
                      <div className="aspect-video rounded-2xl overflow-hidden border border-border bg-foreground/5">
                        <iframe
                          src={selectedProgram.introVideo}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="aspect-video rounded-2xl border-2 border-dashed border-border bg-secondary/20 flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <PlayCircle className="w-8 h-8 text-primary/50" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">{t.modal.introVideoSoon}</p>
                      </div>
                    )}
                  </section>
                  <section>
                    <h3 className="font-bold text-2xl mb-4 border-b border-border pb-4">{t.modal.transformHeading}</h3>
                    <div className="bg-secondary/30 p-6 rounded-2xl border border-border flex items-center gap-4">
                      <Star className="w-8 h-8 text-accent shrink-0" />
                      <p className="font-serif text-sm font-medium">{selectedProgram.transformation}</p>
                    </div>
                  </section>
                  <section>
                    <h3 className="font-bold text-2xl mb-4 border-b border-border pb-4">{t.modal.sessionsHeading} ({selectedProgram.sessions} {t.structure.sessionsUnit})</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {selectedProgram.modules.map((mod, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-background p-4 rounded-xl border border-border">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">{idx + 1}</div>
                          <span className="font-medium text-foreground text-sm">{mod}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
                <div className="space-y-6">
                  <div className="bg-secondary/20 p-6 rounded-3xl border border-border">
                    <h4 className="font-bold mb-4 text-muted-foreground text-sm uppercase tracking-wider">{t.modal.outcomesHeading}</h4>
                    <ul className="space-y-3">
                      {selectedProgram.outcomes.map((out, idx) => (
                        <li key={idx} className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span className="text-sm font-medium">{out}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-card p-5 rounded-3xl border border-primary/20 shadow-sm">
                    <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">{t.modal.workbookHeading}</div>
                    <h4 className="font-serif font-bold text-lg mb-2">{selectedProgram.workbook.title}</h4>
                    <p className="text-sm text-muted-foreground">{selectedProgram.workbook.description}</p>
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <span className="font-bold text-lg">{formatPrice(WORKBOOK_PRICES[selectedProgram.id as keyof typeof WORKBOOK_PRICES])}</span>
                      <Button variant="outline" size="sm" className="rounded-full">{t.modal.orderWorkbook}</Button>
                    </div>
                  </div>
                  <div className="bg-card p-5 rounded-3xl border border-border">
                    <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">{t.modal.audienceHeading}</div>
                    <p className="text-sm font-medium">{selectedProgram.audience}</p>
                    <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">{selectedProgram.delivery}</div>
                  </div>
                  <div className="space-y-3">
                    <Button size="lg" className="w-full rounded-full h-14 text-lg font-bold shadow-lg bg-primary text-white hover:bg-primary/90" onClick={() => { setFormData((prev) => ({ ...prev, program: selectedProgram.shortTitle, mode: "combined" })); setSelectedProgram(null); setTimeout(() => scrollTo("enroll"), 300); }}>
                      <ShoppingCart className="w-5 h-5 me-2" />
                      {t.modal.buyRecordedBtn} — {formatPrice(Math.round(RECORDED_PRICES[selectedProgram.id as keyof typeof RECORDED_PRICES] * 1.5))}
                    </Button>
                    <Button size="lg" variant="outline" className="w-full rounded-full h-12 font-bold border-primary/30 text-primary hover:bg-primary/5" onClick={() => { setFormData((prev) => ({ ...prev, program: selectedProgram.shortTitle })); setSelectedProgram(null); setTimeout(() => scrollTo("enroll"), 300); }}>
                      {t.modal.registerInterestBtn}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

      {/* ── ZOOM SCHEDULER MODAL ── */}
      <AnimatePresence>
        {showZoomModal && (
          <motion.div
            key="zoom-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowZoomModal(false); }}
          >
            <motion.div
              key="zoom-modal-box"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              style={{ width: "min(680px, 100%)", height: "min(720px, 90vh)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#2D8CFF]/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#2D8CFF]" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h10.667A2.667 2.667 0 0 1 17.333 6.667v6.666A2.667 2.667 0 0 1 14.667 16H4a2.667 2.667 0 0 1-2.667-2.667V6.667A2.667 2.667 0 0 1 4 4zm15.333 2.72 2.774-1.664A.667.667 0 0 1 23.333 5.627v12.746a.667.667 0 0 1-1.226.37l-2.774-1.663V6.72z"/></svg>
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-none">{lang === "ar" ? "احجز جلستك الاستشارية" : "Book Your Consultation"}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{lang === "ar" ? "٢٠ دقيقة مع صهيب الخوالدة · مجاناً" : "20 min with Suhaib Al-Khawaldeh · Free"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowZoomModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto">
                {consultBooked ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full gap-5 px-8 py-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-9 h-9 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-serif text-xl font-bold mb-2">{lang === "ar" ? "تم تأكيد حجزك! 🎉" : "Booking Confirmed! 🎉"}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                        {lang === "ar"
                          ? `وصلك تأكيد على ${consultEmail} يتضمن رابط Zoom ودعوة التقويم الخاصة بجلستك في ${consultDate} الساعة ${consultTime}.`
                          : `A confirmation was sent to ${consultEmail} with your Zoom link and calendar invite for ${consultDate} at ${consultTime}.`}
                      </p>
                    </div>
                    <div className="bg-primary/5 border border-primary/15 rounded-2xl px-5 py-3.5 text-sm flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-semibold text-primary">{consultDate} · {consultTime} {lang === "ar" ? "(بتوقيت عمّان)" : "(Amman Time)"}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{lang === "ar" ? "رابط Zoom سيصلك قبيل موعد جلستك مباشرة" : "Your Zoom link will be in your confirmation email"}</p>
                    <Button variant="outline" size="sm" className="rounded-full mt-2" onClick={() => {
                      setConsultBooked(false); setConsultDate(null); setConsultTime(null);
                      setConsultName(""); setConsultEmail(""); setConsultPhone(""); setConsultNotes("");
                    }}>
                      {lang === "ar" ? "حجز موعد آخر" : "Book another slot"}
                    </Button>
                  </motion.div>
                ) : (
                  <div className="p-5 space-y-5">
                    {/* Day picker */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">{lang === "ar" ? "١ · اختر اليوم" : "1 · Choose a Day"}</p>
                      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                        {getConsultAvailableDays().map((day) => (
                          <button
                            key={day.date}
                            onClick={() => { setConsultDate(day.date); setConsultTime(null); }}
                            className={`shrink-0 flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-2xl border-2 text-center transition-all duration-150 min-w-[56px] ${
                              consultDate === day.date
                                ? "border-primary bg-primary text-primary-foreground shadow-md"
                                : "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
                            }`}
                          >
                            <span className="text-[9px] font-semibold opacity-70 uppercase">{day.dayName}</span>
                            <span className="text-lg font-bold leading-none">{day.dayNum}</span>
                            <span className="text-[9px] opacity-60">{day.month}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time slots */}
                    <AnimatePresence>
                      {consultDate && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">{lang === "ar" ? "٢ · اختر الوقت" : "2 · Choose a Time"}</p>
                          <div className="grid grid-cols-4 gap-2">
                            {["10:00","11:30","14:00","16:00"].map((slot) => (
                              <button
                                key={slot}
                                onClick={() => setConsultTime(slot)}
                                className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all duration-150 ${
                                  consultTime === slot
                                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                                    : "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Form fields */}
                    <AnimatePresence>
                      {consultDate && consultTime && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="space-y-3">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{lang === "ar" ? "٣ · بياناتك" : "3 · Your Info"}</p>
                          <div className="bg-primary/5 border border-primary/15 rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-sm">
                            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="font-semibold text-primary">{consultDate} · {consultTime} {lang === "ar" ? "— بتوقيت عمّان" : "— Amman Time"}</span>
                          </div>
                          <Input
                            placeholder={lang === "ar" ? "اسمك الكريم *" : "Your name *"}
                            value={consultName} onChange={(e) => setConsultName(e.target.value)}
                            className="rounded-xl h-11"
                          />
                          <Input
                            type="email"
                            placeholder={lang === "ar" ? "بريدك الإلكتروني *" : "Your email *"}
                            value={consultEmail} onChange={(e) => setConsultEmail(e.target.value)}
                            className="rounded-xl h-11"
                          />
                          <Input
                            placeholder={lang === "ar" ? "رقم الجوال (اختياري)" : "Phone number (optional)"}
                            value={consultPhone} onChange={(e) => setConsultPhone(e.target.value)}
                            className="rounded-xl h-11"
                          />
                          <Textarea
                            placeholder={lang === "ar" ? "ماذا تريد أن تناقش؟ (اختياري)" : "What would you like to discuss? (optional)"}
                            value={consultNotes} onChange={(e) => setConsultNotes(e.target.value)}
                            rows={2} className="rounded-xl resize-none"
                          />
                          <Button
                            onClick={handleBookConsultation}
                            disabled={consultLoading || !consultName.trim() || !consultEmail.trim()}
                            className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-lg shadow-primary/20"
                          >
                            {consultLoading
                              ? (lang === "ar" ? "جارٍ الحجز..." : "Booking...")
                              : (lang === "ar" ? "✦ تأكيد الحجز" : "✦ Confirm Booking")}
                          </Button>
                          <p className="text-[11px] text-center text-muted-foreground pb-2">
                            {lang === "ar" ? "ستصلك دعوة تقويم ورابط Zoom على بريدك فور التأكيد" : "Calendar invite & Zoom link will be sent to your email"}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!consultDate && (
                      <p className="text-xs text-center text-muted-foreground pt-2 pb-4">
                        {lang === "ar" ? "ابدأ باختيار اليوم المناسب ↑" : "Start by picking a day above ↑"}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
