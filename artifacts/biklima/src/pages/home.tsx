import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
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

import { T, type Lang } from "../translations";
import { programs, testimonials as testimonialsData, getLocalizedProgram, BASE_PRICES } from "../programsData";

// ── Language ─────────────────────────────────────────────────────────────────
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


// ── Wisdom articles (marquee) ─────────────────────────────────────────────────
type WisdomArticle = {
  source: string;
  category: string;
  icon: React.ReactNode;
  quote: string;
  body: string;
};

const wisdomArticles: Record<Lang, WisdomArticle[]> = {
  ar: [
    {
      source: "كراسة المتدرب",
      category: "النطاق الذهني",
      icon: <Lightbulb className="w-5 h-5" />,
      quote: "الثقة لا تُعطى، تُبنى.",
      body: "وبناؤها يبدأ من أعمق نقطة في الداخل — من صورتك عن نفسك لحظة الكلام. كثيرون يبحثون عن تقنيات الإلقاء وينسون أن المشكلة الحقيقية ليست في اللسان بل في العقل. قبل أن تُصلح ما يسمعه الجمهور، أصلح ما تسمعه أنت من نفسك. الكلمة التي تخرج من متحدث واثق من نفسه تحمل ثقلاً مختلفاً — وهذا الثقل لا يكتسب بيوم وليلة، بل بممارسة واعية ومتعمّدة.",
    },
    {
      source: "كراسة المتدرب",
      category: "النطاق اللفظي",
      icon: <Mic2 className="w-5 h-5" />,
      quote: "رَبِّ اشْرَحْ لِي صَدْرِي، وَيَسِّرْ لِي أَمْرِي، وَاحْلُلْ عُقْدَةً مِن لِّسَانِي يَفْقَهُوا قَوْلِي.",
      body: "حتى أعظم الأنبياء طلب تيسير الإلقاء. الخطابة دعوة قبل أن تكون مهارة، وهبة تستحق أن تُطلب من السماء. اللسان الفصيح ليس مجرد أداة بلاغية — إنه جسر بين القلب والعالم. وحين يُفقه القول، يتحرك المستمع لا في أذنيه فقط بل في وجدانه كله.",
    },
    {
      source: "برنامج المعلمين وأولياء الأمور",
      category: "الفجوة بين الأجيال",
      icon: <Heart className="w-5 h-5" />,
      quote: "٧٠٪ من الناس يعانون من رهاب التحدث.",
      body: "والسبب الأول ليس الجمهور، بل البيئة التي نشأوا فيها. كل طفل خجول كان يوماً طفلاً لم يُتَح له أن يُسمع بشكل صحيح. الخوف من الكلام لا يُولد مع الإنسان — بل يُزرع، أحياناً دون قصد، في غرف الدراسة والمنازل. الخبر الجيد: ما زُرع يمكن أن يُقتلع، وما تعلّم يمكن أن يُعاد تعلّمه.",
    },
    {
      source: "برنامج المعلمين وأولياء الأمور",
      category: "دور المربّي",
      icon: <Users className="w-5 h-5" />,
      quote: "الكلمة التي تقولها لطفل في لحظة الحاجة قد تُشكّل صوته طوال حياته — أو تُصمته.",
      body: "لا يحتاج الطفل مدرباً فصيحاً فقط، بل بيئة تؤمن بأن صوته يستحق أن يُسمع. المربّي الواعي لا يصحح فقط، بل يفتح — يفتح مساحة للتعبير دون خوف، ويُعلّم الطفل أن الخطأ في الكلام لحظة تعلّم لا لحظة عار. هذه الفلسفة البسيطة تبني متحدثين لا يتذكرون الخوف بل يتذكرون الأثر.",
    },
    {
      source: "كراسة الخطيب الصغير",
      category: "فلسفة التعليم",
      icon: <Star className="w-5 h-5" />,
      quote: "الطفل الذي يتعلم الكلام بثقة اليوم هو القائد الذي يُغيّر غرفته غداً.",
      body: "الخطابة للأطفال ليست نشاطاً إضافياً، هي استثمار في شخصية كاملة. الطفل الذي يتعلم أن يُعبّر عن فكرة بوضوح يكتسب أكثر من مهارة — يكتسب شجاعة اجتماعية وثقة داخلية وقدرة على الإقناع. هذه الأدوات تصحبه في المدرسة والعمل والعلاقات، في كل غرفة يدخلها ومحادثة يخوضها.",
    },
    {
      source: "برنامج المدرب المعتمد",
      category: "رسالة المدرب",
      icon: <Feather className="w-5 h-5" />,
      quote: "المدرب الحقيقي لا يُعلّم الناس كيف يتكلمون — بل يُعيد إليهم الإيمان بأن ما يقولونه يستحق أن يُسمع.",
      body: "حين تصبح مدرباً، تتضاعف مسؤوليتك: أنت تصنع أثراً ثم توكّله لآخرين ليصنعوا أثراً من بعدك. المدرب المعتمد في بكلمة لا يحمل منهجاً فحسب، بل يحمل رسالة — رسالة تقول إن كل إنسان، بغض النظر عن تاريخه، يستطيع أن يتحدث بثقة ويترك أثراً حقيقياً.",
    },
    {
      source: "كراسة المتدرب",
      category: "الخوف وقوة الكلام",
      icon: <Sparkles className="w-5 h-5" />,
      quote: "الخوف من الكلام ليس عدوك — إنه إشارة إلى أن ما تقوله مهم.",
      body: "التوتر قبل الخطاب ليس ضعفاً — بل إشعال. الجسم يُعبّئ طاقة لأن اللحظة مهمة وأنت تعرف ذلك. المتحدثون المحترفون لا يتخلصون من الخوف بل يُحوّلونه. يأخذون ذلك الاضطراب الداخلي ويُفضون به إلى حضور ومصداقية وطاقة تُعدي الجمهور. التدريب لا يقضي على التوتر بل يُعلّمك كيف تركبه.",
    },
    {
      source: "برنامج المدرب المعتمد",
      category: "الصوت والهوية",
      icon: <Globe className="w-5 h-5" />,
      quote: "صوتك هو أكثر من أداة — إنه توقيعك في كل غرفة تدخلها.",
      body: "لا يوجد صوتان متطابقان في العالم. صوتك يحمل تاريخك، وثقافتك، ورؤيتك للعالم. لذلك التدريب على الخطابة ليس عن تقليد الآخرين — بل عن اكتشاف نسختك الأقوى من نفسك وتطويرها. هويتك كمتحدث تتشكّل حين تُتقن مهاراتك دون أن تفقد أثرك الشخصي الذي لا يقدر أحد على تقليده.",
    },
  ],
  en: [
    {
      source: "The Trainee's Workbook",
      category: "The Mental Domain",
      icon: <Lightbulb className="w-5 h-5" />,
      quote: "Confidence is not given — it is built.",
      body: "And it begins from the deepest point inside — from the image you hold of yourself in the moment of speaking. Many search for delivery techniques and forget that the real problem is not in the tongue but in the mind. Before you fix what the audience hears, fix what you hear from yourself. A word spoken by someone who is genuinely confident carries a different weight — and that weight is not gained overnight, but through deliberate and conscious practice.",
    },
    {
      source: "The Trainee's Workbook",
      category: "The Verbal Domain",
      icon: <Mic2 className="w-5 h-5" />,
      quote: "Even the greatest of prophets sought ease of articulation.",
      body: "Public speaking is a calling before it is a skill — a gift worth asking for from above. An eloquent tongue is not merely a rhetorical tool — it is a bridge between the heart and the world. When a message is truly understood, the listener moves not just in their ears but in their entire being.",
    },
    {
      source: "Educators & Parents Program",
      category: "The Generational Gap",
      icon: <Heart className="w-5 h-5" />,
      quote: "70% of people suffer from the fear of public speaking.",
      body: "And the primary cause is not the audience — it is the environment they grew up in. Every shy child was once a child who was never properly heard. Fear of speech is not born with a person — it is planted, sometimes unintentionally, in classrooms and homes. The good news: what is planted can be uprooted, and what was learned can be unlearned.",
    },
    {
      source: "Educators & Parents Program",
      category: "The Educator's Role",
      icon: <Users className="w-5 h-5" />,
      quote: "The word you say to a child in their moment of need may shape their voice for life — or silence it.",
      body: "A child doesn't need just an eloquent trainer — they need an environment that believes their voice deserves to be heard. The aware educator doesn't only correct — they open. They open a space for expression without fear and teach the child that a speaking mistake is a learning moment, not a moment of shame. This simple philosophy builds speakers who remember not the fear, but the impact.",
    },
    {
      source: "The Young Speaker's Workbook",
      category: "Philosophy of Education",
      icon: <Star className="w-5 h-5" />,
      quote: "The child who learns to speak with confidence today is the leader who changes the room tomorrow.",
      body: "Public speaking for children is not an extra-curricular activity — it is an investment in a complete personality. A child who learns to express an idea clearly gains more than a skill — they gain social courage, inner confidence, and the ability to persuade. These tools accompany them throughout school, work, and relationships — in every room they enter and every conversation they have.",
    },
    {
      source: "The Certified Trainer Program",
      category: "The Trainer's Mission",
      icon: <Feather className="w-5 h-5" />,
      quote: "The real trainer doesn't teach people how to speak — they restore their belief that what they say deserves to be heard.",
      body: "When you become a trainer, your responsibility multiplies: you create impact and then entrust it to others to create impact after you. A certified Biklima trainer doesn't just carry a curriculum — they carry a message. A message that says every person, regardless of their history, can speak with confidence and leave a genuine mark.",
    },
    {
      source: "The Trainee's Workbook",
      category: "Fear and the Power of Words",
      icon: <Sparkles className="w-5 h-5" />,
      quote: "Fear of speaking is not your enemy — it is a signal that what you have to say matters.",
      body: "Nervousness before a speech is not weakness — it is ignition. The body mobilizes energy because the moment is important and you know it. Professional speakers don't eliminate fear — they transform it. They take that internal turbulence and channel it into presence, credibility, and energy that is contagious to the audience. Training doesn't eliminate tension — it teaches you how to ride it.",
    },
    {
      source: "The Certified Trainer Program",
      category: "Voice and Identity",
      icon: <Globe className="w-5 h-5" />,
      quote: "Your voice is more than a tool — it is your signature in every room you enter.",
      body: "No two voices in the world are identical. Your voice carries your history, your culture, and your worldview. That is why public speaking training is not about imitating others — it's about discovering and developing your strongest version of yourself. Your identity as a speaker is shaped when you master your skills without losing the personal mark that no one else can replicate.",
    },
    {
      source: "Educators & Parents Program",
      category: "Growing with Words",
      icon: <GraduationCap className="w-5 h-5" />,
      quote: "A generation raised to speak will reshape the world's conversations.",
      body: "Language is not just communication — it is the infrastructure of thought itself. When we teach people to speak well, we teach them to think clearly, to structure their ideas, and to express their truth with dignity. The investment in a single skilled communicator ripples outward: to their family, their colleagues, their students, and every person they ever influence.",
    },
  ],
  fr: [
    {
      source: "Le Cahier du Stagiaire",
      category: "Le Domaine Mental",
      icon: <Lightbulb className="w-5 h-5" />,
      quote: "La confiance ne se donne pas — elle se construit.",
      body: "Et elle commence au plus profond de soi — à partir de l'image que vous avez de vous-même au moment de prendre la parole. Beaucoup cherchent des techniques d'expression et oublient que le vrai problème n'est pas dans la langue mais dans l'esprit. Avant de corriger ce que l'audience entend, corrigez ce que vous vous entendez dire. Une parole prononcée par quelqu'un qui a une vraie confiance en soi porte un poids différent — et ce poids ne s'acquiert pas du jour au lendemain, mais par une pratique délibérée et consciente.",
    },
    {
      source: "Le Cahier du Stagiaire",
      category: "Le Domaine Verbal",
      icon: <Mic2 className="w-5 h-5" />,
      quote: "Même les plus grands prophètes ont demandé la facilité d'élocution.",
      body: "L'art oratoire est une vocation avant d'être une compétence — un don qui mérite d'être demandé. Une langue éloquente n'est pas seulement un outil rhétorique — c'est un pont entre le cœur et le monde. Quand un message est vraiment compris, l'auditeur est touché non seulement dans ses oreilles mais dans tout son être.",
    },
    {
      source: "Programme Éducateurs et Parents",
      category: "Le Fossé Générationnel",
      icon: <Heart className="w-5 h-5" />,
      quote: "70 % des personnes souffrent de la peur de parler en public.",
      body: "Et la cause principale n'est pas le public — c'est l'environnement dans lequel elles ont grandi. Chaque enfant timide était autrefois un enfant qui n'a jamais été correctement entendu. La peur de parler ne naît pas avec une personne — elle est plantée, parfois involontairement, dans les salles de classe et les maisons. La bonne nouvelle : ce qui est planté peut être déraciné, et ce qui a été appris peut être désappris.",
    },
    {
      source: "Programme Éducateurs et Parents",
      category: "Le Rôle de l'Éducateur",
      icon: <Users className="w-5 h-5" />,
      quote: "Le mot que vous dites à un enfant dans son moment de besoin peut façonner sa voix pour la vie — ou la faire taire.",
      body: "Un enfant n'a pas besoin d'un formateur éloquent seulement — il a besoin d'un environnement qui croit que sa voix mérite d'être entendue. L'éducateur conscient ne corrige pas seulement — il ouvre. Il ouvre un espace d'expression sans peur et enseigne à l'enfant qu'une erreur de parole est un moment d'apprentissage, non un moment de honte.",
    },
    {
      source: "Le Cahier du Jeune Orateur",
      category: "Philosophie de l'Enseignement",
      icon: <Star className="w-5 h-5" />,
      quote: "L'enfant qui apprend à parler avec confiance aujourd'hui est le leader qui change la salle demain.",
      body: "L'art oratoire pour les enfants n'est pas une activité parascolaire — c'est un investissement dans une personnalité complète. Un enfant qui apprend à exprimer une idée clairement acquiert plus qu'une compétence — il acquiert du courage social, de la confiance intérieure et la capacité de persuader. Ces outils l'accompagnent tout au long de ses études, de son travail et de ses relations.",
    },
    {
      source: "Programme du Formateur Certifié",
      category: "La Mission du Formateur",
      icon: <Feather className="w-5 h-5" />,
      quote: "Le vrai formateur n'enseigne pas aux gens comment parler — il leur restitue la croyance que ce qu'ils disent mérite d'être entendu.",
      body: "Quand vous devenez formateur, votre responsabilité se multiplie : vous créez un impact et vous le confiez ensuite à d'autres pour qu'ils créent un impact après vous. Un formateur certifié Biklima ne porte pas seulement un programme — il porte un message. Un message qui dit que toute personne, quelle que soit son histoire, peut parler avec confiance et laisser une empreinte authentique.",
    },
    {
      source: "Le Cahier du Stagiaire",
      category: "La Peur et le Pouvoir des Mots",
      icon: <Sparkles className="w-5 h-5" />,
      quote: "La peur de parler n'est pas votre ennemi — c'est un signal que ce que vous avez à dire est important.",
      body: "La nervosité avant un discours n'est pas une faiblesse — c'est une ignition. Le corps mobilise de l'énergie parce que le moment est important et vous le savez. Les orateurs professionnels n'éliminent pas la peur — ils la transforment. Ils prennent cette turbulence intérieure et la canalisent en présence, crédibilité et énergie qui est contagieuse pour le public.",
    },
    {
      source: "Programme du Formateur Certifié",
      category: "La Voix et l'Identité",
      icon: <Globe className="w-5 h-5" />,
      quote: "Votre voix est plus qu'un outil — c'est votre signature dans chaque pièce où vous entrez.",
      body: "Il n'existe pas deux voix identiques dans le monde. Votre voix porte votre histoire, votre culture et votre vision du monde. C'est pourquoi la formation en art oratoire ne consiste pas à imiter les autres — il s'agit de découvrir et développer votre version la plus forte de vous-même. Votre identité en tant qu'orateur se façonne lorsque vous maîtrisez vos compétences sans perdre la marque personnelle que personne d'autre ne peut reproduire.",
    },
  ],
};

// ── Currency detection ──────────────────────────────────────────────────────
type CurrencyConfig = {
  code: string;
  symbol: string;
  name: string;
  rate: number;
};

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
      "Asia/Amman": "JO",
      "Asia/Riyadh": "SA",
      "Asia/Dubai": "AE",
      "Asia/Kuwait": "KW",
      "Asia/Qatar": "QA",
      "Asia/Bahrain": "BH",
      "Asia/Muscat": "OM",
      "Africa/Cairo": "EG",
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


// ── Home component ────────────────────────────────────────────────────────────
export default function Home() {
  const { toast } = useToast();
  const { format: formatPrice, currency } = useCurrency();
  const { lang, switchLang, dir } = useLang();
  const t = T[lang];
  const articles = wisdomArticles[lang];
  const faqItems = t.faq.items;
  const localizedPrograms = programs.map((p) => getLocalizedProgram(p, lang));
  const localizedTestimonials = testimonialsData[lang];

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ReturnType<typeof getLocalizedProgram> | null>(null);
  const [trainingMode, setTrainingMode] = useState<"group" | "private">("group");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    program: "",
    mode: "group",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Apply dir + lang to document root
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [dir, lang]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 80,
        behavior: "smooth",
      });
    }
  };

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setFormData({ name: "", email: "", phone: "", category: "", program: "", mode: "group", reason: "" });
      toast({
        title: t.enroll.successTitle,
        description: t.enroll.successDesc,
      });
    }, 1500);
  };

  const coreProgram = localizedPrograms.find((p) => p.id === "core")!;
  const branchPrograms = localizedPrograms.filter((p) => p.id !== "core");

  const prereqBadgeClass = (id: string) =>
    id === "tot"
      ? "bg-red-50 text-red-600 border border-red-200"
      : id === "teachers"
      ? "bg-amber-50 text-amber-700 border border-amber-200"
      : "bg-blue-50 text-blue-700 border border-blue-200";

  const prereqLabel = (id: string) => {
    const labels = t.structure.prereqLabels as Record<string, string>;
    return labels[id] ?? "";
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
          isScrolled
            ? "bg-background/90 backdrop-blur-md border-b border-border py-4 shadow-sm"
            : "bg-transparent py-6"
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between gap-4">
          <div className="logo-biklima text-5xl text-primary tracking-tight leading-none">
            بكلمة
          </div>
          <nav className="hidden md:flex items-center gap-6 font-medium">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-foreground/80 hover:text-primary transition-colors"
              >
                {item.label}
              </button>
            ))}
            <Button
              onClick={() => scrollTo("enroll")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 rounded-full"
            >
              {t.nav.cta}
            </Button>
            {/* Language switcher */}
            <div className="flex items-center gap-1 border border-border rounded-full overflow-hidden">
              {langButtons.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => switchLang(key)}
                  className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                    lang === key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </nav>
          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background flex flex-col pt-24 px-8 gap-6"
          >
            <button
              className="absolute top-6 left-6 text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={28} />
            </button>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-2xl font-serif text-start text-foreground/90 border-b border-border pb-4"
              >
                {item.label}
              </button>
            ))}
            <Button
              size="lg"
              onClick={() => scrollTo("enroll")}
              className="w-full mt-4 text-lg bg-primary rounded-full"
            >
              {t.nav.mobileCta}
            </Button>
            {/* Language switcher (mobile) */}
            <div className="flex items-center justify-center gap-2 mt-2">
              {langButtons.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => switchLang(key)}
                  className={`px-4 py-2 text-sm font-bold rounded-full border transition-colors ${
                    lang === key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
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

          <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-6">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {t.hero.badge}
                </div>
                <h1 className="font-serif text-5xl md:text-7xl font-bold leading-[1.2] text-foreground mb-6">
                  {t.hero.h1a} <br />
                  <span className="text-primary">{t.hero.h1b}</span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-10 max-w-lg">
                  {t.hero.sub}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    onClick={() => scrollTo("enroll")}
                    className="bg-primary hover:bg-primary/90 text-white rounded-full text-lg h-14 px-8"
                  >
                    {t.hero.ctaPrimary}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => scrollTo("structure")}
                    className="rounded-full text-lg h-14 px-8"
                  >
                    {t.hero.ctaSecondary}
                  </Button>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="aspect-[4/5] rounded-[2rem] overflow-hidden relative shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/80 to-accent/60 mix-blend-multiply z-10" />
                <img src={coreProgram.image} alt={t.hero.h1a} className="w-full h-full object-cover" />
                <div className="absolute bottom-8 left-8 right-8 z-20 bg-background/90 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl">
                  <Quote className="text-primary w-8 h-8 mb-4 opacity-50" />
                  <p className="font-serif text-xl font-medium leading-relaxed">
                    "{t.hero.imageQuote}"
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── AUTHOR'S MESSAGE ── */}
        <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
          />
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-5xl mb-6 opacity-30">✦</div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-10 opacity-90">
                {t.author.sectionTitle}
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {t.author.cards.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="bg-primary-foreground/10 backdrop-blur-sm p-7 rounded-3xl border border-primary-foreground/20"
                >
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <h2 className="font-serif text-4xl font-bold mb-6">{t.why.heading}</h2>
              <p className="text-xl text-muted-foreground">{t.why.sub}</p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-8">
              {t.why.items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm hover:shadow-md transition-shadow"
                >
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
                  {t.structure.heading}
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  {t.structure.sub}
                </p>
              </motion.div>
            </div>

            <div className="flex flex-col items-center">
              {/* Core program card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="w-full max-w-2xl"
              >
                <div
                  className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-primary cursor-pointer group"
                  onClick={() => setSelectedProgram(coreProgram)}
                >
                  <div className="aspect-[21/8] relative">
                    <img
                      src={coreProgram.image}
                      alt={coreProgram.shortTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold mb-3">
                      <Star className="w-4 h-4 text-accent" />
                      {t.structure.coreBadge}
                    </div>
                    <h3 className="font-serif text-2xl md:text-3xl font-bold mb-1">{coreProgram.shortTitle}</h3>
                    <div className="flex items-center gap-4 text-white/80 text-sm">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {coreProgram.hours} {t.structure.hoursUnit}
                      </span>
                      <span>·</span>
                      <span>{coreProgram.sessions} {t.structure.sessionsUnit}</span>
                      <span>·</span>
                      <span className="font-bold text-white">{formatPrice(BASE_PRICES.core)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Connector — arrows only, no text label */}
              <div className="flex flex-col items-center py-3 gap-0">
                <div className="w-px h-10 bg-primary/40" />
                <ArrowDown className="w-5 h-5 text-primary/60" />
              </div>

              {/* Three branch cards */}
              <div className="w-full relative">
                <div className="hidden md:block absolute top-0 left-[16.66%] right-[16.66%] h-px bg-border" />
                <div className="grid md:grid-cols-3 gap-6">
                  {branchPrograms.map((program, i) => (
                    <motion.div
                      key={program.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 }}
                      className="flex flex-col items-center"
                    >
                      {/* Downward connector per branch */}
                      <div className="hidden md:flex flex-col items-center mb-4">
                        <div className="w-px h-8 bg-border" />
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      </div>

                      <Card
                        className={`w-full overflow-hidden border-2 ${program.borderColor} shadow-md hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 cursor-pointer`}
                        onClick={() => setSelectedProgram(program)}
                      >
                        <div className="aspect-[4/3] relative overflow-hidden">
                          <img
                            src={program.image}
                            alt={program.shortTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-transparent to-transparent" />
                          <div className="absolute bottom-4 right-4 left-4">
                            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold mb-2 ${program.tagColor}`}>
                              {program.role}
                            </div>
                            <h3 className="font-serif text-lg font-bold text-white leading-tight">
                              {program.shortTitle}
                            </h3>
                            <div className="flex items-center gap-2 text-white/70 text-xs mt-1">
                              <Clock className="w-3 h-3" />
                              <span>{program.hours} {t.structure.hoursUnit}</span>
                              <span>·</span>
                              <span className="font-bold text-white">
                                {formatPrice(BASE_PRICES[program.id as keyof typeof BASE_PRICES])}
                              </span>
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-5">
                          <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                            {program.hook}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-full text-primary border-primary/30 hover:bg-primary hover:text-white mb-3"
                          >
                            {t.structure.viewDetails}
                          </Button>
                          {/* Prerequisite badge — inside card, below button */}
                          {program.prerequisiteLabel && (
                            <div
                              className={`flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${prereqBadgeClass(program.id)}`}
                            >
                              {program.id === "tot" ? (
                                <Lock className="w-3 h-3" />
                              ) : program.id === "children" ? (
                                <School className="w-3 h-3" />
                              ) : (
                                <AlertCircle className="w-3 h-3" />
                              )}
                              {prereqLabel(program.id)}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-full">
                  <Lock className="w-4 h-4" />
                  <span>{t.structure.legendLabels.mandatory}</span>
                </div>
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-full">
                  <AlertCircle className="w-4 h-4" />
                  <span>{t.structure.legendLabels.recommended}</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-full">
                  <School className="w-4 h-4" />
                  <span>{t.structure.legendLabels.schools}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── WISDOM MARQUEE ── */}
        <section id="wisdom" className="py-24 bg-secondary/20 border-y border-border overflow-hidden">
          <div className="container mx-auto px-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-6 text-sm">
                <BookOpen className="w-4 h-4" />
                {t.wisdom.badge}
              </div>
              <h2 className="font-serif text-4xl font-bold mb-6">
                {t.wisdom.heading}
              </h2>
              <p className="text-xl text-muted-foreground">
                {t.wisdom.sub}
              </p>
            </motion.div>
          </div>

          {/* Horizontal scrolling belt */}
          <div className="marquee-wrapper overflow-hidden py-4">
            <div className="marquee-track gap-6 px-6" style={{ direction: "ltr" }}>
              {[...articles, ...articles].map((item, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-3xl p-7 relative overflow-hidden shrink-0"
                  style={{ minWidth: "min(46vw, 520px)", maxWidth: "min(46vw, 520px)" }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
                  <div className="relative z-10" dir={dir}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-primary">{item.category}</div>
                        <div className="text-xs text-muted-foreground">{item.source}</div>
                      </div>
                    </div>
                    <Quote className="w-7 h-7 text-primary/30 mb-3" />
                    <blockquote className="font-serif text-lg font-semibold leading-relaxed text-foreground mb-4">
                      {item.quote}
                    </blockquote>
                    <div className="border-t border-border/50 pt-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
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
                  <Globe className="w-4 h-4" />
                  {t.workbooks.pricesIn} {currency.name}
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {localizedPrograms.map((program, i) => (
                <motion.div
                  key={`wb-${program.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="group cursor-pointer" onClick={() => setSelectedProgram(program)}>
                    {/* Booklet shape */}
                    <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border/50 group-hover:shadow-xl transition-shadow duration-300 mb-4">
                      <div className="relative" style={{ paddingBottom: "140%" }}>
                        <img
                          src={program.image}
                          alt={program.workbook.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-br ${program.accentColor} opacity-70 mix-blend-multiply`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                        {/* Booklet binding line */}
                        <div className="absolute inset-y-0 start-0 w-6 bg-black/20 flex flex-col justify-center items-center gap-1">
                          {[...Array(8)].map((_, j) => (
                            <div key={j} className="w-1 h-1 rounded-full bg-white/30" />
                          ))}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-5 ps-8">
                          <div className="text-white/70 text-xs mb-2 font-bold uppercase tracking-wider">
                            {t.workbooks.companion}
                          </div>
                          <h3 className="font-serif text-base font-bold text-white leading-tight mb-3">
                            {program.workbook.title}
                          </h3>
                          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-bold">
                            {formatPrice(BASE_PRICES[program.id as keyof typeof BASE_PRICES])}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-full text-primary border-primary/30 hover:bg-primary hover:text-white transition-colors"
                    >
                      {t.workbooks.orderBtn}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section id="testimonials" className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
          />
          <div className="container mx-auto px-6 relative z-10">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-center mb-16">
              {t.testimonials.heading}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {localizedTestimonials.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? 40 : -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="bg-primary-foreground/10 p-8 rounded-3xl border border-primary-foreground/20"
                >
                  <Quote className="w-10 h-10 text-accent mb-6" />
                  <p className="font-serif text-xl md:text-2xl leading-relaxed mb-8">"{item.quote}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-xl shrink-0">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold">{item.name}</h4>
                      <p className="text-primary-foreground/70 text-sm">{item.role}</p>
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
            <div className="space-y-4">
              {faqItems.map((faq, i) => (
                <details key={i} className="group bg-card border border-border rounded-2xl overflow-hidden">
                  <summary className="flex items-center justify-between p-6 cursor-pointer font-serif text-xl font-medium list-none">
                    {faq.q}
                    <span className="transition group-open:rotate-180 shrink-0 ms-4">
                      <ChevronDown className="text-muted-foreground" />
                    </span>
                  </summary>
                  <div className="p-6 pt-0 text-muted-foreground leading-relaxed border-t border-border/50">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── ENROLLMENT FORM ── */}
        <section id="enroll" className="py-24 bg-secondary/20 border-t border-border">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto bg-card rounded-[2.5rem] shadow-xl overflow-hidden border border-border/50 grid lg:grid-cols-5">
              <div className="lg:col-span-3 p-8 md:p-12">
                <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2">{t.enroll.heading}</h2>
                <p className="text-muted-foreground mb-8">{t.enroll.sub}</p>

                {/* Training mode toggle */}
                <div className="mb-8">
                  <Label className="mb-3 block font-bold">{t.enroll.modeLabel}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => { setTrainingMode("group"); setFormData(p => ({ ...p, mode: "group" })); }}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                        trainingMode === "group"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <Wifi className="w-5 h-5 shrink-0" />
                      <div className="text-start">
                        <div className="font-bold text-sm">{t.enroll.modeGroup}</div>
                        <div className="text-xs opacity-70">{t.enroll.modeGroupSub}</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTrainingMode("private"); setFormData(p => ({ ...p, mode: "private" })); }}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                        trainingMode === "private"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <UserCheck className="w-5 h-5 shrink-0" />
                      <div className="text-start">
                        <div className="font-bold text-sm">{t.enroll.modePrivate}</div>
                        <div className="text-xs opacity-70">{t.enroll.modePrivateSub}</div>
                      </div>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleEnrollSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t.enroll.nameLabel}</Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-12 rounded-xl bg-background"
                        placeholder={t.enroll.namePlaceholder}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t.enroll.phoneLabel}</Label>
                      <Input
                        id="phone"
                        required
                        dir="ltr"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-12 rounded-xl bg-background"
                        placeholder="+962 7X XXX XXXX"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t.enroll.emailLabel}</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      dir="ltr"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12 rounded-xl bg-background"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>{t.enroll.interestLabel}</Label>
                      <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                        <SelectTrigger className="h-12 rounded-xl bg-background">
                          <SelectValue placeholder={t.enroll.interestPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {t.enroll.interestOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t.enroll.programLabel}</Label>
                      <Select value={formData.program} onValueChange={(val) => setFormData({ ...formData, program: val })}>
                        <SelectTrigger className="h-12 rounded-xl bg-background">
                          <SelectValue placeholder={t.enroll.programPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {localizedPrograms.map((p) => (
                            <SelectItem key={p.id} value={p.shortTitle}>{p.shortTitle}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">{t.enroll.reasonLabel}</Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="min-h-[120px] rounded-xl bg-background resize-none"
                      placeholder={t.enroll.reasonPlaceholder}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 text-lg rounded-xl bg-primary hover:bg-primary/90 text-white font-bold"
                  >
                    {isSubmitting ? t.enroll.submitting : t.enroll.submitBtn}
                  </Button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-primary text-primary-foreground p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent rounded-full blur-[100px] opacity-20 -mr-20 -mt-20" />
                <div className="relative z-10">
                  <h3 className="font-serif text-3xl font-bold mb-6">{t.enroll.sidePanelTitle}</h3>
                  <p className="text-primary-foreground/80 text-lg leading-relaxed mb-8">
                    {t.enroll.sidePanelText}
                  </p>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-primary-foreground/60">{t.enroll.quickQ}</p>
                        <p className="font-bold text-lg" dir="ltr">hello@bikalima.com</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-primary-foreground/80">
                        <Wifi className="w-4 h-4 shrink-0" />
                        <span>{t.enroll.featureGroup}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-primary-foreground/80">
                        <UserCheck className="w-4 h-4 shrink-0" />
                        <span>{t.enroll.featurePrivate}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-primary-foreground/80">
                        <Globe className="w-4 h-4 shrink-0" />
                        <span>{t.enroll.featureLang}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative z-10 mt-12 bg-primary-foreground/10 p-6 rounded-2xl border border-primary-foreground/20">
                  <p className="font-serif font-medium leading-relaxed italic text-lg text-center">
                    "{t.enroll.sideQuote}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-foreground text-background py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12 border-b border-background/10 pb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="logo-biklima text-5xl text-accent mb-6 leading-none">بكلمة</div>
              <p className="text-background/60 leading-relaxed max-w-sm">
                {t.footer.about}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">{t.footer.programsHeading}</h4>
              <ul className="space-y-4 text-background/70">
                {localizedPrograms.map((p) => (
                  <li key={p.id}>
                    <button onClick={() => setSelectedProgram(p)} className="hover:text-accent transition text-start">
                      {p.shortTitle}
                    </button>
                  </li>
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
                  <li key={item.id}>
                    <button onClick={() => scrollTo(item.id)} className="hover:text-accent transition text-start">
                      {item.label}
                    </button>
                  </li>
                ))}
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setSelectedProgram(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl relative z-10 border border-border"
            >
              <button
                aria-label="Close"
                onClick={() => setSelectedProgram(null)}
                className="absolute top-6 end-6 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-foreground hover:bg-white transition-colors z-20 shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative aspect-[21/8] overflow-hidden rounded-t-[2rem]">
                <img
                  src={selectedProgram.image}
                  alt={selectedProgram.shortTitle}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${selectedProgram.accentColor} opacity-75 mix-blend-multiply`} />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                    {selectedProgram.role}
                  </div>
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-2">
                    {selectedProgram.shortTitle}
                  </h2>
                  <div className="flex flex-wrap gap-4 text-white/80 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {selectedProgram.hours} {t.modal.hoursUnit}
                    </span>
                    <span>·</span>
                    <span>{selectedProgram.sessions} {t.structure.sessionsUnit}</span>
                    <span>·</span>
                    <span className="font-bold text-white text-base">
                      {formatPrice(BASE_PRICES[selectedProgram.id as keyof typeof BASE_PRICES])}
                    </span>
                  </div>
                  {selectedProgram.prerequisite && (
                    <div
                      className={`mt-3 inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${
                        selectedProgram.id === "tot"
                          ? "bg-red-100 text-red-700"
                          : selectedProgram.id === "children"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {selectedProgram.id === "tot" ? <Lock className="w-3 h-3" /> :
                       selectedProgram.id === "children" ? <School className="w-3 h-3" /> :
                       <AlertCircle className="w-3 h-3" />}
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
                      <p className="font-serif text-xl font-medium italic">{selectedProgram.hook}</p>
                    </div>
                    <h3 className="font-bold text-2xl mb-4 border-b border-border pb-4">{t.modal.aboutHeading}</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">{selectedProgram.description}</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-2xl mb-4 border-b border-border pb-4">{t.modal.transformHeading}</h3>
                    <div className="bg-secondary/30 p-6 rounded-2xl border border-border flex items-center gap-4">
                      <Star className="w-8 h-8 text-accent shrink-0" />
                      <p className="font-serif text-xl font-medium">{selectedProgram.transformation}</p>
                    </div>
                  </section>

                  <section>
                    <h3 className="font-bold text-2xl mb-4 border-b border-border pb-4">
                      {t.modal.sessionsHeading} ({selectedProgram.sessions} {t.structure.sessionsUnit})
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {selectedProgram.modules.map((mod, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-background p-4 rounded-xl border border-border">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                            {idx + 1}
                          </div>
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
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm font-medium">{out}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-card p-5 rounded-3xl border border-primary/20 shadow-sm">
                    <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">{t.modal.workbookHeading}</div>
                    <h4 className="font-serif font-bold text-lg mb-2">{selectedProgram.workbook.title}</h4>
                    <p className="text-sm text-muted-foreground">{selectedProgram.workbook.description}</p>
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <span className="font-bold text-lg">{formatPrice(BASE_PRICES[selectedProgram.id as keyof typeof BASE_PRICES])}</span>
                      <Button variant="outline" size="sm" className="rounded-full">{t.modal.orderWorkbook}</Button>
                    </div>
                  </div>

                  <div className="bg-card p-5 rounded-3xl border border-border">
                    <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">{t.modal.audienceHeading}</div>
                    <p className="text-sm font-medium">{selectedProgram.audience}</p>
                    <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                      {selectedProgram.delivery}
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full rounded-full h-14 text-lg font-bold shadow-lg bg-primary text-white hover:bg-primary/90"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, program: selectedProgram.shortTitle }));
                      setSelectedProgram(null);
                      setTimeout(() => scrollTo("enroll"), 300);
                    }}
                  >
                    {t.modal.enrollBtn}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
