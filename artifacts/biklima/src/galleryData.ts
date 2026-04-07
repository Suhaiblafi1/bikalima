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
  | "opening"
  | "closing"
  | "storytelling"
  | "humor"
  | "voice"
  | "body";

export type VideoEntry = {
  youtubeId: string;
  speaker: { ar: string; en: string };
  title: { ar: string; en: string };
  skill: { ar: string; en: string };
  learn: { ar: string; en: string };
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
    speaker: { ar: "صهيب الخوالدة", en: "Suhaib Al-Khawaldeh" },
    title: { ar: "خطاب من الميدان", en: "A Field Speech" },
    skill: { ar: "البداية بالانغماس الفوري", en: "Immediate Immersion Opening" },
    learn: {
      ar: "راقب كيف يُسقط الخطيب المستمع في اللحظة فوراً — لا مقدمات، لا شكر، لا تحية مطوّلة. هذا هو مبدأ 'الانغماس الفوري' الذي تعلمته في الكراسة: ابدأ بالمشهد وليس بالتحضير للمشهد.",
      en: "Watch how the speaker drops the listener into the moment immediately — no preamble, no thanks, no long greeting. This is the 'immediate immersion' principle from the workbook: open with the scene, not the setup.",
    },
  },
  {
    youtubeId: "qp0HIF3SfI4",
    category: "opening",
    type: "world",
    speaker: { ar: "سيمون سينك", en: "Simon Sinek" },
    title: { ar: "كيف يلهم القادة العظماء التحرك", en: "How Great Leaders Inspire Action" },
    skill: { ar: "البداية بالسؤال الجوهري", en: "Core Question Opening" },
    learn: {
      ar: "سينك يفتح بـ'لماذا؟' لا بـ'ماذا؟' — السؤال الذي يُزعزع التوقع ويجعل المستمع يريد الإجابة. من الكراسة: البداية بالسؤال الاستفزازي الذي يربك بشكل إيجابي ويفتح الفضول.",
      en: "Sinek opens with 'Why?' not 'What?' — the question that disrupts expectation and makes listeners want the answer. Workbook principle: the provocative question opening that creates productive confusion and opens curiosity.",
    },
  },
  {
    youtubeId: "iCvmsMzlF7o",
    category: "opening",
    type: "world",
    speaker: { ar: "برينيه براون", en: "Brené Brown" },
    title: { ar: "قوة الضعف", en: "The Power of Vulnerability" },
    skill: { ar: "البداية بالاعتراف", en: "Confession Opening" },
    learn: {
      ar: "في الدقيقة الأولى تعترف بـ'أزمتها الوجودية كباحثة' — هذا الضعف المُعلَن يكسر الجدار فوراً ويجعل الجمهور يتماهى معها. تقنية 'القناع المكسور': اعترف بالهشاشة قبل أن تقدّم قوتك.",
      en: "In the first minute she confesses to her 'researcher identity crisis' — this declared vulnerability instantly breaks the wall and creates identification. Workbook technique: 'the broken mask' — admit fragility before you present your strength.",
    },
  },
  {
    youtubeId: "hg3umXU_gu0",
    category: "opening",
    type: "world",
    speaker: { ar: "شيماماندا نغوزي أديتشي", en: "Chimamanda Ngozi Adichie" },
    title: { ar: "خطر القصة الواحدة", en: "The Danger of a Single Story" },
    skill: { ar: "البداية بالغمرة المباشرة في القصة", en: "Direct Story Immersion Opening" },
    learn: {
      ar: "الكلمة الأولى هي دخول القصة مباشرة — 'عندما كنت صغيرة'. لا مقدمات، لا عنوان، لا شكر. هذا أقوى أساليب البداية: اجعل المستمع داخل المشهد قبل أن يدرك أنك بدأت خطابك.",
      en: "The first word is direct entry into the story — 'When I was a child'. No intro, no title, no thanks. This is the strongest opening style: put the listener inside the scene before they realize you've begun your speech.",
    },
  },

  /* ══════════════════════════════════════════════
     النهاية — CLOSING TECHNIQUES
  ══════════════════════════════════════════════ */
  {
    youtubeId: "UF8uR6Z6KLc",
    category: "closing",
    type: "world",
    speaker: { ar: "ستيف جوبز", en: "Steve Jobs" },
    title: { ar: "خطاب التخرج في ستانفورد", en: "Stanford Commencement Address" },
    skill: { ar: "الختام بالجملة الحافرة", en: "The Chiseled Closing Line" },
    learn: {
      ar: "'Stay hungry, stay foolish' — جملة واحدة يتذكرها الجميع بعد ٢٠ سنة. راقب كيف تصنع جملتك الختامية: قصيرة، إيقاعية، تحمل تناقضاً جميلاً. من الكراسة: الختام يجب أن يكون 'ثقيلاً بالمعنى، خفيفاً بالألفاظ'.",
      en: "'Stay hungry, stay foolish' — a line everyone remembers 20 years later. Notice how to craft your closing line: short, rhythmic, carrying a beautiful contradiction. Workbook principle: a closing must be 'heavy in meaning, light in words'.",
    },
  },
  {
    youtubeId: "8S0FDjFBj8o",
    category: "closing",
    type: "world",
    speaker: { ar: "مارتن لوثر كينغ", en: "Martin Luther King Jr." },
    title: { ar: "لديّ حلم", en: "I Have a Dream" },
    skill: { ar: "الختام بالتكرار المتصاعد", en: "Crescendo Repetition Closing" },
    learn: {
      ar: "'I have a dream' تتكرر ٨ مرات في ٥ دقائق — كل تكرار أعلى صوتاً وأشد وطأة. هذا هو التصاعد الصوتي إلى الذروة. من الكراسة: التكرار المتصاعد يُحرّك العاطفة ويثبّت الرسالة في الذاكرة للأبد.",
      en: "'I have a dream' repeated 8 times in 5 minutes — each time louder and more intense. This is the vocal crescendo to climax. Workbook principle: escalating repetition moves emotion and permanently embeds the message in memory.",
    },
  },
  {
    youtubeId: "rrkrvAUbU9Y",
    category: "closing",
    type: "world",
    speaker: { ar: "دانيال بينك", en: "Daniel Pink" },
    title: { ar: "لغز الدافعية", en: "The Puzzle of Motivation" },
    skill: { ar: "الختام بالسؤال المفتوح", en: "The Open Question Closing" },
    learn: {
      ar: "بينك يُنهي خطابه بسؤال لا بإجابة — يُلزم المستمع بالتفكير بعد انتهاء الخطاب. الختام المفتوح يُطيل عمر خطابك في عقل جمهورك. من الكراسة: أقوى الخطابات لا تُغلق — بل تُشعل.",
      en: "Pink ends his speech with a question, not an answer — obligating the listener to keep thinking after the speech ends. The open closing extends your speech's life in your audience's mind. Workbook: the strongest speeches don't close — they ignite.",
    },
  },

  /* ══════════════════════════════════════════════
     السرد والقصة — STORYTELLING
  ══════════════════════════════════════════════ */
  {
    youtubeId: "H14bBuluwB8",
    category: "storytelling",
    type: "world",
    speaker: { ar: "مالكولم غلادويل", en: "Malcolm Gladwell" },
    title: { ar: "داود وجولياث — القصة التي لم تسمعها", en: "The Unheard Story of David and Goliath" },
    skill: { ar: "قلب القصة المألوفة", en: "The Subverted Familiar Story" },
    learn: {
      ar: "غلادويل يأخذ قصة داود وجولياث التي تعرفها منذ طفولتك ويقلبها رأساً على عقب. تعلّم تقنية 'الاستعارة المعكوسة': ادخل من باب مألوف جداً ثم أخرج من باب مدهش تماماً — يجعل المستمع يُعيد تقييم كل ما ظنّه يعرفه.",
      en: "Gladwell takes the David and Goliath story you've known since childhood and flips it completely. Learn the 'inverted metaphor' technique: enter through a very familiar door, exit through a completely astonishing one — making the listener reassess everything they thought they knew.",
    },
  },
  {
    youtubeId: "ObiLbFBGAo4",
    category: "storytelling",
    type: "world",
    speaker: { ar: "وائل غنيم", en: "Wael Ghonim" },
    title: { ar: "داخل الثورة المصرية", en: "Inside the Egyptian Revolution" },
    skill: { ar: "الشهادة الشخصية كمحرّك جماهيري", en: "Personal Testimony as Mass Catalyst" },
    learn: {
      ar: "غنيم لا يُقدّم إحصاءات — يُقدّم اعترافاً شخصياً داخل حدث تاريخي. هذه هي تقنية 'الشهادة الصادقة': أنت لست الراوي، أنت الشاهد. والشاهد أكثر إقناعاً من أي خبير.",
      en: "Ghonim presents no statistics — he presents personal confession inside a historic event. This is the 'authentic testimony' technique: you're not the narrator, you're the witness. And a witness is more convincing than any expert.",
    },
  },
  {
    youtubeId: "-MTRxRO5SRA",
    category: "storytelling",
    type: "world",
    speaker: { ar: "سال خان", en: "Sal Khan" },
    title: { ar: "لنستخدم الفيديو لإعادة اختراع التعليم", en: "Let's Use Video to Reinvent Education" },
    skill: { ar: "قصة النشأة — لماذا بدأت", en: "The Origin Story" },
    learn: {
      ar: "خان يبني خطابه كاملاً على قصة بدايته مع ابنة عمه — قصة شخصية جداً تُولد فكرة كونية. من الكراسة: قصة النشأة هي أقوى أدوات الإقناع، لأنها تُجيب عن السؤال الأعمق: 'لماذا أصدّقك؟'",
      en: "Khan builds his entire speech on the story of how he started tutoring his cousin — a very personal story that generates a universal idea. Workbook: the origin story is the most powerful persuasion tool, because it answers the deepest question: 'Why should I trust you?'",
    },
  },

  /* ══════════════════════════════════════════════
     الفكاهة — HUMOR
  ══════════════════════════════════════════════ */
  {
    youtubeId: "n9hbf4r4Z1g",
    category: "humor",
    type: "world",
    speaker: { ar: "ماز جوبراني", en: "Maz Jobrani" },
    title: { ar: "هل سمعت عن الإيراني الأمريكي؟", en: "Did You Hear the One About the Iranian-American?" },
    skill: { ar: "الفكاهة كجسر ثقافي", en: "Humor as Cultural Bridge" },
    learn: {
      ar: "ماز يُوظّف ثقافتين متناقضتين ليصنع ضحكة تُقرّب لا تُبعد. من الكراسة: الفكاهة الناجحة لا تضحك 'على' أحد — بل تضحك 'مع' الجميع. احرص أن يكون الضحك جامعاً لا فارقاً.",
      en: "Maz uses two contrasting cultures to create laughter that bridges rather than divides. Workbook: successful humor doesn't laugh 'at' anyone — it laughs 'with' everyone. Make sure the laughter is inclusive, not divisive.",
    },
  },
  {
    youtubeId: "iG9CE55wbtY",
    category: "humor",
    type: "world",
    speaker: { ar: "كن روبنسون", en: "Ken Robinson" },
    title: { ar: "هل تقتل المدارس الإبداع؟", en: "Do Schools Kill Creativity?" },
    skill: { ar: "الفكاهة المدمجة في الخطاب الجاد", en: "Embedded Humor in Serious Speech" },
    learn: {
      ar: "روبنسون يتحدث عن قضية إنسانية خطيرة — لكنه يُدخل الضحكة كل دقيقتين. لاحظ أن الضحكة لا تُخفّف الموضوع، بل تمنح المستمع تنفّساً ثم تُعيده لعمق أكبر. من الكراسة: 'الفكاهة هي نفس بين أعماقين'.",
      en: "Robinson speaks about a serious human issue — but inserts laughter every two minutes. Notice how the humor doesn't dilute the subject, it gives the listener breath then pulls them into even greater depth. Workbook: 'Humor is a breath between two depths'.",
    },
  },
  {
    youtubeId: "R1vskiVDwl4",
    category: "humor",
    type: "world",
    speaker: { ar: "سيليست هيدلي", en: "Celeste Headlee" },
    title: { ar: "١٠ طرق لحوار أفضل", en: "10 Ways to Have a Better Conversation" },
    skill: { ar: "خفة الظل والدفء في الإلقاء", en: "Lightness and Warmth in Delivery" },
    learn: {
      ar: "هيدلي لا تُخبر نكتة — لكنها دافئة ومُضحكة في كل جملة. الفكاهة ليست فقط النكتة المُعلَنة، بل طريقة النظر للعالم. من الكراسة: 'خفة الظل' ليست مهارة مضافة — إنها روح المتحدث الحقيقي.",
      en: "Headlee tells no jokes — but she's warm and amusing in every sentence. Humor isn't just the announced joke, it's a way of looking at the world. Workbook: 'lightness' isn't an added skill — it's the soul of the true speaker.",
    },
  },

  /* ══════════════════════════════════════════════
     الصوت والإيقاع — VOICE & RHYTHM
  ══════════════════════════════════════════════ */
  {
    youtubeId: "eIho2S0ZahI",
    category: "voice",
    type: "world",
    speaker: { ar: "جوليان ترجر", en: "Julian Treasure" },
    title: { ar: "كيف تتحدث لكي يسمعك الناس", en: "How to Speak So That People Want to Listen" },
    skill: { ar: "الأدوات الصوتية السبعة", en: "The Seven Vocal Tools" },
    learn: {
      ar: "ترجر يُعلّمك أدواتك الصوتية: النبرة، الإيقاع، الطبقة، الحجم، الجرس، الصمت، والتلوين. لاحظ في هذا الفيديو بالذات كيف يُطبّق كل أداة وهو يشرحها. من الكراسة: الصوت هو أداتك الأولى — لا تتركها للصدفة.",
      en: "Treasure teaches you your seven vocal tools: timbre, rhythm, pitch, volume, resonance, silence, and color. Notice in this very video how he applies each tool as he explains it. Workbook: your voice is your primary tool — don't leave it to chance.",
    },
  },
  {
    youtubeId: "hER0Qp6QJNU",
    category: "voice",
    type: "world",
    speaker: { ar: "سيمون سينك", en: "Simon Sinek" },
    title: { ar: "جيل الألفية في بيئة العمل", en: "Millennials in the Workplace" },
    skill: { ar: "الإيقاع الحواري الطبيعي", en: "Natural Conversational Rhythm" },
    learn: {
      ar: "سينك يتحدث كأنه يحادثك وحدك — لا كأنه يُلقي خطاباً. راقب التوقفات، التردد المقصود، الإيقاع غير المنتظم. من الكراسة: الخطاب الجيد يُقنعك أنك في حوار لا في محاضرة.",
      en: "Sinek speaks as if he's talking only to you — not as if he's delivering a speech. Watch the pauses, intentional hesitation, irregular rhythm. Workbook: a great speech convinces you that you're in a conversation, not a lecture.",
    },
  },
  {
    youtubeId: "3rNhZu3ttIU",
    category: "voice",
    type: "world",
    speaker: { ar: "ملالا يوسفزاي", en: "Malala Yousafzai" },
    title: { ar: "خطاب الأمم المتحدة", en: "United Nations Speech" },
    skill: { ar: "الثقة بصوت غير متكلّف", en: "Unforced Confidence" },
    learn: {
      ar: "ملالا لا تمتلك صوتاً مُدرَّباً — لكنها تمتلك شيئاً أقوى: اليقين. راقب ثباتها على المنصة أمام قادة العالم. من الكراسة: الثقة الصوتية لا تأتي من التدريب فقط — بل من عمق إيمانك برسالتك.",
      en: "Malala doesn't have a trained voice — but she has something stronger: certainty. Watch her stillness on stage before world leaders. Workbook: vocal confidence doesn't come from training alone — it comes from deep belief in your message.",
    },
  },

  /* ══════════════════════════════════════════════
     الحضور المسرحي — STAGE PRESENCE & BODY
  ══════════════════════════════════════════════ */
  {
    youtubeId: "Ks-_Mh1QhMc",
    category: "body",
    type: "world",
    speaker: { ar: "إيمي كودي", en: "Amy Cuddy" },
    title: { ar: "لغة جسدك تُشكّل شخصيتك", en: "Your Body Language May Shape Who You Are" },
    skill: { ar: "وضعيات القوة ما قبل المسرح", en: "Pre-Stage Power Posing" },
    learn: {
      ar: "كودي تُثبت علمياً أن وضعيات جسدك لا تُرسل رسالة للآخرين فقط — بل تُغيّر كيمياء دماغك هي. دقيقتان في وضعية القوة قبل الخطاب تُغيّر مستوى التستوستيرون والكورتيزول. من الكراسة: جسدك يستطيع أن يُقنعك بنفسك قبل أن تُقنع جمهورك.",
      en: "Cuddy scientifically proves that your body postures don't just send messages to others — they change your own brain chemistry. Two minutes in a power pose before a speech changes testosterone and cortisol levels. Workbook: your body can convince you before you convince your audience.",
    },
  },
  {
    youtubeId: "HAnw168huqA",
    category: "body",
    type: "world",
    speaker: { ar: "ماثيو أبراهامز", en: "Matt Abrahams" },
    title: { ar: "فكّر بسرعة وتحدث بذكاء", en: "Think Fast, Talk Smart" },
    skill: { ar: "الحضور تحت الضغط المفاجئ", en: "Presence Under Sudden Pressure" },
    learn: {
      ar: "أبراهامز يُعلّمك كيف تُجيب على سؤال مفاجئ دون أن تبدو مرتبكاً. الحضور ليس فقط الوقوف بثقة — بل التعافي السريع من اللحظات غير المتوقعة. من الكراسة: الارتجال الناجح ليس فن الإجابة الجاهزة — بل فن إدارة الارتباك بهدوء.",
      en: "Abrahams teaches you how to respond to a sudden question without appearing flustered. Presence isn't just standing confidently — it's rapid recovery from unexpected moments. Workbook: successful improvisation isn't the art of the ready answer — it's the art of managing confusion calmly.",
    },
  },
  {
    youtubeId: "qp0HIF3SfI4",
    category: "body",
    type: "world",
    speaker: { ar: "سيمون سينك", en: "Simon Sinek" },
    title: { ar: "الحضور والتأثير على المسرح", en: "Stage Presence and Impact" },
    skill: { ar: "الصمت المقصود والتوقف التأثيري", en: "Intentional Silence and Impact Pause" },
    learn: {
      ar: "راقب سينك في هذا الفيديو من زاوية مختلفة: التوقفات المقصودة، الهدوء، ومحدودية الحركة تمنحانه ثقلاً استثنائياً. من الكراسة: الصمت ليس فراغاً — بل لحظة تصنع فيها المستمع يُفكّر، ينتظر، ويتفاعل.",
      en: "Watch Sinek here from a different angle: intentional pauses, stillness, and minimal movement give him exceptional weight. Workbook: silence isn't emptiness — it's the moment you make the listener think, wait, and engage.",
    },
  },
];
