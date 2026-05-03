import { HOME_SECTION_KEYS, type SectionContent, type SectionKey } from "./sections-schema.js";

// Server-side mirror of artifacts/biklima/src/cms/sections-defaults.ts.
export const SECTION_DEFAULTS: Record<SectionKey, { ar: SectionContent; en: SectionContent }> = {
  hero: {
    ar: {
      titleLine1: "لديك ما تقوله —",
      titleLine2: "وبكلمة ستُسمَع.",
      subtitle:
        "كثيرون يخسرون فرصهم لأن أفكارهم تتوه بين العقل والكلام. في المقابلة، الاجتماع، المنصة، والحياة — بكلمة هي الحل لمن أسكته التردد ولم يُسمع بعد.",
      ctaPrimary: "ابدأ التعلم الآن",
      ctaSecondary: "اكتشف البرامج التدريبية",
      badgeText: "منهج متكامل في فنّ الخطابة والتأثير",
    },
    en: {
      titleLine1: "Bikalima,",
      titleLine2: "We Create Impact.",
      subtitle:
        "A foundational public speaking course for youth and professionals, branching into tracks for certified trainers, educators, parents, and children.",
      ctaPrimary: "Start learning now",
      ctaSecondary: "Explore the Programs",
      badgeText: "A Comprehensive Public Speaking & Influence Methodology",
    },
  },
  "about-trainer": {
    ar: {
      heading: "عن المؤلف والمدرب",
      subheading: "صهيب الخوالدة — مستشار · باحث دكتوراه · متحدث TEDx · مؤسس بكلمة",
      bioParagraph1:
        "مستشار يعمل مع مجموعة من المؤسسات التنموية والخيرية والحكومية في المنطقة، من بينها Qatar Foundation، ووزارة الاقتصاد والسياحة في دولة الإمارات، بالإضافة إلى مؤسسة التمويل Breakthrough T1D وغيرهم، حيث يساهم في تصميم البرامج، وبناء الشراكات، ودعم مبادرات التنمية والابتكار.",
      bioParagraph2:
        "متحدث TEDx ومؤلف سلسلة كراسات بكلمة التدريبية. يقدّم برامج تدريبية في فن الخطابة والإلقاء، ومهارات القيادة المهنية، وتمويل المشاريع كامتداد لخبرته في العمل والتأثير المؤسسي.",
      ctaLabel: "تواصل عبر LinkedIn",
    },
    en: {
      heading: "About the Author & Trainer",
      subheading: "Suhaib Al-Khawaldeh — Consultant · PhD Researcher · TEDx Speaker · Founder of Bikalima",
      bioParagraph1:
        "A consultant working with a range of developmental, charitable, and governmental organizations in the region, including Qatar Foundation, the UAE Ministry of Economy and Tourism, and Breakthrough T1D — contributing to program design, partnership building, and supporting development and innovation initiatives.",
      bioParagraph2:
        "A TEDx speaker and author of the Bikalima training workbook series. He delivers training programs in the art of public speaking, professional leadership skills, and project funding — as an extension of his institutional work and impact experience.",
      ctaLabel: "Connect on LinkedIn",
    },
  },
  "why-bikalima": {
    ar: {
      heading: "لماذا بكلمة؟",
      subheading: "المشكلة ليست أن ليس لديك ما تقوله — المشكلة أن ما تقوله لا يصل كما تريد.",
      point1Title: "لأن صمتك في اللحظة الحاسمة له ثمن",
      point1Body:
        "خسارة وظيفة لأن المقابلة لم تُقنع. فكرة عظيمة ضاعت لأن أحداً لم يسمعها. شراكة لم تُعقد لأن الكلمات لم تكن في محلّها. هذه ليست مشكلة تعبير — هي خسارة حقيقية يمكن تجنّبها.",
      point2Title: "لأن المشكلة ليست في الأفكار",
      point2Body:
        "معظم من يعانون من ضعف التواصل لديهم أفكار عميقة وحقيقية. المشكلة في الفجوة بين ما يُفكّرون فيه وما يصل للآخرين. بكلمة يجسّر هذه الفجوة بمنهجية تعمل على اللفظ والذهن والأداء معاً.",
      point3Title: "لأن الثقة مهارة، لا موهبة",
      point3Body:
        "٧٠٪ ممن يصمتون لم يُولدوا خائفين — بل تعلّموا الخوف في مكان ما. نعمل على الجذور قبل الأداء. ما بُني يمكن إعادة بنائه — وهذا تحديداً ما نفعله.",
    },
    en: {
      heading: "Why Bikalima?",
      subheading: "The problem isn't that you have nothing to say — it's that what you say doesn't land the way you intend.",
      point1Title: "Because your silence in the critical moment has a cost",
      point1Body:
        "A missed job because the interview didn't convince. A brilliant idea lost because no one heard it. A partnership that never formed because the words weren't there. This isn't a communication problem — it's a real loss that can be prevented.",
      point2Title: "Because the problem isn't in your ideas",
      point2Body:
        "Most people who struggle with communication have deep, genuine thoughts. The problem is the gap between what they think and what reaches others. Bikalima bridges that gap with a methodology that works on expression, mindset, and delivery together.",
      point3Title: "Because confidence is a skill, not a talent",
      point3Body:
        "70% of those who go silent weren't born afraid — they learned fear somewhere along the way. We work on the roots before the performance. What was built can be rebuilt — and that is exactly what we do.",
    },
  },
  programs: {
    ar: {
      heading: "البرامج التدريبية",
      subheading: "دورة أساسية تنبثق منها ثلاثة مسارات — كل مسار يُولد أثراً يتضاعف.",
    },
    en: {
      heading: "Training Programs",
      subheading: "A core course that branches into three tracks — each one multiplying the impact.",
    },
  },
  events: {
    ar: {
      heading: "الفعاليات القادمة",
      subheading: "دورات وجاهية جماعية — سجّل مكانك الآن",
      ctaLabel: "احجز جلسة استشارية مجانية",
    },
    en: {
      heading: "Upcoming Events",
      subheading: "In-person group courses — secure your spot now",
      ctaLabel: "Book a Free Consultation",
    },
  },
  "gallery-preview": {
    ar: {
      heading: "معرض بكلمة",
      subheading: "لحظات حقيقية من دوراتنا التدريبية وخطاباتنا — أفواج متعددة، وجوه تغيّرت، وكلمات صنعت أثراً.",
    },
    en: {
      heading: "Bikalima Gallery",
      subheading: "Real moments from our training programs and speeches — cohorts across the globe, lives changed, words that made an impact.",
    },
  },
  "field-videos": {
    ar: {
      heading: "من الميدان — فيديوهات",
      subheading: "مكتبة تعليمية شاملة تُغطي كل مهارات التواصل والإلقاء والتفاوض — فيديوهات قصيرة بترجمة عربية.",
    },
    en: {
      heading: "From the Field — Videos",
      subheading: "A comprehensive learning library covering every communication, speaking and negotiation skill — short videos with Arabic subtitles.",
    },
  },
  testimonials: {
    ar: {
      heading: "كلماتٌ من قلوب من سبقوك",
      subheading: "أصواتٌ حقيقية من متدربين ومدربين وأولياء أمور — هؤلاء بدأوا رحلتهم معنا، فلِمَ لا تكون التالي؟",
    },
    en: {
      heading: "Words from those who came before you",
      subheading: "Real voices from trainees, trainers, and parents — they started their journey with us. Why not be next?",
    },
  },
  faq: {
    ar: {
      heading: "الأسئلة الشائعة",
      subheading: "كل ما تحتاج لمعرفته عن برامجنا ومساراتها.",
    },
    en: {
      heading: "Frequently Asked Questions",
      subheading: "Everything you need to know about our programs and tracks.",
    },
  },
  "enrollment-form": {
    ar: {
      heading: "للأفراد والمؤسسات",
      subheading:
        "اطلب عرضًا مخصصًا لمؤسستك أو مجموعتك. للأفراد: استخدم زر «ابدأ التعلم الآن» في الأعلى للتسجيل المباشر في الدورة.",
      submitLabel: "تأكيد الطلب",
    },
    en: {
      heading: "For Institutions & Groups",
      subheading:
        "Request a custom proposal for your institution or group. For individuals: use the “Start learning now” button above to enroll directly in a course.",
      submitLabel: "Confirm Registration",
    },
  },
  footer: {
    ar: {
      tagline:
        "مؤسسة تعليمية وتدريبية متخصصة في بناء مهارات الخطابة والتواصل للشباب والمهنيين والمعلمين.",
      copyrightSuffix: "بكلمة. جميع الحقوق محفوظة.",
    },
    en: {
      tagline:
        "An educational and training institution specializing in building public speaking and communication skills for youth, professionals, and educators.",
      copyrightSuffix: "Bikalima. All rights reserved.",
    },
  },
};

for (const k of HOME_SECTION_KEYS) {
  if (!SECTION_DEFAULTS[k]) {
    throw new Error(`SECTION_DEFAULTS missing entry for "${k}"`);
  }
}
