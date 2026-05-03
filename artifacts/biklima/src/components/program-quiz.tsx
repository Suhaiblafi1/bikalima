import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, ArrowLeft, RefreshCw, Calendar, CheckCircle2 } from "lucide-react";
import { programs, getLocalizedProgram } from "../programsData";
import { PROGRAM_SLUGS } from "@/lib/site-config";
import type { Lang } from "../translations";

type ProgramId = "core" | "tot" | "teachers" | "children";

type QuizText = {
  badge: string;
  heading: string;
  sub: string;
  start: string;
  progress: (n: number, total: number) => string;
  next: string;
  back: string;
  retake: string;
  resultIntro: string;
  resultProgramLabel: string;
  startProgram: string;
  bookConsult: string;
  questions: { q: string; options: { label: string; scores: Partial<Record<ProgramId, number>> }[] }[];
};

const TEXT: Record<Lang, QuizText> = {
  ar: {
    badge: "اختبار سريع",
    heading: "ما البرنامج المناسب لك؟",
    sub: "أجب عن ٦ أسئلة قصيرة، وسنرشّح لك المسار الأنسب من برامج بكلمة.",
    start: "ابدأ الاختبار",
    progress: (n, total) => `السؤال ${n} من ${total}`,
    next: "التالي",
    back: "السابق",
    retake: "أعد الاختبار",
    resultIntro: "البرنامج الأنسب لك هو",
    resultProgramLabel: "البرنامج المُرشَّح",
    startProgram: "ابدأ بهذا البرنامج",
    bookConsult: "احجز استشارة",
    questions: [
      {
        q: "هل تريد تطوير حضورك الشخصي أم تدريب الآخرين؟",
        options: [
          { label: "تطوير حضوري الشخصي", scores: { core: 3 } },
          { label: "تدريب الآخرين", scores: { tot: 3 } },
        ],
      },
      {
        q: "هل أنت معلم أو ولي أمر؟",
        options: [
          { label: "نعم", scores: { teachers: 3 } },
          { label: "لا", scores: {} },
        ],
      },
      {
        q: "هل تبحث عن برنامج لطفل؟",
        options: [
          { label: "نعم", scores: { children: 5 } },
          { label: "لا", scores: {} },
        ],
      },
      {
        q: "هل لديك مقابلة أو عرض تقديمي قريب؟",
        options: [
          { label: "نعم", scores: { core: 2 } },
          { label: "لا", scores: {} },
        ],
      },
      {
        q: "هل تخاف من التحدث أمام الجمهور؟",
        options: [
          { label: "نعم", scores: { core: 2 } },
          { label: "لا", scores: {} },
        ],
      },
      {
        q: "هل تريد الحصول على شهادة مدرب معتمد؟",
        options: [
          { label: "نعم", scores: { tot: 4 } },
          { label: "لا", scores: {} },
        ],
      },
    ],
  },
  en: {
    badge: "Quick Quiz",
    heading: "Which Bikalima program is right for you?",
    sub: "Answer 6 short questions and we'll recommend the path that fits you best.",
    start: "Start Quiz",
    progress: (n, total) => `Question ${n} of ${total}`,
    next: "Next",
    back: "Back",
    retake: "Retake quiz",
    resultIntro: "The program that fits you best is",
    resultProgramLabel: "Recommended Program",
    startProgram: "Start this program",
    bookConsult: "Book a consultation",
    questions: [
      {
        q: "Do you want to develop your own presence, or train others?",
        options: [
          { label: "Develop my own presence", scores: { core: 3 } },
          { label: "Train others", scores: { tot: 3 } },
        ],
      },
      {
        q: "Are you a teacher or a parent?",
        options: [
          { label: "Yes", scores: { teachers: 3 } },
          { label: "No", scores: {} },
        ],
      },
      {
        q: "Are you looking for a program for a child?",
        options: [
          { label: "Yes", scores: { children: 5 } },
          { label: "No", scores: {} },
        ],
      },
      {
        q: "Do you have an upcoming interview or presentation?",
        options: [
          { label: "Yes", scores: { core: 2 } },
          { label: "No", scores: {} },
        ],
      },
      {
        q: "Do you fear public speaking?",
        options: [
          { label: "Yes", scores: { core: 2 } },
          { label: "No", scores: {} },
        ],
      },
      {
        q: "Do you want a certified trainer certificate?",
        options: [
          { label: "Yes", scores: { tot: 4 } },
          { label: "No", scores: {} },
        ],
      },
    ],
  },
};

const TIE_BREAKER: ProgramId[] = ["children", "tot", "teachers", "core"];
const CONSULT_URL = "https://scheduler.zoom.us/suhaib-ahmad-x9pyfc";

function pickWinner(answers: number[], questions: QuizText["questions"]): ProgramId {
  const totals: Record<ProgramId, number> = { core: 0, tot: 0, teachers: 0, children: 0 };
  answers.forEach((optIdx, qIdx) => {
    const scores = questions[qIdx]?.options[optIdx]?.scores ?? {};
    (Object.keys(scores) as ProgramId[]).forEach((k) => {
      totals[k] += scores[k] ?? 0;
    });
  });
  const max = Math.max(...Object.values(totals));
  if (max === 0) return "core";
  for (const id of TIE_BREAKER) if (totals[id] === max) return id;
  return "core";
}

export function ProgramQuiz({ lang }: { lang: Lang }) {
  const [, navigate] = useLocation();
  const t = TEXT[lang];
  const total = t.questions.length;
  const [step, setStep] = useState<number>(-1); // -1 = intro screen
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(total).fill(null));

  const isComplete = step >= total;
  const winner = useMemo<ProgramId | null>(() => {
    if (!isComplete) return null;
    return pickWinner(answers as number[], t.questions);
  }, [isComplete, answers, t.questions]);

  const winningProgram = useMemo(() => {
    if (!winner) return null;
    const base = programs.find((p) => p.id === winner);
    if (!base) return null;
    const local = getLocalizedProgram(base, lang);
    return { ...base, ...local };
  }, [winner, lang]);

  const handleSelect = (qIdx: number, optIdx: number) => {
    const next = [...answers];
    next[qIdx] = optIdx;
    setAnswers(next);
    setStep(qIdx + 1);
  };

  const handleReset = () => {
    setAnswers(Array(total).fill(null));
    setStep(-1);
  };

  const progressPct = isComplete ? 100 : step <= 0 ? 0 : (step / total) * 100;

  return (
    <section id="program-quiz" className="pt-20 md:pt-24 pb-10 md:pb-12 bg-gradient-to-b from-background via-primary/5 to-background border-y border-border">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-4 text-sm">
            <Sparkles className="w-4 h-4" />
            {t.badge}
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3">{t.heading}</h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">{t.sub}</p>
        </div>

        <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden">
          {/* Progress bar */}
          {step >= 0 && (
            <div className="h-1.5 bg-secondary/40">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          )}

          <div className="p-5 md:p-7 min-h-[220px] flex flex-col">
            <AnimatePresence mode="wait">
              {/* INTRO */}
              {step === -1 && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center text-center flex-1 gap-3 py-2"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-muted-foreground text-sm max-w-md">{t.sub}</p>
                  <Button
                    size="default"
                    onClick={() => setStep(0)}
                    className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-6"
                    data-testid="button-quiz-start"
                  >
                    {t.start}
                    {lang === "ar" ? <ArrowLeft className="w-4 h-4 ms-2" /> : <ArrowRight className="w-4 h-4 ms-2" />}
                  </Button>
                </motion.div>
              )}

              {/* QUESTIONS */}
              {step >= 0 && step < total && (
                <motion.div
                  key={`q-${step}`}
                  initial={{ opacity: 0, x: lang === "ar" ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: lang === "ar" ? 20 : -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col flex-1"
                >
                  <div className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
                    {t.progress(step + 1, total)}
                  </div>
                  <h3 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-6 leading-snug">
                    {t.questions[step].q}
                  </h3>
                  <div className="grid gap-3 flex-1">
                    {t.questions[step].options.map((opt, idx) => {
                      const selected = answers[step] === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelect(step, idx)}
                          data-testid={`button-quiz-option-${step}-${idx}`}
                          className={`w-full text-start px-5 py-4 rounded-2xl border-2 transition-all font-medium text-base hover:border-primary hover:bg-primary/5 ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background text-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span>{opt.label}</span>
                            {selected && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {step > 0 && (
                    <div className="mt-6 flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStep(step - 1)}
                        className="text-muted-foreground hover:text-foreground"
                        data-testid="button-quiz-back"
                      >
                        {lang === "ar" ? <ArrowRight className="w-4 h-4 me-1" /> : <ArrowLeft className="w-4 h-4 me-1" />}
                        {t.back}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {step + 1} / {total}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* RESULT */}
              {isComplete && winningProgram && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col flex-1"
                >
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
                      <Sparkles className="w-3.5 h-3.5" />
                      {t.resultProgramLabel}
                    </div>
                    <p className="text-muted-foreground text-sm">{t.resultIntro}</p>
                  </div>

                  <div className="rounded-2xl overflow-hidden border-2 border-primary shadow-lg bg-background">
                    <div className="aspect-[16/7] relative">
                      <img
                        src={winningProgram.image}
                        alt={winningProgram.shortTitle}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                        <div className="text-xs font-medium opacity-90 mb-1">{winningProgram.role}</div>
                        <h3 className="font-serif text-2xl md:text-3xl font-bold">{winningProgram.shortTitle}</h3>
                      </div>
                    </div>
                    <div className="p-5 md:p-6">
                      <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-5 line-clamp-4">
                        {winningProgram.description}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          size="lg"
                          onClick={() => navigate(`/courses/${PROGRAM_SLUGS[winningProgram.id]}`)}
                          className="flex-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                          data-testid="button-quiz-start-program"
                        >
                          {t.startProgram}
                          {lang === "ar" ? <ArrowLeft className="w-4 h-4 ms-2" /> : <ArrowRight className="w-4 h-4 ms-2" />}
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={() => window.open(CONSULT_URL, "_blank", "noopener,noreferrer")}
                          className="flex-1 rounded-full border-2"
                          data-testid="button-quiz-consult"
                        >
                          <Calendar className="w-4 h-4 me-2" />
                          {t.bookConsult}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                      data-testid="button-quiz-retake"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {t.retake}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
