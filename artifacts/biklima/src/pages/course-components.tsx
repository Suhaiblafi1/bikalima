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
        title: "اللقاء الافتتاحي — من متحدث إلى مؤثر",
        sessions: [
          { title: "من متحدث عادي إلى متحدث مؤثر", outcome: "فهم مسار التطور الخطابي وخارطة البرنامج" },
        ],
      },
      {
        title: "المنطقة الحفظية — الصوت والأداء والحضور",
        sessions: [
          { title: "الثقة، الحضور، والانطباع الأول", outcome: "بناء حضور قوي ومؤثر منذ اللحظة الأولى" },
          { title: "إدارة الخوف والتحكم في التوتر", outcome: "أدوات عملية لتحويل التوتر إلى طاقة إيجابية" },
          { title: "نبرة الصوت، الوقفة، ولغة الجسد", outcome: "إتقان أدوات الأداء الخطابي وتعظيم الأثر" },
        ],
      },
      {
        title: "المنطقة الذهنية — اللغة والمنطق والقصة",
        sessions: [
          { title: "كيف تبني رسالتك بوضوح؟", outcome: "تصميم رسالة واضحة ومؤثرة بمنطق متماسك" },
          { title: "تنظيم الفكرة وافتتاح الحديث وختامه", outcome: "هيكلة الخطاب بشكل احترافي يُبقي المستمع منتبهاً" },
          { title: "القصة كأداة تأثير", outcome: "توظيف السرد القصصي لتعزيز الرسالة وإحداث أثر عاطفي عميق" },
        ],
      },
      {
        title: "المنطقة الاجتماعية — التأثير والإقناع والتكيّف",
        sessions: [
          { title: "اختيار الكلمات وصياغة الحجج", outcome: "بناء منطق مقنع ومتماسك يُحرّك العقول" },
          { title: "مهارات الإقناع والتأثير", outcome: "فهم مفاتيح التأثير على العقول والقلوب معاً" },
          { title: "مخاطبة الجمهور بحسب السياق", outcome: "التكيّف الذكي مع مختلف بيئات التواصل وأنواع الجماهير" },
        ],
      },
      {
        title: "هندسة الخطاب — التطبيق والاحتراف",
        sessions: [
          { title: "تقديم العروض والخطابات الاحترافية", outcome: "تقديم عروض تقنية ومهنية باحتراف عالٍ" },
          { title: "إدارة الأسئلة والاعتراضات", outcome: "الإجابة بثقة وذكاء تحت الضغط" },
          { title: "التحدث في الاجتماعات والمناسبات المختلفة", outcome: "التميّز والتأثير في البيئات المتنوعة" },
          { title: "التغذية الراجعة وخطة التطوير الشخصي", outcome: "بناء مسار تطوير مستمر بعد البرنامج" },
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
        title: "المحور الأول — اللقاء الافتتاحي وهوية المدرب",
        sessions: [
          { title: "من متحدث إلى مدرب — التحوّل في الدور", outcome: "استيعاب الفرق الجوهري بين المتحدث والمدرب واكتساب العقلية الجديدة" },
          { title: "فلسفة برنامج بكلمة وأثره التحويلي", outcome: "فهم عمق المنهجية والأهداف التي تميّز بكلمة عن غيره" },
          { title: "شخصية المدرب وهويته المهنية", outcome: "بناء حضور المدرب الاحترافي وتطوير الأسلوب الخاص" },
          { title: "أخلاقيات المدرب ومسؤولياته", outcome: "الالتزام بمعايير الاحترافية والسلوك المهني في التدريب" },
          { title: "فهم أنواع المتدربين وأساليب التعلم", outcome: "التكيّف مع مختلف أنماط التعلم لضمان أثر التدريب" },
        ],
      },
      {
        title: "المحور الثاني — تصميم التدريب وإدارة الجلسة",
        sessions: [
          { title: "تصميم الجلسة التدريبية من الصفر", outcome: "هيكلة جلسات فعّالة ومنظمة تحقق الأهداف التعليمية" },
          { title: "إدارة المجموعات والتفاعل الحيّ", outcome: "تقنيات قيادة ديناميكيات الجماعة وتفعيل المشاركة" },
          { title: "بناء الأنشطة والتطبيقات العملية", outcome: "تصميم أنشطة مؤثرة تُرسّخ التعلّم وتُحفّز المتدربين" },
          { title: "توظيف الوسائل البصرية ومواد التدريب", outcome: "إثراء التجربة التدريبية بأدوات بصرية وتقنية احترافية" },
          { title: "إدارة الوقت والإيقاع داخل الجلسة", outcome: "ضبط إيقاع التدريب وضمان التغطية الكاملة دون إرهاق" },
        ],
      },
      {
        title: "المحور الثالث — التقديم والتجريب والتقييم",
        sessions: [
          { title: "التقديم المؤثر من منظور المدرب", outcome: "إتقان أساليب التقديم الاحترافية التي تُلهم المتدربين" },
          { title: "الإقناع وصناعة رسالة المدرب", outcome: "التأثير على المتدربين وتحفيزهم من خلال الكلمة الموجَّهة" },
          { title: "الجلسة التجريبية — الجولة الأولى", outcome: "تطبيق عملي شامل أمام المجموعة مع تغذية راجعة فورية ومفصّلة" },
          { title: "الجلسة التجريبية — الجولة الثانية", outcome: "تحسين الأداء بعد استيعاب التغذية الراجعة والارتقاء للمستوى التالي" },
          { title: "التغذية الراجعة والتقييم المهني", outcome: "إتقان أدوات قياس الأداء التدريبي وتقديم تغذية راجعة بنّاءة" },
        ],
      },
      {
        title: "المحور الرابع — الاعتماد والانطلاق في السوق",
        sessions: [
          { title: "معايير المدرب المعتمد من بكلمة", outcome: "استيعاب شروط الاعتماد الرسمي والمؤشرات التي تُقيَّم وفقها" },
          { title: "مشروع الاعتماد النهائي", outcome: "تقديم مشروع تدريبي متكامل أمام لجنة التقييم والحصول على التغذية الختامية" },
          { title: "مراجعة الأداء وإصدار الاعتماد", outcome: "استلام اعتماد مدرب بكلمة الرسمي وفهم حقوقه ومسؤولياته" },
          { title: "خطة الانطلاق في السوق", outcome: "بناء خطة تسويق وعمل واقعية قابلة للتنفيذ الفوري" },
          { title: "استراتيجيات بناء قاعدة المتدربين والسمعة", outcome: "أدوات عملية لاكتساب المتدربين وبناء سمعة مهنية مستدامة" },
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
        title: "الوحدة الأولى — لماذا الكلمة؟ السياق والأهمية",
        sessions: [
          { title: "لماذا نعلّم الأطفال الخطابة في هذا العصر؟", outcome: "فهم أهمية التعبير الشفهي في تطوير شخصية الطفل وتجهيزه للمستقبل" },
          { title: "الكلمة كأداة بناء شخصية وهوية", outcome: "الربط العميق بين قدرة التعبير وتكوين هوية الطفل وثقته بنفسه" },
          { title: "كيف يختلف التدريب حسب العمر والمرحلة؟", outcome: "فهم المراحل العمرية وخصائصها لتصميم تجارب تدريبية ملائمة" },
        ],
      },
      {
        title: "الوحدة الثانية — فهم الطفل وخصائص مراحله",
        sessions: [
          { title: "الفروق الفردية في التعبير والتواصل", outcome: "التعامل الذكي مع التنوع داخل الصف وبين الأطفال" },
          { title: "الحاجات النفسية والعاطفية في كل مرحلة", outcome: "تقديم الدعم النفسي الملائم لكل مرحلة وبناء بيئة آمنة للتعبير" },
        ],
      },
      {
        title: "الوحدة الثالثة — منهجية التدريب والتطبيق",
        sessions: [
          { title: "كيف أقدّم الجلسة للأطفال بفاعلية؟", outcome: "بناء جلسة تفاعلية ومشوّقة تناسب عمر الطفل وخصائصه" },
          { title: "إدارة التفاعل والأنشطة داخل الجلسة", outcome: "إدارة الصف وتحفيز المشاركة بأدوات إبداعية ومدروسة" },
          { title: "تعزيز المشاركة وتجاوز الخجل والتردد", outcome: "استراتيجيات عملية لكسر حواجز الخوف وبناء الثقة التدريجية" },
        ],
      },
      {
        title: "الوحدة الرابعة — التطبيق في البيئات المختلفة",
        sessions: [
          { title: "تطبيق البرنامج داخل الصف المدرسي", outcome: "خطة عملية لدمج البرنامج ضمن بيئة الصف وجدول المدرسة" },
          { title: "تطبيق البرنامج في البيت مع الأسرة", outcome: "أدوات وأنشطة يومية يمارسها ولي الأمر مع طفله في البيت" },
        ],
      },
      {
        title: "الوحدة الخامسة — القياس والمتابعة والأثر",
        sessions: [
          { title: "نماذج تدريب عملية والتقييم والمتابعة", outcome: "تجربة تدريب حيّة مع الأطفال ورصد الأثر الفعلي بمؤشرات واضحة" },
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
        title: "الدرس الأول — التعريف بالنفس",
        sessions: [
          { title: "أتكلم بثقة أمام الآخرين", outcome: "بناء شجاعة التحدث والتغلب على الخجل للمرة الأولى" },
          { title: "ما معنى أن أتحدث أمام الآخرين؟", outcome: "فهم معنى الخطابة وأهميتها بأسلوب ممتع ومناسب للعمر" },
        ],
      },
      {
        title: "الدرس الثاني — الجرأة والانطلاق",
        sessions: [
          { title: "كيف أعبّر عن نفسي دون خوف؟", outcome: "التغلب على الخجل والتردد بخطوات عملية وآمنة" },
          { title: "خطواتي الأولى أمام المجموعة", outcome: "تجربة التحدث أمام الأصدقاء في جو مشجّع وممتع" },
        ],
      },
      {
        title: "الدرس الثالث — الاستعداد قبل الكلام",
        sessions: [
          { title: "ترتيب أفكاري قبل أن أتكلم", outcome: "التفكير المنطقي وتنظيم الأفكار قبل الوقوف أمام الجمهور" },
          { title: "كيف أبدأ حديثي بشكل جميل؟", outcome: "إتقان مهارة الافتتاح الجذّاب الذي يشدّ انتباه الجمهور" },
        ],
      },
      {
        title: "الدرس الرابع — الصوت ولغة الجسد",
        sessions: [
          { title: "نبرة صوتي وكيف أستخدمها؟", outcome: "اكتشاف قوة الصوت وتعلّم التنويع في النبرة والإيقاع" },
          { title: "جسدي يتكلم — الوقوف والنظر والحركة", outcome: "توظيف لغة الجسد بثقة لتعزيز التأثير في المستمع" },
        ],
      },
      {
        title: "الدرس الخامس — فن القصة",
        sessions: [
          { title: "كيف أحكي قصة تشدّ الانتباه؟", outcome: "إتقان عناصر القصة الجذّابة والتشويق في السرد" },
          { title: "القصة كأداة تأثير وإقناع", outcome: "توظيف القصة لإيصال الأفكار والتأثير في مشاعر المستمع" },
        ],
      },
      {
        title: "الدرس السادس — الإقناع والتأثير",
        sessions: [
          { title: "كيف أوصل فكرتي بوضوح؟", outcome: "الوضوح في التعبير وإيصال الرسالة بأقل الكلمات وأكثرها تأثيراً" },
          { title: "أساليب الإقناع البسيطة والفعّالة", outcome: "تعلّم طرق الإقناع المناسبة للعمر لتحقيق الأثر المرجو" },
        ],
      },
      {
        title: "الدرس السابع — إدارة الجمهور",
        sessions: [
          { title: "كيف أتعامل مع جمهوري بثقة؟", outcome: "إدارة الجمهور والتفاعل معه بأسلوب طبيعي ومريح" },
          { title: "كيف أترك أثرًا جميلًا في كلامي؟", outcome: "صياغة الختام المؤثر الذي يبقى في ذاكرة المستمع" },
        ],
      },
      {
        title: "الدرس الثامن — خطبتي الكبيرة",
        sessions: [
          { title: "عرضي الأول الكامل أمام المجموعة", outcome: "تقديم خطاب كامل ومتكامل أمام الصف في تجربة خطابية حقيقية لا تُنسى" },
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
