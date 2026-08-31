/**
 * Described score bands for the rubrics that grade on a wide numeric scale.
 *
 * The workbook rubrics in ./rubrics.ts pick between four named levels. The
 * speech evaluation predates them and scores each criterion 0–100, with
 * evaluations already recorded on that scale — so the fix here is not to
 * replace the scale but to say what a number on it means.
 *
 * Without that, "المعايير (٠–١٠٠)" and seven bare inputs is what a grader
 * gets: no definition of any criterion, and a scale precise enough to invite
 * a choice between 71 and 74 that nobody could justify. Two evaluators score
 * the same recording differently and the average of their numbers looks like
 * a measurement.
 *
 * Arabic only, deliberately. This is the admin evaluation screen, which has
 * no English anywhere; twenty-eight English descriptors for a screen nobody
 * reads in English would be content written for no reader. The learner-facing
 * rubrics in ./rubrics.ts are bilingual because learners read both.
 */

export type ScoreBand = {
  /** Inclusive lower bound on the criterion's scale. */
  readonly from: number;
  /** Inclusive upper bound. */
  readonly to: number;
  readonly labelAr: string;
  /** What a grader must be able to observe to place the work in this band. */
  readonly descriptorAr: string;
  /** What clicking this band records — a defensible middle, not the edge. */
  readonly represents: number;
};

export type BandCriterion = {
  readonly key: string;
  readonly titleAr: string;
  readonly bands: readonly [ScoreBand, ScoreBand, ScoreBand, ScoreBand];
};

export type BandRubric = {
  readonly key: string;
  readonly version: number;
  readonly titleAr: string;
  readonly min: number;
  readonly max: number;
  readonly criteria: readonly BandCriterion[];
};

const BAND_LABELS: readonly [string, string, string, string] = [
  "لم يتحقّق",
  "أوّليّ",
  "متمكّن",
  "متميّز",
];

/** 0–100 split into the four bands, with the representative score each records. */
const RANGES: readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
] = [
  [0, 49, 35],
  [50, 69, 60],
  [70, 84, 78],
  [85, 100, 92],
];

function bands(
  descriptors: readonly [string, string, string, string],
): readonly [ScoreBand, ScoreBand, ScoreBand, ScoreBand] {
  return descriptors.map((descriptorAr, i) => ({
    from: RANGES[i][0],
    to: RANGES[i][1],
    represents: RANGES[i][2],
    labelAr: BAND_LABELS[i],
    descriptorAr,
  })) as unknown as readonly [ScoreBand, ScoreBand, ScoreBand, ScoreBand];
}

/**
 * The seven criteria of the speech evaluation, each with what its bands mean.
 *
 * The criterion keys are the ones already stored in speech_evaluations'
 * rubric JSON — clarity, voice, body_language, structure, content, presence,
 * impact — so existing evaluations keep reading correctly against them.
 */
export const SPEECH_EVAL_RUBRIC: BandRubric = {
  key: "speech_evaluation",
  version: 1,
  titleAr: "معايير تقييم الخطبة",
  min: 0,
  max: 100,
  criteria: [
    {
      key: "clarity",
      titleAr: "الوضوح",
      bands: bands([
        "لا تُفهم الرسالة بعد سماع المقطع كاملاً؛ الجمل غير مكتملة أو الأفكار تتقاطع.",
        "المعنى يُفهم بجهد: يحتاج السامع أن يعيد ترتيب ما قيل في ذهنه ليصل إليه.",
        "كل جملة مفهومة من أوّل سماع، وأي مصطلح يُشرَح في موضعه.",
        "الوضوح مقصود لا عارض: جملٌ قصيرة عند مواضع الثقل، وتلخيصٌ للفكرة قبل الانتقال عنها.",
      ]),
    },
    {
      key: "voice",
      titleAr: "الصوت",
      bands: bands([
        "منخفض أو متسارع أو مسطّح إلى حدّ تضيع معه كلمات على السامع.",
        "مسموع وواضح، لكن بنبرة واحدة من أوّله إلى آخره وبلا وقفات مقصودة.",
        "تغيّر في السرعة والعلوّ يخدم المعنى، ووقفات في مواضعها.",
        "الصوت أداة: الصمت والتشديد والسرعة تُستعمل لصناعة لحظة بعينها، لا لتفادي الخطأ.",
      ]),
    },
    {
      key: "body_language",
      titleAr: "لغة الجسد",
      bands: bands([
        "حركة عصبية متكرّرة تسحب الانتباه من الكلام، أو جمودٌ تامّ لا يفارقه.",
        "وقوف ثابت، والنظر إلى الورقة أو الأرض أكثر من الجمهور؛ لا حركة ضارّة ولا نافعة.",
        "تواصل بصري موزّع على الجمهور، ويدان تشرح لا تُشغل، ووقوف مستقرّ.",
        "كل حركة وكل انتقال في المكان له سبب في الخطبة، والوجه يحمل ما يقوله الكلام.",
      ]),
    },
    {
      key: "structure",
      titleAr: "الهيكلة",
      bands: bands([
        "لا بداية ولا وسط ولا خاتمة؛ يمكن تبديل مواضع الأجزاء دون أن يتغيّر شيء.",
        "هناك ترتيب، لكنه سرد متتالٍ: الانتقال من فكرة إلى أخرى غير محسوب.",
        "افتتاحية تفتح، وجسمٌ متسلسل، وخاتمة تُغلق، وانتقالات يسمعها الجمهور.",
        "الهيكل نفسه يحمل المعنى: حذف جزء أو نقله يُضعف الخطبة بوضوح.",
      ]),
    },
    {
      key: "content",
      titleAr: "المحتوى",
      bands: bands([
        "عموميات بلا مثال ولا دليل؛ الكلام يصلح أن يُقال في أي موضوع آخر.",
        "أفكار صحيحة لكن مأخوذة كما هي، بلا إضافة من المتحدّث نفسه.",
        "كل فكرة رئيسية مسنودة بمثال محدّد أو رقم أو قصّة.",
        "زاويةٌ خاصّة بالمتحدّث، مسنودة بتجربة أو دليل لا يملكه غيره.",
      ]),
    },
    {
      key: "presence",
      titleAr: "الحضور",
      bands: bands([
        "يبدو أن المتحدّث يريد أن ينتهي؛ التوتّر هو ما يقود الأداء.",
        "علامات التوتّر بادية، لكنه يواصل ويصل إلى النهاية.",
        "بداية ثابتة، وتعامل هادئ مع أي تعثّر، بلا اعتذار ولا استعجال للنهاية.",
        "حضورٌ يمنح الجمهور الأمان: يستطيع أن يصمت، وأن يخرج عن النصّ، ثم يعود.",
      ]),
    },
    {
      key: "impact",
      titleAr: "التأثير",
      bands: bands([
        "لا يبقى من الخطبة شيء بعد انتهائها.",
        "تشدّ الانتباه أثناءها، ولا يبقى منها ما يُحكى بعدها.",
        "لحظة واحدة على الأقلّ يستطيع السامع أن يحكيها لغيره بعد أيام.",
        "تطلب من السامع شيئاً محدّداً وتجعله يريد أن يفعله.",
      ]),
    },
  ],
};

/** The band a score falls in, or null when there is no score yet. */
export function bandFor(rubric: BandRubric, criterionKey: string, score: number | null | undefined): ScoreBand | null {
  if (score === null || score === undefined || Number.isNaN(score)) return null;
  const criterion = rubric.criteria.find((c) => c.key === criterionKey);
  if (!criterion) return null;
  return criterion.bands.find((b) => score >= b.from && score <= b.to) ?? null;
}
