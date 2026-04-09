import React from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Users, Target, BookOpen, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export type AudienceItem = { icon: string; label: string };
export type SessionModule = { title: string; sessions: { title: string; outcome?: string }[] };
export type FaqItem = { q: string; a: string };

export type CoursePageData = {
  slug: string;
  tagline: string;
  priceJod: number | "free";
  startDate: string;
  format: string;
  audienceItems: AudienceItem[];
  outcomes: string[];
  modules: SessionModule[];
  practicePoints: string[];
  accessSteps: string[];
  faqItems: FaqItem[];
};

export const COURSE_PAGE_DATA: Record<string, CoursePageData> = {
  core: {
    slug: "influential-speaker",
    tagline: "كلمتك قادرة على تغيير الغرفة — ابنِ حضورك وقوّ تأثيرك",
    priceJod: 70,
    startDate: "مايو 2026",
    format: "مباشر · وجاهي أو أونلاين",
    audienceItems: [
      { icon: "🎓", label: "طلاب الجامعات" },
      { icon: "💼", label: "المهنيون والموظفون" },
      { icon: "🎤", label: "من يقدّم عروض أو خطب" },
      { icon: "🌱", label: "الشباب الطموح" },
      { icon: "📈", label: "أصحاب الأعمال" },
      { icon: "👤", label: "من يريد بناء الثقة بالنفس" },
    ],
    outcomes: [
      "بناء حضور شخصي قوي ومؤثر",
      "إتقان تقنيات الإقناع والتأثير",
      "هندسة الخطاب وتنظيم الرسالة بوضوح",
      "التحكم في التوتر والتوازن الانفعالي أمام الجمهور",
      "تحسين نبرة الصوت ولغة الجسد",
      "التواصل الذكي في البيئات المختلفة",
    ],
    modules: [
      {
        title: "الوحدة الأولى: الأساسيات",
        sessions: [
          { title: "من متحدث عادي إلى متحدث مؤثر", outcome: "فهم مسار التطور الخطابي" },
          { title: "الثقة، الحضور، والانطباع الأول", outcome: "بناء حضور قوي منذ اللحظة الأولى" },
          { title: "إدارة الخوف والتحكم في التوتر", outcome: "أدوات عملية لمواجهة الخشية من الجمهور" },
        ],
      },
      {
        title: "الوحدة الثانية: بناء الرسالة",
        sessions: [
          { title: "كيف تبني رسالتك بوضوح؟", outcome: "تصميم رسالة محددة ومؤثرة" },
          { title: "تنظيم الفكرة وافتتاح الحديث وختامه", outcome: "هيكلة الخطاب بشكل احترافي" },
          { title: "القصة كأداة تأثير", outcome: "توظيف السرد لتعزيز الرسالة وإحداث أثر عاطفي" },
          { title: "اختيار الكلمات وصياغة الحجج", outcome: "بناء منطق مقنع ومتماسك في الخطاب" },
        ],
      },
      {
        title: "الوحدة الثالثة: الأداء والتأثير",
        sessions: [
          { title: "نبرة الصوت، الوقفة، ولغة الجسد", outcome: "إتقان أدوات الأداء الخطابي" },
          { title: "مهارات الإقناع والتأثير", outcome: "التأثير على العقول والقلوب" },
          { title: "مخاطبة الجمهور بحسب السياق", outcome: "التكيّف مع مختلف بيئات التواصل" },
        ],
      },
      {
        title: "الوحدة الرابعة: التطبيق المتقدم",
        sessions: [
          { title: "تقديم العروض والخطابات", outcome: "تقديم عروض تقنية واحترافية" },
          { title: "إدارة الأسئلة والاعتراضات", outcome: "الإجابة بثقة وذكاء" },
          { title: "التحدث في الاجتماعات والمناسبات", outcome: "التميّز في البيئات المختلفة" },
          { title: "التغذية الراجعة وخطة التطوير الشخصي", outcome: "بناء مسار تطوير مستمر" },
        ],
      },
    ],
    practicePoints: [
      "تمارين الحضور والانطباع الأول",
      "ورش تقديم خطابات حية مع تغذية راجعة فورية",
      "تسجيل وتحليل أداء المتدرب",
      "تمارين الإقناع والتأثير العملية",
    ],
    accessSteps: [
      "أرسل طلبك وادفع الرسوم",
      "يُفعّل حسابك خلال 24 ساعة",
      "تصلك بيانات الدخول عبر البريد",
      "انضم للجلسات المباشرة وابدأ رحلتك",
    ],
    faqItems: [
      { q: "ما مستوى الدورة؟", a: "الدورة مفتوحة لجميع المستويات — لا يُشترط أي خبرة سابقة في الخطابة." },
      { q: "هل الدورة أونلاين أم وجاهية؟", a: "نقدمها بالصيغتين: تدريب جماعي أونلاين وتدريب وجاهي في عمّان والمدن الأخرى." },
      { q: "هل سأحصل على شهادة؟", a: "نعم، شهادة إتمام معتمدة من بكلمة عند إتمام البرنامج." },
      { q: "هل يمكنني الدفع بالتقسيط؟", a: "نعم، يمكنك التواصل مع الفريق للاتفاق على خطة دفع مناسبة." },
      { q: "ماذا يشمل البرنامج؟", a: "جلسات تفاعلية مباشرة، كراسة تدريبية مطبوعة، شهادة إتمام، ومواد داعمة رقمية." },
    ],
  },
  tot: {
    slug: "certified-trainer",
    tagline: "ضاعف أثرك — كن المدرب الذي يغيّر حياة الآخرين",
    priceJod: 110,
    startDate: "مايو 2026",
    format: "مباشر · وجاهي",
    audienceItems: [
      { icon: "🏆", label: "المدربون المحترفون" },
      { icon: "🎓", label: "خريجو دورة المتحدث المؤثر" },
      { icon: "📚", label: "الميسّرون والمختصون" },
      { icon: "🌍", label: "من يريد مسار تدريب احترافي" },
      { icon: "💡", label: "المدرّسون الجامعيون" },
      { icon: "🚀", label: "أصحاب مراكز التدريب" },
    ],
    outcomes: [
      "إتقان منهجية التدريب الاحترافي",
      "تصميم جلسات تدريبية مؤثرة",
      "إدارة المجموعات والتفاعل بكفاءة",
      "الحصول على الاعتماد الرسمي من بكلمة",
      "بناء مسار تدريبي مستدام",
      "الانطلاق في السوق بأدوات جاهزة",
    ],
    modules: [
      {
        title: "الوحدة الأولى: هوية المدرب",
        sessions: [
          { title: "من متحدث إلى مدرب", outcome: "التحوّل في الهوية المهنية" },
          { title: "فلسفة برنامج بكلمة وأثره", outcome: "فهم عمق المنهجية والأهداف" },
          { title: "شخصية المدرب وهويته المهنية", outcome: "بناء حضور المدرب الاحترافي" },
          { title: "أخلاقيات المدرب ومسؤولياته", outcome: "الالتزام بمعايير الاحترافية والسلوك" },
          { title: "فهم أنواع المتدربين وأساليب التعلم", outcome: "التكيّف مع مختلف أنماط التعلم" },
        ],
      },
      {
        title: "الوحدة الثانية: التصميم والإدارة",
        sessions: [
          { title: "تصميم الجلسة التدريبية", outcome: "هيكلة جلسات فعّالة ومنظمة" },
          { title: "إدارة المجموعات والتفاعل", outcome: "تقنيات إدارة الديناميكيات الجماعية" },
          { title: "بناء الأنشطة والتطبيقات", outcome: "تصميم أنشطة عملية مؤثرة" },
          { title: "توظيف الوسائل البصرية والمواد", outcome: "إثراء التجربة التدريبية بأدوات بصرية" },
          { title: "إدارة الوقت والإيقاع داخل الجلسة", outcome: "ضبط إيقاع التدريب وضمان التغطية الكاملة" },
        ],
      },
      {
        title: "الوحدة الثالثة: التقديم والتقييم",
        sessions: [
          { title: "التقديم المؤثر أمام الجمهور", outcome: "أساليب التقديم الاحترافية للمدرب" },
          { title: "الإقناع وصناعة الرسالة", outcome: "التأثير على المتدربين وتحفيزهم" },
          { title: "تقديم جلسات تجريبية — الجولة الأولى", outcome: "تطبيق عملي شامل مع تغذية راجعة" },
          { title: "تقديم جلسات تجريبية — الجولة الثانية", outcome: "تحسين الأداء بعد التغذية الراجعة" },
          { title: "التغذية الراجعة والتقييم المهني", outcome: "أدوات قياس الأداء التدريبي" },
        ],
      },
      {
        title: "الوحدة الرابعة: الاعتماد والانطلاق",
        sessions: [
          { title: "معايير المدرب المعتمد", outcome: "استيفاء شروط الاعتماد الرسمي" },
          { title: "مشروع الاعتماد النهائي", outcome: "تقديم مشروع تدريبي متكامل أمام اللجنة" },
          { title: "مراجعة الأداء وإصدار الاعتماد", outcome: "الحصول على اعتماد مدرب بكلمة الرسمي" },
          { title: "خطة الانطلاق في السوق", outcome: "بناء خطة تسويق وعمل واقعية" },
          { title: "استراتيجيات بناء قاعدة عملاء", outcome: "أدوات لاكتساب المتدربين وبناء السمعة" },
        ],
      },
    ],
    practicePoints: [
      "جلسات تجريبية أمام المجموعة مع تغذية راجعة",
      "تصميم جلسة كاملة من الصفر",
      "إدارة حالات صعبة ضمن المجموعات",
      "مشروع الاعتماد النهائي",
    ],
    accessSteps: [
      "تحقق من إتمامك لدورة المتحدث المؤثر",
      "أرسل طلب التسجيل وادفع الرسوم",
      "يُفعّل حسابك خلال 24 ساعة",
      "ابدأ مسارك نحو الاعتماد الرسمي",
    ],
    faqItems: [
      { q: "هل يشترط إتمام دورة المتحدث المؤثر؟", a: "نعم، إتمام الدورة الأساسية شرط إلزامي للالتحاق بهذا البرنامج." },
      { q: "ماذا يعني الاعتماد من بكلمة؟", a: "يؤهلك الاعتماد لتقديم برنامج بكلمة رسمياً وبناء مسار تدريبي احترافي." },
      { q: "هل يمكنني تدريب آخرين بعد الاعتماد؟", a: "نعم، ستحصل على ترخيص رسمي لتقديم برنامج بكلمة للبالغين." },
      { q: "كم مدة الحصول على الاعتماد؟", a: "عادةً 3-4 أشهر اعتماداً على الجدول الزمني للبرنامج وأدائك في الجلسات التجريبية." },
      { q: "هل تتوفر مواد داعمة للمدرب؟", a: "نعم، ستحصل على حقيبة المدرب الكاملة تشمل المناهج والأدوات والتقييمات." },
    ],
  },
  teachers: {
    slug: "educators-program",
    tagline: "بيئة الطفل هي مستقبله — أنتَ من يصنع تلك البيئة",
    priceJod: 90,
    startDate: "مايو 2026",
    format: "مباشر · أونلاين",
    audienceItems: [
      { icon: "👩‍🏫", label: "المعلمون والمدرّسون" },
      { icon: "👨‍👧", label: "أولياء الأمور" },
      { icon: "🏫", label: "إداريو المدارس" },
      { icon: "🌱", label: "المربون والموجّهون" },
      { icon: "🧩", label: "المتخصصون في تطوير الطفل" },
      { icon: "📖", label: "من يعمل مع الأطفال" },
    ],
    outcomes: [
      "إتقان منهجية تدريب الأطفال على الخطابة",
      "اكتساب أدوات تربوية مناسبة لكل عمر",
      "دمج البرنامج داخل الصف أو المنزل",
      "تعزيز مشاركة الأطفال وتجاوز الخجل",
      "قياس وتقييم تقدم الأطفال بمؤشرات واضحة",
      "بناء جيل واثق ومعبّر",
    ],
    modules: [
      {
        title: "الوحدة الأولى: الأساسيات النظرية",
        sessions: [
          { title: "لماذا نعلّم الأطفال الخطابة؟", outcome: "فهم أهمية الخطابة في تطوير الطفل" },
          { title: "الكلمة كأداة بناء شخصية", outcome: "الربط بين التعبير وتكوين الهوية" },
          { title: "كيف يختلف التدريب حسب العمر؟", outcome: "فهم المراحل العمرية وخصائصها" },
        ],
      },
      {
        title: "الوحدة الثانية: فهم الطفل",
        sessions: [
          { title: "الفروق الفردية في التعبير", outcome: "التعامل مع التنوع في الصف" },
          { title: "الحاجات النفسية في كل مرحلة", outcome: "الدعم العاطفي والنفسي للمتعلم" },
        ],
      },
      {
        title: "الوحدة الثالثة: التطبيق العملي",
        sessions: [
          { title: "كيف أقدّم الجلسة للأطفال؟", outcome: "بناء جلسة تفاعلية وفعّالة" },
          { title: "إدارة التفاعل والأنشطة", outcome: "إدارة الصف وتحفيز المشاركة" },
          { title: "تعزيز المشاركة وتجاوز الخجل", outcome: "استراتيجيات عملية لكسر الحواجز" },
          { title: "تطبيق البرنامج في الصف أو البيت", outcome: "خطة عملية للتطبيق الفوري" },
          { title: "نماذج تدريب عملية", outcome: "تطبيق فعلي مع تغذية راجعة" },
          { title: "التقييم والمتابعة", outcome: "قياس الأثر ومتابعة التقدم" },
        ],
      },
    ],
    practicePoints: [
      "تمارين تطبيقية داخل الصف",
      "سيناريوهات واقعية لإدارة المجموعات",
      "تصميم أنشطة مناسبة للعمر",
      "جلسات تطبيق مباشرة مع الأطفال",
    ],
    accessSteps: [
      "أرسل طلبك وادفع الرسوم",
      "يُفعّل حسابك خلال 24 ساعة",
      "تصلك حقيبة المعلم الرقمية",
      "ابدأ تطبيق البرنامج في بيئتك",
    ],
    faqItems: [
      { q: "هل يشترط إتمام دورة المتحدث المؤثر؟", a: "لا يشترط، لكنه يُعزز الاستفادة القصوى من البرنامج." },
      { q: "هل البرنامج مناسب لأولياء الأمور؟", a: "نعم، البرنامج موجّه للمعلمين وأولياء الأمور معاً." },
      { q: "هل يمكن تطبيق البرنامج في المنزل؟", a: "نعم، يحتوي البرنامج على أنشطة ومحتوى خصيصاً لتطبيقه في البيئة المنزلية." },
      { q: "هل سأحصل على شهادة؟", a: "نعم، شهادة إتمام معتمدة من بكلمة عند إكمال البرنامج." },
      { q: "هل يمكنني تدريب أطفال المدارس بعد الانتهاء؟", a: "ستتأهل لتدريب الأطفال في المنزل والمدرسة، والتسجيل لبرنامج المدرب المعتمد لو أردت التوسع." },
    ],
  },
  children: {
    slug: "young-speaker",
    tagline: "صوتك يستحق أن يُسمع — برنامج للأطفال عبر مدارسهم",
    priceJod: 50,
    startDate: "حسب جدول المدرسة",
    format: "وجاهي · داخل المدارس",
    audienceItems: [
      { icon: "👦", label: "الأطفال (٥–١٢ سنة)" },
      { icon: "👧", label: "اليافعون (١٢–١٦ سنة)" },
      { icon: "🏫", label: "مدارس مشتركة في البرنامج" },
      { icon: "🌟", label: "الأطفال الخجولون" },
      { icon: "🎯", label: "من يريد بناء الثقة" },
      { icon: "🤝", label: "أطفال يعانون من التعبير" },
    ],
    outcomes: [
      "بناء الثقة بالنفس أمام الآخرين",
      "إتقان أساسيات الخطابة المناسبة للعمر",
      "استخدام الصوت ولغة الجسد بثقة",
      "ترتيب الأفكار وإيصالها بوضوح",
      "التأثير والإقناع بأسلوب بسيط",
      "الحضور الواثق أمام الجمهور",
    ],
    modules: [
      {
        title: "الوحدة الأولى: أنا أتكلم",
        sessions: [
          { title: "أتكلم بثقة", outcome: "بناء شجاعة التحدث أمام الآخرين" },
          { title: "كيف أعبّر عن نفسي دون خوف", outcome: "التغلب على الخجل والتردد" },
          { title: "ما معنى أن أتحدث أمام الآخرين؟", outcome: "فهم معنى الخطابة وأهميتها" },
        ],
      },
      {
        title: "الوحدة الثانية: أنا أُنظّم أفكاري",
        sessions: [
          { title: "كيف أبدأ حديثي بشكل جميل؟", outcome: "مهارة الافتتاح الجذّاب" },
          { title: "ترتيب أفكاري قبل الكلام", outcome: "التفكير المنطقي قبل التحدث" },
          { title: "نبرة الصوت ولغة الجسد", outcome: "توظيف الجسد والصوت بثقة" },
        ],
      },
      {
        title: "الوحدة الثالثة: أنا أُؤثّر",
        sessions: [
          { title: "كيف أوصل فكرتي بوضوح؟", outcome: "الوضوح في التعبير والإيصال" },
          { title: "كيف أترك أثرًا جميلًا في كلامي؟", outcome: "الختام المؤثر وبناء الذاكرة" },
          { title: "عرضي الأول أمام المجموعة", outcome: "أول تجربة خطابية حقيقية" },
        ],
      },
    ],
    practicePoints: [
      "ألعاب تعبير وتواصل تفاعلية",
      "تمارين الصوت ولغة الجسد للأطفال",
      "قصص وأنشطة مدروسة حسب العمر",
      "عرض نهائي أمام الصف والأهل",
    ],
    accessSteps: [
      "تواصل مع مدرستك لمعرفة التوفر",
      "تُقدَّم الجلسات من خلال مدرب معتمد",
      "يتابع فريق بكلمة جودة التنفيذ",
      "تحصل المدرسة على تقرير أثر نهائي",
    ],
    faqItems: [
      { q: "كيف يصل البرنامج للمدارس؟", a: "يُقدَّم البرنامج للمدارس حصراً عبر خريجي برنامج المعلمين المعتمدين." },
      { q: "ما الفئة العمرية المستهدفة؟", a: "الأطفال من سن ٥ إلى ١٦ سنة." },
      { q: "كيف يمكن لمدرستنا الانضمام؟", a: "تواصل معنا عبر البريد الإلكتروني أو واتساب وسنرتب لك جلسة تعريفية." },
      { q: "هل هناك متطلبات خاصة للمدرسة؟", a: "نحتاج فقط إلى قاعة دراسية مناسبة وجدول زمني متفق عليه مع المدرسة." },
      { q: "كم عدد الطلاب المثالي في كل مجموعة؟", a: "المجموعة المثالية بين ١٠ إلى ١٥ طالباً لضمان الجودة والتفاعل." },
    ],
  },
};

export function getCoursePageData(programId: string): CoursePageData | undefined {
  return COURSE_PAGE_DATA[programId];
}

type Lang = "ar" | "en";

interface CourseHeroProps {
  title: string;
  tagline: string;
  role: string;
  sessions: number;
  hours: number;
  priceJod: number | "free";
  format: string;
  slug: string;
  heroGradient: string;
  coverImage?: string;
  lang: Lang;
}

export function CourseHero({ title, tagline, role, sessions, hours, priceJod, format, slug, heroGradient, coverImage, lang }: CourseHeroProps) {
  const [, navigate] = useLocation();
  const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  return (
    <div className={`relative bg-gradient-to-br ${heroGradient} text-white overflow-hidden`}>
      {coverImage && (
        <div className="absolute inset-0">
          <img src={coverImage} alt={title} className="w-full h-full object-cover opacity-25" />
          <div className={`absolute inset-0 bg-gradient-to-br ${heroGradient} opacity-80`} />
        </div>
      )}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="flex flex-col gap-5 max-w-2xl">
          <span className="inline-block text-xs font-bold tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full w-fit">
            {role}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight">{title}</h1>
          <p className="text-base sm:text-lg text-white/85 leading-relaxed">{tagline}</p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {sessions} {lang === "ar" ? "جلسة" : "sessions"}
            </span>
            <span className="text-white/40">·</span>
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4" />
              {hours} {lang === "ar" ? "ساعة تدريب" : "training hours"}
            </span>
            <span className="text-white/40">·</span>
            <span className="flex items-center gap-1.5">
              {format}
            </span>
            {typeof priceJod === "number" && (
              <>
                <span className="text-white/40">·</span>
                <span className="font-bold text-white text-base">
                  {priceJod} {lang === "ar" ? "د.أ" : "JOD"}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mt-2">
            <Button
              size="lg"
              className="bg-white text-gray-900 hover:bg-white/90 font-bold rounded-full px-8 shadow-lg"
              onClick={() => navigate(`${baseUrl}/checkout?slug=${slug}`)}
            >
              {lang === "ar" ? "سجّل وادفع الآن" : "Register & Pay Now"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StickyPurchaseCardProps {
  priceJod: number | "free";
  sessions: number;
  startDate: string;
  format: string;
  slug: string;
  lang: Lang;
}

export function StickyPurchaseCard({ priceJod, sessions, startDate, format, slug, lang }: StickyPurchaseCardProps) {
  const [, navigate] = useLocation();
  const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  return (
    <div className="sticky top-24 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {lang === "ar" ? "رسوم البرنامج" : "Program Fee"}
          </p>
          <p className="text-3xl font-black text-primary">
            {typeof priceJod === "number" ? priceJod : "—"}{" "}
            <span className="text-base font-semibold text-muted-foreground">{lang === "ar" ? "د.أ" : "JOD"}</span>
          </p>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground border-t border-border pt-4">
          <div className="flex justify-between">
            <span>{lang === "ar" ? "عدد الجلسات" : "Sessions"}</span>
            <span className="font-semibold text-foreground">{sessions} {lang === "ar" ? "جلسة" : "sessions"}</span>
          </div>
          <div className="flex justify-between">
            <span>{lang === "ar" ? "الصيغة" : "Format"}</span>
            <span className="font-semibold text-foreground">{format}</span>
          </div>
          <div className="flex justify-between">
            <span>{lang === "ar" ? "يبدأ" : "Starts"}</span>
            <span className="font-semibold text-foreground">{startDate}</span>
          </div>
        </div>

        <>
          <Button
            className="w-full rounded-xl font-bold py-6 text-base"
            onClick={() => navigate(`${baseUrl}/checkout?slug=${slug}`)}
          >
            {lang === "ar" ? "سجّل وادفع الآن" : "Register & Pay Now"}
          </Button>
          <p className="text-center text-xs text-muted-foreground leading-relaxed">
            {lang === "ar"
              ? "بعد التسجيل ستصلك بيانات الدخول فوراً"
              : "Login credentials sent immediately after registration"}
          </p>
        </>

        <div className="space-y-2 border-t border-border pt-4">
          {[
            lang === "ar" ? "جلسات تفاعلية مباشرة" : "Live interactive sessions",
            lang === "ar" ? "كراسة تدريبية مطبوعة" : "Printed training workbook",
            lang === "ar" ? "شهادة إتمام معتمدة" : "Certified completion certificate",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface AudienceSectionProps {
  items: AudienceItem[];
  lang: Lang;
}

export function AudienceSection({ items, lang }: AudienceSectionProps) {
  return (
    <section className="py-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {lang === "ar" ? "لمن هذا البرنامج؟" : "Who Is This Program For?"}
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-3 border border-border">
            <span className="text-2xl">{item.icon}</span>
            <span className="text-sm font-medium text-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

interface OutcomesSectionProps {
  outcomes: string[];
  lang: Lang;
}

export function OutcomesSection({ outcomes, lang }: OutcomesSectionProps) {
  return (
    <section className="py-10 border-t border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Target className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {lang === "ar" ? "ماذا ستتعلم وتكتسب؟" : "What Will You Learn?"}
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {outcomes.map((outcome, i) => (
          <div key={i} className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <span className="text-sm text-foreground leading-relaxed">{outcome}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

interface HowItWorksProps {
  lang: Lang;
}

export function HowItWorks({ lang }: HowItWorksProps) {
  const steps = lang === "ar"
    ? [
        { icon: "📖", title: "تعلّم", desc: "جلسات مباشرة مع صهيب الخوالدة" },
        { icon: "⚡", title: "طبّق", desc: "تمارين عملية في كل جلسة" },
        { icon: "🔄", title: "تغذية راجعة", desc: "تقييم فوري لأدائك" },
        { icon: "📈", title: "تطوّر", desc: "قياس أثرك وتتبّع تقدمك" },
      ]
    : [
        { icon: "📖", title: "Learn", desc: "Live sessions with Suhaib Al-Khawaldeh" },
        { icon: "⚡", title: "Apply", desc: "Practical exercises every session" },
        { icon: "🔄", title: "Feedback", desc: "Instant assessment of your performance" },
        { icon: "📈", title: "Grow", desc: "Track your progress and impact" },
      ];

  return (
    <section className="py-10 border-t border-border">
      <h2 className="text-xl font-bold text-foreground mb-6">
        {lang === "ar" ? "كيف يعمل البرنامج؟" : "How Does the Program Work?"}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center text-center gap-3 bg-muted/30 rounded-2xl p-5 border border-border">
            <span className="text-3xl">{step.icon}</span>
            <span className="font-bold text-foreground text-sm">{step.title}</span>
            <span className="text-xs text-muted-foreground leading-relaxed">{step.desc}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export type DbLesson = {
  id: string;
  titleAr: string;
  titleEn: string;
  isFreePreview: boolean;
  sortOrder: number;
};

interface SessionsAccordionProps {
  modules: SessionModule[];
  dbLessons?: DbLesson[];
  lang: Lang;
}

export function SessionsAccordion({ modules, dbLessons, lang }: SessionsAccordionProps) {
  const hasDbLessons = dbLessons && dbLessons.length > 0;

  return (
    <section className="py-10 border-t border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {lang === "ar" ? "محتوى البرنامج" : "Program Content"}
        </h2>
      </div>

      {hasDbLessons ? (
        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border/50">
          {[...dbLessons].sort((a, b) => a.sortOrder - b.sortOrder).map((lesson, i) => (
            <div key={lesson.id} className="px-5 py-3 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div className="flex-1 flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-foreground">
                  {lang === "ar" ? lesson.titleAr : lesson.titleEn}
                </p>
                {lesson.isFreePreview && (
                  <span className="shrink-0 text-xs font-semibold bg-primary/10 text-primary rounded-full px-2 py-0.5">
                    {lang === "ar" ? "معاينة مجانية" : "Free Preview"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={["module-0"]} className="space-y-2">
          {modules.map((mod, mi) => (
            <AccordionItem key={mi} value={`module-${mi}`} className="border border-border rounded-xl overflow-hidden px-0">
              <AccordionTrigger className="px-5 py-4 bg-muted/30 hover:bg-muted/50 hover:no-underline font-semibold text-start">
                <span>{mod.title}</span>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0">
                <div className="divide-y divide-border/50">
                  {mod.sessions.map((session, si) => (
                    <div key={si} className="px-5 py-3 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {si + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{session.title}</p>
                        {session.outcome && (
                          <p className="text-xs text-muted-foreground mt-0.5">{session.outcome}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </section>
  );
}

interface PracticeSectionProps {
  practicePoints: string[];
  lang: Lang;
}

export function PracticeSection({ practicePoints, lang }: PracticeSectionProps) {
  return (
    <section className="py-10 border-t border-border">
      <h2 className="text-xl font-bold text-foreground mb-6">
        {lang === "ar" ? "ركائز التطبيق العملي" : "Practical Training Pillars"}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {practicePoints.map((point, i) => (
          <div key={i} className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
            <span className="text-primary font-black text-lg leading-none mt-0.5">{i + 1}</span>
            <span className="text-sm text-foreground leading-relaxed">{point}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

interface AccessSectionProps {
  accessSteps: string[];
  lang: Lang;
}

export function AccessSection({ accessSteps, lang }: AccessSectionProps) {
  return (
    <section className="py-10 border-t border-border">
      <h2 className="text-xl font-bold text-foreground mb-6">
        {lang === "ar" ? "كيف تصل إلى البرنامج؟" : "How to Access the Program"}
      </h2>
      <div className="space-y-3">
        {accessSteps.map((step, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </div>
            <span className="text-sm text-foreground leading-relaxed">{step}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

interface TrainerSectionProps {
  lang: Lang;
}

export function TrainerSection({ lang }: TrainerSectionProps) {
  const isAr = lang === "ar";
  return (
    <section className="py-10 border-t border-border">
      <h2 className="text-xl font-bold text-foreground mb-6">
        {isAr ? "عن المدرب" : "About the Trainer"}
      </h2>
      <div className="flex flex-col sm:flex-row items-start gap-5 bg-muted/30 rounded-2xl p-6 border border-border">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl shrink-0">
          🎤
        </div>
        <div className="space-y-2">
          <p className="font-bold text-lg text-foreground">
            {isAr ? "صهيب الخوالدة" : "Suhaib Al-Khawaldeh"}
          </p>
          <p className="text-sm text-primary font-medium">
            {isAr
              ? "مستشار · باحث دكتوراه · متحدث TEDx · مؤسس بكلمة"
              : "Consultant · PhD Researcher · TEDx Speaker · Founder of Bikalima"}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isAr
              ? "مستشار يعمل مع مجموعة من المؤسسات التنموية والخيرية والحكومية في المنطقة، من بينها Qatar Foundation، ووزارة الاقتصاد والسياحة في الإمارات. محاضر في عدد من الجامعات، باحث دكتوراه في Aston University (UK)، ومتحدث TEDx ومؤلف سلسلة كراسات بكلمة."
              : "A consultant working with development, charitable and government organisations across the region, including Qatar Foundation and the UAE Ministry of Economy and Tourism. Lecturer and PhD researcher at Aston University (UK). TEDx speaker and author of the Bikalima training workbook series."}
          </p>
        </div>
      </div>
    </section>
  );
}

interface FAQSectionProps {
  faqItems: FaqItem[];
  lang: Lang;
}

export function FAQSection({ faqItems, lang }: FAQSectionProps) {
  return (
    <section className="py-10 border-t border-border">
      <h2 className="text-xl font-bold text-foreground mb-6">
        {lang === "ar" ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
      </h2>
      <Accordion type="multiple" className="space-y-2">
        {faqItems.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl overflow-hidden px-0">
            <AccordionTrigger className="px-5 py-4 hover:no-underline font-medium text-start text-foreground">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-4 text-muted-foreground leading-relaxed">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

interface FinalCTAProps {
  title: string;
  priceJod: number | "free";
  slug: string;
  lang: Lang;
}

export function FinalCTA({ title, priceJod, slug, lang }: FinalCTAProps) {
  const [, navigate] = useLocation();
  const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  return (
    <section className="py-10 border-t border-border">
      <div className="bg-primary rounded-2xl p-8 text-center text-white space-y-4">
        <h2 className="text-2xl font-black">
          {lang === "ar" ? `ابدأ رحلتك في ${title} الآن` : `Start your journey in ${title} now`}
        </h2>
        <p className="text-white/80">
          {lang === "ar"
            ? `انضم للبرنامج مقابل ${typeof priceJod === "number" ? priceJod : "—"} د.أ فقط`
            : `Join the program for just ${typeof priceJod === "number" ? priceJod : "—"} JOD`}
        </p>
        <Button
          size="lg"
          className="bg-white text-gray-900 hover:bg-white/90 font-bold rounded-full px-10 shadow-lg"
          onClick={() => navigate(`${baseUrl}/checkout?slug=${slug}`)}
        >
          {lang === "ar" ? "سجّل وادفع الآن" : "Register & Pay Now"}
        </Button>
      </div>
    </section>
  );
}
