import img1 from "@assets/لقطة_اثناء_التدريب_فوج_1775600657862.jpeg";
import img2 from "@assets/الاردن_فوج__1775600657862.jpeg";
import img4 from "@assets/تدريب_٤_1775600657862.jpg";
import img5 from "@assets/تدريب_٥_1775600657862.jpg";
import img6 from "@assets/تدريب_1775600657862.jpg";
import img8 from "@assets/لتواصل_٨_1775600657862.jpg";
import img9 from "@assets/فوج_٦_1775600657862.jpg";
import img10 from "@assets/فوج_الاردن__1775600657862.jpg";
import img11 from "@assets/تدريب_احد_الافواج_1775600657862.jpg";
import img12 from "@assets/الاردن_1775600657862.jpg";
import img13 from "@assets/عمان_فوج_1775600657862.jpg";
import img14 from "@assets/فوج_خخ_1775600657862.jpg";
import img15 from "@assets/فوج_خ_1775600657862.jpg";
import img16 from "@assets/UAE_1775600657862.jpg";

import sp1 from "@assets/الدوحه_ه_1775602066240.jpg";
import sp2 from "@assets/خطاب_٤_1775602066240.jpg";
import sp3 from "@assets/خطاب_ب_1775602066240.jpg";
import sp4 from "@assets/تترستان_1775602066240.jpg";
import sp5 from "@assets/موسكو_1775602066240.jpg";
import sp6 from "@assets/خطاب_٣٨_1775602066240.jpg";
import sp7 from "@assets/عمان_٢_1775602066240.jpg";
import sp8 from "@assets/السودان__1775602066240.jpg";
import sp9 from "@assets/موسكو_٢_1775602066240.jpg";
import sp10 from "@assets/ام_درمان_-_السودان__1775602066240.jpg";
import sp11 from "@assets/خطاب-_السودان_1775602066240.jpg";
import sp12 from "@assets/الاردن_1775602066240.jpg";
import sp13 from "@assets/السعودية_1775602066240.jpg";
import sp14 from "@assets/472469922_10170418834520644_4137411242115363245_n_1775602066240.jpg";
import sp15 from "@assets/خطاب_لصهيب_1775602066240.jpg";
import sp16 from "@assets/خطاب_صهيب_٦_1775602066240.jpg";
import sp17 from "@assets/خطاب_صهيب_١٠_1775602066240.jpg";
import sp18 from "@assets/خطاب_لصهيب_٥_1775602066240.jpg";
import sp19 from "@assets/خطاب_لصهيب_٤_1775602066240.jpg";
import sp20 from "@assets/خطاب_لصهيب_٣_1775602066240.jpg";
import sp21 from "@assets/خطاب_لصهي_٦_1775602465895.jpg";
import sp22 from "@assets/كازان__1775602465895.jpg";
import sp23 from "@assets/تكريم_٢_1775602465895.jpg";
import sp24 from "@assets/موسكو_ه_1775602465895.jpg";
import sp25 from "@assets/قطر_1775602465895.jpg";

export type GalleryPhoto = {
  src: string;
};

export const galleryPhotos: GalleryPhoto[] = [
  { src: img1 },
  { src: img2 },
  { src: img9 },
  { src: img4 },
  { src: img5 },
  { src: img10 },
  { src: img13 },
  { src: img6 },
  { src: img14 },
  { src: img15 },
  { src: img8 },
  { src: img11 },
  { src: img16 },
  { src: img12 },
];

export const speechPhotos: GalleryPhoto[] = [
  { src: sp1 },
  { src: sp2 },
  { src: sp3 },
  { src: sp4 },
  { src: sp5 },
  { src: sp6 },
  { src: sp7 },
  { src: sp8 },
  { src: sp9 },
  { src: sp10 },
  { src: sp11 },
  { src: sp12 },
  { src: sp13 },
  { src: sp14 },
  { src: sp15 },
  { src: sp16 },
  { src: sp17 },
  { src: sp18 },
  { src: sp19 },
  { src: sp20 },
  { src: sp21 },
  { src: sp22 },
  { src: sp23 },
  { src: sp24 },
  { src: sp25 },
];

export type VideoType = "suhaib" | "world";

export type VideoCategory =
  | "delivery"
  | "english"
  | "arabic"
  | "podcast"
  | "debate"
  | "comedy"
  | "education"
  | "body-language"
  | "movies"
  | "classical";

export type VideoEntry = {
  youtubeId: string;
  speaker: { ar: string; en: string };
  title: { ar: string; en: string };
  learn: { ar: string; en: string };
  type: VideoType;
  category: VideoCategory;
};

export const videoLibrary: VideoEntry[] = [

  /* ══════════════════════════════════════════════
     الإلقاء — DELIVERY
  ══════════════════════════════════════════════ */
  {
    youtubeId: "qp0HIF3SfI4",
    category: "delivery",
    speaker: { ar: "سيمون سينك", en: "Simon Sinek" },
    title: { ar: "كيف يلهم القادة العظماء التحرك", en: "How Great Leaders Inspire Action" },
    learn: {
      ar: "ابدأ بالسبب — كيف يُحرّك خطابك الناس من الداخل حين تبدأ بالهدف لا بالمنتج.",
      en: "Start with Why — move people from within by leading with purpose, not product.",
    },
    type: "world",
  },
  {
    youtubeId: "eIho2S0ZahI",
    category: "delivery",
    speaker: { ar: "جوليان ترجر", en: "Julian Treasure" },
    title: { ar: "كيف تتحدث لكي يسمعك الناس", en: "How to Speak So That People Want to Listen" },
    learn: {
      ar: "الأدوات الصوتية السبعة — الإيقاع والصمت والنبرة والطبقة وكيف توظّفها في كل خطاب.",
      en: "The 7 vocal tools — rhythm, silence, tone, pitch and how to deploy them in every speech.",
    },
    type: "world",
  },
  {
    youtubeId: "Ks-_Mh1QhMc",
    category: "delivery",
    speaker: { ar: "إيمي كودي", en: "Amy Cuddy" },
    title: { ar: "لغة جسدك تُشكّل شخصيتك", en: "Your Body Language May Shape Who You Are" },
    learn: {
      ar: "جسدك يتحدث قبل فمك — وضعيات القوة وكيف تُحوّل ثقتك من اللحظة الأولى.",
      en: "Your body speaks before you do — power poses and how they transform your confidence from the first second.",
    },
    type: "world",
  },
  {
    youtubeId: "R1vskiVDwl4",
    category: "delivery",
    speaker: { ar: "سيليست هيدلي", en: "Celeste Headlee" },
    title: { ar: "١٠ طرق لحوار أفضل", en: "10 Ways to Have a Better Conversation" },
    learn: {
      ar: "الاستماع الحقيقي هو نصف الخطاب — ١٠ قواعد تُجدّد حواراتك اليومية من جذورها.",
      en: "Real listening is half the speech — 10 rules that will transform your everyday conversations.",
    },
    type: "world",
  },
  {
    youtubeId: "HAnw168huqA",
    category: "delivery",
    speaker: { ar: "ماثيو أبراهامز", en: "Matt Abrahams" },
    title: { ar: "فكّر بسرعة وتحدث بذكاء", en: "Think Fast, Talk Smart" },
    learn: {
      ar: "كيف تُجيب وتتحدث بعفوية تحت الضغط دون تحضير — تقنيات الارتجال الذكي.",
      en: "How to speak spontaneously and intelligently under pressure — the science of smart improvisation.",
    },
    type: "world",
  },

  /* ══════════════════════════════════════════════
     خطابات إنجليزية — ENGLISH SPEECHES
  ══════════════════════════════════════════════ */
  {
    youtubeId: "8S0FDjFBj8o",
    category: "english",
    speaker: { ar: "مارتن لوثر كينغ", en: "Martin Luther King Jr." },
    title: { ar: "لديّ حلم", en: "I Have a Dream" },
    learn: {
      ar: "أعظم خطاب في التاريخ الحديث — تكرار الجملة الواحدة كأداة للاختراق العاطفي الأبدي.",
      en: "The greatest modern speech — repetition as a tool for eternal emotional impact.",
    },
    type: "world",
  },
  {
    youtubeId: "UF8uR6Z6KLc",
    category: "english",
    speaker: { ar: "ستيف جوبز", en: "Steve Jobs" },
    title: { ar: "خطاب ستانفورد — اربط النقاط", en: "Stanford Commencement — Connecting the Dots" },
    learn: {
      ar: "ثلاث قصص شخصية كافية لتُغيّر حياة جيل — بنية الخطاب العاطفي من قلب التجربة الحقيقية.",
      en: "Three personal stories are enough to change a generation — emotional speech structure from lived experience.",
    },
    type: "world",
  },
  {
    youtubeId: "hg3umXU_gu0",
    category: "english",
    speaker: { ar: "شيماماندا نغوزي أديتشي", en: "Chimamanda Ngozi Adichie" },
    title: { ar: "خطر القصة الواحدة", en: "The Danger of a Single Story" },
    learn: {
      ar: "القصة الواحدة تُفقرنا — كيف تبني سرداً متعدد الأوجه يُوسّع أفق مستمعيك.",
      en: "The single story impoverishes us — how to build multi-layered narratives that expand horizons.",
    },
    type: "world",
  },
  {
    youtubeId: "iCvmsMzlF7o",
    category: "english",
    speaker: { ar: "برينيه براون", en: "Brené Brown" },
    title: { ar: "قوة الضعف", en: "The Power of Vulnerability" },
    learn: {
      ar: "الضعف ليس عكس الشجاعة — بل هو قلبها. كيف تجعل خطابك أصيلاً حين تكشف إنسانيتك.",
      en: "Vulnerability isn't the opposite of courage — it's its heart. How authenticity makes speeches unforgettable.",
    },
    type: "world",
  },
  {
    youtubeId: "3rNhZu3ttIU",
    category: "english",
    speaker: { ar: "ملالا يوسفزاي", en: "Malala Yousafzai" },
    title: { ar: "خطاب الأمم المتحدة", en: "United Nations Speech" },
    learn: {
      ar: "صوت واحد يكفي لتحريك العالم — درس ملالا في الشجاعة والوضوح والرسالة المحورية.",
      en: "One voice is enough to move the world — Malala's lesson in courage, clarity and a central mission.",
    },
    type: "world",
  },
  {
    youtubeId: "H14bBuluwB8",
    category: "english",
    speaker: { ar: "مالكولم غلادويل", en: "Malcolm Gladwell" },
    title: { ar: "انتصار الضعفاء — داود وجولياث", en: "The Unheard Story of David and Goliath" },
    learn: {
      ar: "كيف تستخدم قصة مألوفة لتقديم فكرة مدهشة — فن تحويل المعلوم إلى مثير.",
      en: "How to use a familiar story to present a stunning idea — turning the known into the astonishing.",
    },
    type: "world",
  },

  /* ══════════════════════════════════════════════
     خطابات عربية — ARABIC SPEECHES
  ══════════════════════════════════════════════ */
  {
    youtubeId: "ObiLbFBGAo4",
    category: "arabic",
    speaker: { ar: "وائل غنيم", en: "Wael Ghonim" },
    title: { ar: "داخل الثورة المصرية", en: "Inside the Egyptian Revolution" },
    learn: {
      ar: "كيف يمكن لكلمة واحدة على الإنترنت أن تُشعل ثورة — قوة الخطاب الرقمي والتأثير الجماهيري.",
      en: "How one digital word can ignite a revolution — the power of digital speech and mass influence.",
    },
    type: "world",
  },
  {
    youtubeId: "nI7DUjF2CjI",
    category: "arabic",
    speaker: { ar: "متحدث عربي", en: "Arabic Speaker" },
    title: { ar: "فن التأثير بالكلمة العربية", en: "The Art of Influence Through Arabic" },
    learn: {
      ar: "كيف تُوظّف جماليات اللغة العربية في خطابك لتُحدث أثراً لا تصنعه أي لغة أخرى.",
      en: "How to use the aesthetics of Arabic in your speech to create an impact no other language can replicate.",
    },
    type: "world",
  },
  {
    youtubeId: "vhXhA8ePoNI",
    category: "arabic",
    speaker: { ar: "متحدث عربي", en: "Arabic Speaker" },
    title: { ar: "الخطاب وبناء الثقة", en: "Speech and Building Confidence" },
    learn: {
      ar: "ثلاثة أسرار يستخدمها المتحدثون العرب الأكثر تأثيراً لبناء الثقة واستمالة الجمهور.",
      en: "Three secrets used by the most influential Arab speakers to build trust and captivate audiences.",
    },
    type: "world",
  },
  {
    youtubeId: "lLYMnLCwBM8",
    category: "arabic",
    speaker: { ar: "متحدث ملهم", en: "Inspiring Speaker" },
    title: { ar: "التحدث من القلب — خطاب بالفصحى", en: "Speaking from the Heart — Classical Arabic Speech" },
    learn: {
      ar: "الفصحى ليست قيداً — بل هي أداة قوة. كيف تتحدث بها بشكل عفوي وطبيعي دون أن تبدو متكلّفاً.",
      en: "Classical Arabic isn't a constraint — it's a power tool. How to speak it naturally without sounding stiff.",
    },
    type: "world",
  },

  /* ══════════════════════════════════════════════
     بودكاست — PODCAST
  ══════════════════════════════════════════════ */
  {
    youtubeId: "hER0Qp6QJNU",
    category: "podcast",
    speaker: { ar: "سيمون سينك", en: "Simon Sinek" },
    title: { ar: "جيل الألفية في بيئة العمل", en: "Millennials in the Workplace" },
    learn: {
      ar: "لماذا يشعر الجيل الجديد بالخواء؟ — درس عميق في التواصل بين الأجيال وقراءة الجمهور.",
      en: "Why does the new generation feel empty? — a profound lesson in cross-generational communication.",
    },
    type: "world",
  },
  {
    youtubeId: "rrkrvAUbU9Y",
    category: "podcast",
    speaker: { ar: "دانيال بينك", en: "Daniel Pink" },
    title: { ar: "لغز الدافعية", en: "The Puzzle of Motivation" },
    learn: {
      ar: "ما الذي يُحرّك الناس حقاً؟ — كيف تُضمّن حديثك أفكاراً تُشعل الرغبة لدى مستمعيك.",
      en: "What truly moves people? — how to embed ideas in your talk that ignite desire in your listeners.",
    },
    type: "world",
  },
  {
    youtubeId: "LBbHFjSKOsM",
    category: "podcast",
    speaker: { ar: "أنثروبولوجيا التواصل", en: "The Anthropology of Communication" },
    title: { ar: "أسرار المحادثة الجذابة", en: "Secrets of Magnetic Conversation" },
    learn: {
      ar: "كيف تجعل حديثك جذاباً في أي موقف — فن الأسئلة المفتوحة وتقنيات بناء الاتصال العميق.",
      en: "How to make your conversation magnetic in any situation — open questions and deep connection techniques.",
    },
    type: "world",
  },
  {
    youtubeId: "d9BYYD9DPfE",
    category: "podcast",
    speaker: { ar: "خبير الاتصال", en: "Communication Expert" },
    title: { ar: "كيف تُقنع في دقيقتين", en: "How to Persuade in Two Minutes" },
    learn: {
      ar: "هيكل الإقناع السريع — كيف تبني حجتك في دقيقتين بدلاً من ساعة بأثر أكبر.",
      en: "The rapid persuasion framework — how to build your case in 2 minutes instead of an hour, with greater impact.",
    },
    type: "world",
  },

  /* ══════════════════════════════════════════════
     مناظرات — DEBATES
  ══════════════════════════════════════════════ */
  {
    youtubeId: "wWo2eAe4hiI",
    category: "debate",
    speaker: { ar: "جوردان بيترسون", en: "Jordan Peterson" },
    title: { ar: "جوردان بيترسون في أوكسفورد", en: "Jordan Peterson at Oxford Union" },
    learn: {
      ar: "كيف تواجه الأسئلة الصعبة برباطة جأش وتُقلب الحجة لصالحك — فن المناظرة الهادئة.",
      en: "How to face hard questions with composure and flip arguments in your favor — the art of calm debate.",
    },
    type: "world",
  },
  {
    youtubeId: "7dKPlSi4nEo",
    category: "debate",
    speaker: { ar: "كريستوفر هيتشنز", en: "Christopher Hitchens" },
    title: { ar: "حرية التعبير — مناظرة أوكسفورد", en: "Free Speech — Oxford Debate" },
    learn: {
      ar: "كيف تُدافع عن فكرتك حتى حين يعارضك الجميع — تقنيات بناء الحجة القوية تحت الضغط.",
      en: "How to defend your idea even when everyone opposes you — building strong arguments under pressure.",
    },
    type: "world",
  },
  {
    youtubeId: "gPnCmXs9l5c",
    category: "debate",
    speaker: { ar: "نقاش فلسفي", en: "Philosophical Debate" },
    title: { ar: "المناظرة الكبرى — الحق والحرية", en: "The Great Debate — Rights and Freedom" },
    learn: {
      ar: "الاستماع الفعّال في المناظرة — كيف تُثبت أنك تسمع حجة خصمك قبل أن تُفنّدها.",
      en: "Active listening in debate — how to show you truly heard your opponent's argument before dismantling it.",
    },
    type: "world",
  },

  /* ══════════════════════════════════════════════
     كوميديا — COMEDY
  ══════════════════════════════════════════════ */
  {
    youtubeId: "n9hbf4r4Z1g",
    category: "comedy",
    speaker: { ar: "ماز جوبراني", en: "Maz Jobrani" },
    title: { ar: "هل سمعت عن الإيراني الأمريكي؟", en: "Did You Hear the One About the Iranian-American?" },
    learn: {
      ar: "كيف يُوظّف الكوميدي ثقافتين مختلفتين ليصنع جسراً بدلاً من جداراً — الفكاهة كأداة للتواصل.",
      en: "How a comedian uses two cultures to build a bridge not a wall — humor as the ultimate communication tool.",
    },
    type: "world",
  },
  {
    youtubeId: "hJncoLBGBDo",
    category: "comedy",
    speaker: { ar: "الفكاهة وفن التواصل", en: "Humor and the Art of Communication" },
    title: { ar: "الفكاهة سلاح الخطيب الذكي", en: "Humor — The Smart Speaker's Secret Weapon" },
    learn: {
      ar: "كيف تدمج الفكاهة في خطابك الجاد دون أن تفقد مصداقيتك — التوقيت هو كل شيء.",
      en: "How to weave humor into a serious speech without losing credibility — timing is everything.",
    },
    type: "world",
  },
  {
    youtubeId: "XPavsNx37C4",
    category: "comedy",
    speaker: { ar: "ستاندأب وإلقاء", en: "Stand-Up and Delivery" },
    title: { ar: "تعلّم الإلقاء من الكوميديا", en: "Learning Delivery from Stand-Up Comedy" },
    learn: {
      ar: "الكوميديا هي علم الإلقاء في أقسى صوره — كيف يُكيّف الستاند أب تقنيات يحتاجها كل خطيب.",
      en: "Comedy is delivery science at its hardest — how stand-up techniques apply to every public speaker.",
    },
    type: "world",
  },

  /* ══════════════════════════════════════════════
     تعليم — EDUCATION
  ══════════════════════════════════════════════ */
  {
    youtubeId: "iG9CE55wbtY",
    category: "education",
    speaker: { ar: "كن روبنسون", en: "Ken Robinson" },
    title: { ar: "هل تقتل المدارس الإبداع؟", en: "Do Schools Kill Creativity?" },
    learn: {
      ar: "أكثر خطاب TED مشاهدةً — فن الفكاهة الذكية التي تُقنع وتُشعل التفكير في آنٍ واحد.",
      en: "The most-watched TED talk ever — intelligent humor that simultaneously persuades and ignites thinking.",
    },
    type: "world",
  },
  {
    youtubeId: "-MTRxRO5SRA",
    category: "education",
    speaker: { ar: "سال خان", en: "Sal Khan" },
    title: { ar: "لنستخدم الفيديو لإعادة اختراع التعليم", en: "Let's Use Video to Reinvent Education" },
    learn: {
      ar: "كيف تبني خطاباً يُغيّر نظاماً كاملاً — قوة الفكرة البسيطة المُقدَّمة بوضوح تام.",
      en: "How to build a speech that changes an entire system — the power of a simple idea delivered with total clarity.",
    },
    type: "world",
  },
  {
    youtubeId: "BKyqkn6EUTM",
    category: "education",
    speaker: { ar: "خبير تعليمي", en: "Education Expert" },
    title: { ar: "كيف تتعلم أي شيء بسرعة", en: "How to Learn Anything Fast" },
    learn: {
      ar: "تقنية تفكيك المهارات — كيف تُطبّق مبدأ التعلم السريع على الإلقاء والخطابة.",
      en: "The skill decomposition technique — how to apply rapid learning to public speaking and oratory.",
    },
    type: "world",
  },
  {
    youtubeId: "fxbCHn6gE3U",
    category: "education",
    speaker: { ar: "ريتشارد فاينمان", en: "Richard Feynman" },
    title: { ar: "أسلوب فاينمان في الشرح", en: "The Feynman Technique of Explanation" },
    learn: {
      ar: "إذا لم تستطع شرح فكرتك لطفل ذي عشر سنوات فأنت لا تفهمها — أبسط قواعد الوضوح.",
      en: "If you can't explain it to a 10-year-old, you don't understand it — the simplest rule of clarity.",
    },
    type: "world",
  },

  /* ══════════════════════════════════════════════
     لغة الجسد — BODY LANGUAGE
  ══════════════════════════════════════════════ */
  {
    youtubeId: "BdB3aGCdm3I",
    category: "body-language",
    speaker: { ar: "فانيسا فان إيدواردز", en: "Vanessa Van Edwards" },
    title: { ar: "علم الانطباع الأول", en: "The Science of First Impressions" },
    learn: {
      ar: "سبع ثوانٍ تُحدد كل شيء — كيف تُدار لغة جسدك لتُصنع انطباعاً أول لا يُنسى.",
      en: "Seven seconds determine everything — how to control your body language for an unforgettable first impression.",
    },
    type: "world",
  },
  {
    youtubeId: "HZwFDGEJrIQ",
    category: "body-language",
    speaker: { ar: "جو نافارو — عميل FBI سابق", en: "Joe Navarro — Former FBI Agent" },
    title: { ar: "قراءة الناس — أسرار الـ FBI", en: "Reading People — FBI Secrets" },
    learn: {
      ar: "كيف يقرأ عميل مخابرات ما لا تقوله الكلمات — إشارات الجسد التي تكشف المشاعر الحقيقية.",
      en: "How an intelligence agent reads what words don't say — body signals that reveal true emotions.",
    },
    type: "world",
  },
  {
    youtubeId: "1cG8f3gHkmI",
    category: "body-language",
    speaker: { ar: "خبير لغة الجسد", en: "Body Language Expert" },
    title: { ar: "لغة الجسد على المسرح", en: "Body Language on Stage" },
    learn: {
      ar: "الفرق بين المتحدث الذي يُشعّ ثقة والذي يخسرها — كل حركة ويدك وعيناك تروي قصة.",
      en: "The difference between a speaker who radiates confidence and one who loses it — every hand movement tells a story.",
    },
    type: "world",
  },
  {
    youtubeId: "nolZ7J0Gkps",
    category: "body-language",
    speaker: { ar: "علم التعبيرات الدقيقة", en: "Micro-Expressions Science" },
    title: { ar: "التعبيرات الدقيقة — ما لا يُكذب", en: "Micro-Expressions — What Cannot Be Faked" },
    learn: {
      ar: "التعبيرات التي تستمر أجزاء من الثانية — كيف تقرأها لتفهم جمهورك في الوقت الفعلي.",
      en: "Expressions lasting fractions of a second — how to read them to understand your audience in real time.",
    },
    type: "world",
  },

  /* ══════════════════════════════════════════════
     ضمن أفلام — MOVIE SCENES
  ══════════════════════════════════════════════ */
  {
    youtubeId: "J7GY1Xg6X20",
    category: "movies",
    speaker: { ar: "تشارلي شابلن — الديكتاتور العظيم", en: "Charlie Chaplin — The Great Dictator" },
    title: { ar: "الخطاب الأعظم في السينما", en: "The Greatest Speech in Cinema" },
    learn: {
      ar: "خطاب شابلن الختامي — كيف تُجمع بين العاطفة والفكر الإنساني في دقيقتين تُحرّك العالم.",
      en: "Chaplin's final speech — how to combine emotion and human thought in two minutes that move the world.",
    },
    type: "world",
  },
  {
    youtubeId: "EcxBrTBGmHk",
    category: "movies",
    speaker: { ar: "الملك جورج السادس — الملك يتكلم", en: "King George VI — The King's Speech" },
    title: { ar: "الملك يتكلم — انتصار التأتأة", en: "The King's Speech — Triumph Over Stuttering" },
    learn: {
      ar: "لا عيب يحول دون الخطاب المؤثر — رحلة الملك من التردد إلى الثقة درس لكل متحدث.",
      en: "No flaw prevents impactful speech — the King's journey from hesitation to confidence is a lesson for every speaker.",
    },
    type: "world",
  },
  {
    youtubeId: "0byL7KUaBhY",
    category: "movies",
    speaker: { ar: "هوارد بيل — نيتووورك ١٩٧٦", en: "Howard Beale — Network 1976" },
    title: { ar: "أنا غاضب ولن أتحمل بعد الآن", en: "I'm Mad as Hell and I'm Not Taking It Anymore" },
    learn: {
      ar: "الغضب الحقيقي كأداة خطابية — كيف تُحوّل المشاعر الجارفة إلى طاقة تستقطب الجماهير.",
      en: "Raw anger as a rhetorical tool — how to channel overwhelming emotion into crowd-gathering energy.",
    },
    type: "world",
  },
  {
    youtubeId: "VPCFnTCN-U4",
    category: "movies",
    speaker: { ar: "ويليام والاس — بريفهارت", en: "William Wallace — Braveheart" },
    title: { ar: "خطاب الحرية — بريفهارت", en: "Freedom Speech — Braveheart" },
    learn: {
      ar: "كيف تُشعل الحماس في لحظة حاسمة — قصر الخطاب وحدّته وتوقيته هي أسلحة القائد الملهم.",
      en: "How to ignite passion at a decisive moment — brevity, sharpness and timing are the inspired leader's weapons.",
    },
    type: "world",
  },

  /* ══════════════════════════════════════════════
     الفصحى العربية — CLASSICAL ARABIC
  ══════════════════════════════════════════════ */
  {
    youtubeId: "PtGqXPfWL0g",
    category: "classical",
    speaker: { ar: "الفصاحة والبيان", en: "Arabic Eloquence" },
    title: { ar: "البلاغة العربية — علم يجب أن تعرفه", en: "Arabic Rhetoric — A Science You Must Know" },
    learn: {
      ar: "ثلاثة علوم كانت سلاح الخطباء العرب — البيان والمعاني والبديع وكيف توظّفها اليوم.",
      en: "Three sciences that armed Arab orators — rhetoric, semantics and literary devices and how to use them today.",
    },
    type: "world",
  },
  {
    youtubeId: "yGAi40klFM4",
    category: "classical",
    speaker: { ar: "الشعر العربي الكلاسيكي", en: "Classical Arabic Poetry" },
    title: { ar: "الشعر والخطابة — روح واحدة", en: "Poetry and Oratory — One Soul" },
    learn: {
      ar: "الشعراء العرب الأوائل كانوا خطباء — كيف تُضمّن البيت الشعري في خطابك ليرفعه درجات.",
      en: "Early Arab poets were orators — how to embed a poetic verse in your speech to elevate it immeasurably.",
    },
    type: "world",
  },
  {
    youtubeId: "rLz9MFgfSIo",
    category: "classical",
    speaker: { ar: "مبادئ الخطابة الفصيحة", en: "Principles of Eloquent Oration" },
    title: { ar: "كيف تتحدث بالفصحى بطلاقة", en: "How to Speak Classical Arabic Fluently" },
    learn: {
      ar: "الفصحى ليست لغة كتب — بل لغة منابر وقلوب. تقنيات عملية لجعلها طبيعية على لسانك.",
      en: "Classical Arabic isn't a book language — it's a language of pulpits and hearts. Practical techniques for natural fluency.",
    },
    type: "world",
  },
];
