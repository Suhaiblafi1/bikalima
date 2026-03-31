import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { 
  ChevronDown, 
  ArrowLeft, 
  BookOpen, 
  Mic2, 
  Users, 
  GraduationCap,
  Play,
  CheckCircle2,
  Quote,
  Star,
  MessageCircle,
  Menu,
  X
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

// DATA
const programs = [
  {
    id: 1,
    level: "المستوى الأول",
    emoji: "🌱",
    title: "المتحدث الصغير",
    subtitle: "كراسة الخطيب الصغير",
    audience: "الأطفال (٦–١٢ سنة)",
    hook: "صوتك يستحق أن يُسمع",
    description: "برنامج متخصص يبني ثقة الطفل بنفسه من خلال فن التعبير والخطابة. يتعلم الطفل كيف يقف أمام الآخرين ببناء الجملة الصحيحة وإيصال فكرته بوضوح وثقة.",
    transformation: "من طفل خجول إلى متحدث واثق أمام جمهوره",
    outcomes: ["بناء الثقة بالنفس", "أساسيات الخطابة", "التعبير عن الأفكار", "لغة الجسد الإيجابية", "التغلب على الخجل"],
    modules: ["التعريف بالنفس", "إلقاء الكلمة", "القصة القصيرة", "التفكير المنظم", "العرض أمام الجمهور", "تطبيق شامل", "التمثيل والتعبير", "الختام والتقييم"],
    workbook: { title: "كراسة الخطيب الصغير", description: "كراسة تفاعلية مصممة للأطفال تحتوي على تمارين وأنشطة مدروسة لبناء مهارات التحدث", price: "١٢٠ ريال" },
    color: "bg-primary text-primary-foreground",
    lightColor: "bg-primary/10 text-primary",
    icon: <Mic2 className="w-6 h-6" />
  },
  {
    id: 2,
    level: "المستوى الثاني",
    emoji: "🌿",
    title: "المتحدث المؤثر",
    subtitle: "كراسة المتدرب – كبار",
    audience: "الشباب والبالغون",
    hook: "كلمتك قادرة على تغيير الغرفة",
    description: "برنامج متكامل للبالغين يرتقي بمهارات التواصل من مجرد كلام إلى خطاب مؤثر. يعمل على المنطقة اللفظية والمنطقة الذهنية والمنطقة الاجتماعية وهندسة الخطاب.",
    transformation: "من شخص عادي إلى متحدث يترك أثراً",
    outcomes: ["بناء حضور الشخصية", "تقنيات الإقناع", "إدارة القصة والحجة", "التوازن الانفعالي", "التأثير والإقناع", "الخطابة الاحترافية"],
    modules: ["تشخيص نقطة البداية", "بناء الصوت الداخلي", "الانطباع الأول", "هندسة الحديث", "التأثير والإقناع", "إدارة الانفعالات والجمهور"],
    workbook: { title: "كراسة المتدرب – كبار", description: "كراسة تدريبية عميقة تحتوي على تمارين الحضور والأداء وهندسة الخطاب والتقييم الذاتي", price: "١٥٠ ريال" },
    color: "bg-accent text-accent-foreground",
    lightColor: "bg-accent/10 text-accent-foreground",
    icon: <Users className="w-6 h-6" />
  },
  {
    id: 3,
    level: "المستوى الثالث",
    emoji: "🌳",
    title: "بكلمة للمعلمين وأولياء الأمور",
    subtitle: "برنامج البيئة الداعمة",
    audience: "المعلمون وأولياء الأمور",
    hook: "بيئة الطفل هي مستقبله",
    description: "برنامج مخصص للمعلمين وأولياء الأمور لفهم كيف يبنون بيئة داعمة لتنمية مهارات التعبير والثقة لدى الأبناء. يعالج الفجوة بين جيل الآباء وجيل الأبناء.",
    transformation: "من الضغط والتوقعات إلى الدعم الواعي والتوجيه الصحيح",
    outcomes: ["فهم نفسية الطفل", "دعم الثقة بالنفس", "التواصل الإيجابي", "إدارة التوقعات", "بناء بيئة محفزة", "التعامل مع الخجل"],
    modules: ["لماذا الآن؟", "أهداف البرنامج", "الفجوة بين الأجيال", "أساليب التعزيز", "أدوات عملية للبيت والمدرسة", "متابعة التطور"],
    workbook: { title: "دليل المعلم وولي الأمر", description: "دليل شامل يحتوي على استراتيجيات وأنشطة عملية يمكن تطبيقها في المنزل والمدرسة لبناء جيل واثق", price: "١٣٠ ريال" },
    color: "bg-primary text-primary-foreground",
    lightColor: "bg-primary/10 text-primary",
    icon: <BookOpen className="w-6 h-6" />
  },
  {
    id: 4,
    level: "المستوى الرابع",
    emoji: "🏆",
    title: "المدرب المعتمد",
    subtitle: "برنامج بكلمة للمدرب المعتمد",
    audience: "المدربون والمتخصصون",
    hook: "علّم الآخرين ما تعلمته، وأضاعف الأثر",
    description: "برنامج الاحتراف الكامل لأولئك الذين يسعون إلى حمل مشعل بكلمة وتدريب الآخرين. يمنحك الأدوات والمنهجية والاعتماد الرسمي لتقديم برامج بكلمة باحتراف.",
    transformation: "من متحدث محترف إلى مدرب معتمد يُحدث أثراً في مجتمعه",
    outcomes: ["منهجية التدريب المعتمدة", "أدوات التقييم والقياس", "بناء برامج تدريبية", "الإقناع الذكي", "الخطابة الأصيلة", "الاعتماد الرسمي"],
    modules: ["النطاق اللفظي", "النطاق الذهني", "النطاق الاجتماعي", "هندسة الخطابة", "الالتقاء القيادي", "الاعتماد الختامي"],
    workbook: { title: "كراسة المدرب المعتمد", description: "الدليل الاحترافي الشامل للمدرب المعتمد من بكلمة، يحتوي على المناهج والأدوات والتقييمات الكاملة", price: "٢٠٠ ريال" },
    color: "bg-accent text-accent-foreground",
    lightColor: "bg-accent/10 text-accent-foreground",
    icon: <GraduationCap className="w-6 h-6" />
  }
];

const testimonials = [
  { name: "سارة الأحمدي", role: "أم لثلاثة أطفال", quote: "بعد اشتراك ابنتي في برنامج المتحدث الصغير، أصبحت تتحدث أمام زملائها بثقة لا نعرفها من قبل. كانت خجولة جداً، الآن تقود التقديمات في مدرستها!" },
  { name: "محمد العتيبي", role: "مدير تسويق", quote: "برنامج المتحدث المؤثر غيّر طريقة تعاملي مع العملاء. أصبحت أعرف كيف أوصل فكرتي في ثوانٍ وأترك أثراً حقيقياً في أي اجتماع." },
  { name: "أ. نورة القحطاني", role: "معلمة لغة عربية", quote: "البرنامج المخصص للمعلمين فتح عيني على أسلوب تعاملي مع الطلاب. أدواته عملية وفعلاً تُحدث فرقاً في الفصل." },
  { name: "د. فهد الزهراني", role: "مدرب معتمد بكلمة", quote: "حصلت على الاعتماد من بكلمة وأنا الآن أدرّب المئات. المنهجية علمية والأثر حقيقي — هذا ليس مجرد برنامج، هو رسالة." }
];

const faqs = [
  { q: "كيف أختار البرنامج المناسب لي؟", a: "كل برنامج مصمم لفئة عمرية ومستوى محدد. إذا كنت تبحث لطفل (٦-١٢ سنة) اختر المتحدث الصغير، للشباب والبالغين اختر المتحدث المؤثر، وللمعلمين وأولياء الأمور برنامج البيئة الداعمة، وللراغبين في التدريب المهني اختر برنامج المدرب المعتمد." },
  { q: "هل أحتاج خبرة مسبقة للانضمام؟", a: "لا توجد متطلبات مسبقة. جميع برامجنا تبدأ من الصفر وتبني المهارات تدريجياً. البداية هي نقطة القوة في بكلمة." },
  { q: "هل يمكن شراء الكراسة دون الاشتراك في البرنامج؟", a: "نعم! يمكنك شراء أي كراسة بشكل مستقل. الكراسات مصممة لتكون مفيدة بمفردها، لكن الاستفادة القصوى تكون مع البرنامج المرافق." },
  { q: "ماذا يحدث بعد التسجيل؟", a: "ستتلقى تأكيداً على بريدك الإلكتروني خلال ٢٤ ساعة، يتضمن تفاصيل البرنامج وموعد الانطلاق وطريقة الوصول للمواد." },
  { q: "هل البرامج حضورية أم إلكترونية؟", a: "نقدم البرامج بالصيغتين. تواصل معنا عبر نموذج الانضمام لمعرفة المواعيد والأماكن المتاحة في منطقتك." }
];

export default function Home() {
  const { toast } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<typeof programs[0] | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    program: "",
    reason: ""
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
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setFormData({ name: "", email: "", phone: "", category: "", program: "", reason: "" });
      toast({
        title: "تم استلام طلبك بنجاح!",
        description: "سنتواصل معك قريباً لتأكيد تفاصيل الانضمام.",
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden relative">
      
      {/* NOISE OVERLAY */}
      <div className="pointer-events-none fixed inset-0 z-[100] opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>

      {/* NAVBAR */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-background/90 backdrop-blur-md border-b border-border py-4 shadow-sm' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="font-serif text-3xl font-bold text-primary tracking-tight">بكلمة</div>
          
          <nav className="hidden md:flex items-center gap-8 font-medium">
            <button onClick={() => scrollTo('journey')} className="text-foreground/80 hover:text-primary transition-colors">الرحلة</button>
            <button onClick={() => scrollTo('programs')} className="text-foreground/80 hover:text-primary transition-colors">البرامج</button>
            <button onClick={() => scrollTo('workbooks')} className="text-foreground/80 hover:text-primary transition-colors">الكراسات</button>
            <button onClick={() => scrollTo('testimonials')} className="text-foreground/80 hover:text-primary transition-colors">تجارب</button>
            <Button onClick={() => scrollTo('enroll')} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 rounded-full">
              ابدأ رحلتك
            </Button>
          </nav>

          <button className="md:hidden text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background pt-24 px-6 flex flex-col gap-6 md:hidden"
          >
            <button onClick={() => scrollTo('journey')} className="text-2xl font-serif text-right text-foreground/90 border-b border-border pb-4">الرحلة</button>
            <button onClick={() => scrollTo('programs')} className="text-2xl font-serif text-right text-foreground/90 border-b border-border pb-4">البرامج</button>
            <button onClick={() => scrollTo('workbooks')} className="text-2xl font-serif text-right text-foreground/90 border-b border-border pb-4">الكراسات</button>
            <button onClick={() => scrollTo('testimonials')} className="text-2xl font-serif text-right text-foreground/90 border-b border-border pb-4">تجارب</button>
            <Button size="lg" onClick={() => scrollTo('enroll')} className="w-full mt-4 text-lg bg-primary rounded-full">ابدأ رحلتك الآن</Button>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* HERO */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex items-center min-h-[90vh]">
          {/* Abstract background blobs */}
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
                  برنامج تحويلي متكامل
                </div>
                <h1 className="font-serif text-5xl md:text-7xl font-bold leading-[1.2] text-foreground mb-6">
                  بكلمة، نصنع <br/>
                  <span className="text-primary">أثراً لا يُنسى.</span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-10 max-w-lg">
                  رحلة تحويلية تبدأ من الطفل الخجول لتصل إلى المدرب المؤثر. لأننا نؤمن أن كلمة واحدة قادرة على تغيير كل شيء.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" onClick={() => scrollTo('enroll')} className="bg-primary hover:bg-primary/90 text-white rounded-full text-lg h-14 px-8">
                    ابدأ رحلة التغيير
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => scrollTo('programs')} className="rounded-full text-lg h-14 px-8 border-border hover:bg-secondary/50">
                    استكشف البرامج
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
                  src="https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=2000&auto=format&fit=crop" 
                  alt="شخص يتحدث بثقة" 
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
              <h2 className="font-serif text-4xl font-bold mb-6">لماذا بكلمة؟</h2>
              <p className="text-xl text-muted-foreground">
                في عالم مليء بالأفكار، المنتصر هو من يستطيع إيصال فكرته بوضوح، بثقة، وبطريقة تترك أثراً في قلوب مستمعيه.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "منهجية علمية متدرجة", desc: "لا نعتمد على التحفيز المؤقت، بل نبني المهارات عبر مستويات مدروسة تنقل المتدرب خطوة بخطوة.", icon: <BookOpen className="w-8 h-8" /> },
                { title: "معالجة الجذور", desc: "نعمل على بناء الثقة من الداخل (المنطقة الذهنية) قبل العمل على الأداء الخارجي (المنطقة اللفظية).", icon: <CheckCircle2 className="w-8 h-8" /> },
                { title: "أثر مستدام", desc: "٧٠٪ من الناس يعانون من الخوف من التحدث العلني. نحن نكسر هذا الخوف لمدى الحياة.", icon: <Play className="w-8 h-8" /> }
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
                  <h3 className="font-serif text-2xl font-bold mb-4">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* JOURNEY MAP */}
        <section id="journey" className="py-24 relative">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">رحلة التغيير المستمرة</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                أربعة مستويات متكاملة، تأخذ بيدك من البدايات وحتى تصبح صانعاً للأثر ومربياً للأجيال.
              </p>
            </div>

            <div className="relative max-w-5xl mx-auto">
              {/* Connector Line */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-border -translate-y-1/2 rounded-full z-0"></div>
              
              <div className="grid md:grid-cols-4 gap-8 md:gap-4 relative z-10">
                {programs.map((p, i) => (
                  <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 }}
                    className="flex flex-col items-center text-center group cursor-pointer"
                    onClick={() => scrollTo('programs')}
                  >
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl mb-6 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-2 ${p.color}`}>
                      {p.emoji}
                    </div>
                    <div className="bg-card px-4 py-2 rounded-full border border-border text-sm font-medium mb-4 text-muted-foreground">
                      {p.level}
                    </div>
                    <h3 className="font-serif text-xl font-bold mb-2">{p.title}</h3>
                    <p className="text-sm text-muted-foreground">{p.audience}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PROGRAMS */}
        <section id="programs" className="py-24 bg-card border-y border-border">
          <div className="container mx-auto px-6">
            <div className="mb-16">
              <h2 className="font-serif text-4xl font-bold mb-4">برامجنا</h2>
              <p className="text-xl text-muted-foreground">اختر المستوى الذي يناسب مرحلتك الحالية.</p>
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
                    <div className={`h-3 ${program.color}`}></div>
                    <CardContent className="p-8 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold mb-4 ${program.lightColor}`}>
                            {program.level}
                          </div>
                          <h3 className="font-serif text-3xl font-bold mb-2">{program.title}</h3>
                          <p className="text-muted-foreground">{program.audience}</p>
                        </div>
                        <div className="text-4xl">{program.emoji}</div>
                      </div>
                      
                      <div className="bg-secondary/30 p-4 rounded-xl mb-6 border border-border/50">
                        <p className="font-serif text-lg font-medium text-foreground italic">"{program.hook}"</p>
                      </div>

                      <p className="text-muted-foreground leading-relaxed mb-8 flex-grow">
                        {program.description}
                      </p>

                      <div className="space-y-3 mb-8">
                        <div className="font-bold text-sm text-primary uppercase tracking-wider mb-2">النتائج الرئيسية:</div>
                        {program.outcomes.slice(0, 3).map((outcome, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                            <span className="text-sm font-medium">{outcome}</span>
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
                            setFormData(prev => ({ ...prev, program: program.title }));
                            scrollTo('enroll');
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
              <h2 className="font-serif text-4xl font-bold mb-6">مكتبة الكراسات</h2>
              <p className="text-xl text-muted-foreground">
                كراسات تدريبية مصممة بعناية فائقة لتكون دليلك العملي. متوفرة للشراء المستقل أو كجزء من البرامج.
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
                    <div className="aspect-[3/4] relative bg-secondary/50 p-6 flex items-center justify-center">
                      {/* Faux Book Cover */}
                      <div className="w-full h-full relative rounded-r-2xl rounded-l-md shadow-[5px_5px_15px_rgba(0,0,0,0.1),inset_2px_0_5px_rgba(255,255,255,0.5)] overflow-hidden">
                        <div className={`absolute inset-0 ${program.id % 2 === 0 ? 'bg-gradient-to-br from-accent to-accent/80' : 'bg-gradient-to-br from-primary to-primary/80'}`}></div>
                        <div className="absolute left-0 top-0 bottom-0 w-4 bg-black/10"></div>
                        <div className="absolute inset-4 border border-white/20 rounded p-4 flex flex-col">
                          <div className="text-4xl mb-4 opacity-50">{program.emoji}</div>
                          <h4 className="font-serif text-white font-bold text-xl leading-tight mb-2 mt-auto">
                            {program.workbook.title}
                          </h4>
                          <p className="text-white/80 text-xs mt-2">مؤسسة بكلمة</p>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="font-serif font-bold text-lg mb-2">{program.workbook.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{program.workbook.description}</p>
                      <div className="flex items-center justify-between mt-4">
                        <span className="font-bold text-lg">{program.workbook.price}</span>
                        <Button variant="secondary" size="sm" className="rounded-full font-bold">
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
        <section id="testimonials" className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          
          <div className="container mx-auto px-6 relative z-10">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-center mb-16">أثر يبقى، وكلمة تُصنع</h2>
            
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

        {/* FAQ */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl font-bold mb-4">الأسئلة الشائعة</h2>
              <p className="text-xl text-muted-foreground">كل ما تحتاج لمعرفته قبل الانطلاق في رحلتك معنا.</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details key={i} className="group bg-card border border-border rounded-2xl overflow-hidden">
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
        <section id="enroll" className="py-24 bg-secondary/20 border-t border-border">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto bg-card rounded-[2.5rem] shadow-xl overflow-hidden border border-border/50 grid lg:grid-cols-5">
              
              {/* Form Side */}
              <div className="lg:col-span-3 p-8 md:p-12">
                <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2">انضم إلينا الآن</h2>
                <p className="text-muted-foreground mb-8">احجز مقعدك أو اطلب استشارة لتحديد البرنامج الأنسب لك.</p>

                <form onSubmit={handleEnrollSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">الاسم الكامل</Label>
                      <Input 
                        id="name" 
                        required 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="h-12 rounded-xl bg-background text-right" 
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>أنا مهتم بـ</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(val) => setFormData({...formData, category: val})}
                      >
                        <SelectTrigger className="h-12 rounded-xl bg-background">
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="child">طفلي (٦-١٢ سنة)</SelectItem>
                          <SelectItem value="adult">نفسي (بالغ / شاب)</SelectItem>
                          <SelectItem value="parent">برنامج الآباء والمعلمين</SelectItem>
                          <SelectItem value="trainer">اعتماد المدربين</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>البرنامج المفضل</Label>
                      <Select 
                        value={formData.program} 
                        onValueChange={(val) => setFormData({...formData, program: val})}
                      >
                        <SelectTrigger className="h-12 rounded-xl bg-background">
                          <SelectValue placeholder="اختر البرنامج" />
                        </SelectTrigger>
                        <SelectContent>
                          {programs.map(p => (
                            <SelectItem key={p.id} value={p.title}>{p.title}</SelectItem>
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
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
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

              {/* Info Side */}
              <div className="lg:col-span-2 bg-primary text-primary-foreground p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>
                
                <div className="relative z-10">
                  <h3 className="font-serif text-3xl font-bold mb-6">هل أنت مستعد للتغيير؟</h3>
                  <p className="text-primary-foreground/80 text-lg leading-relaxed mb-8">
                    خطوتك الأولى تبدأ هنا. املأ النموذج وسيقوم فريقنا بالتواصل معك لتوجيهك نحو البرنامج الذي سيصنع الفارق في حياتك أو حياة أبنائك.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                        <MessageCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-primary-foreground/60">استفسارات سريعة؟</p>
                        <p className="font-bold text-lg dir-ltr">hello@bikalima.com</p>
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
              <div className="font-serif text-4xl font-bold text-accent mb-6">بكلمة</div>
              <p className="text-background/60 leading-relaxed max-w-sm">
                مؤسسة تعليمية وتدريبية متخصصة في بناء مهارات التواصل والإلقاء للأطفال والبالغين والمعلمين.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6">البرامج</h4>
              <ul className="space-y-4 text-background/70">
                <li><button onClick={() => scrollTo('programs')} className="hover:text-accent transition">المتحدث الصغير</button></li>
                <li><button onClick={() => scrollTo('programs')} className="hover:text-accent transition">المتحدث المؤثر</button></li>
                <li><button onClick={() => scrollTo('programs')} className="hover:text-accent transition">البيئة الداعمة</button></li>
                <li><button onClick={() => scrollTo('programs')} className="hover:text-accent transition">المدرب المعتمد</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6">روابط سريعة</h4>
              <ul className="space-y-4 text-background/70">
                <li><button onClick={() => scrollTo('journey')} className="hover:text-accent transition">الرحلة</button></li>
                <li><button onClick={() => scrollTo('workbooks')} className="hover:text-accent transition">الكراسات</button></li>
                <li><button onClick={() => scrollTo('testimonials')} className="hover:text-accent transition">تجارب العملاء</button></li>
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
                onClick={() => setSelectedProgram(null)}
                className="absolute top-6 left-6 w-10 h-10 bg-secondary/50 rounded-full flex items-center justify-center text-foreground hover:bg-secondary transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className={`p-8 md:p-12 ${selectedProgram.color}`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-5xl bg-white/20 w-20 h-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    {selectedProgram.emoji}
                  </div>
                  <div>
                    <div className="text-sm font-bold opacity-80 uppercase tracking-wider mb-1">{selectedProgram.level}</div>
                    <h2 className="font-serif text-3xl md:text-5xl font-bold">{selectedProgram.title}</h2>
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-serif italic opacity-90 max-w-2xl">
                  "{selectedProgram.hook}"
                </p>
              </div>

              <div className="p-8 md:p-12 grid md:grid-cols-3 gap-12">
                <div className="md:col-span-2 space-y-10">
                  <section>
                    <h3 className="font-bold text-2xl mb-4 border-b border-border pb-4">عن البرنامج</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {selectedProgram.description}
                    </p>
                  </section>

                  <section>
                    <h3 className="font-bold text-2xl mb-4 border-b border-border pb-4">التحول المستهدف</h3>
                    <div className="bg-secondary/30 p-6 rounded-2xl border border-border flex items-center gap-4">
                      <Star className="w-8 h-8 text-accent shrink-0" />
                      <p className="font-serif text-xl font-medium">{selectedProgram.transformation}</p>
                    </div>
                  </section>

                  <section>
                    <h3 className="font-bold text-2xl mb-4 border-b border-border pb-4">الوحدات التدريبية</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {selectedProgram.modules.map((mod, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-background p-4 rounded-xl border border-border">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                            {idx + 1}
                          </div>
                          <span className="font-medium text-foreground">{mod}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  <div className="bg-secondary/20 p-6 rounded-3xl border border-border">
                    <h4 className="font-bold mb-4 text-muted-foreground">مخرجات البرنامج</h4>
                    <ul className="space-y-3">
                      {selectedProgram.outcomes.map((out, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm font-medium">{out}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-card p-6 rounded-3xl border border-primary/20 shadow-lg relative overflow-hidden group">
                    <div className={`absolute top-0 right-0 w-2 h-full ${selectedProgram.color}`}></div>
                    <div className="mb-2 text-xs font-bold text-muted-foreground">الكراسة المرافقة</div>
                    <h4 className="font-serif font-bold text-xl mb-3">{selectedProgram.workbook.title}</h4>
                    <p className="text-sm text-muted-foreground mb-4">{selectedProgram.workbook.description}</p>
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                      <span className="font-bold text-lg">{selectedProgram.workbook.price}</span>
                      <Button variant="outline" size="sm" className="rounded-full">طلب الكراسة</Button>
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    className={`w-full rounded-full h-14 text-lg font-bold shadow-lg ${selectedProgram.color}`}
                    onClick={() => {
                      setSelectedProgram(null);
                      setFormData(prev => ({ ...prev, program: selectedProgram.title }));
                      setTimeout(() => scrollTo('enroll'), 300);
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
