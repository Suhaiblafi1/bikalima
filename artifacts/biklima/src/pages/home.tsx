import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ArrowLeft,
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

const programs = [
  {
    id: "core",
    role: "الدورة الأساسية",
    emoji: "🎤",
    title: "المتحدث المؤثر",
    subtitle: "كراسة المتدرب – كبار",
    audience: "الشباب والمهنيون",
    hook: "كلمتك قادرة على تغيير الغرفة",
    description:
      "الدورة المحورية في بكلمة، مصممة للشباب والمهنيين الراغبين في إتقان فن الخطابة والإلقاء الاحترافي. تعمل على المنطقة اللفظية والمنطقة الذهنية والمنطقة الاجتماعية وهندسة الخطاب من جذوره.",
    transformation: "من شخص عادي إلى متحدث يترك أثراً لا يُنسى",
    prerequisite: null,
    prerequisiteLabel: null,
    delivery: "مفتوح للعموم — شباب ومهنيون",
    outcomes: [
      "بناء حضور الشخصية",
      "تقنيات الإقناع",
      "إدارة القصة والحجة",
      "التوازن الانفعالي",
      "التأثير والإقناع",
      "الخطابة الاحترافية",
    ],
    modules: [
      "تشخيص نقطة البداية",
      "بناء الصوت الداخلي",
      "الانطباع الأول",
      "هندسة الحديث",
      "التأثير والإقناع",
      "إدارة الانفعالات والجمهور",
    ],
    workbook: {
      title: "كراسة المتدرب – كبار",
      description:
        "كراسة تدريبية عميقة تحتوي على تمارين الحضور والأداء وهندسة الخطاب والتقييم الذاتي",
      price: "١٥٠ ريال",
    },
    image: imgCore,
    color: "bg-primary text-primary-foreground",
    lightColor: "bg-primary/10 text-primary",
    borderColor: "border-primary/30",
    icon: <Mic2 className="w-6 h-6" />,
  },
  {
    id: "tot",
    role: "تدريب المدربين",
    emoji: "🏆",
    title: "المدرب المعتمد",
    subtitle: "برنامج بكلمة للمدرب المعتمد",
    audience: "المدربون والمتخصصون",
    hook: "علّم الآخرين ما تعلمته، وضاعف الأثر",
    description:
      "برنامج الاحتراف الكامل لأولئك الذين يسعون إلى حمل مشعل بكلمة وتدريب الآخرين. يمنحك الأدوات والمنهجية والاعتماد الرسمي لتقديم برامج بكلمة باحتراف.",
    transformation: "من متحدث محترف إلى مدرب معتمد يُحدث أثراً في مجتمعه",
    prerequisite: "يشترط إتمام دورة المتحدث المؤثر بنجاح",
    prerequisiteLabel: "متطلب سابق إلزامي",
    delivery: "للمتخصصين الراغبين في الاعتماد — يشترط إتمام الأساسية",
    outcomes: [
      "منهجية التدريب المعتمدة",
      "أدوات التقييم والقياس",
      "بناء برامج تدريبية",
      "الإقناع الذكي",
      "الخطابة الأصيلة",
      "الاعتماد الرسمي",
    ],
    modules: [
      "النطاق اللفظي",
      "النطاق الذهني",
      "النطاق الاجتماعي",
      "هندسة الخطابة",
      "الالتقاء القيادي",
      "الاعتماد الختامي",
    ],
    workbook: {
      title: "برنامج بكلمة – المدرب المعتمد",
      description:
        "الدليل الاحترافي الشامل للمدرب المعتمد، يحتوي على المناهج والأدوات والتقييمات الكاملة",
      price: "٢٠٠ ريال",
    },
    image: imgToT,
    color: "bg-accent text-accent-foreground",
    lightColor: "bg-accent/10 text-accent-foreground",
    borderColor: "border-accent/30",
    icon: <GraduationCap className="w-6 h-6" />,
  },
  {
    id: "teachers",
    role: "المعلمون وأولياء الأمور",
    emoji: "👨‍👩‍👧",
    title: "بكلمة للمعلمين وأولياء الأمور",
    subtitle: "برنامج البيئة الداعمة",
    audience: "المعلمون وأولياء الأمور",
    hook: "بيئة الطفل هي مستقبله",
    description:
      "برنامج مخصص للمعلمين وأولياء الأمور يمنحهم حقيبة تدريبية متخصصة لبناء بيئة داعمة تنمّي مهارات التعبير والثقة لدى الأبناء. يعالج الفجوة بين جيل الآباء وجيل الأبناء.",
    transformation: "من الضغط والتوقعات إلى الدعم الواعي والتوجيه الصحيح",
    prerequisite: "يُستحسن إتمام دورة المتحدث المؤثر مسبقاً",
    prerequisiteLabel: "يُستحسن (غير إلزامي)",
    delivery: "مفتوح للمعلمين وأولياء الأمور — لا متطلب إلزامي",
    outcomes: [
      "فهم نفسية الطفل",
      "دعم الثقة بالنفس",
      "التواصل الإيجابي",
      "إدارة التوقعات",
      "بناء بيئة محفزة",
      "التعامل مع الخجل",
    ],
    modules: [
      "لماذا الآن؟",
      "أهداف البرنامج",
      "الفجوة بين الأجيال",
      "أساليب التعزيز",
      "أدوات عملية للبيت والمدرسة",
      "متابعة التطور",
    ],
    workbook: {
      title: "الحقيبة التدريبية للمعلمين وأولياء الأمور",
      description:
        "حقيبة تدريبية متخصصة تحتوي على استراتيجيات وأنشطة عملية يمكن تطبيقها في المنزل والمدرسة لبناء جيل واثق",
      price: "١٣٠ ريال",
    },
    image: imgTeachers,
    color: "bg-primary text-primary-foreground",
    lightColor: "bg-primary/10 text-primary",
    borderColor: "border-primary/30",
    icon: <Users className="w-6 h-6" />,
  },
  {
    id: "children",
    role: "برنامج المدارس",
    emoji: "🌱",
    title: "المتحدث الصغير",
    subtitle: "كراسة الخطيب الصغير",
    audience: "الأطفال (٦–١٢ سنة) — عبر المدارس",
    hook: "صوتك يستحق أن يُسمع",
    description:
      "برنامج متخصص يُقدَّم للمدارس مباشرةً عبر خريجي برنامج تأهيل المعلمين وأولياء الأمور. يبني ثقة الطفل بنفسه من خلال فن التعبير والخطابة، ويتعلم الطفل كيف يقف أمام الآخرين بوضوح وثقة.",
    transformation: "من طفل خجول إلى متحدث واثق أمام جمهوره",
    prerequisite: "يُقدَّم بواسطة خريجي برنامج المعلمين وأولياء الأمور",
    prerequisiteLabel: "مُقدَّم عبر خريجي برنامج المعلمين",
    delivery: "يُقدَّم للمدارس حصراً عبر خريجي برنامج المعلمين وأولياء الأمور المعتمدين",
    outcomes: [
      "بناء الثقة بالنفس",
      "أساسيات الخطابة",
      "التعبير عن الأفكار",
      "لغة الجسد الإيجابية",
      "التغلب على الخجل",
    ],
    modules: [
      "التعريف بالنفس",
      "إلقاء الكلمة",
      "القصة القصيرة",
      "التفكير المنظم",
      "العرض أمام الجمهور",
      "تطبيق شامل",
      "التمثيل والتعبير",
      "الختام والتقييم",
    ],
    workbook: {
      title: "كراسة الخطيب الصغير",
      description:
        "كراسة تفاعلية مصممة للأطفال تحتوي على تمارين وأنشطة مدروسة لبناء مهارات التحدث",
      price: "١٢٠ ريال",
    },
    image: imgChildren,
    color: "bg-primary text-primary-foreground",
    lightColor: "bg-primary/10 text-primary",
    borderColor: "border-primary/30",
    icon: <BookOpen className="w-6 h-6" />,
  },
];

const testimonials = [
  {
    name: "سارة الأحمدي",
    role: "أم لثلاثة أطفال",
    quote:
      "بعد اشتراك ابنتي في برنامج المتحدث الصغير، أصبحت تتحدث أمام زملائها بثقة لا نعرفها من قبل. كانت خجولة جداً، الآن تقود التقديمات في مدرستها!",
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
    a: 'الدورة الأساسية هي "المتحدث المؤثر" وهي المدخل الطبيعي لعالم بكلمة. إذا كنت تريد الوصول للاعتماد كمدرب فستحتاج إتمامها أولاً. أما إذا كنت معلماً أو ولي أمر فيمكنك الالتحاق ببرنامجنا المتخصص مباشرةً.',
  },
  {
    q: "هل يشترط إتمام الدورة الأساسية قبل برنامج المعلمين وأولياء الأمور؟",
    a: "لا يشترط ذلك. البرنامج مصمم ليكون مستقلاً وقابلاً للتطبيق مباشرةً. لكن إتمام الدورة الأساسية يعزز الاستفادة القصوى ويعطيك تجربة المتدرب قبل أن تكون المرشد.",
  },
  {
    q: "كيف يصل برنامج الأطفال للمدارس؟",
    a: 'برنامج "المتحدث الصغير" لا يُقدَّم للعموم مباشرةً، بل يُقدَّم للمدارس حصرياً عبر خريجي برنامج تأهيل المعلمين وأولياء الأمور المعتمدين من بكلمة. هذا يضمن جودة التطبيق وانسجامه مع المنهجية.',
  },
  {
    q: "هل يمكن شراء الكراسة دون الاشتراك في البرنامج؟",
    a: "نعم! يمكنك شراء أي كراسة بشكل مستقل. الكراسات مصممة لتكون مفيدة بمفردها، لكن الاستفادة القصوى تكون مع البرنامج المرافق.",
  },
  {
    q: "ماذا يحدث بعد التسجيل؟",
    a: "ستتلقى تأكيداً على بريدك الإلكتروني خلال ٢٤ ساعة، يتضمن تفاصيل البرنامج وموعد الانطلاق وطريقة الوصول للمواد.",
  },
  {
    q: "هل البرامج حضورية أم إلكترونية؟",
    a: "نقدم البرامج بالصيغتين. تواصل معنا عبر نموذج الانضمام لمعرفة المواعيد والأماكن المتاحة في منطقتك.",
  },
];

export default function Home() {
  const { toast } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<
    (typeof programs)[0] | null
  >(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    program: "",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        category: "",
        program: "",
        reason: "",
      });
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
      <div
        className="pointer-events-none fixed inset-0 z-[100] opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
        }}
      ></div>

      {/* NAVBAR */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-background/90 backdrop-blur-md border-b border-border py-4 shadow-sm" : "bg-transparent py-6"}`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="font-serif text-3xl font-bold text-primary tracking-tight">
            بكلمة
          </div>

          <nav className="hidden md:flex items-center gap-8 font-medium">
            <button
              onClick={() => scrollTo("structure")}
              className="text-foreground/80 hover:text-primary transition-colors"
            >
              البنية التدريبية
            </button>
            <button
              onClick={() => scrollTo("programs")}
              className="text-foreground/80 hover:text-primary transition-colors"
            >
              البرامج
            </button>
            <button
              onClick={() => scrollTo("workbooks")}
              className="text-foreground/80 hover:text-primary transition-colors"
            >
              الكراسات
            </button>
            <button
              onClick={() => scrollTo("testimonials")}
              className="text-foreground/80 hover:text-primary transition-colors"
            >
              تجارب
            </button>
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
            <button
              onClick={() => scrollTo("structure")}
              className="text-2xl font-serif text-right text-foreground/90 border-b border-border pb-4"
            >
              البنية التدريبية
            </button>
            <button
              onClick={() => scrollTo("programs")}
              className="text-2xl font-serif text-right text-foreground/90 border-b border-border pb-4"
            >
              البرامج
            </button>
            <button
              onClick={() => scrollTo("workbooks")}
              className="text-2xl font-serif text-right text-foreground/90 border-b border-border pb-4"
            >
              الكراسات
            </button>
            <button
              onClick={() => scrollTo("testimonials")}
              className="text-2xl font-serif text-right text-foreground/90 border-b border-border pb-4"
            >
              تجارب
            </button>
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
        {/* HERO */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex items-center min-h-[90vh]">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-secondary/60 blur-[100px] opacity-70 -z-10"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px] opacity-70 -z-10"></div>

          <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-6">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  برنامج تحويلي في فن الخطابة والإلقاء
                </div>
                <h1 className="font-serif text-5xl md:text-7xl font-bold leading-[1.2] text-foreground mb-6">
                  بكلمة، نصنع <br />
                  <span className="text-primary">أثراً لا يُنسى.</span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-10 max-w-lg">
                  دورة أساسية في الخطابة والإلقاء تؤهّل الشباب والمهنيين،
                  وتتشعّب منها مسارات لتأهيل المدربين والمعلمين وأولياء الأمور
                  والأطفال.
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
                    className="rounded-full text-lg h-14 px-8 border-border hover:bg-secondary/50"
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
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/80 to-accent/60 mix-blend-multiply z-10"></div>
                <img
                  src={imgCore}
                  alt="متحدث محترف أمام جمهور"
                  className="w-full h-full object-cover"
                />
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

        {/* WHY BIKLIMA */}
        <section className="py-24 bg-secondary/30 relative">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <h2 className="font-serif text-4xl font-bold mb-6">
                لماذا بكلمة؟
              </h2>
              <p className="text-xl text-muted-foreground">
                في عالم مليء بالأفكار، المنتصر هو من يستطيع إيصال فكرته
                بوضوح، بثقة، وبطريقة تترك أثراً في قلوب مستمعيه.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "منهجية علمية متدرجة",
                  desc: "لا نعتمد على التحفيز المؤقت، بل نبني المهارات عبر مناهج مدروسة تنقل المتدرب خطوة بخطوة.",
                  icon: <BookOpen className="w-8 h-8" />,
                },
                {
                  title: "معالجة الجذور",
                  desc: "نعمل على بناء الثقة من الداخل (المنطقة الذهنية) قبل العمل على الأداء الخارجي (المنطقة اللفظية).",
                  icon: <CheckCircle2 className="w-8 h-8" />,
                },
                {
                  title: "أثر يمتد للأجيال",
                  desc: "٧٠٪ من الناس يعانون من الخوف من التحدث العلني. نحن نكسر هذا الخوف ونمرّره عبر المعلمين والمدربين إلى الأطفال.",
                  icon: <Sparkles className="w-8 h-8" />,
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.15 }}
                  className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                    {item.icon}
                  </div>
                  <h3 className="font-serif text-2xl font-bold mb-4">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* PROGRAM STRUCTURE — BRANCHING DIAGRAM */}
        <section id="structure" className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background -z-10"></div>
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
                  ليست رحلةً متسلسلة، بل دورة أساسية تتشعّب منها ثلاثة مسارات
                  لكل من يريد صنع الأثر — بنفسه أو في أبنائه أو في مجتمعه.
                </p>
              </motion.div>
            </div>

            {/* CORE COURSE */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="w-full max-w-xl"
              >
                <div
                  className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-primary cursor-pointer group"
                  onClick={() => setSelectedProgram(coreProgram)}
                >
                  <div className="aspect-[21/9] relative">
                    <img
                      src={coreProgram.image}
                      alt={coreProgram.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent"></div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold mb-3">
                      <Star className="w-4 h-4 text-accent" />
                      الدورة الأساسية المحورية
                    </div>
                    <h3 className="font-serif text-3xl font-bold mb-1">
                      {coreProgram.title}
                    </h3>
                    <p className="text-white/80">{coreProgram.audience}</p>
                  </div>
                </div>
              </motion.div>

              {/* DOWN CONNECTOR */}
              <div className="flex flex-col items-center py-4 gap-1">
                <div className="w-px h-10 bg-primary/40"></div>
                <div className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  تتشعّب منها
                </div>
                <div className="w-px h-6 bg-primary/40"></div>
              </div>

              {/* THREE BRANCHES */}
              <div className="w-full relative">
                {/* Horizontal connector line (desktop) */}
                <div className="hidden md:block absolute top-0 left-[16.66%] right-[16.66%] h-px bg-border"></div>

                <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                  {branchPrograms.map((program, i) => (
                    <motion.div
                      key={program.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 }}
                      className="flex flex-col items-center"
                    >
                      {/* Vertical connector (desktop) */}
                      <div className="hidden md:flex flex-col items-center mb-4">
                        <div className="w-px h-8 bg-border"></div>
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      </div>

                      {/* Prerequisite badge */}
                      {program.prerequisite && (
                        <div
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-3 border ${
                            program.id === "tot"
                              ? "bg-red-50 text-red-600 border-red-200"
                              : program.id === "teachers"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
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
                      )}

                      <Card
                        className={`w-full overflow-hidden border-2 ${program.borderColor} shadow-md hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 cursor-pointer`}
                        onClick={() => setSelectedProgram(program)}
                      >
                        <div className="aspect-[4/3] relative overflow-hidden">
                          <img
                            src={program.image}
                            alt={program.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent"></div>
                          <div className="absolute bottom-4 right-4 left-4">
                            <div
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold mb-2 ${program.color}`}
                            >
                              {program.emoji} {program.role}
                            </div>
                            <h3 className="font-serif text-xl font-bold text-white leading-tight">
                              {program.title}
                            </h3>
                          </div>
                        </div>
                        <CardContent className="p-5">
                          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                            {program.description.substring(0, 110)}...
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-full text-primary border-primary/30 hover:bg-primary hover:text-white"
                          >
                            عرض التفاصيل
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-12 flex flex-wrap justify-center gap-4 text-sm">
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
        </section>

        {/* PROGRAMS — FULL CARDS */}
        <section id="programs" className="py-24 bg-card border-y border-border">
          <div className="container mx-auto px-6">
            <div className="mb-16">
              <h2 className="font-serif text-4xl font-bold mb-4">
                تفاصيل برامجنا
              </h2>
              <p className="text-xl text-muted-foreground">
                اختر المسار الذي يناسب هدفك.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {programs.map((program, i) => (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full overflow-hidden flex flex-col border-border/50 shadow-md hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                    {/* Program image banner */}
                    <div className="aspect-[16/7] relative overflow-hidden">
                      <img
                        src={program.image}
                        alt={program.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent"></div>
                      <div className="absolute bottom-4 right-4 left-4 flex items-end justify-between">
                        <div>
                          <div
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-bold mb-2 ${program.lightColor}`}
                          >
                            {program.role}
                          </div>
                          <h3 className="font-serif text-2xl font-bold text-white">
                            {program.title}
                          </h3>
                        </div>
                        <div className="text-3xl bg-white/20 backdrop-blur-sm w-12 h-12 rounded-xl flex items-center justify-center">
                          {program.emoji}
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-8 flex flex-col flex-grow">
                      {program.prerequisite && (
                        <div
                          className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl mb-5 ${
                            program.id === "tot"
                              ? "bg-red-50 text-red-600 border border-red-100"
                              : program.id === "children"
                                ? "bg-blue-50 text-blue-700 border border-blue-100"
                                : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}
                        >
                          {program.id === "tot" ? (
                            <Lock className="w-3.5 h-3.5 shrink-0" />
                          ) : program.id === "children" ? (
                            <School className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          )}
                          {program.prerequisite}
                        </div>
                      )}

                      <div className="bg-secondary/30 p-4 rounded-xl mb-6 border border-border/50">
                        <p className="font-serif text-lg font-medium text-foreground italic">
                          "{program.hook}"
                        </p>
                      </div>

                      <p className="text-muted-foreground leading-relaxed mb-8 flex-grow">
                        {program.description}
                      </p>

                      <div className="space-y-3 mb-8">
                        <div className="font-bold text-sm text-primary uppercase tracking-wider mb-2">
                          النتائج الرئيسية:
                        </div>
                        {program.outcomes.slice(0, 3).map((outcome, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                            <span className="text-sm font-medium">
                              {outcome}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-6 border-t border-border">
                        <Button
                          onClick={() => setSelectedProgram(program)}
                          className="flex-1 rounded-full"
                          variant="outline"
                        >
                          عرض التفاصيل
                        </Button>
                        <Button
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              program: program.title,
                            }));
                            scrollTo("enroll");
                          }}
                          className={`flex-1 rounded-full ${program.color} hover:opacity-90`}
                        >
                          سجل الآن
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* WORKBOOKS STORE */}
        <section id="workbooks" className="py-24 bg-background">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-serif text-4xl font-bold mb-6">
                مكتبة الكراسات
              </h2>
              <p className="text-xl text-muted-foreground">
                كراسات وحقائب تدريبية مصممة بعناية فائقة لتكون دليلك العملي.
                متوفرة للشراء المستقل أو كجزء من البرامج.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {programs.map((program, i) => (
                <motion.div
                  key={`wb-${program.id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group"
                >
                  <Card className="h-full border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <img
                        src={program.image}
                        alt={program.workbook.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div
                        className={`absolute inset-0 ${program.id === "tot" ? "bg-accent/70" : "bg-primary/70"} mix-blend-multiply`}
                      ></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent"></div>
                      {/* Book spine effect */}
                      <div className="absolute right-0 top-0 bottom-0 w-3 bg-black/20"></div>
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <div className="text-3xl mb-3 opacity-80">
                          {program.emoji}
                        </div>
                        <h4 className="font-serif font-bold text-lg leading-tight">
                          {program.workbook.title}
                        </h4>
                        <p className="text-white/70 text-xs mt-1">
                          مؤسسة بكلمة
                        </p>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="font-serif font-bold text-base mb-2 leading-snug">
                        {program.workbook.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {program.workbook.description}
                      </p>
                      <div className="flex items-center justify-between mt-4">
                        <span className="font-bold text-lg">
                          {program.workbook.price}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="rounded-full font-bold"
                        >
                          طلب شراء
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section
          id="testimonials"
          className="py-24 bg-primary text-primary-foreground relative overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(#ffffff 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          ></div>

          <div className="container mx-auto px-6 relative z-10">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-center mb-16">
              أثر يبقى، وكلمة تُصنع
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? 50 : -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="bg-primary-foreground/10 backdrop-blur-sm p-8 rounded-3xl border border-primary-foreground/20"
                >
                  <Quote className="w-10 h-10 text-accent mb-6" />
                  <p className="font-serif text-xl md:text-2xl leading-relaxed mb-8">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-xl">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold">{t.name}</h4>
                      <p className="text-primary-foreground/70 text-sm">
                        {t.role}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl font-bold mb-4">
                الأسئلة الشائعة
              </h2>
              <p className="text-xl text-muted-foreground">
                كل ما تحتاج لمعرفته عن برامجنا ومساراتها.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group bg-card border border-border rounded-2xl overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-6 cursor-pointer font-serif text-xl font-medium list-none">
                    {faq.q}
                    <span className="transition group-open:rotate-180">
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

        {/* ENROLLMENT FORM */}
        <section
          id="enroll"
          className="py-24 bg-secondary/20 border-t border-border"
        >
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto bg-card rounded-[2.5rem] shadow-xl overflow-hidden border border-border/50 grid lg:grid-cols-5">
              <div className="lg:col-span-3 p-8 md:p-12">
                <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2">
                  انضم إلينا الآن
                </h2>
                <p className="text-muted-foreground mb-8">
                  احجز مقعدك أو اطلب استشارة لتحديد البرنامج الأنسب لك.
                </p>

                <form onSubmit={handleEnrollSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">الاسم الكامل</Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
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
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="h-12 rounded-xl bg-background text-right"
                        placeholder="+966 5X XXX XXXX"
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
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="h-12 rounded-xl bg-background text-right"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>أنا مهتم بـ</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(val) =>
                          setFormData({ ...formData, category: val })
                        }
                      >
                        <SelectTrigger className="h-12 rounded-xl bg-background">
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="adult">
                            نفسي (شاب / مهني)
                          </SelectItem>
                          <SelectItem value="trainer">
                            اعتماد المدربين (ToT)
                          </SelectItem>
                          <SelectItem value="parent">
                            برنامج المعلمين وأولياء الأمور
                          </SelectItem>
                          <SelectItem value="school">
                            برنامج الأطفال (عبر المدرسة)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>البرنامج المفضل</Label>
                      <Select
                        value={formData.program}
                        onValueChange={(val) =>
                          setFormData({ ...formData, program: val })
                        }
                      >
                        <SelectTrigger className="h-12 rounded-xl bg-background">
                          <SelectValue placeholder="اختر البرنامج" />
                        </SelectTrigger>
                        <SelectContent>
                          {programs.map((p) => (
                            <SelectItem key={p.id} value={p.title}>
                              {p.title}
                            </SelectItem>
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
                      onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                      }
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
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>

                <div className="relative z-10">
                  <h3 className="font-serif text-3xl font-bold mb-6">
                    هل أنت مستعد للتغيير؟
                  </h3>
                  <p className="text-primary-foreground/80 text-lg leading-relaxed mb-8">
                    خطوتك الأولى تبدأ هنا. املأ النموذج وسيقوم فريقنا
                    بالتواصل معك لتوجيهك نحو البرنامج الذي يصنع الفارق.
                  </p>

                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                        <MessageCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-primary-foreground/60">
                          استفسارات سريعة؟
                        </p>
                        <p className="font-bold text-lg" dir="ltr">
                          hello@bikalima.com
                        </p>
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

      {/* FOOTER */}
      <footer className="bg-foreground text-background py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12 border-b border-background/10 pb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="font-serif text-4xl font-bold text-accent mb-6">
                بكلمة
              </div>
              <p className="text-background/60 leading-relaxed max-w-sm">
                مؤسسة تعليمية وتدريبية متخصصة في بناء مهارات التواصل والإلقاء
                للشباب والمهنيين والمعلمين وأولياء الأمور.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6">البرامج</h4>
              <ul className="space-y-4 text-background/70">
                <li>
                  <button
                    onClick={() => scrollTo("programs")}
                    className="hover:text-accent transition"
                  >
                    المتحدث المؤثر
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("programs")}
                    className="hover:text-accent transition"
                  >
                    المدرب المعتمد
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("programs")}
                    className="hover:text-accent transition"
                  >
                    المعلمون وأولياء الأمور
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("programs")}
                    className="hover:text-accent transition"
                  >
                    المتحدث الصغير
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6">روابط سريعة</h4>
              <ul className="space-y-4 text-background/70">
                <li>
                  <button
                    onClick={() => scrollTo("structure")}
                    className="hover:text-accent transition"
                  >
                    البنية التدريبية
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("workbooks")}
                    className="hover:text-accent transition"
                  >
                    الكراسات
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo("testimonials")}
                    className="hover:text-accent transition"
                  >
                    تجارب العملاء
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center text-background/50 text-sm">
            <p>© {new Date().getFullYear()} بكلمة. جميع الحقوق محفوظة.</p>
            <div className="mt-4 md:mt-0 space-x-6 space-x-reverse">
              <a href="#" className="hover:text-white transition">
                الشروط والأحكام
              </a>
              <a href="#" className="hover:text-white transition">
                سياسة الخصوصية
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* PROGRAM DETAIL MODAL */}
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
                className="absolute top-6 left-6 w-10 h-10 bg-secondary/50 rounded-full flex items-center justify-center text-foreground hover:bg-secondary transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal header with real image */}
              <div className="relative aspect-[16/7] overflow-hidden rounded-t-[2rem]">
                <img
                  src={selectedProgram.image}
                  alt={selectedProgram.title}
                  className="w-full h-full object-cover"
                />
                <div
                  className={`absolute inset-0 ${selectedProgram.color} opacity-80 mix-blend-multiply`}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-5xl bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      {selectedProgram.emoji}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white/80 uppercase tracking-wider mb-1">
                        {selectedProgram.role}
                      </div>
                      <h2 className="font-serif text-3xl md:text-4xl font-bold text-white">
                        {selectedProgram.title}
                      </h2>
                    </div>
                  </div>
                  {selectedProgram.prerequisite && (
                    <div
                      className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${
                        selectedProgram.id === "tot"
                          ? "bg-red-100 text-red-700"
                          : selectedProgram.id === "children"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {selectedProgram.id === "tot" ? (
                        <Lock className="w-3 h-3" />
                      ) : selectedProgram.id === "children" ? (
                        <School className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {selectedProgram.prerequisite}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 md:p-12 grid md:grid-cols-3 gap-12">
                <div className="md:col-span-2 space-y-10">
                  <section>
                    <div className="bg-secondary/30 p-5 rounded-2xl border border-border mb-6">
                      <p className="font-serif text-xl font-medium italic">
                        "{selectedProgram.hook}"
                      </p>
                    </div>
                    <h3 className="font-bold text-2xl mb-4 border-b border-border pb-4">
                      عن البرنامج
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {selectedProgram.description}
                    </p>
                  </section>

                  <section>
                    <h3 className="font-bold text-2xl mb-4 border-b border-border pb-4">
                      التحول المستهدف
                    </h3>
                    <div className="bg-secondary/30 p-6 rounded-2xl border border-border flex items-center gap-4">
                      <Star className="w-8 h-8 text-accent shrink-0" />
                      <p className="font-serif text-xl font-medium">
                        {selectedProgram.transformation}
                      </p>
                    </div>
                  </section>

                  <section>
                    <h3 className="font-bold text-2xl mb-4 border-b border-border pb-4">
                      الوحدات التدريبية
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {selectedProgram.modules.map((mod, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 bg-background p-4 rounded-xl border border-border"
                        >
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                            {idx + 1}
                          </div>
                          <span className="font-medium text-foreground">
                            {mod}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  <div className="bg-secondary/20 p-6 rounded-3xl border border-border">
                    <h4 className="font-bold mb-4 text-muted-foreground">
                      مخرجات البرنامج
                    </h4>
                    <ul className="space-y-3">
                      {selectedProgram.outcomes.map((out, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm font-medium">{out}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-card p-6 rounded-3xl border border-primary/20 shadow-lg relative overflow-hidden">
                    <div className="aspect-[4/3] relative rounded-xl overflow-hidden mb-4">
                      <img
                        src={selectedProgram.image}
                        alt={selectedProgram.workbook.title}
                        className="w-full h-full object-cover"
                      />
                      <div
                        className={`absolute inset-0 ${selectedProgram.color} opacity-60 mix-blend-multiply`}
                      ></div>
                    </div>
                    <div className="mb-2 text-xs font-bold text-muted-foreground">
                      الكراسة المرافقة
                    </div>
                    <h4 className="font-serif font-bold text-xl mb-3">
                      {selectedProgram.workbook.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      {selectedProgram.workbook.description}
                    </p>
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                      <span className="font-bold text-lg">
                        {selectedProgram.workbook.price}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                      >
                        طلب الكراسة
                      </Button>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className={`w-full rounded-full h-14 text-lg font-bold shadow-lg ${selectedProgram.color}`}
                    onClick={() => {
                      setSelectedProgram(null);
                      setFormData((prev) => ({
                        ...prev,
                        program: selectedProgram.title,
                      }));
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
