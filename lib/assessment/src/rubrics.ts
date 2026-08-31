import type { SkillKey } from "./skills";

/**
 * The grading rubrics for workbook exercises.
 *
 * What this replaces: a trainer pressed "اجتاز" or "يحتاج تعديلاً" and the
 * page paid its whole skill_points or nothing. Two trainers judging the same
 * speech had no shared definition of a pass, the learner was told only that
 * they had passed, and a recording that shows voice, body language, impact and
 * composure at once credited exactly one of them.
 *
 * Every cell below is written out. A rubric whose lower levels say "less than
 * the level above" is not a rubric — it is the same private judgement with a
 * number attached, and it buys none of the agreement between graders that is
 * the whole reason to have one.
 *
 * The wording is deliberately observable. "الفكرة واضحة" is a matter of taste;
 * "يستطيع القارئ أن يعيد صياغتها في جملة واحدة" is something a grader can
 * check and a learner can argue with.
 *
 * VERSIONING. Each rubric carries a version, stored on every submission it
 * grades. Reword a descriptor and the marks already recorded keep meaning what
 * they meant when they were given; a later reader can tell which text a "3"
 * was measured against. Bump the version on any change to wording, weights or
 * criteria — never edit in place.
 */

export type RubricLevelValue = 1 | 2 | 3 | 4;

export type RubricLevel = {
  readonly value: RubricLevelValue;
  readonly labelAr: string;
  readonly labelEn: string;
  /** What a grader must be able to observe to give this level. */
  readonly descriptorAr: string;
  readonly descriptorEn: string;
};

export type RubricCriterion = {
  readonly key: string;
  readonly titleAr: string;
  readonly titleEn: string;
  /**
   * The skill this criterion pays into, or null for a criterion that belongs
   * in the judgement but is not one of the eight counters. "Following the
   * brief" is such a criterion: ignoring what was asked has to cost marks, but
   * it is not a public-speaking skill and inventing a ninth counter for it
   * would put a number on a screen that means nothing.
   */
  readonly skillKey: SkillKey | null;
  /** Relative importance within this rubric. */
  readonly weight: number;
  readonly levels: readonly [RubricLevel, RubricLevel, RubricLevel, RubricLevel];
};

export type Rubric = {
  readonly key: RubricKey;
  readonly version: number;
  readonly titleAr: string;
  readonly titleEn: string;
  readonly criteria: readonly RubricCriterion[];
  /**
   * The share of the available marks a pass normally needs. 0.6 sits just
   * below "level 3 everywhere" (0.667), so a learner who is solid across the
   * board passes even after one weak criterion, and one who is level 2
   * everywhere (0.333) does not.
   */
  readonly passThreshold: number;
};

export type RubricKey = "text" | "video_link";

const LEVEL_LABELS: readonly [string, string, string, string] = [
  "لم يتحقّق",
  "أوّليّ",
  "متمكّن",
  "متميّز",
];

const LEVEL_LABELS_EN: readonly [string, string, string, string] = [
  "Not yet",
  "Emerging",
  "Proficient",
  "Distinguished",
];

function levels(
  cells: readonly [
    readonly [string, string],
    readonly [string, string],
    readonly [string, string],
    readonly [string, string],
  ],
): readonly [RubricLevel, RubricLevel, RubricLevel, RubricLevel] {
  return cells.map((cell, i) => ({
    value: (i + 1) as RubricLevelValue,
    labelAr: LEVEL_LABELS[i],
    labelEn: LEVEL_LABELS_EN[i],
    descriptorAr: cell[0],
    descriptorEn: cell[1],
  })) as unknown as readonly [RubricLevel, RubricLevel, RubricLevel, RubricLevel];
}

/**
 * Written exercises: "اكتب افتتاحية من ثلاث جمل لخطبة عن مدينتك".
 *
 * Voice, body language and composure are not judged here — they are not on the
 * page. A rubric that asks a grader to rate what the evidence cannot show is
 * how a rubric starts producing numbers people ignore.
 */
export const TEXT_RUBRIC: Rubric = {
  key: "text",
  version: 1,
  titleAr: "معايير تقييم التمرين المكتوب",
  titleEn: "Written exercise rubric",
  passThreshold: 0.6,
  criteria: [
    {
      key: "idea_clarity",
      titleAr: "وضوح الفكرة",
      titleEn: "Clarity of the idea",
      skillKey: "idea",
      weight: 3,
      levels: levels([
        [
          "لا تُعرف الفكرة الرئيسية بعد قراءة النصّ كاملاً، أو تتنازع فيه أكثر من فكرة بلا واحدة تقود.",
          "After reading the whole answer the main idea is still not identifiable, or several ideas compete with none leading.",
        ],
        [
          "الفكرة موجودة لكن على القارئ أن يستنتجها؛ لا توجد جملة واحدة تقولها صراحة.",
          "An idea is there but the reader has to infer it; no single sentence states it outright.",
        ],
        [
          "الفكرة الرئيسية تُفهم من القراءة الأولى، ويستطيع القارئ أن يعيد صياغتها في جملة واحدة.",
          "The main idea lands on first reading, and the reader can restate it in one sentence.",
        ],
        [
          "الفكرة واحدة ومحدّدة، وفيها زاوية خاصّة بصاحبها لا تصلح أن تُنقل كما هي إلى موضوع آخر.",
          "One specific idea, carrying an angle of the writer's own that could not be lifted onto another topic unchanged.",
        ],
      ]),
    },
    {
      key: "structure",
      titleAr: "البناء والترتيب",
      titleEn: "Structure and order",
      skillKey: "structure",
      weight: 3,
      levels: levels([
        [
          "يمكن تبديل مواضع الجمل دون أن يتغيّر شيء؛ لا بداية ولا وسط ولا خاتمة.",
          "The sentences could be reordered without changing anything; there is no beginning, middle or end.",
        ],
        [
          "هناك ترتيب، لكنه سرد متتالٍ: كل جملة تبدأ من جديد بدل أن تُكمل ما قبلها.",
          "There is an order, but it reads as a list: each sentence restarts instead of continuing the one before it.",
        ],
        [
          "كل جملة تُسلّم للتي بعدها، والافتتاحية تفتح والخاتمة تُغلق.",
          "Each sentence hands over to the next; the opening opens and the closing closes.",
        ],
        [
          "الترتيب نفسه يخدم المعنى: تقديم جملة واحدة أو تأخيرها يُضعف النصّ بوضوح.",
          "The order itself carries meaning: moving a single sentence would visibly weaken the piece.",
        ],
      ]),
    },
    {
      key: "impact",
      titleAr: "الأثر في القارئ",
      titleEn: "Effect on the reader",
      skillKey: "impact",
      weight: 2,
      levels: levels([
        [
          "لا صورة ولا موقف ولا سؤال؛ لا يبقى من النصّ شيء بعد إغلاقه.",
          "No image, no situation, no question; nothing remains once the page is closed.",
        ],
        [
          "هناك محاولة للتأثير، لكنها عبارة عامّة يمكن أن تُقال في أي موضوع.",
          "There is an attempt at effect, but through a general phrase that would fit any topic.",
        ],
        [
          "صورة أو مثال أو سؤال محدّد يجعل القارئ يتوقّف عنده.",
          "A specific image, example or question makes the reader pause on it.",
        ],
        [
          "جملة واحدة على الأقلّ يستطيع القارئ أن يستشهد بها لاحقاً بلفظها.",
          "At least one sentence the reader could quote back later, word for word.",
        ],
      ]),
    },
    {
      key: "brief",
      titleAr: "الالتزام بالمطلوب",
      titleEn: "Meeting the brief",
      skillKey: null,
      weight: 2,
      levels: levels([
        [
          "أُجيب عن غير ما طُلب، أو خُولف الحدّ المطلوب (العدد أو الطول أو الموضوع).",
          "Answers something other than what was asked, or breaks the stated limit (count, length or topic).",
        ],
        [
          "تحقّق بعض ما طلبه التمرين وأُهمل بعضه الآخر.",
          "Some of what the exercise asked for is there; some of it is missing.",
        ],
        [
          "كلّ ما طلبه التمرين موجود، وبالصيغة التي طُلب بها.",
          "Everything the exercise asked for is present, in the form it was asked for.",
        ],
        [
          "المطلوب كامل، وأُضيف إليه ما يخدمه دون خروج عن حدّ التمرين.",
          "The brief is fully met, with an addition that serves it without exceeding the exercise's limits.",
        ],
      ]),
    },
  ],
};

/**
 * Speech recordings: "ارفع رابط تسجيل خطبتك".
 *
 * The four criteria are the four things a recording actually shows at once,
 * which is the reason this exists — the old single skill_key had to pick one
 * of them and threw the other three away.
 *
 * Composure and managing fear are one criterion, not two. They are told apart
 * by what a speaker feels rather than by anything on the recording, and two
 * criteria a grader cannot separate is exactly how a rubric loses the
 * agreement between graders it was built to buy.
 */
export const VIDEO_RUBRIC: Rubric = {
  key: "video_link",
  version: 1,
  titleAr: "معايير تقييم الخطبة المصوّرة",
  titleEn: "Recorded speech rubric",
  passThreshold: 0.6,
  criteria: [
    {
      key: "voice",
      titleAr: "الصوت والإلقاء",
      titleEn: "Voice and delivery",
      skillKey: "voice",
      weight: 3,
      levels: levels([
        [
          "الصوت منخفض أو متسارع إلى حدّ تضيع معه كلمات على السامع.",
          "So quiet or so rushed that words are lost to the listener.",
        ],
        [
          "الكلام مسموع وواضح، لكن النبرة واحدة من أوّله إلى آخره وبلا وقفات مقصودة.",
          "Audible and clear, but one single tone from start to finish, with no deliberate pauses.",
        ],
        [
          "تغيّر في السرعة والعلوّ يخدم المعنى، ووقفات في مواضعها.",
          "Changes of pace and volume that serve the meaning, with pauses in the right places.",
        ],
        [
          "الصوت أداة: الصمت والتشديد والسرعة تُستعمل لصناعة لحظة بعينها، لا لتفادي الخطأ.",
          "The voice is an instrument: silence, emphasis and pace are used to build a particular moment, not to avoid mistakes.",
        ],
      ]),
    },
    {
      key: "body",
      titleAr: "لغة الجسد والحضور",
      titleEn: "Body language and presence",
      skillKey: "body",
      weight: 3,
      levels: levels([
        [
          "حركة عصبية متكرّرة (تمايل، لمس الوجه، عبث باليدين) تسحب الانتباه من الكلام.",
          "Repeated nervous movement — swaying, touching the face, fidgeting — pulls attention away from the words.",
        ],
        [
          "وقوف ثابت والنظر إلى الورقة أو الأرض أكثر من الجمهور؛ لا حركة ضارّة ولا نافعة.",
          "Static stance, eyes on notes or the floor more than on the audience; movement neither harms nor helps.",
        ],
        [
          "تواصل بصري موزّع على الجمهور، ويدان تشرح لا تُشغل، ووقوف مستقرّ.",
          "Eye contact spread across the audience, hands that explain rather than distract, a settled stance.",
        ],
        [
          "كل حركة وكل انتقال في المكان له سبب في الخطبة، والوجه يحمل ما يقوله الكلام.",
          "Every gesture and move has a reason in the speech, and the face carries what the words are saying.",
        ],
      ]),
    },
    {
      key: "impact",
      titleAr: "الأثر في الجمهور",
      titleEn: "Effect on the audience",
      skillKey: "impact",
      weight: 2,
      levels: levels([
        [
          "معلومات تُقال بلا سبب يجعل السامع يهتمّ بها.",
          "Information delivered with no reason given for the listener to care about it.",
        ],
        [
          "هناك ما يشدّ الانتباه أثناء الخطبة، لكنه لا يبقى بعد انتهاء المقطع.",
          "Something holds attention during the speech, but nothing survives the end of the clip.",
        ],
        [
          "لحظة واحدة على الأقلّ يستطيع السامع أن يحكيها لغيره بعد أيام.",
          "At least one moment the listener could retell to someone else days later.",
        ],
        [
          "الخطبة تطلب من السامع شيئاً محدّداً وتجعله يريد أن يفعله.",
          "The speech asks the listener for something specific, and makes them want to do it.",
        ],
      ]),
    },
    {
      key: "composure",
      titleAr: "الثقة وإدارة التوتّر",
      titleEn: "Composure under pressure",
      skillKey: "confidence",
      weight: 2,
      levels: levels([
        [
          "التوتّر يقود الأداء: تلجلج متكرّر أو توقّف، أو اعتذار عن الأداء داخل الخطبة نفسها.",
          "Nerves are driving: repeated stumbling or stopping, or apologising for the delivery inside the speech itself.",
        ],
        [
          "علامات التوتّر بادية، لكن المتحدّث يواصل ويصل إلى النهاية.",
          "Signs of nerves are visible, but the speaker keeps going and reaches the end.",
        ],
        [
          "بداية ثابتة، وتعامل هادئ مع أي تعثّر، بلا اعتذار ولا استعجال للنهاية.",
          "A steady start, calm handling of any stumble, no apology and no rush to finish.",
        ],
        [
          "حضورٌ يمنح الجمهور الأمان: يستطيع أن يصمت، وأن يخرج عن النصّ، ثم يعود.",
          "A presence that puts the audience at ease: able to fall silent, leave the script, and come back.",
        ],
      ]),
    },
  ],
};

export const RUBRICS: Readonly<Record<RubricKey, Rubric>> = {
  text: TEXT_RUBRIC,
  video_link: VIDEO_RUBRIC,
};

/** The rubric that applies to an exercise type, or null when there is none. */
export function rubricFor(exerciseType: string | null | undefined): Rubric | null {
  if (exerciseType === "text") return TEXT_RUBRIC;
  if (exerciseType === "video_link") return VIDEO_RUBRIC;
  return null;
}

/** The distinct skills a rubric can credit, in the order its criteria list them. */
export function rubricSkills(rubric: Rubric): readonly SkillKey[] {
  const seen: SkillKey[] = [];
  for (const c of rubric.criteria) {
    if (c.skillKey && !seen.includes(c.skillKey)) seen.push(c.skillKey);
  }
  return seen;
}
