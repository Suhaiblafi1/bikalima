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

export type VideoType = "suhaib" | "world";

export type VideoEntry = {
  youtubeId: string;
  speaker: { ar: string; en: string };
  title: { ar: string; en: string };
  learn: { ar: string; en: string };
  type: VideoType;
};

export const videoLibrary: VideoEntry[] = [
  {
    youtubeId: "qp0HIF3SfI4",
    speaker: { ar: "سيمون سينك", en: "Simon Sinek" },
    title: {
      ar: "كيف يلهم القادة العظماء التحرك",
      en: "How Great Leaders Inspire Action",
    },
    learn: {
      ar: "تعلّم مفهوم 'لماذا' الذي يجعل خطابك يُحرّك الناس من الداخل لا من الخارج — لماذا تبدأ بالهدف قبل المنتج.",
      en: "Learn the 'Why' concept — why the most inspiring speakers start from purpose, not product.",
    },
    type: "world",
  },
  {
    youtubeId: "UF8uR6Z6KLc",
    speaker: { ar: "ستيف جوبز", en: "Steve Jobs" },
    title: {
      ar: "خطاب التخرج في ستانفورد",
      en: "Stanford Commencement Address",
    },
    learn: {
      ar: "كيف تبني خطاباً من ثلاث قصص شخصية حقيقية — النموذج الأعلى في سرد القصص الملهمة والخطاب العاطفي.",
      en: "How to structure a speech around three personal stories — the gold standard of emotional and inspirational storytelling.",
    },
    type: "world",
  },
  {
    youtubeId: "hg3umXU_gu0",
    speaker: { ar: "شيماماندا نغوزي أديتشي", en: "Chimamanda Ngozi Adichie" },
    title: {
      ar: "خطر القصة الواحدة",
      en: "The Danger of a Single Story",
    },
    learn: {
      ar: "القصة الواحدة تُفقرنا جميعاً. تعلّم كيف تبني سرداً متعدد الأوجه يُوسّع أفق مستمعيك.",
      en: "A single story impoverishes us all. Learn to build multi-layered narratives that broaden your listener's horizon.",
    },
    type: "world",
  },
  {
    youtubeId: "8S0FDjFBj8o",
    speaker: { ar: "مارتن لوثر كينغ", en: "Martin Luther King Jr." },
    title: {
      ar: "لديّ حلم",
      en: "I Have a Dream",
    },
    learn: {
      ar: "أعظم خطاب في التاريخ الحديث — تعلّم كيف تُكرّر جملة واحدة لتخترق القلوب وتصنع الأثر الأبدي.",
      en: "The greatest modern speech — learn how to repeat a single phrase to pierce hearts and create a lasting legacy.",
    },
    type: "world",
  },
  {
    youtubeId: "iG9CE55wbtY",
    speaker: { ar: "كن روبنسون", en: "Ken Robinson" },
    title: {
      ar: "هل تقتل المدارس الإبداع؟",
      en: "Do Schools Kill Creativity?",
    },
    learn: {
      ar: "أكثر خطاب TED مشاهدةً في التاريخ — تعلّم فن الفكاهة الذكية التي تُقنع بدلاً من أن تُثقل.",
      en: "The most-watched TED talk ever — learn the art of intelligent humor that persuades rather than entertains.",
    },
    type: "world",
  },
  {
    youtubeId: "H14bBuluwB8",
    speaker: { ar: "مالكولم غلادويل", en: "Malcolm Gladwell" },
    title: {
      ar: "انتصار الضعفاء — كيف تُقلب الطاولة",
      en: "The unheard story of David and Goliath",
    },
    learn: {
      ar: "كيف تستخدم قصة مألوفة لتقديم فكرة جديدة تماماً — مهارة تحويل المعلوم إلى مدهش.",
      en: "How to use a familiar story to deliver a completely new idea — the skill of turning the known into the astonishing.",
    },
    type: "world",
  },
];
