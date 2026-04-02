import React, { useState, useEffect, useCallback } from "react";
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
  Menu,
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
  FileText,
  Printer,
  Mail,
  Package,
  Minus,
  Plus,
  Download,
  PlayCircle,
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
import { useAuth } from "@workspace/replit-auth-web";

import imgHeroCollage from "@assets/speeches_1774983233277.jpeg";
import imgTedx from "@assets/42267697_10160981969510644_1547980864304971776_n_1774982322778.jpg";

function useLang() {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem("biklima-lang") as Lang | null;
      if (stored && ["ar", "en", "fr"].includes(stored)) return stored;
    } catch {}
    const nav = navigator.language.toLowerCase();
    if (nav.startsWith("ar")) return "ar";
    if (nav.startsWith("fr")) return "fr";
    return "en";
  });

  const switchLang = (l: Lang) => {
    setLang(l);
    try { localStorage.setItem("biklima-lang", l); } catch {}
  };

  const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";
  return { lang, switchLang, dir };
}

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
  fr: [
    { source: "Le Cahier du Stagiaire", category: "Le Domaine Mental", icon: <Lightbulb className="w-5 h-5" />, quote: "La confiance ne se donne pas — elle se construit.", body: "Et elle commence au plus profond de soi — à partir de l'image que vous avez de vous-même au moment de prendre la parole." },
    { source: "Le Cahier du Stagiaire", category: "Le Domaine Verbal", icon: <Mic2 className="w-5 h-5" />, quote: "Même les plus grands prophètes ont demandé la facilité d'élocution.", body: "L'art oratoire est une vocation avant d'être une compétence — un don qui mérite d'être demandé." },
    { source: "Programme Éducateurs et Parents", category: "Le Fossé Générationnel", icon: <Heart className="w-5 h-5" />, quote: "70 % des personnes souffrent de la peur de parler en public.", body: "Et la cause principale n'est pas le public — c'est l'environnement dans lequel elles ont grandi." },
    { source: "Programme Éducateurs et Parents", category: "Le Rôle de l'Éducateur", icon: <Users className="w-5 h-5" />, quote: "Le mot que vous dites à un enfant dans son moment de besoin peut façonner sa voix pour la vie.", body: "Un enfant n'a pas besoin d'un formateur éloquent seulement — il a besoin d'un environnement qui croit que sa voix mérite d'être entendue." },
    { source: "Le Cahier du Jeune Orateur", category: "Philosophie de l'Enseignement", icon: <Star className="w-5 h-5" />, quote: "L'enfant qui apprend à parler avec confiance aujourd'hui est le leader qui change la salle demain.", body: "L'art oratoire pour les enfants n'est pas une activité parascolaire — c'est un investissement dans une personnalité complète." },
    { source: "Programme du Formateur Certifié", category: "La Mission du Formateur", icon: <Feather className="w-5 h-5" />, quote: "Le vrai formateur n'enseigne pas aux gens comment parler — il leur restitue la croyance que ce qu'ils disent mérite d'être entendu.", body: "Quand vous devenez formateur, votre responsabilité se multiplie : vous créez un impact et vous le confiez ensuite à d'autres." },
    { source: "Le Cahier du Stagiaire", category: "La Peur et le Pouvoir des Mots", icon: <Sparkles className="w-5 h-5" />, quote: "La peur de parler n'est pas votre ennemi — c'est un signal que ce que vous avez à dire est important.", body: "La nervosité avant un discours n'est pas une faiblesse — c'est une ignition. Les orateurs professionnels n'éliminent pas la peur — ils la transforment." },
    { source: "Programme du Formateur Certifié", category: "La Voix et l'Identité", icon: <Globe className="w-5 h-5" />, quote: "Votre voix est plus qu'un outil — c'est votre signature dans chaque pièce où vous entrez.", body: "Il n'existe pas deux voix identiques dans le monde. Votre voix porte votre histoire, votre culture et votre vision du monde." },
  ],
};

type CurrencyConfig = { code: string; symbol: string; name: string; rate: number };

const CURRENCIES: Record<string, CurrencyConfig> = {
  JO: { code: "JOD", symbol: "د.أ", name: "دينار أردني", rate: 1 },
  SA: { code: "SAR", symbol: "ر.س", name: "ريال سعودي", rate: 5.28 },
  AE: { code: "AED", symbol: "د.إ", name: "درهم إماراتي", rate: 5.18 },
  KW: { code: "KWD", symbol: "د.ك", name: "دينار كويتي", rate: 0.46 },
  QA: { code: "QAR", symbol: "ر.ق", name: "ريال قطري", rate: 5.15 },
  BH: { code: "BHD", symbol: "د.ب", name: "دينار بحريني", rate: 0.53 },
  OM: { code: "OMR", symbol: "ر.ع", name: "ريال عُماني", rate: 0.54 },
  EG: { code: "EGP", symbol: "ج.م", name: "جنيه مصري", rate: 47.0 },
  DEFAULT: { code: "USD", symbol: "$", name: "US Dollar", rate: 1.41 },
};

function useCurrency() {
  const [currency, setCurrency] = useState<CurrencyConfig>(CURRENCIES.JO);
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const tzMap: Record<string, string> = {
      "Asia/Amman": "JO", "Asia/Riyadh": "SA", "Asia/Dubai": "AE",
      "Asia/Kuwait": "KW", "Asia/Qatar": "QA", "Asia/Bahrain": "BH",
      "Asia/Muscat": "OM", "Africa/Cairo": "EG",
    };
    const country = tzMap[tz] || "DEFAULT";
    setCurrency(CURRENCIES[country] || CURRENCIES.DEFAULT);
  }, []);
  const format = useCallback(
    (jodPrice: number) => {
      const converted = Math.round(jodPrice * currency.rate);
      return `${converted} ${currency.symbol}`;
    },
    [currency],
  );
  return { currency, format };
}

const AR_DAYS = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const EN_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FR_DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function MiniCalendar({ lang }: { lang: Lang }) {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const year = nextMonth.getFullYear();
  const month = nextMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = nextMonth.getDay();

  const monthName = nextMonth.toLocaleDateString(
    lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-US",
    { month: "long", year: "numeric" }
  );
  const dayHeaders = lang === "ar" ? AR_DAYS : lang === "fr" ? FR_DAYS : EN_DAYS;

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
  const { format: formatPrice, currency } = useCurrency();
  const { lang, switchLang, dir } = useLang();
  const t = T[lang];
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const articles = wisdomArticles[lang];
  const faqItems = t.faq.items;
  const localizedPrograms = programs.map((p) => getLocalizedProgram(p, lang));
  const localizedTestimonials = testimonialsData[lang];

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ReturnType<typeof getLocalizedProgram> | null>(null);
  const [selectedWorkbook, setSelectedWorkbook] = useState<ReturnType<typeof getLocalizedProgram> | null>(null);
  const [wbQuantity, setWbQuantity] = useState(1);
  const [wbFormat, setWbFormat] = useState<"pdf" | "print">("pdf");
  const [wbDeliveryAddress, setWbDeliveryAddress] = useState("");
  const [wbBuyerName, setWbBuyerName] = useState("");
  const [wbBuyerPhone, setWbBuyerPhone] = useState("");
  const [wbBuyerEmail, setWbBuyerEmail] = useState("");
  const [wbSubmitting, setWbSubmitting] = useState(false);
  const [wbExpandedPage, setWbExpandedPage] = useState<number | null>(null);
  const [faqPage, setFaqPage] = useState(0);
  const [trainingMode, setTrainingMode] = useState<"recorded" | "group-online" | "group-inperson" | "private">("recorded");
  const [applicantType, setApplicantType] = useState<"individual" | "institution">("individual");
  const [wisdomIndex, setWisdomIndex] = useState(0);
  const [heroQuoteIdx, setHeroQuoteIdx] = useState(0);
  const [bioPageIdx, setBioPageIdx] = useState(0);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", category: "", program: "",
    mode: "recorded", reason: "", youtube: "",
  });
  const [orgFormData, setOrgFormData] = useState({
    orgName: "", contactPerson: "", phone: "", email: "",
    studentCount: "", teacherCount: "", workbookCount: "",
    program: "", message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [dir, lang]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const total = t.hero.imageQuotes.length;
    if (!total) return;
    setHeroQuoteIdx(0);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    const timer = setInterval(() => setHeroQuoteIdx((i) => (i + 1) % total), 5000);
    return () => clearInterval(timer);
  }, [t.hero.imageQuotes.length, lang]);

  const handleWorkbookOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setWbSubmitting(true);
    try {
      const base = import.meta.env.BASE_URL || "/";
      const apiBase = base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
      await fetch(`${apiBase}/workbook-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workbookId: selectedWorkbook?.id,
          workbookTitle: selectedWorkbook?.workbook.title,
          quantity: wbQuantity,
          format: wbFormat,
          deliveryAddress: wbFormat === "print" ? wbDeliveryAddress : "",
          buyerName: wbBuyerName,
          buyerPhone: wbBuyerPhone,
          buyerEmail: wbBuyerEmail,
          unitPrice: WORKBOOK_PRICES[selectedWorkbook?.id as keyof typeof WORKBOOK_PRICES],
          lang,
        }),
      });
      toast({ title: t.workbooks.orderSuccess, description: "" });
      setSelectedWorkbook(null);
    } catch {
      toast({ title: lang === "ar" ? "حدث خطأ" : lang === "fr" ? "Une erreur est survenue" : "Something went wrong", description: lang === "ar" ? "يرجى المحاولة مرة أخرى" : lang === "fr" ? "Veuillez réessayer" : "Please try again later", variant: "destructive" });
    } finally {
      setWbSubmitting(false);
    }
  };

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
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
      if (applicantType === "individual") {
        setFormData({ name: "", email: "", phone: "", category: "", program: "", mode: "recorded", reason: "", youtube: "" });
      } else {
        setOrgFormData({ orgName: "", contactPerson: "", phone: "", email: "", studentCount: "", teacherCount: "", workbookCount: "", program: "", message: "" });
      }
      toast({ title: t.enroll.successTitle, description: t.enroll.successDesc });
    } catch {
      setIsSubmitting(false);
      toast({ title: lang === "ar" ? "حدث خطأ" : lang === "fr" ? "Une erreur est survenue" : "Something went wrong", description: lang === "ar" ? "يرجى المحاولة مرة أخرى" : lang === "fr" ? "Veuillez réessayer" : "Please try again later", variant: "destructive" });
    }
  };

  const coreProgram = localizedPrograms.find((p) => p.id === "core")!;
  const branchPrograms = localizedPrograms.filter((p) => p.id !== "core");

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
    if (mode === "recorded") return `${base}`;
    if (mode === "group-online") return `${base * 2}`;
    if (mode === "group-inperson") return null;
    if (mode === "private") return `${base * 4}`;
    return null;
  };

  const navItems = [
    { label: t.nav.structure, id: "structure" },
    { label: t.nav.wisdom, id: "wisdom" },
    { label: t.nav.workbooks, id: "workbooks" },
    { label: t.nav.testimonials, id: "testimonials" },
  ];

  const langButtons: { key: Lang; label: string }[] = [
    { key: "ar", label: "ع" },
    { key: "en", label: "EN" },
    { key: "fr", label: "FR" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden relative">
      {/* ── NAVBAR ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-background/90 backdrop-blur-md border-b border-border py-4 shadow-sm" : "bg-transparent py-6"
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between gap-4">
          <div className="logo-biklima text-5xl text-primary tracking-tight leading-none">بكلمة</div>
          <nav className="hidden md:flex items-center gap-6 font-medium">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => scrollTo(item.id)} className="text-foreground/80 hover:text-primary transition-colors">{item.label}</button>
            ))}
            <Button onClick={() => scrollTo("enroll")} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 rounded-full">{t.nav.cta}</Button>
            {!authLoading && (
              isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`${import.meta.env.BASE_URL}dashboard`)} className="text-sm font-bold text-primary hover:text-primary/80 transition-colors border border-primary/30 px-4 py-1.5 rounded-full hover:bg-primary/5">
                    {lang === "ar" ? "منصتي" : lang === "fr" ? "Ma plateforme" : "My Platform"}
                  </button>
                  <button onClick={logout} className="text-xs text-muted-foreground hover:text-destructive transition-colors border border-border/50 px-2.5 py-1 rounded-full">
                    {lang === "ar" ? "تسجيل الخروج" : lang === "fr" ? "Déconnexion" : "Log out"}
                  </button>
                </div>
              ) : (
                <button onClick={() => navigate(`${import.meta.env.BASE_URL}dashboard`)} className="text-sm font-bold text-primary hover:text-primary/80 transition-colors border border-primary/30 px-4 py-1.5 rounded-full hover:bg-primary/5">
                  {lang === "ar" ? "تسجيل الدخول" : lang === "fr" ? "Connexion" : "Log in"}
                </button>
              )
            )}
            <div className="flex items-center gap-1 border border-border rounded-full overflow-hidden">
              {langButtons.map(({ key, label }) => (
                <button key={key} onClick={() => switchLang(key)} className={`px-3 py-1.5 text-xs font-bold transition-colors ${lang === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{label}</button>
              ))}
            </div>
          </nav>
          <button className="md:hidden text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed inset-0 z-40 bg-background flex flex-col pt-24 px-8 gap-6">
            <button className="absolute top-6 left-6 text-foreground" onClick={() => setMobileMenuOpen(false)}><X size={28} /></button>
            {navItems.map((item) => (
              <button key={item.id} onClick={() => scrollTo(item.id)} className="text-2xl font-serif text-start text-foreground/90 border-b border-border pb-4">{item.label}</button>
            ))}
            <Button size="lg" onClick={() => scrollTo("enroll")} className="w-full mt-4 text-lg bg-primary rounded-full">{t.nav.mobileCta}</Button>
            {!authLoading && (
              isAuthenticated ? (
                <div className="space-y-3">
                  <button onClick={() => { setMobileMenuOpen(false); navigate(`${import.meta.env.BASE_URL}dashboard`); }} className="w-full text-center py-3 font-bold text-primary border border-primary/30 rounded-2xl hover:bg-primary/5 transition-colors">
                    {lang === "ar" ? "منصتي" : lang === "fr" ? "Ma plateforme" : "My Platform"}
                  </button>
                  <button onClick={logout} className="w-full text-center py-2.5 text-sm text-muted-foreground hover:text-destructive transition-colors border border-border rounded-2xl">
                    {lang === "ar" ? "تسجيل الخروج" : lang === "fr" ? "Déconnexion" : "Log out"}
                  </button>
                </div>
              ) : (
                <button onClick={() => { setMobileMenuOpen(false); navigate(`${import.meta.env.BASE_URL}dashboard`); }} className="w-full text-center py-3 font-bold text-primary border border-primary/30 rounded-2xl hover:bg-primary/5 transition-colors">
                  {lang === "ar" ? "تسجيل الدخول / إنشاء حساب" : lang === "fr" ? "Connexion / Inscription" : "Log in / Sign up"}
                </button>
              )
            )}
            <div className="flex items-center justify-center gap-2 mt-2">
              {langButtons.map(({ key, label }) => (
                <button key={key} onClick={() => switchLang(key)} className={`px-4 py-2 text-sm font-bold rounded-full border transition-colors ${lang === key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>{label}</button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <img src={imgTedx} alt={t.hero.h1a} className="w-full h-full object-cover" />
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

        {/* ── TRAINER BIO ── */}
        <section className="py-20 bg-secondary/20 border-y border-border">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-xl relative">
                  <img src={imgHeroCollage} alt={t.trainerBio.name} className="w-full h-full object-cover object-[8%_15%]" />
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
        <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
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
        <section className="py-24 bg-secondary/30">
          <div className="container mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-serif text-4xl font-bold mb-6">{t.why.heading}</h2>
              <p className="text-xl text-muted-foreground">{t.why.sub}</p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-8">
              {t.why.items.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                    {i === 0 ? <Layers className="w-8 h-8" /> : i === 1 ? <CheckCircle2 className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
                  </div>
                  <h3 className="font-serif text-2xl font-bold mb-4">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BRANCHING DIAGRAM ── */}
        <section id="structure" className="py-24 bg-background relative overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">{t.structure.heading}</h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t.structure.sub}</p>
              </motion.div>
            </div>
            <div className="flex flex-col items-center">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="w-full max-w-2xl">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-primary cursor-pointer group" onClick={() => setSelectedProgram(coreProgram)}>
                  <div className="aspect-[21/8] relative">
                    <img src={coreProgram.image} alt={coreProgram.shortTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold mb-3">
                      <Star className="w-4 h-4 text-accent" />{t.structure.coreBadge}
                    </div>
                    <h3 className="font-serif text-2xl md:text-3xl font-bold mb-1">{coreProgram.shortTitle}</h3>
                    <p className="text-white/80 text-sm italic mb-2">{t.structure.coreSubtitle}</p>
                    <div className="flex items-center gap-4 text-white/80 text-sm">
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{coreProgram.hours} {t.structure.hoursUnit}</span>
                      <span>·</span>
                      <span>{coreProgram.sessions} {t.structure.sessionsUnit}</span>
                      <span>·</span>
                      <span className="font-bold text-white">{formatPrice(RECORDED_PRICES.core)} <span className="font-normal text-white/60 text-xs">({t.structure.recordedLabel})</span></span>
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
                      <Card className={`w-full flex flex-col overflow-hidden border-2 ${program.borderColor} shadow-md hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 cursor-pointer`} onClick={() => setSelectedProgram(program)}>
                        <div className="aspect-[4/3.5] relative overflow-hidden">
                          <img src={program.image} alt={program.shortTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-transparent to-transparent" />
                          <div className="absolute bottom-4 right-4 left-4">
                            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold mb-2 ${program.tagColor}`}>{program.role}</div>
                            <h3 className="font-serif text-lg font-bold text-white leading-tight">{program.shortTitle}</h3>
                            <div className="flex items-center gap-2 text-white/70 text-xs mt-1">
                              <Clock className="w-3 h-3" />
                              <span>{program.hours} {t.structure.hoursUnit}</span>
                              <span>·</span>
                              <span className="font-bold text-white">{formatPrice(RECORDED_PRICES[program.id as keyof typeof RECORDED_PRICES])} <span className="font-normal text-white/60 text-[10px]">({t.structure.recordedLabel})</span></span>
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-5 flex flex-col flex-1">
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2 flex-1">{program.hook}</p>
                          <Button variant="outline" size="sm" className="w-full rounded-full text-primary border-primary/30 hover:bg-primary hover:text-white mb-2">{t.structure.viewDetails}</Button>
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

        {/* ── UPCOMING EVENTS ── */}
        <section className="py-10 bg-gradient-to-b from-primary/5 to-background border-b border-border">
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
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {upcomingEvents.map((ev) => {
                  const evLoc = lang === "ar" ? { location: ev.location, city: ev.city } : ev.i18n[lang as "en" | "fr"];
                  const prog = programs.find(p => p.id === ev.programId);
                  const lp = prog ? getLocalizedProgram(prog, lang) : null;
                  return (
                    <Card key={ev.id} className="border-2 border-primary/20 hover:border-primary/40 transition-colors overflow-hidden">
                      <CardContent className="p-6 flex flex-col gap-3">
                        {lp && <span className="text-xs font-bold text-primary uppercase">{lp.shortTitle}</span>}
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span className="font-semibold">{ev.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{evLoc.location} — {evLoc.city}</span>
                        </div>
                        {ev.spotsLeft && <span className="text-xs text-orange-600 font-medium">{ev.spotsLeft} {t.structure.spotsLeft}</span>}
                        <Button size="sm" onClick={() => scrollTo("enroll")} className="mt-2 bg-primary hover:bg-primary/90 text-white rounded-full">{t.structure.registerNow}</Button>
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
            <div className="mt-10 max-w-2xl mx-auto grid sm:grid-cols-2 gap-4">
              <div onClick={() => scrollTo("enroll")} className="flex items-center gap-3 bg-background border rounded-xl p-4 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <User className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <p className="text-sm font-bold">{t.structure.privateLabel}</p>
                  <p className="text-xs text-muted-foreground">{t.structure.privateDesc}</p>
                </div>
                <ArrowDown className="w-4 h-4 text-muted-foreground ms-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div onClick={() => scrollTo("enroll")} className="flex items-center gap-3 bg-background border rounded-xl p-4 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold">{t.structure.recordedLabel}</p>
                  <p className="text-xs text-muted-foreground">{t.structure.recordedDesc}</p>
                </div>
                <ArrowDown className="w-4 h-4 text-muted-foreground ms-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </section>

        {/* ── WISDOM CAROUSEL ── */}
        <section id="wisdom" className="py-24 bg-secondary/20 border-y border-border overflow-hidden">
          <div className="container mx-auto px-6 mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-6 text-sm">
                <BookOpen className="w-4 h-4" />{t.wisdom.badge}
              </div>
              <h2 className="font-serif text-4xl font-bold mb-6">{t.wisdom.heading}</h2>
              <p className="text-xl text-muted-foreground">{t.wisdom.sub}</p>
            </motion.div>
          </div>
          <div className="container mx-auto px-6">
            <div className="relative max-w-3xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={wisdomIndex}
                  initial={{ opacity: 0, x: dir === "rtl" ? -40 : 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir === "rtl" ? 40 : -40 }}
                  transition={{ duration: 0.35 }}
                  className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">{articles[wisdomIndex].icon}</div>
                      <div>
                        <div className="text-xs font-bold text-primary">{articles[wisdomIndex].category}</div>
                        <div className="text-xs text-muted-foreground">{articles[wisdomIndex].source}</div>
                      </div>
                    </div>
                    <Quote className="w-7 h-7 text-primary/30 mb-3" />
                    <blockquote className="font-serif text-lg font-semibold leading-relaxed text-foreground mb-4">{articles[wisdomIndex].quote}</blockquote>
                    <div className="border-t border-border/50 pt-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">{articles[wisdomIndex].body}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="flex items-center justify-center gap-3 mt-8">
                <button onClick={() => setWisdomIndex((prev) => (prev - 1 + articles.length) % articles.length)} className="w-10 h-10 rounded-full border border-border bg-card hover:bg-secondary flex items-center justify-center transition-colors">
                  {dir === "rtl" ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
                <div className="flex gap-2">
                  {articles.map((_, i) => (
                    <button key={i} onClick={() => setWisdomIndex(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === wisdomIndex ? "bg-primary w-6" : "bg-border hover:bg-muted-foreground"}`} />
                  ))}
                </div>
                <button onClick={() => setWisdomIndex((prev) => (prev + 1) % articles.length)} className="w-10 h-10 rounded-full border border-border bg-card hover:bg-secondary flex items-center justify-center transition-colors">
                  {dir === "rtl" ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── WORKBOOKS STORE ── */}
        <section id="workbooks" className="py-24 bg-background">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-serif text-4xl font-bold mb-6">{t.workbooks.heading}</h2>
              <p className="text-xl text-muted-foreground">{t.workbooks.sub}</p>
              {currency.code !== "JOD" && (
                <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full">
                  <Globe className="w-4 h-4" />{t.workbooks.pricesIn} {currency.name}
                </div>
              )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {localizedPrograms.map((program, i) => (
                <motion.div key={`wb-${program.id}`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <div className="group cursor-pointer" onClick={() => { setSelectedWorkbook(program); setWbQuantity(1); setWbFormat("pdf"); setWbDeliveryAddress(""); setWbBuyerName(""); setWbBuyerPhone(""); setWbBuyerEmail(""); setWbExpandedPage(null); }}>
                    <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border/50 group-hover:shadow-xl transition-shadow duration-300 mb-4">
                      <div className="relative" style={{ paddingBottom: "140%" }}>
                        <img src={program.image} alt={program.workbook.title} className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${program.id === "teachers" ? "object-[25%_center]" : ""}`} />
                        <div className={`absolute inset-0 bg-gradient-to-br ${program.accentColor} opacity-70 mix-blend-multiply`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                        <div className="absolute inset-y-0 start-0 w-6 bg-black/20 flex flex-col justify-center items-center gap-1">
                          {[...Array(8)].map((_, j) => (<div key={j} className="w-1 h-1 rounded-full bg-white/30" />))}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-5 ps-8">
                          <div className="text-white/70 text-xs mb-2 font-medium">{program.audience}</div>
                          <h3 className="font-serif text-base font-bold text-white leading-tight mb-3">{program.workbook.title}</h3>
                          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-bold">
                            {formatPrice(WORKBOOK_PRICES[program.id as keyof typeof WORKBOOK_PRICES])}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full rounded-full text-primary border-primary/30 hover:bg-primary hover:text-white transition-colors">{(program.id === "tot" || program.id === "teachers") ? t.workbooks.orderBtnKit : t.workbooks.orderBtn}</Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section id="testimonials" className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
          <div className="container mx-auto px-6 relative z-10">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-12">{t.testimonials.heading}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {localizedTestimonials.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-primary-foreground/10 p-5 rounded-2xl border border-primary-foreground/20">
                  <Quote className="w-6 h-6 text-accent mb-3" />
                  <p className="font-serif text-sm leading-relaxed mb-5">"{item.quote}"</p>
                  <div className="flex items-center gap-2 pt-3 border-t border-primary-foreground/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent/60 shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-primary-foreground/50 text-xs">{item.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

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
        <section id="enroll" className="py-24 bg-secondary/20 border-t border-border">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto bg-card rounded-[2.5rem] shadow-xl overflow-hidden border border-border/50 grid lg:grid-cols-5">
              <div className="lg:col-span-3 p-8 md:p-12">
                <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2">{t.enroll.heading}</h2>
                <p className="text-muted-foreground mb-6">{t.enroll.sub}</p>

                {/* Applicant type toggle */}
                <div className="mb-6">
                  <Label className="mb-3 block font-bold">{t.enroll.applicantTypeLabel}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setApplicantType("individual")} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${applicantType === "individual" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                      <User className="w-5 h-5 shrink-0" />
                      <span className="font-bold text-sm">{t.enroll.applicantIndividual}</span>
                    </button>
                    <button type="button" onClick={() => setApplicantType("institution")} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${applicantType === "institution" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                      <Building2 className="w-5 h-5 shrink-0" />
                      <span className="font-bold text-sm">{t.enroll.applicantInstitution}</span>
                    </button>
                  </div>
                </div>

                {applicantType === "individual" ? (
                  <>
                    {/* Training mode toggle */}
                    <div className="mb-6">
                      <Label className="mb-3 block font-bold">{t.enroll.modeLabel}</Label>
                      <div className="grid grid-cols-4 gap-2">
                        <button type="button" onClick={() => { setTrainingMode("recorded"); setFormData(p => ({ ...p, mode: "recorded" })); }} className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border-2 transition-all text-center ${trainingMode === "recorded" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                          <span className="text-base">🎬</span>
                          <span className="font-bold text-[11px] leading-tight">{t.enroll.modeRecorded}</span>
                          <span className="text-[9px] opacity-70 leading-tight">{t.enroll.modeRecordedSub}</span>
                        </button>
                        <button type="button" onClick={() => { setTrainingMode("group-online"); setFormData(p => ({ ...p, mode: "group-online" })); }} className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border-2 transition-all text-center ${trainingMode === "group-online" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                          <span className="text-base">📡</span>
                          <span className="font-bold text-[11px] leading-tight">{t.enroll.modeGroupOnline}</span>
                          <span className="text-[9px] opacity-70 leading-tight">{t.enroll.modeGroupOnlineSub}</span>
                        </button>
                        <button type="button" onClick={() => { setTrainingMode("group-inperson"); setFormData(p => ({ ...p, mode: "group-inperson" })); }} className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border-2 transition-all text-center ${trainingMode === "group-inperson" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                          <span className="text-base">📍</span>
                          <span className="font-bold text-[11px] leading-tight">{t.enroll.modeGroupInPerson}</span>
                          <span className="text-[9px] opacity-70 leading-tight">{t.enroll.modeGroupInPersonSub}</span>
                        </button>
                        <button type="button" onClick={() => { setTrainingMode("private"); setFormData(p => ({ ...p, mode: "private" })); }} className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border-2 transition-all text-center ${trainingMode === "private" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                          <span className="text-base">👤</span>
                          <span className="font-bold text-[11px] leading-tight">{t.enroll.modePrivate}</span>
                          <span className="text-[9px] opacity-70 leading-tight">{t.enroll.modePrivateSub}</span>
                        </button>
                      </div>
                      {/* Dynamic price badge */}
                      {(() => {
                        const progId = localizedPrograms.find(p => p.shortTitle === formData.program)?.id ?? "";
                        const price = getEnrollPrice(progId, trainingMode);
                        if (!progId) return null;
                        if (trainingMode === "group-inperson") {
                          return (
                            <div className="mt-3 flex items-center gap-2 justify-center">
                              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold">
                                📅 {lang === "ar" ? "السعر يُحدد بحسب جدول الفعاليات" : lang === "fr" ? "Tarif selon le calendrier des événements" : "Price set per event schedule"}
                              </span>
                            </div>
                          );
                        }
                        if (trainingMode === "private") {
                          return (
                            <div className="mt-3 flex items-center gap-2 justify-center">
                              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-sm font-bold">
                                👤 {formatPrice(Number(price))} JOD — {lang === "ar" ? "١:١ حصري" : lang === "fr" ? "1:1 exclusif" : "Exclusive 1:1"}
                              </span>
                            </div>
                          );
                        }
                        if (price) {
                          const colors = trainingMode === "recorded"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-blue-50 border-blue-200 text-blue-700";
                          const icon = trainingMode === "recorded" ? "🎬" : "📡";
                          return (
                            <div className="mt-3 flex items-center gap-2 justify-center">
                              <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-sm font-bold ${colors}`}>
                                {icon} {formatPrice(Number(price))} JOD
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <form onSubmit={handleEnrollSubmit} className="space-y-5">
                      <div className="grid md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="name">{t.enroll.nameLabel}</Label>
                          <Input id="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-11 rounded-xl bg-background" placeholder={t.enroll.namePlaceholder} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">{t.enroll.phoneLabel}</Label>
                          <Input id="phone" required dir="ltr" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-11 rounded-xl bg-background" placeholder="+962 7X XXX XXXX" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{t.enroll.emailLabel}</Label>
                        <Input id="email" type="email" required dir="ltr" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-11 rounded-xl bg-background" placeholder="email@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.enroll.programLabel}</Label>
                        <Select value={formData.program} onValueChange={(val) => setFormData({ ...formData, program: val })}>
                          <SelectTrigger className="h-11 rounded-xl bg-background"><SelectValue placeholder={t.enroll.programPlaceholder} /></SelectTrigger>
                          <SelectContent>
                            {localizedPrograms.map((p) => (<SelectItem key={p.id} value={p.shortTitle}>{p.shortTitle}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="youtube" className="flex items-center gap-2"><Youtube className="w-4 h-4 text-red-500" />{t.enroll.youtubeLabel}</Label>
                        <Input id="youtube" dir="ltr" value={formData.youtube} onChange={(e) => setFormData({ ...formData, youtube: e.target.value })} className="h-11 rounded-xl bg-background" placeholder={t.enroll.youtubePlaceholder} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reason">{t.enroll.reasonLabel}</Label>
                        <Input id="reason" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} className="h-11 rounded-xl bg-background" placeholder={t.enroll.reasonPlaceholder} />
                      </div>
                      <Button type="submit" disabled={isSubmitting} className="w-full h-13 text-lg rounded-xl bg-primary hover:bg-primary/90 text-white font-bold">
                        {isSubmitting ? t.enroll.submitting : t.enroll.submitBtn}
                      </Button>
                    </form>
                  </>
                ) : (
                  <form onSubmit={handleEnrollSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label>{t.enroll.orgNameLabel}</Label>
                        <Input required value={orgFormData.orgName} onChange={(e) => setOrgFormData({ ...orgFormData, orgName: e.target.value })} className="h-11 rounded-xl bg-background" placeholder={t.enroll.orgNamePlaceholder} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.enroll.contactPersonLabel}</Label>
                        <Input required value={orgFormData.contactPerson} onChange={(e) => setOrgFormData({ ...orgFormData, contactPerson: e.target.value })} className="h-11 rounded-xl bg-background" placeholder={t.enroll.contactPersonPlaceholder} />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label>{t.enroll.phoneLabel}</Label>
                        <Input required dir="ltr" value={orgFormData.phone} onChange={(e) => setOrgFormData({ ...orgFormData, phone: e.target.value })} className="h-11 rounded-xl bg-background" placeholder="+962 7X XXX XXXX" />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.enroll.emailLabel}</Label>
                        <Input type="email" required dir="ltr" value={orgFormData.email} onChange={(e) => setOrgFormData({ ...orgFormData, email: e.target.value })} className="h-11 rounded-xl bg-background" placeholder="info@school.edu" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-5">
                      <div className="space-y-2">
                        <Label>{t.enroll.studentCountLabel}</Label>
                        <Input type="number" required value={orgFormData.studentCount} onChange={(e) => setOrgFormData({ ...orgFormData, studentCount: e.target.value })} className="h-11 rounded-xl bg-background" placeholder="50" />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.enroll.teacherCountLabel}</Label>
                        <Input type="number" required value={orgFormData.teacherCount} onChange={(e) => setOrgFormData({ ...orgFormData, teacherCount: e.target.value })} className="h-11 rounded-xl bg-background" placeholder="5" />
                      </div>
                      <div className="space-y-2">
                        <Label>{t.enroll.workbookCountLabel}</Label>
                        <Input type="number" value={orgFormData.workbookCount} onChange={(e) => setOrgFormData({ ...orgFormData, workbookCount: e.target.value })} className="h-11 rounded-xl bg-background" placeholder="50" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t.enroll.programLabel}</Label>
                      <Select value={orgFormData.program} onValueChange={(val) => setOrgFormData({ ...orgFormData, program: val })}>
                        <SelectTrigger className="h-11 rounded-xl bg-background"><SelectValue placeholder={t.enroll.programPlaceholder} /></SelectTrigger>
                        <SelectContent>
                          {localizedPrograms.map((p) => (<SelectItem key={p.id} value={p.shortTitle}>{p.shortTitle}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t.enroll.orgMessageLabel}</Label>
                      <Textarea value={orgFormData.message} onChange={(e) => setOrgFormData({ ...orgFormData, message: e.target.value })} className="min-h-[100px] rounded-xl bg-background resize-none" placeholder={t.enroll.orgMessagePlaceholder} />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full h-13 text-lg rounded-xl bg-primary hover:bg-primary/90 text-white font-bold">
                      {isSubmitting ? t.enroll.submitting : t.enroll.submitBtn}
                    </Button>
                  </form>
                )}
              </div>

              <div className="lg:col-span-2 bg-primary text-primary-foreground p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent rounded-full blur-[100px] opacity-20 -mr-20 -mt-20" />
                <div className="relative z-10">
                  <h3 className="font-serif text-3xl font-bold mb-6">{t.enroll.sidePanelTitle}</h3>
                  <p className="text-primary-foreground/80 text-lg leading-relaxed mb-8">{t.enroll.sidePanelText}</p>
                  <div className="space-y-6">
                    <a href="https://wa.me/97455377065" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group cursor-pointer">
                      <div className="w-12 h-12 rounded-full bg-[#25D366]/20 flex items-center justify-center shrink-0 group-hover:bg-[#25D366]/30 transition-colors">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      </div>
                      <p className="text-sm text-primary-foreground/70 group-hover:text-primary-foreground transition-colors">{lang === "ar" ? "تواصل عبر واتساب" : lang === "fr" ? "Contactez via WhatsApp" : "Chat on WhatsApp"}</p>
                    </a>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center shrink-0"><MessageCircle className="w-6 h-6" /></div>
                      <div>
                        <p className="text-sm text-primary-foreground/60">{t.enroll.quickQ}</p>
                        <p className="font-bold text-lg" dir="ltr">suhaib@ilgholding.com</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-primary-foreground/80"><Wifi className="w-4 h-4 shrink-0" /><span>{t.enroll.featureGroupOnline}</span></div>
                      <div className="flex items-center gap-3 text-sm text-primary-foreground/80"><MapPin className="w-4 h-4 shrink-0" /><span>{t.enroll.featureGroupInPerson}</span></div>
                      <div className="flex items-center gap-3 text-sm text-primary-foreground/80"><UserCheck className="w-4 h-4 shrink-0" /><span>{t.enroll.featurePrivate}</span></div>
                      <div className="flex items-center gap-3 text-sm text-primary-foreground/80"><Globe className="w-4 h-4 shrink-0" /><span>{t.enroll.featureLang}</span></div>
                    </div>
                  </div>
                </div>
                <div className="relative z-10 mt-12 bg-primary-foreground/10 p-6 rounded-2xl border border-primary-foreground/20">
                  <p className="font-serif font-medium leading-relaxed italic text-lg text-center">"{t.enroll.sideQuote}"</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-foreground text-background py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-12 mb-12 border-b border-background/10 pb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="logo-biklima text-5xl text-accent mb-6 leading-none">بكلمة</div>
              <p className="text-background/60 leading-relaxed max-w-sm">{t.footer.about}</p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">{t.footer.programsHeading}</h4>
              <ul className="space-y-4 text-background/70">
                {localizedPrograms.map((p) => (
                  <li key={p.id}><button onClick={() => setSelectedProgram(p)} className="hover:text-accent transition text-start">{p.shortTitle}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">{t.footer.linksHeading}</h4>
              <ul className="space-y-4 text-background/70">
                {[
                  { label: t.footer.linkLabels.structure, id: "structure" },
                  { label: t.footer.linkLabels.wisdom, id: "wisdom" },
                  { label: t.footer.linkLabels.workbooks, id: "workbooks" },
                  { label: t.footer.linkLabels.testimonials, id: "testimonials" },
                ].map((item) => (
                  <li key={item.id}><button onClick={() => scrollTo(item.id)} className="hover:text-accent transition text-start">{item.label}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">{t.footer.contactHeading}</h4>
              <ul className="space-y-4 text-background/70">
                <li>
                  <a href="https://wa.me/97455377065" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-accent transition">
                    <MessageCircle className="w-5 h-5" />
                    {t.footer.whatsappLabel}
                  </a>
                </li>
                <li>
                  <a href="mailto:suhaib@ilgholding.com" className="flex items-center gap-2 hover:text-accent transition" dir="ltr">
                    <Mail className="w-4 h-4" />
                    suhaib@ilgholding.com
                  </a>
                </li>
                <li>
                  <a href="https://www.linkedin.com/in/suhaiblafi/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-accent transition">
                    <Linkedin className="w-5 h-5" />
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a href="https://www.instagram.com/suhaiblafi/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-accent transition">
                    <Instagram className="w-5 h-5" />
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center text-background/50 text-sm gap-4">
            <p>{t.footer.copyright}</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition">{t.footer.terms}</a>
              <a href="#" className="hover:text-white transition">{t.footer.privacy}</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── PROGRAM DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedProgram && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedProgram(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-card w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl relative z-10 border border-border">
              <button aria-label="Close" onClick={() => setSelectedProgram(null)} className="absolute top-6 end-6 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-foreground hover:bg-white transition-colors z-20 shadow-sm"><X className="w-5 h-5" /></button>
              <div className="relative aspect-[21/8] overflow-hidden rounded-t-[2rem]">
                <img src={selectedProgram.image} alt={selectedProgram.shortTitle} className="w-full h-full object-cover" />
                <div className={`absolute inset-0 bg-gradient-to-br ${selectedProgram.accentColor} opacity-75 mix-blend-multiply`} />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full mb-3">{selectedProgram.role}</div>
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-2">{selectedProgram.shortTitle}</h2>
                  <div className="flex flex-wrap gap-4 text-white/80 text-sm">
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{selectedProgram.hours} {t.modal.hoursUnit}</span>
                    <span>·</span>
                    <span>{selectedProgram.sessions} {t.structure.sessionsUnit}</span>
                    <span>·</span>
                    <span className="font-bold text-white text-base">{formatPrice(RECORDED_PRICES[selectedProgram.id as keyof typeof RECORDED_PRICES])} <span className="font-normal text-white/60 text-xs">({t.structure.recordedLabel})</span></span>
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
                    <Button size="lg" className="w-full rounded-full h-14 text-lg font-bold shadow-lg bg-primary text-white hover:bg-primary/90" onClick={() => { setFormData((prev) => ({ ...prev, program: selectedProgram.shortTitle, mode: "recorded" })); setSelectedProgram(null); setTimeout(() => scrollTo("enroll"), 300); }}>
                      <ShoppingCart className="w-5 h-5 me-2" />
                      {t.modal.buyRecordedBtn} — {formatPrice(RECORDED_PRICES[selectedProgram.id as keyof typeof RECORDED_PRICES])}
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

        {selectedWorkbook && (() => {
          const wb = selectedWorkbook;
          const unitPrice = WORKBOOK_PRICES[wb.id as keyof typeof WORKBOOK_PRICES];
          const totalPrice = unitPrice * wbQuantity;
          const previewModules = wb.modules.slice(0, 6);
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedWorkbook(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-card w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl relative z-10 border border-border">
                <button aria-label="Close" onClick={() => setSelectedWorkbook(null)} className="absolute top-6 end-6 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-foreground hover:bg-white transition-colors z-20 shadow-sm"><X className="w-5 h-5" /></button>

                <div className="relative aspect-[21/6] overflow-hidden rounded-t-[2rem]">
                  <img src={wb.image} alt={wb.workbook.title} className="w-full h-full object-cover" />
                  <div className={`absolute inset-0 bg-gradient-to-br ${wb.accentColor} opacity-75 mix-blend-multiply`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full mb-3"><FileText className="w-3.5 h-3.5" />{wb.role}</div>
                    <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-2">{wb.workbook.title}</h2>
                    <p className="text-white/80 text-sm max-w-xl">{wb.workbook.description}</p>
                  </div>
                </div>

                <div className="p-8 md:p-12">
                  <div className="bg-gradient-to-br from-primary/5 to-secondary/20 rounded-2xl border border-border p-6 md:p-8 mb-8 flex flex-col sm:flex-row items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${wb.accentColor} text-white flex items-center justify-center shadow-lg shrink-0`}><Download className="w-7 h-7" /></div>
                    <div className="flex-1 text-center sm:text-start">
                      <h3 className="font-bold text-lg mb-1">{t.workbooks.samplePdfBtn}</h3>
                      <p className="text-sm text-muted-foreground">{t.workbooks.samplePdfNote}</p>
                    </div>
                    <Button
                      className={`rounded-full px-8 text-white shadow-md ${wb.samplePdf ? `bg-gradient-to-r ${wb.accentColor} hover:opacity-90` : "bg-muted-foreground/40 cursor-not-allowed"}`}
                      disabled={!wb.samplePdf}
                      onClick={() => { if (wb.samplePdf) window.open(wb.samplePdf, "_blank"); }}
                    >
                      <Download className="w-4 h-4 me-2" />{wb.samplePdf ? t.workbooks.samplePdfBtn : (lang === "ar" ? "قريباً" : lang === "fr" ? "Bientôt" : "Coming Soon")}
                    </Button>
                  </div>

                  <div className="bg-secondary/20 rounded-2xl border border-border p-6 md:p-8">
                    <h3 className="font-bold text-xl mb-6 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-primary" />{t.workbooks.orderTitle}</h3>
                    <form onSubmit={handleWorkbookOrder} className="space-y-6">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">{t.workbooks.nameLabel}</label>
                          <Input value={wbBuyerName} onChange={(e) => setWbBuyerName(e.target.value)} placeholder={t.workbooks.namePlaceholder} required className="rounded-xl" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">{t.workbooks.phoneLabel}</label>
                          <Input type="tel" value={wbBuyerPhone} onChange={(e) => setWbBuyerPhone(e.target.value)} placeholder="+962..." required className="rounded-xl" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">{t.workbooks.emailLabel}</label>
                          <Input type="email" value={wbBuyerEmail} onChange={(e) => setWbBuyerEmail(e.target.value)} placeholder="email@example.com" required className="rounded-xl" />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-3">{t.workbooks.formatLabel}</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => setWbFormat("pdf")} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${wbFormat === "pdf" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}>
                              <FileText className="w-6 h-6" />
                              <span className="text-sm font-medium">{t.workbooks.formatPdf}</span>
                            </button>
                            <button type="button" onClick={() => setWbFormat("print")} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${wbFormat === "print" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}>
                              <Printer className="w-6 h-6" />
                              <span className="text-sm font-medium">{t.workbooks.formatPrint}</span>
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-3">{t.workbooks.quantityLabel}</label>
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setWbQuantity(Math.max(1, wbQuantity - 1))} className="w-10 h-10 rounded-full border border-border bg-background hover:bg-secondary flex items-center justify-center transition-colors"><Minus className="w-4 h-4" /></button>
                            <span className="text-2xl font-bold w-12 text-center">{wbQuantity}</span>
                            <button type="button" onClick={() => setWbQuantity(wbQuantity + 1)} className="w-10 h-10 rounded-full border border-border bg-background hover:bg-secondary flex items-center justify-center transition-colors"><Plus className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>

                      {wbFormat === "print" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                          <label className="block text-sm font-medium mb-2 flex items-center gap-2"><Package className="w-4 h-4" />{t.workbooks.deliveryLabel}</label>
                          <Textarea value={wbDeliveryAddress} onChange={(e) => setWbDeliveryAddress(e.target.value)} placeholder={t.workbooks.deliveryPlaceholder} required className="rounded-xl" rows={2} />
                          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{t.workbooks.deliveryNote}</p>
                        </motion.div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                        <div className="text-center sm:text-start">
                          <div className="text-sm text-muted-foreground">{t.workbooks.totalLabel}</div>
                          <div className="text-3xl font-bold text-primary">{formatPrice(totalPrice)}</div>
                          {wbFormat === "print" && <p className="text-xs text-muted-foreground mt-1">+ {t.workbooks.deliveryNote.split("—")[0]}</p>}
                        </div>
                        <Button type="submit" size="lg" disabled={wbSubmitting} className="rounded-full h-14 px-10 text-lg font-bold shadow-lg bg-primary text-white hover:bg-primary/90">
                          {wbSubmitting ? t.workbooks.submittingOrder : t.workbooks.submitOrder}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
