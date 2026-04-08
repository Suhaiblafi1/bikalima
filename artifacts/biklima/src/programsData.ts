import imgCore from "@assets/برنامج_اليافعين__1774983039252.jpg";
import imgToT from "@assets/برنامج_tot_1774988106487.jpg";
import imgTeachers from "@assets/برنامج_اولياء_الامور_1774988106487.jpg";
import imgChildren from "@assets/برنامج_الطفل_١_1774988344874.jpg";
import type { Lang } from "./translations";

export const RECORDED_PRICES = { core: 70, tot: 110, teachers: 90, children: 50 };
export const WORKBOOK_PRICES = { core: 23, tot: 37, teachers: 30, children: 17 };

export type EventCountry = "uae" | "saudi" | "jordan" | "uk";

export type UpcomingEvent = {
  id: string;
  programId: string;
  type: "inPerson" | "online";
  startDate: string;
  endDate: string;
  trainer: Record<"ar" | "en" | "fr", string>;
  days: Record<"ar" | "en" | "fr", string>;
  timeSlot: Record<"ar" | "en" | "fr", string>;
  organization: Record<"ar" | "en" | "fr", string>;
  location: Record<"ar" | "en" | "fr", string>;
  city: Record<"ar" | "en" | "fr", string>;
  country: EventCountry;
  registrationLink: string;
  spotsLeft?: number;
};

export const EVENT_COUNTRIES: { key: EventCountry; flag: string }[] = [
  { key: "uae", flag: "🇦🇪" },
  { key: "saudi", flag: "🇸🇦" },
  { key: "jordan", flag: "🇯🇴" },
  { key: "uk", flag: "🇬🇧" },
];

export const upcomingEvents: UpcomingEvent[] = [
  {
    id: "sensorial-core-2026-05",
    programId: "core",
    type: "inPerson",
    startDate: "03/05/2026",
    endDate: "07/06/2026",
    trainer: { ar: "صهيب الخوالدة", en: "Suhaib Al-Khawaldeh", fr: "Suhaib Al-Khawaldeh" },
    days: { ar: "الأحد · الثلاثاء · الخميس", en: "Sun · Tue · Thu", fr: "Dim · Mar · Jeu" },
    timeSlot: { ar: "٣:٠٠ م — ٥:٠٠ م", en: "3:00 PM – 5:00 PM", fr: "15h00 – 17h00" },
    organization: { ar: "أكاديمية Sensorial Life", en: "Sensorial Life Academy", fr: "Académie Sensorial Life" },
    location: { ar: "وجاهي — عمّان، الأردن", en: "In-person — Amman, Jordan", fr: "Présentiel — Amman, Jordanie" },
    city: { ar: "عمّان", en: "Amman", fr: "Amman" },
    country: "jordan",
    registrationLink: "https://sensoriallife.com/Jo/CourseDetails.aspx?N=The_Influential_Speaker_–_Public_Speaking,_Presentation,_and_Impact_Skills",
    spotsLeft: 8,
  },
  {
    id: "sensorial-teachers-2026-05",
    programId: "teachers",
    type: "online",
    startDate: "09/05/2026",
    endDate: "11/07/2026",
    trainer: { ar: "صهيب الخوالدة", en: "Suhaib Al-Khawaldeh", fr: "Suhaib Al-Khawaldeh" },
    days: { ar: "السبت", en: "Saturday", fr: "Samedi" },
    timeSlot: { ar: "٦:٠٠ م — ٩:٠٠ م", en: "6:00 PM – 9:00 PM", fr: "18h00 – 21h00" },
    organization: { ar: "أكاديمية Sensorial Life", en: "Sensorial Life Academy", fr: "Académie Sensorial Life" },
    location: { ar: "Zoom — عبر الإنترنت", en: "Zoom — Online", fr: "Zoom — En ligne" },
    city: { ar: "أونلاين", en: "Online", fr: "En ligne" },
    country: "jordan",
    registrationLink: "https://sensoriallife.com/Jo/CourseDetails.aspx?N=The_Influential_Speaker_–_Public_Speaking,_Presentation,_and_Impact_Skills",
    spotsLeft: 12,
  },
];

export type ProgramLocale = {
  role: string;
  shortTitle: string;
  subtitle?: string;
  badge?: string;
  audience: string;
  hook: string;
  description: string;
  transformation: string;
  prerequisite: string | null;
  prerequisiteLabel: string | null;
  delivery: string;
  outcomes: string[];
  modules: string[];
  workbook: { title: string; description: string };
};

export type Program = ProgramLocale & {
  id: string;
  hours: number;
  sessions: number;
  image: string;
  accentColor: string;
  borderColor: string;
  tagColor: string;
  samplePdf?: string;
  introVideo?: string;
  i18n: { en: ProgramLocale; fr?: ProgramLocale };
};

const programsBase: Program[] = [
  {
    id: "core",
    hours: 27,
    sessions: 14,
    image: imgCore,
    samplePdf: `${import.meta.env.BASE_URL}samples/sample-core.pdf`,
    accentColor: "from-primary to-primary/80",
    borderColor: "border-primary/30",
    tagColor: "bg-primary/10 text-primary border border-primary/20",
    role: "الدورة الأساسية",
    shortTitle: "المتحدث المؤثر",
    subtitle: "صناعة التأثير وفن الإلقاء والخطابة",
    audience: "اليافعون، الشباب، المهنيون",
    hook: "كلمتك قادرة على تغيير الغرفة",
    description: "برنامج تدريبي متكامل لليافعين والشباب والكبار، يهدف إلى بناء متحدث أكثر حضوراً ووضوحاً وتأثيراً في الدراسة والعمل والحياة العامة. يركز على تطوير الثقة، وتنظيم الرسائل، وتحسين الإلقاء، ورفع جودة العروض، وبناء قدرة حقيقية على الإقناع.",
    transformation: "من شخص عادي إلى متحدث يترك أثراً لا يُنسى",
    prerequisite: null,
    prerequisiteLabel: null,
    delivery: "مفتوح للعموم — شباب ومهنيون",
    outcomes: ["بناء حضور الشخصية", "تقنيات الإقناع والتأثير", "هندسة الخطاب والرسالة", "التوازن الانفعالي أمام الجمهور", "أدوات الإلقاء المهني", "التواصل الذكي في السياقات المختلفة"],
    modules: ["من متحدث عادي إلى متحدث مؤثر", "الثقة، الحضور، والانطباع الأول", "إدارة الخوف والتحكم في التوتر", "كيف تبني رسالتك بوضوح؟", "تنظيم الفكرة وافتتاح الحديث وختامه", "نبرة الصوت، الوقفة، ولغة الجسد", "مهارات الإقناع والتأثير", "مخاطبة الجمهور بحسب السياق", "تقديم العروض والخطابات", "إدارة الأسئلة والاعتراضات", "التحدث في الاجتماعات والمناسبات", "التغذية الراجعة وخطة التطوير الشخصي"],
    workbook: { title: "كراسة المتدرب", description: "كراسة تدريبية عميقة تحتوي على تمارين الحضور والأداء وهندسة الخطاب والتقييم الذاتي" },
    i18n: {
      en: {
        role: "Core Course",
        shortTitle: "The Influential Speaker",
        subtitle: "Crafting Influence & the Art of Public Speaking",
        audience: "Youth, Young Adults, Professionals",
        hook: "Your word can change the room",
        description: "A comprehensive training program for youth and professionals, designed to build a more present, clear, and impactful speaker in academic, professional, and public contexts. It focuses on developing confidence, structuring messages, improving delivery, enhancing presentations, and building genuine persuasive ability.",
        transformation: "From an ordinary person to a speaker who leaves an unforgettable impression",
        prerequisite: null,
        prerequisiteLabel: null,
        delivery: "Open to the public — youth and professionals",
        outcomes: ["Building personal presence", "Persuasion and influence techniques", "Speech and message architecture", "Emotional balance in front of an audience", "Professional delivery tools", "Smart communication in different contexts"],
        modules: ["From Ordinary Speaker to Influential Speaker", "Confidence, Presence, and First Impressions", "Managing Fear and Controlling Anxiety", "How to Build Your Message Clearly", "Organizing Ideas, Opening, and Closing", "Voice Tone, Pause, and Body Language", "Persuasion and Influence Skills", "Addressing Different Audiences", "Delivering Presentations and Speeches", "Managing Questions and Objections", "Speaking in Meetings and Events", "Feedback and Personal Development Plan"],
        workbook: { title: "The Trainee's Workbook", description: "A deep training workbook containing exercises on presence, performance, speech architecture, and self-assessment" },
      },
    },
  },
  {
    id: "tot",
    hours: 40,
    sessions: 20,
    image: imgToT,
    samplePdf: `${import.meta.env.BASE_URL}samples/sample-tot.pdf`,
    accentColor: "from-amber-700 to-amber-600",
    borderColor: "border-amber-600/30",
    tagColor: "bg-amber-50 text-amber-800 border border-amber-200",
    role: "تدريب المدربين",
    shortTitle: "المدرب المعتمد",
    badge: "(تدريب مدربين)",
    audience: "المدربون، الميسّرون، المختصون",
    hook: "ضاعف الأثر بالتعليم",
    description: "برنامج تأهيلي متقدم لإعداد مدربين معتمدين قادرين على تقديم برنامج بكلمة للكبار باحتراف. يركز على بناء هوية المدرب، وفهم فلسفة البرنامج، وإتقان أدوات التدريب، وإدارة الجلسات والمجموعات.",
    transformation: "من متحدث محترف إلى مدرب معتمد يُحدث أثراً في مجتمعه",
    prerequisite: "يشترط إتمام دورة المتحدث المؤثر بنجاح",
    prerequisiteLabel: "متطلب سابق إلزامي",
    delivery: "للمتخصصين الراغبين في الاعتماد — يشترط إتمام الأساسية",
    outcomes: ["منهجية التدريب الاحترافي", "تصميم الجلسة التدريبية", "إدارة المجموعات والتفاعل", "الاعتماد الرسمي من بكلمة", "بناء المسار التدريبي", "التطبيق والانطلاق للسوق"],
    modules: ["من متحدث إلى مدرب", "فلسفة برنامج بكلمة وأثره", "شخصية المدرب وهويته المهنية", "تصميم الجلسة التدريبية", "إدارة المجموعات والتفاعل", "بناء الأنشطة والتطبيقات", "التقديم المؤثر أمام الجمهور", "الإقناع وصناعة الرسالة", "تقديم جلسات تجريبية", "التغذية الراجعة والتقييم المهني", "معايير المدرب المعتمد", "خطة الانطلاق في السوق"],
    workbook: { title: "حقيبة المدرب المعتمد", description: "الدليل الاحترافي الشامل للمدرب المعتمد، يحتوي على المناهج والأدوات والتقييمات الكاملة" },
    i18n: {
      en: {
        role: "Train the Trainer",
        shortTitle: "The Certified Trainer",
        badge: "(Train the Trainer)",
        audience: "Trainers, Facilitators, Specialists",
        hook: "Teach others what you've learned, and multiply the impact",
        description: "An advanced qualification program to prepare certified trainers capable of delivering the Bikalima program for adults professionally. It focuses on building the trainer's identity, understanding the program philosophy, mastering training tools, and managing sessions and groups.",
        transformation: "From a professional speaker to a certified trainer making an impact in their community",
        prerequisite: "Completion of The Influential Speaker course is required",
        prerequisiteLabel: "Mandatory Prerequisite",
        delivery: "For specialists seeking certification — requires completion of the core course",
        outcomes: ["Professional training methodology", "Training session design", "Group management and facilitation", "Official Bikalima certification", "Building a training career track", "Implementation and market launch"],
        modules: ["From Speaker to Trainer", "Bikalima Program Philosophy and Impact", "The Trainer's Personality and Professional Identity", "Training Session Design", "Group Management and Facilitation", "Building Activities and Applications", "Impactful Presentation in Front of an Audience", "Persuasion and Crafting the Message", "Delivering Trial Sessions", "Feedback and Professional Assessment", "Standards of the Certified Trainer", "Market Launch Plan"],
        workbook: { title: "Bikalima – The Certified Trainer Program", description: "The comprehensive professional guide for the certified trainer, including complete curricula, tools, and assessments" },
      },
    },
  },
  {
    id: "teachers",
    hours: 21,
    sessions: 11,
    image: imgTeachers,
    samplePdf: `${import.meta.env.BASE_URL}samples/sample-teachers.pdf`,
    accentColor: "from-teal-700 to-teal-600",
    borderColor: "border-teal-600/30",
    tagColor: "bg-teal-50 text-teal-800 border border-teal-200",
    role: "المعلمون وأولياء الأمور",
    shortTitle: "تأهيل المعلمين لتعليم الأطفال",
    audience: "المعلمون، أولياء الأمور، المربون",
    hook: "بيئة الطفل هي مستقبله",
    description: "برنامج تأهيلي مخصص للمعلمين وأولياء الأمور، يعرّفهم بمنهجية تدريب الأطفال على الخطابة والتواصل وقوة التأثير، ويمكنهم من تطبيق البرنامج داخل الصف أو المنزل بأسلوب عملي ومنظم.",
    transformation: "من الضغط والتوقعات إلى الدعم الواعي والتوجيه الصحيح",
    prerequisite: "يُستحسن إتمام دورة المتحدث المؤثر مسبقاً",
    prerequisiteLabel: "يُستحسن (غير إلزامي)",
    delivery: "مفتوح للمعلمين وأولياء الأمور",
    outcomes: ["منهجية تدريب الأطفال على الخطابة", "أدوات تربوية مناسبة للعمر", "دمج البرنامج في البيت والصف", "تعزيز المشاركة وتجاوز الخجل", "التقييم والمتابعة وتطوير الأداء", "بناء جيل واثق ومعبّر"],
    modules: ["لماذا نعلّم الأطفال الخطابة؟", "الكلمة كأداة بناء شخصية", "كيف يختلف التدريب حسب العمر؟", "الفروق الفردية في التعبير", "الحاجات النفسية في كل مرحلة", "كيف أقدّم الجلسة للأطفال؟", "إدارة التفاعل والأنشطة", "تعزيز المشاركة وتجاوز الخجل", "تطبيق البرنامج في الصف أو البيت", "نماذج تدريب عملية", "التقييم والمتابعة"],
    workbook: { title: "حقيبة المعلمين وأولياء الأمور", description: "حقيبة تدريبية متخصصة تحتوي على استراتيجيات وأنشطة عملية لبناء جيل واثق" },
    i18n: {
      en: {
        role: "Educators & Parents",
        shortTitle: "Qualifying Educators to Teach Children",
        audience: "Educators, Parents, Mentors",
        hook: "A child's environment is their future",
        description: "A qualification program for educators and parents, introducing them to the methodology of training children in public speaking, communication, and influence, enabling them to apply the program inside the classroom or home in a practical, organized manner.",
        transformation: "From pressure and expectations to conscious support and proper guidance",
        prerequisite: "Completing The Influential Speaker course is recommended",
        prerequisiteLabel: "Recommended (not required)",
        delivery: "Open to educators and parents",
        outcomes: ["Children's public speaking training methodology", "Age-appropriate educational tools", "Integrating the program at home and in the classroom", "Encouraging participation and overcoming shyness", "Assessment, follow-up, and performance development", "Building a confident and expressive generation"],
        modules: ["Why Teach Children Public Speaking?", "The Word as a Tool for Character Building", "How Does Training Differ by Age?", "Individual Differences in Expression", "Psychological Needs at Each Stage", "How to Deliver a Session to Children", "Managing Interaction and Activities", "Encouraging Participation and Overcoming Shyness", "Applying the Program in Class or at Home", "Practical Training Models", "Assessment and Follow-up"],
        workbook: { title: "Bikalima Program for Educators & Parents", description: "A specialized training kit with strategies and practical activities to build a confident generation" },
      },
    },
  },
  {
    id: "children",
    hours: 18,
    sessions: 9,
    image: imgChildren,
    samplePdf: `${import.meta.env.BASE_URL}samples/sample-children.pdf`,
    accentColor: "from-sky-700 to-sky-600",
    borderColor: "border-white shadow-lg ring-1 ring-sky-200",
    tagColor: "bg-sky-50 text-sky-800 border border-sky-200",
    role: "برنامج المدارس",
    shortTitle: "المتحدث الصغير",
    audience: "الأطفال (٥–١٦ سنة) — عبر المدارس",
    hook: "صوتك يستحق أن يُسمع",
    description: "برنامج تدريبي تفاعلي للأطفال لبناء الثقة، وتنمية مهارات التعبير، وتعليمهم كيف يتحدثون بوضوح وراحة وتأثير أمام الآخرين. يُقدَّم للمدارس عبر خريجي برنامج المعلمين وأولياء الأمور المعتمدين.",
    transformation: "من طفل خجول إلى متحدث واثق أمام جمهوره",
    prerequisite: "يُقدَّم بواسطة خريجي برنامج المعلمين وأولياء الأمور",
    prerequisiteLabel: "مُقدَّم عبر خريجي برنامج المعلمين",
    delivery: "يُقدَّم للمدارس حصراً عبر خريجي برنامج المعلمين المعتمدين",
    outcomes: ["بناء الثقة بالنفس", "أساسيات الخطابة للأطفال", "استخدام الصوت ولغة الجسد", "ترتيب الأفكار وإيصالها", "التأثير والإقناع المناسب للعمر", "الحضور الواثق أمام الجمهور"],
    modules: ["أتكلم بثقة", "كيف أعبّر عن نفسي دون خوف", "ما معنى أن أتحدث أمام الآخرين؟", "كيف أبدأ حديثي بشكل جميل؟", "ترتيب أفكاري قبل الكلام", "نبرة الصوت ولغة الجسد", "كيف أوصل فكرتي بوضوح؟", "كيف أترك أثرًا جميلًا في كلامي؟", "عرضي الأول أمام المجموعة"],
    workbook: { title: "كراسة الخطيب الصغير", description: "كراسة تفاعلية مصممة للأطفال تحتوي على تمارين وأنشطة مدروسة لبناء مهارات التحدث" },
    i18n: {
      en: {
        role: "Schools Program",
        shortTitle: "The Young Speaker",
        audience: "Children (Ages 5–16) — via schools",
        hook: "Your voice deserves to be heard",
        description: "An interactive training program for children to build confidence, develop expression skills, and teach them how to speak clearly, comfortably, and impactfully in front of others. Delivered to schools through certified graduates of the Educators & Parents program.",
        transformation: "From a shy child to a confident speaker in front of their audience",
        prerequisite: "Delivered by graduates of the Educators & Parents Program",
        prerequisiteLabel: "Delivered via Educators Program Graduates",
        delivery: "Delivered exclusively to schools through certified Educators & Parents program graduates",
        outcomes: ["Building self-confidence", "Public speaking fundamentals for children", "Using voice and body language", "Organizing and communicating ideas", "Age-appropriate influence and persuasion", "Confident presence in front of an audience"],
        modules: ["I Speak with Confidence", "How to Express Myself Without Fear", "What Does It Mean to Speak in Front of Others?", "How to Start Speaking Beautifully", "Organizing My Thoughts Before Speaking", "Voice Tone and Body Language", "How to Communicate My Ideas Clearly", "How to Leave a Beautiful Impression", "My First Presentation in Front of the Group"],
        workbook: { title: "The Young Speaker's Workbook", description: "An interactive workbook designed for children with carefully crafted exercises and activities to build speaking skills" },
      },
    },
  },
];

export function getLocalizedProgram(p: Program, lang: Lang): ProgramLocale & Pick<Program, "id" | "hours" | "sessions" | "image" | "accentColor" | "borderColor" | "tagColor"> {
  if (lang === "ar") {
    const { i18n, ...rest } = p;
    return rest;
  }
  const locale = (lang === "fr" ? (p.i18n["fr"] ?? p.i18n["en"]) : p.i18n["en"]);
  return { ...p, ...locale };
}

export const programs = programsBase;

export const testimonials: Record<Lang, { name: string; role: string; quote: string }[]> = {
  ar: [
    { name: "أم ريم الكسواني", role: "أم لطفلين — عمّان، الأردن", quote: "ابنتي كانت ترتجف عند الإلقاء أمام صفها. بعد أسابيع قليلة في البرنامج، أصبحت تطلب أن تكون أول من يتحدث! شكراً بكلمة." },
    { name: "مريم واعش", role: "مدير تسويق", quote: "برنامج المتحدث المؤثر غيّر طريقة تعاملي مع العملاء. أصبحت أعرف كيف أوصل فكرتي في ثوانٍ وأترك أثراً حقيقياً في أي اجتماع." },
    { name: "أبو عمر نصار", role: "أب لثلاثة أبناء — فلسطين", quote: "لأول مرة أجد برنامجاً يعلّمني كيف أتحدث مع أولادي بطريقة تبني ثقتهم. أولادي أصبحوا يعبّرون عن أنفسهم بشكل لم أتوقعه." },
    { name: "د. فهد الزهراني", role: "مدرب معتمد بكلمة", quote: "حصلت على الاعتماد من بكلمة وأنا الآن أدرّب المئات. المنهجية علمية والأثر حقيقي — هذا ليس مجرد برنامج، هو رسالة." },
  ],
  en: [
    { name: "Umm Reem Al-Kaswani", role: "Mother of two — Amman, Jordan", quote: "My daughter used to tremble when presenting in class. After a few weeks in the program, she started asking to be the first to speak! Thank you, Bikalima." },
    { name: "Meryem Ouache", role: "Marketing Director", quote: "The Influential Speaker program changed the way I deal with clients. I now know how to convey my idea in seconds and leave a real impression in any meeting." },
    { name: "Abu Omar Nassar", role: "Father of three — Palestine", quote: "For the first time, I found a program that teaches me how to talk to my children in a way that builds their confidence. My kids now express themselves in ways I never expected." },
    { name: "Dr. Fahad Al-Zahrani", role: "Certified Bikalima Trainer", quote: "I got certified by Bikalima and I'm now training hundreds. The methodology is scientific and the impact is real — this is not just a program, it's a mission." },
  ],
  fr: [
    { name: "Umm Reem Al-Kaswani", role: "Mère de deux enfants — Amman, Jordanie", quote: "Ma fille tremblait lorsqu'elle devait présenter en classe. Après quelques semaines dans le programme, elle demandait à parler en premier ! Merci Bikalima." },
    { name: "Meryem Ouache", role: "Directrice Marketing", quote: "Le programme L'Orateur Influent a changé ma façon de traiter avec mes clients. Je sais désormais comment transmettre mon idée en quelques secondes et laisser une vraie impression lors de chaque réunion." },
    { name: "Abu Omar Nassar", role: "Père de trois enfants — Palestine", quote: "Pour la première fois, j'ai trouvé un programme qui m'apprend à parler à mes enfants d'une manière qui renforce leur confiance. Mes enfants s'expriment maintenant d'une façon que je n'aurais jamais imaginée." },
    { name: "Dr. Fahad Al-Zahrani", role: "Formateur Certifié Bikalima", quote: "J'ai obtenu la certification Bikalima et je forme maintenant des centaines de personnes. La méthodologie est scientifique et l'impact est réel — ce n'est pas seulement un programme, c'est une mission." },
  ],
};
