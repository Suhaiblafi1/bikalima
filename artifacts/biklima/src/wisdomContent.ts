/**
 * The wisdom pieces the institution has written, in one place.
 *
 * These were defined twice — once in home.tsx and once in workbooks.tsx —
 * with the same eight pieces in each and no link between the copies. Editing
 * a quote in one left the other saying something else on the same site.
 *
 * They are also the only long-form writing the site owns, drawn from its own
 * workbooks and programmes, and until now they existed solely as decoration
 * inside two pages: not addressable, not linkable, invisible to search and to
 * anything that cites sources. Giving each one a slug is what lets the
 * insights pages exist without inventing a word of new content.
 *
 * Slugs are derived from the English quote rather than transliterated Arabic,
 * so a URL never changes when the Arabic copy is edited — a published address
 * is a promise.
 */

export type WisdomLocale = {
  /** Which workbook or programme the piece comes from. */
  source: string;
  category: string;
  quote: string;
  body: string;
};

export type WisdomPiece = {
  slug: string;
  /** Name of the lucide icon the pages render; kept as data, not JSX, so this
   *  module stays importable by the build-time prerender script. */
  icon: string;
  ar: WisdomLocale;
  en: WisdomLocale;
};

export const WISDOM_PIECES: WisdomPiece[] = [
  {
    slug: "confidence-is-built",
    icon: "Lightbulb",
    ar: {
      source: "كراسة المتدرب",
      category: "النطاق الذهني",
      quote: "الثقة لا تُعطى، تُبنى.",
      body: "وبناؤها يبدأ من أعمق نقطة في الداخل — من صورتك عن نفسك لحظة الكلام. كثيرون يبحثون عن تقنيات الإلقاء وينسون أن المشكلة الحقيقية ليست في اللسان بل في العقل. قبل أن تُصلح ما يسمعه الجمهور، أصلح ما تسمعه أنت من نفسك.",
    },
    en: {
      source: "The Trainee's Workbook",
      category: "The Mental Domain",
      quote: "Confidence is not given — it is built.",
      body: "And it begins from the deepest point inside — from the image you hold of yourself in the moment of speaking. Many search for delivery techniques and forget that the real problem is not in the tongue but in the mind.",
    },
  },
  {
    slug: "ease-of-articulation",
    icon: "Mic2",
    ar: {
      source: "كراسة المتدرب",
      category: "النطاق اللفظي",
      quote: "رَبِّ اشْرَحْ لِي صَدْرِي، وَيَسِّرْ لِي أَمْرِي، وَاحْلُلْ عُقْدَةً مِن لِّسَانِي يَفْقَهُوا قَوْلِي.",
      body: "حتى الأنبياء دعوا الله أن يُيسّر لهم البيان. اللسان الفصيح دعوة قبل أن يكون مهارة — طلبها موسى عليه السلام حين أُرسل. فإن كان أكلم البشر وأعظمهم رسالةً قد طلب من ربه أن يُحلّ عقدة لسانه، فلا عيب في أن تطلب أنت أيضاً أن يُيسّر الله لك الكلمة.",
    },
    en: {
      source: "The Trainee's Workbook",
      category: "The Verbal Domain",
      quote: "Even the greatest of prophets sought ease of articulation.",
      body: "Public speaking is a calling before it is a skill — a gift worth asking for from above. An eloquent tongue is not merely a rhetorical tool — it is a bridge between the heart and the world.",
    },
  },
  {
    slug: "fear-of-speaking-is-learned",
    icon: "Heart",
    ar: {
      source: "برنامج المعلمين وأولياء الأمور",
      category: "الفجوة بين الأجيال",
      quote: "٧٠٪ من الناس يعانون من رهاب التحدث.",
      body: "والسبب الأول ليس الجمهور، بل البيئة التي نشأوا فيها. كل طفل خجول كان يوماً طفلاً لم يُتَح له أن يُسمع بشكل صحيح. الخوف من الكلام لا يُولد مع الإنسان — بل يُزرع.",
    },
    en: {
      source: "Educators & Parents Program",
      category: "The Generational Gap",
      quote: "70% of people suffer from the fear of public speaking.",
      body: "And the primary cause is not the audience — it is the environment they grew up in. Every shy child was once a child who was never properly heard.",
    },
  },
  {
    slug: "a-word-shapes-a-childs-voice",
    icon: "Users",
    ar: {
      source: "برنامج المعلمين وأولياء الأمور",
      category: "دور المربّي",
      quote: "الكلمة التي تقولها لطفل في لحظة الحاجة قد تُشكّل صوته طوال حياته — أو تُصمته.",
      body: "لا يحتاج الطفل مدرباً فصيحاً فقط، بل بيئة تؤمن بأن صوته يستحق أن يُسمع. المربّي الواعي لا يصحح فقط، بل يفتح مساحة للتعبير دون خوف.",
    },
    en: {
      source: "Educators & Parents Program",
      category: "The Educator's Role",
      quote: "The word you say to a child in their moment of need may shape their voice for life — or silence it.",
      body: "A child doesn't need just an eloquent trainer — they need an environment that believes their voice deserves to be heard.",
    },
  },
  {
    slug: "children-who-speak-with-confidence",
    icon: "Star",
    ar: {
      source: "كراسة الخطيب الصغير",
      category: "فلسفة التعليم",
      quote: "الطفل الذي يتعلم الكلام بثقة اليوم هو القائد الذي يُغيّر غرفته غداً.",
      body: "الخطابة للأطفال ليست نشاطاً إضافياً، هي استثمار في شخصية كاملة. الطفل الذي يتعلم أن يُعبّر عن فكرة بوضوح يكتسب أكثر من مهارة — يكتسب شجاعة اجتماعية وثقة داخلية.",
    },
    en: {
      source: "The Young Speaker's Workbook",
      category: "Philosophy of Education",
      quote: "The child who learns to speak with confidence today is the leader who changes the room tomorrow.",
      body: "Public speaking for children is not an extra-curricular activity — it is an investment in a complete personality.",
    },
  },
  {
    slug: "what-a-real-trainer-restores",
    icon: "Feather",
    ar: {
      source: "برنامج المدرب المعتمد",
      category: "رسالة المدرب",
      quote: "المدرب الحقيقي لا يُعلّم الناس كيف يتكلمون — بل يُعيد إليهم الإيمان بأن ما يقولونه يستحق أن يُسمع.",
      body: "حين تصبح مدرباً، تتضاعف مسؤوليتك: أنت تصنع أثراً ثم توكّله لآخرين ليصنعوا أثراً من بعدك.",
    },
    en: {
      source: "The Certified Trainer Program",
      category: "The Trainer's Mission",
      quote: "The real trainer doesn't teach people how to speak — they restore their belief that what they say deserves to be heard.",
      body: "When you become a trainer, your responsibility multiplies: you create impact and then entrust it to others to create impact after you.",
    },
  },
  {
    slug: "fear-is-a-signal",
    icon: "Sparkles",
    ar: {
      source: "كراسة المتدرب",
      category: "الخوف وقوة الكلام",
      quote: "الخوف من الكلام ليس عدوك — إنه إشارة إلى أن ما تقوله مهم.",
      body: "التوتر قبل الخطاب ليس ضعفاً — بل إشعال. الجسم يُعبّئ طاقة لأن اللحظة مهمة. المتحدثون المحترفون لا يتخلصون من الخوف بل يُحوّلونه.",
    },
    en: {
      source: "The Trainee's Workbook",
      category: "Fear and the Power of Words",
      quote: "Fear of speaking is not your enemy — it is a signal that what you have to say matters.",
      body: "Nervousness before a speech is not weakness — it is ignition. The body mobilizes energy because the moment is important. Professional speakers don't eliminate fear — they transform it.",
    },
  },
  {
    slug: "your-voice-is-your-signature",
    icon: "Globe",
    ar: {
      source: "برنامج المدرب المعتمد",
      category: "الصوت والهوية",
      quote: "صوتك هو أكثر من أداة — إنه توقيعك في كل غرفة تدخلها.",
      body: "لا يوجد صوتان متطابقان في العالم. صوتك يحمل تاريخك، وثقافتك، ورؤيتك للعالم. لذلك التدريب على الخطابة ليس عن تقليد الآخرين — بل عن اكتشاف نسختك الأقوى.",
    },
    en: {
      source: "The Certified Trainer Program",
      category: "Voice and Identity",
      quote: "Your voice is more than a tool — it is your signature in every room you enter.",
      body: "No two voices in the world are identical. Your voice carries your history, your culture, and your worldview. That is why public speaking training is not about imitating others — it's about discovering your strongest version.",
    },
  },
];

export function wisdomBySlug(slug: string): WisdomPiece | undefined {
  return WISDOM_PIECES.find((p) => p.slug === slug);
}

/** The pieces in the reader's language, in publication order. */
export function wisdomFor(lang: string): Array<WisdomLocale & { slug: string; icon: string }> {
  const key = lang === "en" ? "en" : "ar";
  return WISDOM_PIECES.map((p) => ({ slug: p.slug, icon: p.icon, ...p[key as "ar" | "en"] }));
}
