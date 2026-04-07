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
  country: { ar: string; en: string; fr: string };
  flag: string;
};

export const galleryPhotos: GalleryPhoto[] = [
  { src: img1,  country: { ar: "الأردن",   en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: img2,  country: { ar: "الأردن",   en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: img9,  country: { ar: "الأردن",   en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: img4,  country: { ar: "الأردن",   en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: img5,  country: { ar: "الأردن",   en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: img10, country: { ar: "الأردن",   en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: img13, country: { ar: "الأردن",   en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: img6,  country: { ar: "الأردن",   en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: img14, country: { ar: "الأردن",   en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: img15, country: { ar: "الأردن",   en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: img8,  country: { ar: "الأردن",   en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: img11, country: { ar: "الأردن",   en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: img16, country: { ar: "الإمارات", en: "UAE",           fr: "ÉAU"         }, flag: "🇦🇪" },
  { src: img12, country: { ar: "الأردن",   en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
];

export const speechPhotos: GalleryPhoto[] = [
  { src: sp1,  country: { ar: "قطر",       en: "Qatar",         fr: "Qatar"       }, flag: "🇶🇦" },
  { src: sp2,  country: { ar: "الأردن",    en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: sp3,  country: { ar: "الأردن",    en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: sp4,  country: { ar: "روسيا",     en: "Russia",        fr: "Russie"      }, flag: "🇷🇺" },
  { src: sp5,  country: { ar: "روسيا",     en: "Russia",        fr: "Russie"      }, flag: "🇷🇺" },
  { src: sp6,  country: { ar: "الأردن",    en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: sp7,  country: { ar: "الأردن",    en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: sp8,  country: { ar: "السودان",   en: "Sudan",         fr: "Soudan"      }, flag: "🇸🇩" },
  { src: sp9,  country: { ar: "روسيا",     en: "Russia",        fr: "Russie"      }, flag: "🇷🇺" },
  { src: sp10, country: { ar: "السودان",   en: "Sudan",         fr: "Soudan"      }, flag: "🇸🇩" },
  { src: sp11, country: { ar: "السودان",   en: "Sudan",         fr: "Soudan"      }, flag: "🇸🇩" },
  { src: sp12, country: { ar: "الأردن",    en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: sp13, country: { ar: "السعودية",  en: "Saudi Arabia",  fr: "Arabie Saoudite" }, flag: "🇸🇦" },
  { src: sp14, country: { ar: "الأردن",    en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: sp15, country: { ar: "الأردن",    en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: sp16, country: { ar: "الأردن",    en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: sp17, country: { ar: "الأردن",    en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: sp18, country: { ar: "الأردن",    en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: sp19, country: { ar: "الأردن",    en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: sp20, country: { ar: "الأردن",    en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: sp21, country: { ar: "قطر",       en: "Qatar",         fr: "Qatar"       }, flag: "🇶🇦" },
  { src: sp22, country: { ar: "روسيا",     en: "Russia",        fr: "Russie"      }, flag: "🇷🇺" },
  { src: sp23, country: { ar: "الأردن",    en: "Jordan",        fr: "Jordanie"    }, flag: "🇯🇴" },
  { src: sp24, country: { ar: "روسيا",     en: "Russia",        fr: "Russie"      }, flag: "🇷🇺" },
  { src: sp25, country: { ar: "قطر",       en: "Qatar",         fr: "Qatar"       }, flag: "🇶🇦" },
];

export const allPhotos: GalleryPhoto[] = [...galleryPhotos, ...speechPhotos];

export type VideoType = "suhaib" | "world";

export type VideoCategory =
  | "opening"
  | "closing"
  | "storytelling"
  | "humor"
  | "voice"
  | "body";

export type VideoEntry = {
  youtubeId: string;
  speaker: { ar: string; en: string; fr: string };
  title: { ar: string; en: string; fr: string };
  skill: { ar: string; en: string; fr: string };
  learn: { ar: string; en: string; fr: string };
  type: VideoType;
  category: VideoCategory;
};

export const videoLibrary: VideoEntry[] = [

  /* ══════════════════════════════════════════════
     البداية — OPENING TECHNIQUES
  ══════════════════════════════════════════════ */
  {
    youtubeId: "QRHnlnwcFXI",
    category: "opening",
    type: "suhaib",
    speaker: { ar: "صهيب الخوالدة", en: "Suhaib Al-Khawaldeh", fr: "Suhaib Al-Khawaldeh" },
    title: { ar: "خطاب من الميدان", en: "A Field Speech", fr: "Un discours du terrain" },
    skill: { ar: "البداية بالانغماس الفوري", en: "Immediate Immersion Opening", fr: "Ouverture par immersion immédiate" },
    learn: {
      ar: "راقب كيف يُسقط الخطيب المستمع في اللحظة فوراً — لا مقدمات، لا شكر، لا تحية مطوّلة. هذا هو مبدأ 'الانغماس الفوري' الذي تعلمته في الكراسة: ابدأ بالمشهد وليس بالتحضير للمشهد.",
      en: "Watch how the speaker drops the listener into the moment immediately — no preamble, no thanks, no long greeting. This is the 'immediate immersion' principle from the workbook: open with the scene, not the setup.",
      fr: "Observez comment l'orateur plonge l'auditeur dans l'instant immédiatement — sans préambule, sans remerciements, sans longue salutation. C'est le principe d'« immersion immédiate » du cahier : ouvrez avec la scène, pas avec la mise en place.",
    },
  },
  {
    youtubeId: "qp0HIF3SfI4",
    category: "opening",
    type: "world",
    speaker: { ar: "سيمون سينك", en: "Simon Sinek", fr: "Simon Sinek" },
    title: { ar: "كيف يلهم القادة العظماء التحرك", en: "How Great Leaders Inspire Action", fr: "Comment les grands leaders inspirent l'action" },
    skill: { ar: "البداية بالسؤال الجوهري", en: "Core Question Opening", fr: "Ouverture par la question centrale" },
    learn: {
      ar: "سينك يفتح بـ'لماذا؟' لا بـ'ماذا؟' — السؤال الذي يُزعزع التوقع ويجعل المستمع يريد الإجابة. من الكراسة: البداية بالسؤال الاستفزازي الذي يربك بشكل إيجابي ويفتح الفضول.",
      en: "Sinek opens with 'Why?' not 'What?' — the question that disrupts expectation and makes listeners want the answer. Workbook principle: the provocative question opening that creates productive confusion and opens curiosity.",
      fr: "Sinek ouvre avec « Pourquoi ? » et non « Quoi ? » — la question qui perturbe les attentes et pousse les auditeurs à vouloir la réponse. Principe du cahier : l'ouverture par la question provocatrice qui crée une confusion productive et éveille la curiosité.",
    },
  },
  {
    youtubeId: "iCvmsMzlF7o",
    category: "opening",
    type: "world",
    speaker: { ar: "برينيه براون", en: "Brené Brown", fr: "Brené Brown" },
    title: { ar: "قوة الضعف", en: "The Power of Vulnerability", fr: "Le pouvoir de la vulnérabilité" },
    skill: { ar: "البداية بالاعتراف", en: "Confession Opening", fr: "Ouverture par l'aveu" },
    learn: {
      ar: "في الدقيقة الأولى تعترف بـ'أزمتها الوجودية كباحثة' — هذا الضعف المُعلَن يكسر الجدار فوراً ويجعل الجمهور يتماهى معها. تقنية 'القناع المكسور': اعترف بالهشاشة قبل أن تقدّم قوتك.",
      en: "In the first minute she confesses to her 'researcher identity crisis' — this declared vulnerability instantly breaks the wall and creates identification. Workbook technique: 'the broken mask' — admit fragility before you present your strength.",
      fr: "Dans la première minute, elle confesse sa « crise d'identité de chercheuse » — cette vulnérabilité déclarée brise immédiatement le mur et crée l'identification. Technique du cahier : « le masque brisé » — admettez la fragilité avant de présenter votre force.",
    },
  },
  {
    youtubeId: "hg3umXU_gu0",
    category: "opening",
    type: "world",
    speaker: { ar: "شيماماندا نغوزي أديتشي", en: "Chimamanda Ngozi Adichie", fr: "Chimamanda Ngozi Adichie" },
    title: { ar: "خطر القصة الواحدة", en: "The Danger of a Single Story", fr: "Le danger de l'histoire unique" },
    skill: { ar: "البداية بالغمرة المباشرة في القصة", en: "Direct Story Immersion Opening", fr: "Ouverture par immersion directe dans l'histoire" },
    learn: {
      ar: "الكلمة الأولى هي دخول القصة مباشرة — 'عندما كنت صغيرة'. لا مقدمات، لا عنوان، لا شكر. هذا أقوى أساليب البداية: اجعل المستمع داخل المشهد قبل أن يدرك أنك بدأت خطابك.",
      en: "The first word is direct entry into the story — 'When I was a child'. No intro, no title, no thanks. This is the strongest opening style: put the listener inside the scene before they realize you've begun your speech.",
      fr: "Le premier mot est une entrée directe dans l'histoire — « Quand j'étais enfant ». Pas d'introduction, pas de titre, pas de remerciements. C'est le style d'ouverture le plus puissant : placez l'auditeur dans la scène avant qu'il réalise que vous avez commencé.",
    },
  },

  /* ══════════════════════════════════════════════
     النهاية — CLOSING TECHNIQUES
  ══════════════════════════════════════════════ */
  {
    youtubeId: "UF8uR6Z6KLc",
    category: "closing",
    type: "world",
    speaker: { ar: "ستيف جوبز", en: "Steve Jobs", fr: "Steve Jobs" },
    title: { ar: "خطاب التخرج في ستانفورد", en: "Stanford Commencement Address", fr: "Discours de remise des diplômes de Stanford" },
    skill: { ar: "الختام بالجملة الحافرة", en: "The Chiseled Closing Line", fr: "La phrase finale ciselée" },
    learn: {
      ar: "'Stay hungry, stay foolish' — جملة واحدة يتذكرها الجميع بعد ٢٠ سنة. راقب كيف تصنع جملتك الختامية: قصيرة، إيقاعية، تحمل تناقضاً جميلاً. من الكراسة: الختام يجب أن يكون 'ثقيلاً بالمعنى، خفيفاً بالألفاظ'.",
      en: "'Stay hungry, stay foolish' — a line everyone remembers 20 years later. Notice how to craft your closing line: short, rhythmic, carrying a beautiful contradiction. Workbook principle: a closing must be 'heavy in meaning, light in words'.",
      fr: "« Restez affamés, restez fous » — une phrase dont tout le monde se souvient 20 ans plus tard. Observez comment construire votre phrase finale : courte, rythmée, portant une belle contradiction. Principe du cahier : une conclusion doit être « lourde de sens, légère en mots ».",
    },
  },
  {
    youtubeId: "8S0FDjFBj8o",
    category: "closing",
    type: "world",
    speaker: { ar: "مارتن لوثر كينغ", en: "Martin Luther King Jr.", fr: "Martin Luther King Jr." },
    title: { ar: "لديّ حلم", en: "I Have a Dream", fr: "J'ai un rêve" },
    skill: { ar: "الختام بالتكرار المتصاعد", en: "Crescendo Repetition Closing", fr: "Clôture par répétition en crescendo" },
    learn: {
      ar: "'I have a dream' تتكرر ٨ مرات في ٥ دقائق — كل تكرار أعلى صوتاً وأشد وطأة. هذا هو التصاعد الصوتي إلى الذروة. من الكراسة: التكرار المتصاعد يُحرّك العاطفة ويثبّت الرسالة في الذاكرة للأبد.",
      en: "'I have a dream' repeated 8 times in 5 minutes — each time louder and more intense. This is the vocal crescendo to climax. Workbook principle: escalating repetition moves emotion and permanently embeds the message in memory.",
      fr: "« J'ai un rêve » répété 8 fois en 5 minutes — chaque fois plus fort et plus intense. C'est le crescendo vocal vers le climax. Principe du cahier : la répétition croissante émeut et ancre le message en mémoire de façon permanente.",
    },
  },
  {
    youtubeId: "rrkrvAUbU9Y",
    category: "closing",
    type: "world",
    speaker: { ar: "دانيال بينك", en: "Daniel Pink", fr: "Daniel Pink" },
    title: { ar: "لغز الدافعية", en: "The Puzzle of Motivation", fr: "L'énigme de la motivation" },
    skill: { ar: "الختام بالسؤال المفتوح", en: "The Open Question Closing", fr: "Clôture par la question ouverte" },
    learn: {
      ar: "بينك يُنهي خطابه بسؤال لا بإجابة — يُلزم المستمع بالتفكير بعد انتهاء الخطاب. الختام المفتوح يُطيل عمر خطابك في عقل جمهورك. من الكراسة: أقوى الخطابات لا تُغلق — بل تُشعل.",
      en: "Pink ends his speech with a question, not an answer — obligating the listener to keep thinking after the speech ends. The open closing extends your speech's life in your audience's mind. Workbook: the strongest speeches don't close — they ignite.",
      fr: "Pink termine son discours par une question, pas une réponse — obligeant l'auditeur à continuer de réfléchir après la fin. La clôture ouverte prolonge la vie de votre discours dans l'esprit de votre public. Cahier : les discours les plus puissants ne se ferment pas — ils enflamment.",
    },
  },

  /* ══════════════════════════════════════════════
     السرد والقصة — STORYTELLING
  ══════════════════════════════════════════════ */
  {
    youtubeId: "H14bBuluwB8",
    category: "storytelling",
    type: "world",
    speaker: { ar: "مالكولم غلادويل", en: "Malcolm Gladwell", fr: "Malcolm Gladwell" },
    title: { ar: "داود وجولياث — القصة التي لم تسمعها", en: "The Unheard Story of David and Goliath", fr: "L'histoire inédite de David et Goliath" },
    skill: { ar: "قلب القصة المألوفة", en: "The Subverted Familiar Story", fr: "La subversion de l'histoire familière" },
    learn: {
      ar: "غلادويل يأخذ قصة داود وجولياث التي تعرفها منذ طفولتك ويقلبها رأساً على عقب. تعلّم تقنية 'الاستعارة المعكوسة': ادخل من باب مألوف جداً ثم أخرج من باب مدهش تماماً.",
      en: "Gladwell takes the David and Goliath story you've known since childhood and flips it completely. Learn the 'inverted metaphor' technique: enter through a very familiar door, exit through a completely astonishing one.",
      fr: "Gladwell prend l'histoire de David et Goliath que vous connaissez depuis l'enfance et la renverse complètement. Apprenez la technique de « la métaphore inversée » : entrez par une porte très familière, sortez par une porte totalement étonnante.",
    },
  },
  {
    youtubeId: "ObiLbFBGAo4",
    category: "storytelling",
    type: "world",
    speaker: { ar: "وائل غنيم", en: "Wael Ghonim", fr: "Wael Ghonim" },
    title: { ar: "داخل الثورة المصرية", en: "Inside the Egyptian Revolution", fr: "Au cœur de la révolution égyptienne" },
    skill: { ar: "الشهادة الشخصية كمحرّك جماهيري", en: "Personal Testimony as Mass Catalyst", fr: "Le témoignage personnel comme catalyseur de masse" },
    learn: {
      ar: "غنيم لا يُقدّم إحصاءات — يُقدّم اعترافاً شخصياً داخل حدث تاريخي. هذه هي تقنية 'الشهادة الصادقة': أنت لست الراوي، أنت الشاهد. والشاهد أكثر إقناعاً من أي خبير.",
      en: "Ghonim presents no statistics — he presents personal confession inside a historic event. This is the 'authentic testimony' technique: you're not the narrator, you're the witness. And a witness is more convincing than any expert.",
      fr: "Ghonim ne présente pas de statistiques — il présente une confession personnelle au sein d'un événement historique. C'est la technique du « témoignage authentique » : vous n'êtes pas le narrateur, vous êtes le témoin. Et un témoin est plus convaincant que n'importe quel expert.",
    },
  },
  {
    youtubeId: "-MTRxRO5SRA",
    category: "storytelling",
    type: "world",
    speaker: { ar: "سال خان", en: "Sal Khan", fr: "Sal Khan" },
    title: { ar: "لنستخدم الفيديو لإعادة اختراع التعليم", en: "Let's Use Video to Reinvent Education", fr: "Utilisons la vidéo pour réinventer l'éducation" },
    skill: { ar: "قصة النشأة — لماذا بدأت", en: "The Origin Story", fr: "L'histoire des origines" },
    learn: {
      ar: "خان يبني خطابه كاملاً على قصة بدايته مع ابنة عمه — قصة شخصية جداً تُولد فكرة كونية. من الكراسة: قصة النشأة هي أقوى أدوات الإقناع، لأنها تُجيب عن السؤال الأعمق: 'لماذا أصدّقك؟'",
      en: "Khan builds his entire speech on the story of how he started tutoring his cousin — a very personal story that generates a universal idea. Workbook: the origin story is the most powerful persuasion tool, because it answers: 'Why should I trust you?'",
      fr: "Khan construit tout son discours sur l'histoire de comment il a commencé à enseigner à sa cousine — une histoire très personnelle qui génère une idée universelle. Cahier : l'histoire des origines est l'outil de persuasion le plus puissant, car elle répond à : « Pourquoi devrais-je vous faire confiance ? »",
    },
  },

  /* ══════════════════════════════════════════════
     الفكاهة — HUMOR
  ══════════════════════════════════════════════ */
  {
    youtubeId: "n9hbf4r4Z1g",
    category: "humor",
    type: "world",
    speaker: { ar: "ماز جوبراني", en: "Maz Jobrani", fr: "Maz Jobrani" },
    title: { ar: "هل سمعت عن الإيراني الأمريكي؟", en: "Did You Hear the One About the Iranian-American?", fr: "Avez-vous entendu parler de l'Irano-Américain ?" },
    skill: { ar: "الفكاهة كجسر ثقافي", en: "Humor as Cultural Bridge", fr: "L'humour comme pont culturel" },
    learn: {
      ar: "ماز يُوظّف ثقافتين متناقضتين ليصنع ضحكة تُقرّب لا تُبعد. من الكراسة: الفكاهة الناجحة لا تضحك 'على' أحد — بل تضحك 'مع' الجميع. احرص أن يكون الضحك جامعاً لا فارقاً.",
      en: "Maz uses two contrasting cultures to create laughter that bridges rather than divides. Workbook: successful humor doesn't laugh 'at' anyone — it laughs 'with' everyone. Make sure the laughter is inclusive, not divisive.",
      fr: "Maz utilise deux cultures contrastées pour créer un rire qui unit plutôt que divise. Cahier : l'humour réussi ne rit pas « de » quelqu'un — il rit « avec » tout le monde. Assurez-vous que le rire est inclusif, pas divisif.",
    },
  },
  {
    youtubeId: "iG9CE55wbtY",
    category: "humor",
    type: "world",
    speaker: { ar: "كن روبنسون", en: "Ken Robinson", fr: "Ken Robinson" },
    title: { ar: "هل تقتل المدارس الإبداع؟", en: "Do Schools Kill Creativity?", fr: "Les écoles tuent-elles la créativité ?" },
    skill: { ar: "الفكاهة المدمجة في الخطاب الجاد", en: "Embedded Humor in Serious Speech", fr: "L'humour intégré dans le discours sérieux" },
    learn: {
      ar: "روبنسون يتحدث عن قضية إنسانية خطيرة — لكنه يُدخل الضحكة كل دقيقتين. لاحظ أن الضحكة لا تُخفّف الموضوع، بل تمنح المستمع تنفّساً ثم تُعيده لعمق أكبر. من الكراسة: 'الفكاهة هي نفس بين أعماقين'.",
      en: "Robinson speaks about a serious human issue — but inserts laughter every two minutes. Notice how the humor doesn't dilute the subject, it gives the listener breath then pulls them into even greater depth. Workbook: 'Humor is a breath between two depths'.",
      fr: "Robinson parle d'un problème humain sérieux — mais insère le rire toutes les deux minutes. Remarquez comment l'humour ne dilue pas le sujet, il donne à l'auditeur un souffle puis le tire vers une profondeur encore plus grande. Cahier : « L'humour est un souffle entre deux profondeurs ».",
    },
  },
  {
    youtubeId: "R1vskiVDwl4",
    category: "humor",
    type: "world",
    speaker: { ar: "سيليست هيدلي", en: "Celeste Headlee", fr: "Celeste Headlee" },
    title: { ar: "١٠ طرق لحوار أفضل", en: "10 Ways to Have a Better Conversation", fr: "10 façons d'avoir de meilleures conversations" },
    skill: { ar: "خفة الظل والدفء في الإلقاء", en: "Lightness and Warmth in Delivery", fr: "Légèreté et chaleur dans la présentation" },
    learn: {
      ar: "هيدلي لا تُخبر نكتة — لكنها دافئة ومُضحكة في كل جملة. الفكاهة ليست فقط النكتة المُعلَنة، بل طريقة النظر للعالم. من الكراسة: 'خفة الظل' ليست مهارة مضافة — إنها روح المتحدث الحقيقي.",
      en: "Headlee tells no jokes — but she's warm and amusing in every sentence. Humor isn't just the announced joke, it's a way of looking at the world. Workbook: 'lightness' isn't an added skill — it's the soul of the true speaker.",
      fr: "Headlee ne raconte aucune blague — mais elle est chaleureuse et amusante dans chaque phrase. L'humour n'est pas seulement la blague annoncée, c'est une façon de voir le monde. Cahier : la « légèreté » n'est pas une compétence ajoutée — c'est l'âme du véritable orateur.",
    },
  },

  /* ══════════════════════════════════════════════
     الصوت والإيقاع — VOICE & RHYTHM
  ══════════════════════════════════════════════ */
  {
    youtubeId: "eIho2S0ZahI",
    category: "voice",
    type: "world",
    speaker: { ar: "جوليان ترجر", en: "Julian Treasure", fr: "Julian Treasure" },
    title: { ar: "كيف تتحدث لكي يسمعك الناس", en: "How to Speak So That People Want to Listen", fr: "Comment parler pour que les gens veuillent écouter" },
    skill: { ar: "الأدوات الصوتية السبعة", en: "The Seven Vocal Tools", fr: "Les sept outils vocaux" },
    learn: {
      ar: "ترجر يُعلّمك أدواتك الصوتية: النبرة، الإيقاع، الطبقة، الحجم، الجرس، الصمت، والتلوين. لاحظ في هذا الفيديو بالذات كيف يُطبّق كل أداة وهو يشرحها. من الكراسة: الصوت هو أداتك الأولى — لا تتركها للصدفة.",
      en: "Treasure teaches you your seven vocal tools: timbre, rhythm, pitch, volume, resonance, silence, and color. Notice in this very video how he applies each tool as he explains it. Workbook: your voice is your primary tool — don't leave it to chance.",
      fr: "Treasure vous enseigne vos sept outils vocaux : timbre, rythme, hauteur, volume, résonance, silence et couleur. Remarquez dans cette vidéo même comment il applique chaque outil en l'expliquant. Cahier : votre voix est votre outil principal — ne le laissez pas au hasard.",
    },
  },
  {
    youtubeId: "hER0Qp6QJNU",
    category: "voice",
    type: "world",
    speaker: { ar: "سيمون سينك", en: "Simon Sinek", fr: "Simon Sinek" },
    title: { ar: "جيل الألفية في بيئة العمل", en: "Millennials in the Workplace", fr: "Les millennials au travail" },
    skill: { ar: "الإيقاع الحواري الطبيعي", en: "Natural Conversational Rhythm", fr: "Rythme conversationnel naturel" },
    learn: {
      ar: "سينك يتحدث كأنه يحادثك وحدك — لا كأنه يُلقي خطاباً. راقب التوقفات، التردد المقصود، الإيقاع غير المنتظم. من الكراسة: الخطاب الجيد يُقنعك أنك في حوار لا في محاضرة.",
      en: "Sinek speaks as if he's talking only to you — not as if he's delivering a speech. Watch the pauses, intentional hesitation, irregular rhythm. Workbook: a great speech convinces you that you're in a conversation, not a lecture.",
      fr: "Sinek parle comme s'il ne parlait qu'à vous — pas comme s'il prononçait un discours. Observez les pauses, l'hésitation intentionnelle, le rythme irrégulier. Cahier : un grand discours vous convainc que vous êtes dans une conversation, pas dans une conférence.",
    },
  },
  {
    youtubeId: "3rNhZu3ttIU",
    category: "voice",
    type: "world",
    speaker: { ar: "ملالا يوسفزاي", en: "Malala Yousafzai", fr: "Malala Yousafzai" },
    title: { ar: "خطاب الأمم المتحدة", en: "United Nations Speech", fr: "Discours aux Nations Unies" },
    skill: { ar: "الثقة بصوت غير متكلّف", en: "Unforced Confidence", fr: "La confiance sans artifice" },
    learn: {
      ar: "ملالا لا تمتلك صوتاً مُدرَّباً — لكنها تمتلك شيئاً أقوى: اليقين. راقب ثباتها على المنصة أمام قادة العالم. من الكراسة: الثقة الصوتية لا تأتي من التدريب فقط — بل من عمق إيمانك برسالتك.",
      en: "Malala doesn't have a trained voice — but she has something stronger: certainty. Watch her stillness on stage before world leaders. Workbook: vocal confidence doesn't come from training alone — it comes from deep belief in your message.",
      fr: "Malala n'a pas une voix formée — mais elle a quelque chose de plus fort : la certitude. Observez son calme sur scène devant les dirigeants mondiaux. Cahier : la confiance vocale ne vient pas seulement de la formation — elle vient de la croyance profonde en votre message.",
    },
  },

  /* ══════════════════════════════════════════════
     الحضور المسرحي — STAGE PRESENCE & BODY
  ══════════════════════════════════════════════ */
  {
    youtubeId: "Ks-_Mh1QhMc",
    category: "body",
    type: "world",
    speaker: { ar: "إيمي كودي", en: "Amy Cuddy", fr: "Amy Cuddy" },
    title: { ar: "لغة جسدك تُشكّل شخصيتك", en: "Your Body Language May Shape Who You Are", fr: "Votre langage corporel peut façonner qui vous êtes" },
    skill: { ar: "وضعيات القوة ما قبل المسرح", en: "Pre-Stage Power Posing", fr: "Les poses de puissance avant la scène" },
    learn: {
      ar: "كودي تُثبت علمياً أن وضعيات جسدك لا تُرسل رسالة للآخرين فقط — بل تُغيّر كيمياء دماغك هي. دقيقتان في وضعية القوة قبل الخطاب تُغيّر مستوى التستوستيرون والكورتيزول. من الكراسة: جسدك يستطيع أن يُقنعك بنفسك قبل أن تُقنع جمهورك.",
      en: "Cuddy scientifically proves that your body postures don't just send messages to others — they change your own brain chemistry. Two minutes in a power pose before a speech changes testosterone and cortisol levels. Workbook: your body can convince you before you convince your audience.",
      fr: "Cuddy prouve scientifiquement que vos postures corporelles n'envoient pas seulement des messages aux autres — elles modifient votre propre chimie cérébrale. Deux minutes dans une pose de puissance avant un discours modifient les niveaux de testostérone et de cortisol. Cahier : votre corps peut vous convaincre avant que vous convainquiez votre public.",
    },
  },
  {
    youtubeId: "HAnw168huqA",
    category: "body",
    type: "world",
    speaker: { ar: "ماثيو أبراهامز", en: "Matt Abrahams", fr: "Matt Abrahams" },
    title: { ar: "فكّر بسرعة وتحدث بذكاء", en: "Think Fast, Talk Smart", fr: "Penser vite, parler intelligemment" },
    skill: { ar: "الحضور تحت الضغط المفاجئ", en: "Presence Under Sudden Pressure", fr: "La présence sous pression soudaine" },
    learn: {
      ar: "أبراهامز يُعلّمك كيف تُجيب على سؤال مفاجئ دون أن تبدو مرتبكاً. الحضور ليس فقط الوقوف بثقة — بل التعافي السريع من اللحظات غير المتوقعة. من الكراسة: الارتجال الناجح ليس فن الإجابة الجاهزة — بل فن إدارة الارتباك بهدوء.",
      en: "Abrahams teaches you how to respond to a sudden question without appearing flustered. Presence isn't just standing confidently — it's rapid recovery from unexpected moments. Workbook: successful improvisation isn't the art of the ready answer — it's the art of managing confusion calmly.",
      fr: "Abrahams vous apprend à répondre à une question soudaine sans paraître déstabilisé. La présence n'est pas seulement se tenir confiant — c'est une récupération rapide des moments inattendus. Cahier : l'improvisation réussie n'est pas l'art de la réponse prête — c'est l'art de gérer la confusion calmement.",
    },
  },
  {
    youtubeId: "qp0HIF3SfI4",
    category: "body",
    type: "world",
    speaker: { ar: "سيمون سينك", en: "Simon Sinek", fr: "Simon Sinek" },
    title: { ar: "الحضور والتأثير على المسرح", en: "Stage Presence and Impact", fr: "La présence scénique et l'impact" },
    skill: { ar: "الصمت المقصود والتوقف التأثيري", en: "Intentional Silence and Impact Pause", fr: "Le silence intentionnel et la pause d'impact" },
    learn: {
      ar: "راقب سينك في هذا الفيديو من زاوية مختلفة: التوقفات المقصودة، الهدوء، ومحدودية الحركة تمنحانه ثقلاً استثنائياً. من الكراسة: الصمت ليس فراغاً — بل لحظة تصنع فيها المستمع يُفكّر، ينتظر، ويتفاعل.",
      en: "Watch Sinek here from a different angle: intentional pauses, stillness, and minimal movement give him exceptional weight. Workbook: silence isn't emptiness — it's the moment you make the listener think, wait, and engage.",
      fr: "Regardez Sinek ici sous un angle différent : les pauses intentionnelles, l'immobilité et les mouvements minimaux lui donnent un poids exceptionnel. Cahier : le silence n'est pas le vide — c'est le moment où vous faites réfléchir, attendre et s'engager l'auditeur.",
    },
  },
];
