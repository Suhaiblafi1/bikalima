export const COUNTRIES = {
  qa: { flag: "🇶🇦", ar: "قطر", en: "Qatar", fr: "Qatar" },
  ae: { flag: "🇦🇪", ar: "الإمارات", en: "UAE", fr: "Émirats" },
  sd: { flag: "🇸🇩", ar: "السودان", en: "Sudan", fr: "Soudan" },
  jo: { flag: "🇯🇴", ar: "الأردن", en: "Jordan", fr: "Jordanie" },
  ru: { flag: "🇷🇺", ar: "روسيا", en: "Russia", fr: "Russie" },
  gb: { flag: "🇬🇧", ar: "المملكة المتحدة", en: "UK", fr: "Royaume-Uni" },
  sa: { flag: "🇸🇦", ar: "السعودية", en: "Saudi Arabia", fr: "Arabie Saoudite" },
} as const;

export type CountryKey = keyof typeof COUNTRIES;

export type GalleryPhoto = {
  src: string;
  countryKey: CountryKey;
};

export const galleryPhotos: GalleryPhoto[] = [
  { src: "https://picsum.photos/seed/bk-jo1/700/500", countryKey: "jo" },
  { src: "https://picsum.photos/seed/bk-ae1/500/680", countryKey: "ae" },
  { src: "https://picsum.photos/seed/bk-qa1/700/420", countryKey: "qa" },
  { src: "https://picsum.photos/seed/bk-sa1/500/640", countryKey: "sa" },
  { src: "https://picsum.photos/seed/bk-gb1/700/480", countryKey: "gb" },
  { src: "https://picsum.photos/seed/bk-ru1/500/420", countryKey: "ru" },
  { src: "https://picsum.photos/seed/bk-sd1/700/520", countryKey: "sd" },
  { src: "https://picsum.photos/seed/bk-jo2/500/600", countryKey: "jo" },
  { src: "https://picsum.photos/seed/bk-ae2/700/440", countryKey: "ae" },
  { src: "https://picsum.photos/seed/bk-qa2/500/700", countryKey: "qa" },
  { src: "https://picsum.photos/seed/bk-sa2/700/500", countryKey: "sa" },
  { src: "https://picsum.photos/seed/bk-gb2/500/440", countryKey: "gb" },
  { src: "https://picsum.photos/seed/bk-jo3/700/460", countryKey: "jo" },
  { src: "https://picsum.photos/seed/bk-ru2/500/560", countryKey: "ru" },
  { src: "https://picsum.photos/seed/bk-sd2/700/500", countryKey: "sd" },
  { src: "https://picsum.photos/seed/bk-ae3/500/400", countryKey: "ae" },
];

export type VideoType = "suhaib" | "world";

export type VideoEntry = {
  youtubeId: string;
  speaker: { ar: string; en: string; fr: string };
  title: { ar: string; en: string; fr: string };
  learn: { ar: string; en: string; fr: string };
  type: VideoType;
};

export const videoLibrary: VideoEntry[] = [
  {
    youtubeId: "qp0HIF3SfI4",
    speaker: { ar: "سيمون سينك", en: "Simon Sinek", fr: "Simon Sinek" },
    title: {
      ar: "كيف يلهم القادة العظماء التحرك",
      en: "How Great Leaders Inspire Action",
      fr: "Comment les grands leaders inspirent l'action",
    },
    learn: {
      ar: "تعلّم مفهوم 'لماذا' الذي يجعل خطابك يُحرّك الناس من الداخل لا من الخارج — لماذا تبدأ بالهدف قبل المنتج.",
      en: "Learn the 'Why' concept — why the most inspiring speakers start from purpose, not product.",
      fr: "Apprenez le concept 'Pourquoi' — pourquoi les orateurs les plus inspirants commencent par le but, pas le produit.",
    },
    type: "world",
  },
  {
    youtubeId: "UF8uR6Z6KLc",
    speaker: { ar: "ستيف جوبز", en: "Steve Jobs", fr: "Steve Jobs" },
    title: {
      ar: "خطاب التخرج في ستانفورد",
      en: "Stanford Commencement Address",
      fr: "Discours de remise des diplômes de Stanford",
    },
    learn: {
      ar: "كيف تبني خطاباً من ثلاث قصص شخصية حقيقية — النموذج الأعلى في سرد القصص الملهمة والخطاب العاطفي.",
      en: "How to structure a speech around three personal stories — the gold standard of emotional and inspirational storytelling.",
      fr: "Comment structurer un discours autour de trois histoires personnelles — le modèle en narration inspirante.",
    },
    type: "world",
  },
  {
    youtubeId: "hg3umXU_gu0",
    speaker: { ar: "شيماماندا نغوزي أديتشي", en: "Chimamanda Ngozi Adichie", fr: "Chimamanda Ngozi Adichie" },
    title: {
      ar: "خطر القصة الواحدة",
      en: "The Danger of a Single Story",
      fr: "Le danger d'une seule histoire",
    },
    learn: {
      ar: "القصة الواحدة تُفقرنا جميعاً. تعلّم كيف تبني سرداً متعدد الأوجه يُوسّع أفق مستمعيك.",
      en: "A single story impoverishes us all. Learn to build multi-layered narratives that broaden your listener's horizon.",
      fr: "Une seule histoire nous appauvrit tous. Apprenez à construire des récits qui élargissent l'horizon de vos auditeurs.",
    },
    type: "world",
  },
  {
    youtubeId: "8S0FDjFBj8o",
    speaker: { ar: "مارتن لوثر كينغ", en: "Martin Luther King Jr.", fr: "Martin Luther King Jr." },
    title: {
      ar: "لديّ حلم",
      en: "I Have a Dream",
      fr: "J'ai un rêve",
    },
    learn: {
      ar: "أعظم خطاب في التاريخ الحديث — تعلّم كيف تُكرّر جملة واحدة لتخترق القلوب وتصنع الأثر الأبدي.",
      en: "The greatest modern speech — learn how to repeat a single phrase to pierce hearts and create a lasting legacy.",
      fr: "Le plus grand discours moderne — apprenez à répéter une seule phrase pour toucher les cœurs et créer un héritage.",
    },
    type: "world",
  },
  {
    youtubeId: "iG9CE55wbtY",
    speaker: { ar: "كن روبنسون", en: "Ken Robinson", fr: "Ken Robinson" },
    title: {
      ar: "هل تقتل المدارس الإبداع؟",
      en: "Do Schools Kill Creativity?",
      fr: "Les écoles tuent-elles la créativité ?",
    },
    learn: {
      ar: "أكثر خطاب TED مشاهدةً في التاريخ — تعلّم فن الفكاهة الذكية التي تُقنع بدلاً من أن تُثقل.",
      en: "The most-watched TED talk ever — learn the art of intelligent humor that persuades rather than entertains.",
      fr: "Le TED talk le plus regardé — apprenez l'art de l'humour intelligent qui persuade plutôt qu'il ne divertit.",
    },
    type: "world",
  },
  {
    youtubeId: "H14bBuluwB8",
    speaker: { ar: "مالكولم غلادويل", en: "Malcolm Gladwell", fr: "Malcolm Gladwell" },
    title: {
      ar: "انتصار الضعفاء — كيف تُقلب الطاولة",
      en: "The unheard story of David and Goliath",
      fr: "L'histoire méconnue de David et Goliath",
    },
    learn: {
      ar: "كيف تستخدم قصة مألوفة لتقديم فكرة جديدة تماماً — مهارة تحويل المعلوم إلى مدهش.",
      en: "How to use a familiar story to deliver a completely new idea — the skill of turning the known into the astonishing.",
      fr: "Comment utiliser une histoire connue pour présenter une idée entièrement nouvelle — transformer le connu en étonnant.",
    },
    type: "world",
  },
];
