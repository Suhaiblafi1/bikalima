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

import imgCore from "@assets/tot_1774971926437.jpg";
import imgToT from "@assets/برنامج_tot_1774971926437.jpg";
import imgTeachers from "@assets/برنامج_اولياء_الامور_1774971926437.jpg";
import imgChildren from "@assets/برنامج_الطفل_٢_1774971926437.jpg";

// ── Currency detection ──────────────────────────────────────────────────────
type CurrencyConfig = {
  code: string;
  symbol: string;
  name: string;
  rate: number; // relative to JOD
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
  DEFAULT: { code: "USD", symbol: "$", name: "دولار أمريكي", rate: 1.41 },
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

// ── Programs data ────────────────────────────────────────────────────────────
const BASE_PRICES = { core: 180, tot: 350, teachers: 250, children: 120 };

const programs = [
  {
    id: "core",
    role: "الدورة الأساسية",
    title: "برنامج بكلمة – مهارات الخطابة والتواصل وقوة التأثير",
    shortTitle: "المتحدث المؤثر",
    audience: "اليافعون، الشباب، المهنيون",
    hours: 27,
    sessions: 14,
    hook: "كلمتك قادرة على تغيير الغرفة",
    description:
      "برنامج تدريبي متكامل لليافعين والشباب والكبار، يهدف إلى بناء متحدث أكثر حضوراً ووضوحاً وتأثيراً في الدراسة والعمل والحياة العامة. يركز على تطوير الثقة، وتنظيم الرسائل، وتحسين الإلقاء، ورفع جودة العروض، وبناء قدرة حقيقية على الإقناع.",
    transformation: "من شخص عادي إلى متحدث يترك أثراً لا يُنسى",
    prerequisite: null,
    prerequisiteLabel: null,
    delivery: "مفتوح للعموم — شباب ومهنيون",
    outcomes: [
      "بناء حضور الشخصية",
      "تقنيات الإقناع والتأثير",
      "هندسة الخطاب والرسالة",
      "التوازن الانفعالي أمام الجمهور",
      "أدوات الإلقاء المهني",
      "التواصل الذكي في السياقات المختلفة",
    ],
    modules: [
      "من متحدث عادي إلى متحدث مؤثر",
      "الثقة، الحضور، والانطباع الأول",
      "إدارة الخوف والتحكم في التوتر",
      "كيف تبني رسالتك بوضوح؟",
      "تنظيم الفكرة وافتتاح الحديث وختامه",
      "نبرة الصوت، الوقفة، ولغة الجسد",
      "مهارات الإقناع والتأثير",
      "مخاطبة الجمهور بحسب السياق",
      "تقديم العروض والخطابات",
      "إدارة الأسئلة والاعتراضات",
      "التحدث في الاجتماعات والمناسبات",
      "التغذية الراجعة وخطة التطوير الشخصي",
    ],
    workbook: {
      title: "كراسة المتدرب",
      description:
        "كراسة تدريبية عميقة تحتوي على تمارين الحضور والأداء وهندسة الخطاب والتقييم الذاتي",
    },
    image: imgCore,
    accentColor: "from-primary to-primary/80",
    borderColor: "border-primary/30",
    tagColor: "bg-primary/10 text-primary border border-primary/20",
  },
  {
    id: "tot",
    role: "تدريب المدربين",
    title: "برنامج بكلمة – المدرب المعتمد لفن الخطابة والإلقاء والتأثير",
    shortTitle: "المدرب المعتمد",
    audience: "المدربون، الميسّرون، المختصون",
    hours: 40,
    sessions: 20,
    hook: "علّم الآخرين ما تعلمته، وضاعف الأثر",
    description:
      "برنامج تأهيلي متقدم لإعداد مدربين معتمدين قادرين على تقديم برنامج بكلمة للكبار باحتراف. يركز على بناء هوية المدرب، وفهم فلسفة البرنامج، وإتقان أدوات التدريب، وإدارة الجلسات والمجموعات.",
    transformation: "من متحدث محترف إلى مدرب معتمد يُحدث أثراً في مجتمعه",
    prerequisite: "يشترط إتمام دورة المتحدث المؤثر بنجاح",
    prerequisiteLabel: "متطلب سابق إلزامي",
    delivery: "للمتخصصين الراغبين في الاعتماد — يشترط إتمام الأساسية",
    outcomes: [
      "منهجية التدريب الاحترافي",
      "تصميم الجلسة التدريبية",
      "إدارة المجموعات والتفاعل",
      "الاعتماد الرسمي من بكلمة",
      "بناء المسار التدريبي",
      "التطبيق والانطلاق للسوق",
    ],
    modules: [
      "من متحدث إلى مدرب",
      "فلسفة برنامج بكلمة وأثره",
      "شخصية المدرب وهويته المهنية",
      "تصميم الجلسة التدريبية",
      "إدارة المجموعات والتفاعل",
      "بناء الأنشطة والتطبيقات",
      "التقديم المؤثر أمام الجمهور",
      "الإقناع وصناعة الرسالة",
      "تقديم جلسات تجريبية",
      "التغذية الراجعة والتقييم المهني",
      "معايير المدرب المعتمد",
      "خطة الانطلاق في السوق",
    ],
    workbook: {
      title: "برنامج بكلمة – المدرب المعتمد",
      description:
        "الدليل الاحترافي الشامل للمدرب المعتمد، يحتوي على المناهج والأدوات والتقييمات الكاملة",
    },
    image: imgToT,
    accentColor: "from-amber-700 to-amber-600",
    borderColor: "border-amber-600/30",
    tagColor: "bg-amber-50 text-amber-800 border border-amber-200",
  },
  {
    id: "teachers",
    role: "المعلمون وأولياء الأمور",
    title: "برنامج بكلمة – المعلم/ولي الأمر المعتمد لتدريب مهارة الخطابة للأطفال",
    shortTitle: "بكلمة للمعلمين وأولياء الأمور",
    audience: "المعلمون، أولياء الأمور، المربون",
    hours: 21,
    sessions: 11,
    hook: "بيئة الطفل هي مستقبله",
    description:
      "برنامج تأهيلي مخصص للمعلمين وأولياء الأمور، يعرّفهم بمنهجية تدريب الأطفال على الخطابة والتواصل وقوة التأثير، ويمكنهم من تطبيق البرنامج داخل الصف أو المنزل بأسلوب عملي ومنظم.",
    transformation: "من الضغط والتوقعات إلى الدعم الواعي والتوجيه الصحيح",
    prerequisite: "يُستحسن إتمام دورة المتحدث المؤثر مسبقاً",
    prerequisiteLabel: "يُستحسن (غير إلزامي)",
    delivery: "مفتوح للمعلمين وأولياء الأمور",
    outcomes: [
      "منهجية تدريب الأطفال على الخطابة",
      "أدوات تربوية مناسبة للعمر",
      "دمج البرنامج في البيت والصف",
      "تعزيز المشاركة وتجاوز الخجل",
      "التقييم والمتابعة وتطوير الأداء",
      "بناء جيل واثق ومعبّر",
    ],
    modules: [
      "لماذا نعلّم الأطفال الخطابة؟",
      "الكلمة كأداة بناء شخصية",
      "كيف يختلف التدريب حسب العمر؟",
      "الفروق الفردية في التعبير",
      "الحاجات النفسية في كل مرحلة",
      "كيف أقدّم الجلسة للأطفال؟",
      "إدارة التفاعل والأنشطة",
      "تعزيز المشاركة وتجاوز الخجل",
      "تطبيق البرنامج في الصف أو البيت",
      "نماذج تدريب عملية",
      "التقييم والمتابعة",
    ],
    workbook: {
      title: "برنامج بكلمة للمعلمين وأولياء الأمور",
      description:
        "حقيبة تدريبية متخصصة تحتوي على استراتيجيات وأنشطة عملية لبناء جيل واثق",
    },
    image: imgTeachers,
    accentColor: "from-teal-700 to-teal-600",
    borderColor: "border-teal-600/30",
    tagColor: "bg-teal-50 text-teal-800 border border-teal-200",
  },
  {
    id: "children",
    role: "برنامج المدارس",
    title: "برنامج بكلمة للأطفال – مهارات الخطابة والتواصل والإلقاء",
    shortTitle: "المتحدث الصغير",
    audience: "الأطفال (٥–١٦ سنة) — عبر المدارس",
    hours: 18,
    sessions: 9,
    hook: "صوتك يستحق أن يُسمع",
    description:
      "برنامج تدريبي تفاعلي للأطفال لبناء الثقة، وتنمية مهارات التعبير، وتعليمهم كيف يتحدثون بوضوح وراحة وتأثير أمام الآخرين. يُقدَّم للمدارس عبر خريجي برنامج المعلمين وأولياء الأمور المعتمدين.",
    transformation: "من طفل خجول إلى متحدث واثق أمام جمهوره",
    prerequisite: "يُقدَّم بواسطة خريجي برنامج المعلمين وأولياء الأمور",
    prerequisiteLabel: "مُقدَّم عبر خريجي برنامج المعلمين",
    delivery: "يُقدَّم للمدارس حصراً عبر خريجي برنامج المعلمين المعتمدين",
    outcomes: [
      "بناء الثقة بالنفس",
      "أساسيات الخطابة للأطفال",
      "استخدام الصوت ولغة الجسد",
      "ترتيب الأفكار وإيصالها",
      "التأثير والإقناع المناسب للعمر",
      "الحضور الواثق أمام الجمهور",
    ],
    modules: [
      "أتكلم بثقة",
      "كيف أعبّر عن نفسي دون خوف",
      "ما معنى أن أتحدث أمام الآخرين؟",
      "كيف أبدأ حديثي بشكل جميل؟",
      "ترتيب أفكاري قبل الكلام",
      "نبرة الصوت ولغة الجسد",
      "كيف أوصل فكرتي بوضوح؟",
      "كيف أترك أثرًا جميلًا في كلامي؟",
      "عرضي الأول أمام المجموعة",
    ],
    workbook: {
      title: "كراسة الخطيب الصغير",
      description:
        "كراسة تفاعلية مصممة للأطفال تحتوي على تمارين وأنشطة مدروسة لبناء مهارات التحدث",
    },
    image: imgChildren,
    accentColor: "from-primary to-primary/80",
    borderColor: "border-primary/30",
    tagColor: "bg-primary/10 text-primary border border-primary/20",
  },
];

// ── Workbook wisdom extracted from source materials ─────────────────────────
const workbookWisdom = [
  {
    source: "كراسة المتدرب",
    category: "النطاق الذهني",
    icon: <Lightbulb className="w-5 h-5" />,
    quote: "الثقة لا تُعطى، تُبنى. وبناؤها يبدأ من أعمق نقطة في الداخل — من صورتك عن نفسك لحظة الكلام.",
    insight: "قبل أن تُصلح ما يسمعه الجمهور، أصلح ما تسمعه أنت من نفسك.",
  },
  {
    source: "كراسة المتدرب",
    category: "النطاق اللفظي",
    icon: <Mic2 className="w-5 h-5" />,
    quote: "رَبِّ اشْرَحْ لِي صَدْرِي، وَيَسِّرْ لِي أَمْرِي، وَاحْلُلْ عُقْدَةً مِن لِّسَانِي يَفْقَهُوا قَوْلِي.",
    insight: "حتى أعظم الأنبياء طلب تيسير الإلقاء. الخطابة دعوة قبل أن تكون مهارة.",
  },
  {
    source: "برنامج المعلمين وأولياء الأمور",
    category: "الفجوة بين الأجيال",
    icon: <Heart className="w-5 h-5" />,
    quote: "٧٠٪ من الناس يعانون من رهاب التحدث — والسبب الأول ليس الجمهور، بل البيئة التي نشأوا فيها.",
    insight: "كل طفل خجول كان يوماً طفلاً لم يُتَح له أن يُسمع بشكل صحيح.",
  },
  {
    source: "برنامج المعلمين وأولياء الأمور",
    category: "دور المربّي",
    icon: <Users className="w-5 h-5" />,
    quote: "الكلمة التي تقولها لطفل في لحظة الحاجة قد تُشكّل صوته طوال حياته — أو تُصمته.",
    insight: "لا يحتاج الطفل مدرباً فصيحاً فقط، بل بيئة تؤمن أن صوته يستحق أن يُسمع.",
  },
  {
    source: "كراسة الخطيب الصغير",
    category: "فلسفة التعليم",
    icon: <Star className="w-5 h-5" />,
    quote: "الطفل الذي يتعلم الكلام بثقة اليوم هو القائد الذي يُغيّر غرفته غداً.",
    insight: "الخطابة للأطفال ليست نشاطاً إضافياً، هي استثمار في شخصية كاملة.",
  },
  {
    source: "برنامج المدرب المعتمد",
    category: "رسالة المدرب",
    icon: <Feather className="w-5 h-5" />,
    quote: "المدرب الحقيقي لا يُعلّم الناس كيف يتكلمون فقط — بل يُعيد إليهم الإيمان بأن ما يقولونه يستحق أن يُسمع.",
    insight: "حين تصبح مدرباً، تتضاعف مسؤوليتك: أنت تصنع أثراً ثم توكّله لآخرين ليصنعوا أثراً من بعدك.",
  },
];

const testimonials = [
  {
    name: "سارة الأحمدي",
    role: "أم لثلاثة أطفال",
    quote:
      "بعد اشتراك ابنتي في برنامج الأطفال، أصبحت تتحدث أمام زملائها بثقة لا نعرفها من قبل. كانت خجولة جداً، الآن تقود التقديمات في مدرستها!",
  },
  {
    name: "محمد العتيبي",
    role: "مدير تسويق",
    quote:
      "برنامج المتحدث المؤثر غيّر طريقة تعاملي مع العملاء. أصبحت أعرف كيف أوصل فكرتي في ثوانٍ وأترك أثراً حقيقياً في أي اجتماع.",
  },
  {
    name: "أ. نورة القحطاني",
    role: "معلمة لغة عربية",
    quote:
      "البرنامج المخصص للمعلمين فتح عيني على أسلوب تعاملي مع الطلاب. أدواته عملية وفعلاً تُحدث فرقاً في الفصل.",
  },
  {
    name: "د. فهد الزهراني",
    role: "مدرب معتمد بكلمة",
    quote:
      "حصلت على الاعتماد من بكلمة وأنا الآن أدرّب المئات. المنهجية علمية والأثر حقيقي — هذا ليس مجرد برنامج، هو رسالة.",
  },
];

const faqs = [
  {
    q: "ما الدورة التي يجب أن أبدأ بها؟",
    a: 'الدورة الأساسية "برنامج بكلمة – مهارات الخطابة والتواصل وقوة التأثير" هي المدخل الطبيعي. إذا كنت تريد الوصول للاعتماد كمدرب فستحتاج إتمامها أولاً. أما إذا كنت معلماً أو ولي أمر فيمكنك الالتحاق ببرنامجنا المتخصص مباشرةً.',
  },
  {
    q: "ما الفرق بين التدريب عن بعد والتدريب الخاص ١:١؟",
    a: "التدريب عن بعد (أونلاين) يتيح لك المشاركة من أي مكان في العالم ضمن مجموعة. أما التدريب الخاص ١:١ فهو تجربة مكثفة ومخصصة تماماً لك، مع وتيرة أسرع وتغذية راجعة فورية ومعمّقة.",
  },
  {
    q: "هل يشترط إتمام الدورة الأساسية قبل برنامج المعلمين وأولياء الأمور؟",
    a: "لا يشترط ذلك. البرنامج مصمم ليكون مستقلاً وقابلاً للتطبيق مباشرةً. لكن إتمام الدورة الأساسية يعزز الاستفادة القصوى ويعطيك تجربة المتدرب قبل أن تكون المرشد.",
  },
  {
    q: "كيف يصل برنامج الأطفال للمدارس؟",
    a: 'برنامج "المتحدث الصغير" يُقدَّم للمدارس حصراً عبر خريجي برنامج المعلمين وأولياء الأمور المعتمدين من بكلمة. هذا يضمن جودة التطبيق وانسجامه مع المنهجية.',
  },
  {
    q: "هل يمكن شراء الكراسة دون الاشتراك في البرنامج؟",
    a: "نعم! يمكنك شراء أي كراسة بشكل مستقل. الكراسات مصممة لتكون مفيدة بمفردها، لكن الاستفادة القصوى تكون مع البرنامج المرافق.",
  },
  {
    q: "هل البرامج حضورية أم إلكترونية؟",
    a: "نقدم البرامج بالصيغتين: تدريب جماعي عن بعد، وتدريب خاص ١:١ حضوري أو عن بعد. تواصل معنا لمعرفة المواعيد والأماكن المتاحة.",
  },
];

export default function Home() {
  const { toast } = useToast();
  const { format: formatPrice, currency } = useCurrency();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<
    (typeof programs)[0] | null
  >(null);
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
        title: "تم استلام طلبك بنجاح!",
        description: "سنتواصل معك قريباً لتأكيد تفاصيل الانضمام.",
      });
    }, 1500);
  };

  const coreProgram = programs.find((p) => p.id === "core")!;
  const branchPrograms = programs.filter((p) => p.id !== "core");

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden relative">
      {/* NAVBAR */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/90 backdrop-blur-md border-b border-border py-4 shadow-sm"
            : "bg-transparent py-6"
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="font-serif text-3xl font-bold text-primary tracking-tight">
            بكلمة
          </div>
          <nav className="hidden md:flex items-center gap-8 font-medium">
            {[
              { label: "البنية التدريبية", id: "structure" },
              { label: "من الكراسات", id: "wisdom" },
              { label: "الكراسات", id: "workbooks" },
              { label: "تجارب", id: "testimonials" },
            ].map((item) => (
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
              ابدأ رحلتك
            </Button>
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
            className="fixed inset-0 z-40 bg-background pt-24 px-6 flex flex-col gap-6 md:hidden"
          >
            {[
              { label: "البنية التدريبية", id: "structure" },
              { label: "من الكراسات", id: "wisdom" },
              { label: "الكراسات", id: "workbooks" },
              { label: "تجارب", id: "testimonials" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-2xl font-serif text-right text-foreground/90 border-b border-border pb-4"
              >
                {item.label}
              </button>
            ))}
            <Button
              size="lg"
              onClick={() => scrollTo("enroll")}
              className="w-full mt-4 text-lg bg-primary rounded-full"
            >
              ابدأ رحلتك الآن
            </Button>
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
                  برنامج تحويلي في فن الخطابة والإلقاء
                </div>
                <h1 className="font-serif text-5xl md:text-7xl font-bold leading-[1.2] text-foreground mb-6">
                  بكلمة، نصنع <br />
                  <span className="text-primary">أثراً لا يُنسى.</span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-10 max-w-lg">
                  دورة أساسية في الخطابة تؤهّل الشباب والمهنيين، وتتشعّب منها مسارات لتأهيل المدربين والمعلمين وأولياء الأمور والأطفال.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    onClick={() => scrollTo("enroll")}
                    className="bg-primary hover:bg-primary/90 text-white rounded-full text-lg h-14 px-8"
                  >
                    ابدأ الآن
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => scrollTo("structure")}
                    className="rounded-full text-lg h-14 px-8"
                  >
                    اكتشف البنية التدريبية
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
                <img src={imgCore} alt="متحدث محترف" className="w-full h-full object-cover" />
                <div className="absolute bottom-8 left-8 right-8 z-20 bg-background/90 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl">
                  <Quote className="text-primary w-8 h-8 mb-4 opacity-50" />
                  <p className="font-serif text-xl font-medium leading-relaxed">
                    "الثقة بالكلام لا تُورث، بل تُبنى وتُصقل خطوة بخطوة."
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
                رسالة إلى كل معلم وخطيب ومتدرب
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  to: "إلى المعلم والمربّي",
                  icon: <GraduationCap className="w-6 h-6" />,
                  text: "أنت لا تُعلّم مادة — أنت تُشكّل أصواتاً. كل كلمة تقولها أمام طالبك تُبقي أثراً في طريقة حديثه مع العالم. برنامجنا وُلد من إيمان عميق بأن أجمل ما يمكن أن تمنحه لطالبك هو أن يُؤمن بأن صوته يُغيّر.",
                },
                {
                  to: "إلى الخطيب والمتحدث",
                  icon: <Mic2 className="w-6 h-6" />,
                  text: "كلامك ليس مجرد أداء — هو حضور. والحضور لا يأتي من التقنية وحدها، بل من الاتصال بما تؤمن به حقاً. بكلمة لا تُعلّمك كيف تتكلم بل تُعيدك إلى سبب كلامك، وتمنحك الأدوات لتوصل روحك قبل صوتك.",
                },
                {
                  to: "إلى المتدرب المبتدئ",
                  icon: <Sparkles className="w-6 h-6" />,
                  text: "لا يهم من أين تبدأ. يهم أنك تبدأ. ٧٠٪ من الناس يعانون من رهاب التحدث، لكن الأثر الحقيقي يصنعه الـ ٣٠٪ الذين قرروا أن يتعلموا. أنت هنا — وهذا هو القرار الأول والأصعب.",
                },
              ].map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="bg-primary-foreground/10 backdrop-blur-sm p-7 rounded-3xl border border-primary-foreground/20"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center mb-4">
                    {msg.icon}
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
              <h2 className="font-serif text-4xl font-bold mb-6">لماذا بكلمة؟</h2>
              <p className="text-xl text-muted-foreground">
                في عالم مليء بالأفكار، المنتصر هو من يستطيع إيصال فكرته بوضوح، بثقة، وبطريقة تترك أثراً.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "منهجية علمية متدرجة",
                  desc: "لا نعتمد على التحفيز المؤقت، بل نبني المهارات عبر مناهج مدروسة تنقل المتدرب خطوة بخطوة عبر أربعة نطاقات: اللفظي، الذهني، الاجتماعي، وهندسة الخطاب.",
                  icon: <Layers className="w-8 h-8" />,
                },
                {
                  title: "معالجة الجذور",
                  desc: "نعمل على بناء الثقة من الداخل (النطاق الذهني) قبل العمل على الأداء الخارجي (النطاق اللفظي). الكلمة تبدأ قبل الفم.",
                  icon: <CheckCircle2 className="w-8 h-8" />,
                },
                {
                  title: "أثر يمتد للأجيال",
                  desc: "نؤهّل المدربين والمعلمين لينقلوا المهارة إلى الأطفال. ما تتعلمه اليوم سيسمعه جيل لم يولد بعد.",
                  icon: <Sparkles className="w-8 h-8" />,
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                    {item.icon}
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
                  البنية التدريبية لبكلمة
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  دورة أساسية تتشعّب منها ثلاثة مسارات — كل مسار يُولد أثراً يتضاعف.
                </p>
              </motion.div>
            </div>

            {/* Core program */}
            <div className="flex flex-col items-center">
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
                      الدورة الأساسية المحورية
                    </div>
                    <h3 className="font-serif text-2xl md:text-3xl font-bold mb-1">{coreProgram.shortTitle}</h3>
                    <div className="flex items-center gap-4 text-white/80 text-sm">
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{coreProgram.hours} ساعة</span>
                      <span>·</span>
                      <span>{coreProgram.sessions} جلسة</span>
                      <span>·</span>
                      <span className="font-bold text-white">{formatPrice(BASE_PRICES.core)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Connector */}
              <div className="flex flex-col items-center py-4 gap-1">
                <div className="w-px h-10 bg-primary/40" />
                <div className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  تتشعّب منها
                </div>
                <div className="w-px h-6 bg-primary/40" />
              </div>

              {/* Three branches */}
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
                      <div className="hidden md:flex flex-col items-center mb-4">
                        <div className="w-px h-8 bg-border" />
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      </div>

                      {/* Prerequisite badge */}
                      <div
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-3 ${
                          program.id === "tot"
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : program.id === "teachers"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {program.id === "tot" ? (
                          <Lock className="w-3 h-3" />
                        ) : program.id === "children" ? (
                          <School className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {program.prerequisiteLabel}
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
                              <span>{program.hours} ساعة</span>
                              <span>·</span>
                              <span className="font-bold text-white">{formatPrice(BASE_PRICES[program.id as keyof typeof BASE_PRICES])}</span>
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
                            className="w-full rounded-full text-primary border-primary/30 hover:bg-primary hover:text-white"
                          >
                            عرض التفاصيل الكاملة
                          </Button>
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
                  <span>متطلب سابق إلزامي</span>
                </div>
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-full">
                  <AlertCircle className="w-4 h-4" />
                  <span>يُستحسن (غير إلزامي)</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-full">
                  <School className="w-4 h-4" />
                  <span>مُقدَّم عبر خريجي برنامج المعلمين</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── WISDOM FROM WORKBOOKS ── */}
        <section id="wisdom" className="py-24 bg-secondary/20 border-y border-border">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-6 text-sm">
                  <BookOpen className="w-4 h-4" />
                  مقتطفات من داخل الكراسات
                </div>
                <h2 className="font-serif text-4xl font-bold mb-6">
                  فلسفة بكلمة — بعمق من المصدر
                </h2>
                <p className="text-xl text-muted-foreground">
                  ما تجده في كراساتنا ليس تمارين فحسب — بل رؤية تربوية تؤمن بأن الكلمة أداة بناء إنسان.
                </p>
              </motion.div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workbookWisdom.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border rounded-3xl p-7 relative overflow-hidden group hover:shadow-lg transition-shadow"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-primary">{item.category}</div>
                        <div className="text-xs text-muted-foreground">{item.source}</div>
                      </div>
                    </div>
                    <Quote className="w-7 h-7 text-primary/30 mb-3" />
                    <blockquote className="font-serif text-lg font-medium leading-relaxed text-foreground mb-5">
                      {item.quote}
                    </blockquote>
                    <div className="border-t border-border/50 pt-4">
                      <p className="text-sm text-muted-foreground italic leading-relaxed">
                        {item.insight}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WORKBOOKS STORE — Booklet Style ── */}
        <section id="workbooks" className="py-24 bg-background">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-serif text-4xl font-bold mb-6">مكتبة الكراسات</h2>
              <p className="text-xl text-muted-foreground">
                حقائب تدريبية وكراسات مصممة بعناية — يمكن اقتناؤها بشكل مستقل أو ضمن البرنامج.
              </p>
              {currency.code !== "JOD" && (
                <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full">
                  <Globe className="w-4 h-4" />
                  الأسعار بـ {currency.name}
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {programs.map((program, i) => (
                <motion.div
                  key={`wb-${program.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  {/* Booklet shape: wider than tall, like a pamphlet */}
                  <div className="group cursor-pointer" onClick={() => setSelectedProgram(program)}>
                    {/* Book cover */}
                    <div className="relative rounded-2xl overflow-hidden shadow-[8px_8px_20px_rgba(0,0,0,0.15)] group-hover:shadow-[12px_12px_28px_rgba(0,0,0,0.2)] transition-all duration-300 group-hover:-translate-y-1 aspect-[3/2]">
                      <img
                        src={program.image}
                        alt={program.workbook.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Color overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${program.accentColor} opacity-75 mix-blend-multiply`} />
                      {/* Book spine on right (RTL: left) */}
                      <div className="absolute left-0 top-0 bottom-0 w-4 bg-black/25" />
                      {/* Page edges on top */}
                      <div className="absolute top-0 left-4 right-0 h-1.5 bg-white/10" />
                      {/* Content on cover */}
                      <div className="absolute inset-0 flex flex-col justify-between p-5 text-white">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">بكلمة</div>
                          <div className="text-xs opacity-50">© 2026</div>
                        </div>
                        <div>
                          <h4 className="font-serif font-bold text-base leading-snug drop-shadow-sm">
                            {program.workbook.title}
                          </h4>
                        </div>
                      </div>
                    </div>

                    {/* Info below book */}
                    <div className="mt-4 px-1">
                      <h3 className="font-serif font-bold text-base mb-1 leading-snug">
                        {program.workbook.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {program.workbook.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg text-foreground">
                          {formatPrice(BASE_PRICES[program.id as keyof typeof BASE_PRICES])}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs"
                          onClick={(e) => { e.stopPropagation(); scrollTo("enroll"); }}
                        >
                          طلب شراء
                        </Button>
                      </div>
                    </div>
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
              أثر يبقى، وكلمة تُصنع
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? 40 : -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="bg-primary-foreground/10 p-8 rounded-3xl border border-primary-foreground/20"
                >
                  <Quote className="w-10 h-10 text-accent mb-6" />
                  <p className="font-serif text-xl md:text-2xl leading-relaxed mb-8">"{t.quote}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-xl">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold">{t.name}</h4>
                      <p className="text-primary-foreground/70 text-sm">{t.role}</p>
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
              <h2 className="font-serif text-4xl font-bold mb-4">الأسئلة الشائعة</h2>
              <p className="text-xl text-muted-foreground">كل ما تحتاج لمعرفته عن برامجنا ومساراتها.</p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details key={i} className="group bg-card border border-border rounded-2xl overflow-hidden">
                  <summary className="flex items-center justify-between p-6 cursor-pointer font-serif text-xl font-medium list-none">
                    {faq.q}
                    <span className="transition group-open:rotate-180 shrink-0 mr-4">
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
                <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2">انضم إلينا الآن</h2>
                <p className="text-muted-foreground mb-8">احجز مقعدك أو اطلب استشارة لتحديد البرنامج الأنسب لك.</p>

                {/* Training mode toggle */}
                <div className="mb-8">
                  <Label className="mb-3 block font-bold">نوع التدريب المفضل</Label>
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
                      <div className="text-right">
                        <div className="font-bold text-sm">تدريب جماعي عن بعد</div>
                        <div className="text-xs opacity-70">أونلاين مع مجموعة</div>
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
                      <div className="text-right">
                        <div className="font-bold text-sm">تدريب خاص ١:١</div>
                        <div className="text-xs opacity-70">مكثف ومخصص لك</div>
                      </div>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleEnrollSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">الاسم الكامل</Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-12 rounded-xl bg-background"
                        placeholder="محمد عبدالله"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        required
                        dir="ltr"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-12 rounded-xl bg-background text-right"
                        placeholder="+962 7X XXX XXXX"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      dir="ltr"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12 rounded-xl bg-background text-right"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>أنا مهتم بـ</Label>
                      <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                        <SelectTrigger className="h-12 rounded-xl bg-background">
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="adult">نفسي (شاب / مهني)</SelectItem>
                          <SelectItem value="trainer">اعتماد المدربين (ToT)</SelectItem>
                          <SelectItem value="parent">برنامج المعلمين وأولياء الأمور</SelectItem>
                          <SelectItem value="school">برنامج الأطفال (عبر المدرسة)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>البرنامج المفضل</Label>
                      <Select value={formData.program} onValueChange={(val) => setFormData({ ...formData, program: val })}>
                        <SelectTrigger className="h-12 rounded-xl bg-background">
                          <SelectValue placeholder="اختر البرنامج" />
                        </SelectTrigger>
                        <SelectContent>
                          {programs.map((p) => (
                            <SelectItem key={p.id} value={p.shortTitle}>{p.shortTitle}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">لماذا تريد الانضمام؟ (اختياري)</Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="min-h-[120px] rounded-xl bg-background resize-none"
                      placeholder="شاركنا ما تطمح لتحقيقه..."
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 text-lg rounded-xl bg-primary hover:bg-primary/90 text-white font-bold"
                  >
                    {isSubmitting ? "جاري الإرسال..." : "تأكيد الطلب"}
                  </Button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-primary text-primary-foreground p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent rounded-full blur-[100px] opacity-20 -mr-20 -mt-20" />
                <div className="relative z-10">
                  <h3 className="font-serif text-3xl font-bold mb-6">هل أنت مستعد للتغيير؟</h3>
                  <p className="text-primary-foreground/80 text-lg leading-relaxed mb-8">
                    خطوتك الأولى تبدأ هنا. سيتواصل معك فريقنا لتوجيهك نحو البرنامج الذي يصنع الفارق.
                  </p>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                        <MessageCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-primary-foreground/60">استفسارات سريعة؟</p>
                        <p className="font-bold text-lg" dir="ltr">hello@bikalima.com</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-primary-foreground/80">
                        <Wifi className="w-4 h-4 shrink-0" />
                        <span>تدريب جماعي عن بعد — مرونة تامة</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-primary-foreground/80">
                        <UserCheck className="w-4 h-4 shrink-0" />
                        <span>تدريب خاص ١:١ — مكثف ومخصص</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-primary-foreground/80">
                        <Globe className="w-4 h-4 shrink-0" />
                        <span>عربية وإنجليزية</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative z-10 mt-12 bg-primary-foreground/10 p-6 rounded-2xl border border-primary-foreground/20">
                  <p className="font-serif font-medium leading-relaxed italic text-lg text-center">
                    "الكلمة الواثقة تفتح أبواباً كانت تبدو مغلقة."
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
              <div className="font-serif text-4xl font-bold text-accent mb-6">بكلمة</div>
              <p className="text-background/60 leading-relaxed max-w-sm">
                مؤسسة تعليمية وتدريبية متخصصة في بناء مهارات الخطابة والتواصل للشباب والمهنيين والمعلمين.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">البرامج</h4>
              <ul className="space-y-4 text-background/70">
                {programs.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => setSelectedProgram(p)}
                      className="hover:text-accent transition"
                    >
                      {p.shortTitle}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">روابط سريعة</h4>
              <ul className="space-y-4 text-background/70">
                {[
                  { label: "البنية التدريبية", id: "structure" },
                  { label: "فلسفة الكراسات", id: "wisdom" },
                  { label: "الكراسات", id: "workbooks" },
                  { label: "تجارب العملاء", id: "testimonials" },
                ].map((item) => (
                  <li key={item.id}>
                    <button onClick={() => scrollTo(item.id)} className="hover:text-accent transition">
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center text-background/50 text-sm">
            <p>© {new Date().getFullYear()} بكلمة. جميع الحقوق محفوظة.</p>
            <div className="mt-4 md:mt-0 space-x-6 space-x-reverse">
              <a href="#" className="hover:text-white transition">الشروط والأحكام</a>
              <a href="#" className="hover:text-white transition">سياسة الخصوصية</a>
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
                aria-label="إغلاق"
                onClick={() => setSelectedProgram(null)}
                className="absolute top-6 left-6 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-foreground hover:bg-white transition-colors z-20 shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal header image — no emoji icons */}
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
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{selectedProgram.hours} ساعة تدريبية</span>
                    <span>·</span>
                    <span>{selectedProgram.sessions} جلسة</span>
                    <span>·</span>
                    <span className="font-bold text-white text-base">{formatPrice(BASE_PRICES[selectedProgram.id as keyof typeof BASE_PRICES])}</span>
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
                    <h3 className="font-bold text-2xl mb-4 border-b border-border pb-4">عن البرنامج</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">{selectedProgram.description}</p>
                  </section>

                  <section>
                    <h3 className="font-bold text-2xl mb-4 border-b border-border pb-4">التحول المستهدف</h3>
                    <div className="bg-secondary/30 p-6 rounded-2xl border border-border flex items-center gap-4">
                      <Star className="w-8 h-8 text-accent shrink-0" />
                      <p className="font-serif text-xl font-medium">{selectedProgram.transformation}</p>
                    </div>
                  </section>

                  <section>
                    <h3 className="font-bold text-2xl mb-4 border-b border-border pb-4">
                      الجلسات التدريبية ({selectedProgram.sessions} جلسة)
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
                    <h4 className="font-bold mb-4 text-muted-foreground text-sm uppercase tracking-wider">مخرجات البرنامج</h4>
                    <ul className="space-y-3">
                      {selectedProgram.outcomes.map((out, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm font-medium">{out}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Workbook info */}
                  <div className="bg-card p-5 rounded-3xl border border-primary/20 shadow-sm">
                    <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">الكراسة المرافقة</div>
                    <h4 className="font-serif font-bold text-lg mb-2">{selectedProgram.workbook.title}</h4>
                    <p className="text-sm text-muted-foreground">{selectedProgram.workbook.description}</p>
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <span className="font-bold text-lg">{formatPrice(BASE_PRICES[selectedProgram.id as keyof typeof BASE_PRICES])}</span>
                      <Button variant="outline" size="sm" className="rounded-full">طلب الكراسة</Button>
                    </div>
                  </div>

                  {/* Audience */}
                  <div className="bg-card p-5 rounded-3xl border border-border">
                    <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">الفئة المستهدفة</div>
                    <p className="text-sm font-medium">{selectedProgram.audience}</p>
                    <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                      {selectedProgram.delivery}
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full rounded-full h-14 text-lg font-bold shadow-lg bg-primary text-white hover:bg-primary/90"
                    onClick={() => {
                      setSelectedProgram(null);
                      setFormData((prev) => ({ ...prev, program: selectedProgram.shortTitle }));
                      setTimeout(() => scrollTo("enroll"), 300);
                    }}
                  >
                    سجل في البرنامج
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
