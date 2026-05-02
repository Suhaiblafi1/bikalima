import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, GraduationCap, Heart, Building2,
  Sparkles, ChevronLeft, ChevronRight, Check,
  Target, Mic2, Briefcase, Users, BookOpen, Baby, MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Lang } from "../translations";
import { T } from "../translations";
import { programs, getLocalizedProgram } from "../programsData";

type Audience = "individual" | "teacher" | "parent" | "institution";
type GoalKey =
  | "goalConfidence" | "goalSpeak" | "goalCareer"
  | "goalTrain" | "goalTeach" | "goalChild" | "goalOther";
type ProgramId = "core" | "tot" | "teachers" | "children";
type ProgramChoice = ProgramId | "recommend";

const GOAL_ICONS: Record<GoalKey, React.ComponentType<{ className?: string }>> = {
  goalConfidence: Sparkles,
  goalSpeak: Mic2,
  goalCareer: Briefcase,
  goalTrain: Users,
  goalTeach: BookOpen,
  goalChild: Baby,
  goalOther: MoreHorizontal,
};

const ALL_GOALS: GoalKey[] = [
  "goalConfidence", "goalSpeak", "goalCareer",
  "goalTrain", "goalTeach", "goalChild", "goalOther",
];

const AUDIENCE_DEFS: { key: Audience; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "individual",  icon: User },
  { key: "teacher",     icon: GraduationCap },
  { key: "parent",      icon: Heart },
  { key: "institution", icon: Building2 },
];

function recommendProgram(audience: Audience, goal: GoalKey | "", goalText: string): ProgramId {
  if (audience === "parent") {
    return goal === "goalChild" ? "children" : "teachers";
  }
  if (audience === "teacher") {
    return goal === "goalTeach" ? "teachers" : "tot";
  }
  if (audience === "institution") {
    return goal === "goalChild" ? "children" : "teachers";
  }
  // individual
  if (goal === "goalTrain") return "tot";
  if (goal === "goalTeach") return "teachers";
  if (goal === "goalChild") return "children";
  // weak hint from free text
  const txt = goalText.toLowerCase();
  if (/طفل|اطفال|أطفال|child|kid/i.test(txt)) return "children";
  if (/مدرب|train|tot/i.test(txt)) return "tot";
  if (/معلم|teach/i.test(txt)) return "teachers";
  return "core";
}

interface Props {
  lang: Lang;
  onSuccess: (info: { name: string; program: string }) => void;
}

export function EnrollmentWizard({ lang, onSuccess }: Props) {
  const t = T[lang];
  const w = t.enroll.wizard;
  const { toast } = useToast();
  const dir = lang === "ar" ? "rtl" : "ltr";

  const localizedPrograms = useMemo(
    () => programs.map((p) => getLocalizedProgram(p, lang)),
    [lang],
  );

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [audience, setAudience] = useState<Audience | "">("");
  const [goal, setGoal] = useState<GoalKey | "">("");
  const [goalText, setGoalText] = useState("");
  const [programChoice, setProgramChoice] = useState<ProgramChoice | "">("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [studentCount, setStudentCount] = useState("");
  const [teacherCount, setTeacherCount] = useState("");
  const [extraMessage, setExtraMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isInstitution = audience === "institution";

  // Resolve the effective program id (after recommendation)
  const effectiveProgramId: ProgramId | null = useMemo(() => {
    if (!programChoice) return null;
    if (programChoice === "recommend") {
      if (!audience) return null;
      return recommendProgram(audience, goal, goalText);
    }
    return programChoice;
  }, [programChoice, audience, goal, goalText]);

  const effectiveProgram = useMemo(
    () => effectiveProgramId ? localizedPrograms.find((p) => p.id === effectiveProgramId) ?? null : null,
    [effectiveProgramId, localizedPrograms],
  );

  const goalLabel = (k: GoalKey | ""): string => {
    if (!k) return "";
    if (k === "goalOther") return goalText.trim() || w.goalOther;
    return w[k];
  };

  // Step navigation with validation
  const goNext = () => {
    if (step === 1) {
      if (!audience) { toast({ title: w.errPickAudience, variant: "destructive" }); return; }
    }
    if (step === 2) {
      if (!goal) { toast({ title: w.errPickGoal, variant: "destructive" }); return; }
      if (goal === "goalOther" && !goalText.trim()) { toast({ title: w.errPickGoal, variant: "destructive" }); return; }
    }
    if (step === 3) {
      if (!programChoice) { toast({ title: w.errPickProgram, variant: "destructive" }); return; }
    }
    setStep((s) => (s < 4 ? ((s + 1) as 1 | 2 | 3 | 4) : s));
  };

  const goBack = () => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s));

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !email.trim()) {
      toast({ title: w.errFillContact, variant: "destructive" });
      return;
    }
    if (isInstitution && !orgName.trim()) {
      toast({ title: w.errInstitutionName, variant: "destructive" });
      return;
    }

    const programShortTitle = effectiveProgram?.shortTitle ?? "";
    const isRecommend = programChoice === "recommend";

    // Build payload that the existing /api/enroll route understands
    const payload: Record<string, string> = {
      type: isInstitution ? "institution" : "individual",
      lang,
      // contact
      name,
      contactPerson: name,
      phone,
      email,
      // institution-specific
      orgName: isInstitution ? orgName : "",
      studentCount: isInstitution ? studentCount : "",
      teacherCount: isInstitution ? teacherCount : "",
      // program
      program: programShortTitle,
      programId: effectiveProgramId ?? "",
      // goal: send canonical enum key + display text separately so admin can
      // map by key and emails can show the label. `reason` carries the user's
      // free-form extra message (NOT the goal label), avoiding duplication.
      goal: goal || "",
      goalText: goalLabel(goal),
      reason: extraMessage,
      orgMessage: extraMessage,
      message: extraMessage,
      // wizard extras for admin/CRM (server normalizes "recommended" → boolean)
      audience: audience || "",
      recommended: isRecommend ? "true" : "false",
      leadSource: "wizard",
    };

    setSubmitting(true);
    try {
      const base = import.meta.env.BASE_URL || "/";
      const apiBase = base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
      const res = await fetch(`${apiBase}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("server_error");
      onSuccess({ name, program: programShortTitle });
    } catch {
      toast({
        title: lang === "ar" ? "حدث خطأ" : "Something went wrong",
        description: lang === "ar" ? "يرجى المحاولة مرة أخرى" : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Forward arrow icon respects RTL/LTR
  const ForwardIcon = lang === "ar" ? ChevronLeft : ChevronRight;
  const BackIcon = lang === "ar" ? ChevronRight : ChevronLeft;

  return (
    <div dir={dir} data-testid="enrollment-wizard">
      <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2">{t.enroll.heading}</h2>
      <p className="text-muted-foreground mb-6">{t.enroll.sub}</p>

      {/* Progress / step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-primary uppercase tracking-widest">
            {w.stepLabel} {step} {w.of} 4
          </span>
          <span className="text-xs font-bold text-muted-foreground">
            {Math.round((step / 4) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={false}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        {/* Step dots */}
        <div className="flex justify-between mt-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                n < step ? "bg-primary text-white"
                : n === step ? "bg-primary/15 text-primary ring-2 ring-primary"
                : "bg-secondary text-muted-foreground"
              }`}
            >
              {n < step ? <Check className="w-4 h-4" /> : n}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: lang === "ar" ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: lang === "ar" ? 20 : -20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {step === 1 && (
            <div data-testid="wizard-step-1">
              <h3 className="text-xl font-bold mb-1">{w.step1Title}</h3>
              <p className="text-sm text-muted-foreground mb-5">{w.step1Sub}</p>
              <div className="grid grid-cols-2 gap-3">
                {AUDIENCE_DEFS.map(({ key, icon: Icon }) => {
                  const titleKey = `aud${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof w;
                  const descKey = `${titleKey}Desc` as keyof typeof w;
                  const selected = audience === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAudience(key)}
                      data-testid={`wizard-audience-${key}`}
                      className={`flex flex-col items-start gap-2 p-5 rounded-2xl border-2 text-start transition-all ${
                        selected
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        selected ? "bg-primary text-white" : "bg-secondary text-primary"
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-base text-foreground">{w[titleKey] as string}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{w[descKey] as string}</p>
                      </div>
                      {selected && (
                        <div className="absolute"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div data-testid="wizard-step-2">
              <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> {w.step2Title}
              </h3>
              <p className="text-sm text-muted-foreground mb-5">{w.step2Sub}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {ALL_GOALS.map((g) => {
                  const Icon = GOAL_ICONS[g];
                  const selected = goal === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGoal(g)}
                      data-testid={`wizard-goal-${g}`}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-start transition-all ${
                        selected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        selected ? "bg-primary text-white" : "bg-secondary text-primary"
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-sm">{w[g]}</span>
                    </button>
                  );
                })}
              </div>
              {goal === "goalOther" && (
                <div className="mt-4">
                  <Input
                    autoFocus
                    value={goalText}
                    onChange={(e) => setGoalText(e.target.value)}
                    placeholder={w.goalOtherPlaceholder}
                    className="h-11 rounded-xl bg-background"
                    data-testid="wizard-goal-other-input"
                  />
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div data-testid="wizard-step-3">
              <h3 className="text-xl font-bold mb-1">{w.step3Title}</h3>
              <p className="text-sm text-muted-foreground mb-5">{w.step3Sub}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {localizedPrograms.map((p) => {
                  const selected = programChoice === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProgramChoice(p.id as ProgramId)}
                      data-testid={`wizard-program-${p.id}`}
                      className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-start transition-all ${
                        selected
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      <p className="font-bold text-sm text-foreground">{p.shortTitle}</p>
                      {p.title && p.title !== p.shortTitle && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{p.title}</p>
                      )}
                    </button>
                  );
                })}
                {/* Recommend option spans both columns */}
                <button
                  type="button"
                  onClick={() => setProgramChoice("recommend")}
                  data-testid="wizard-program-recommend"
                  className={`sm:col-span-2 flex items-center gap-3 p-4 rounded-2xl border-2 text-start transition-all ${
                    programChoice === "recommend"
                      ? "border-primary bg-gradient-to-br from-primary/10 to-accent/10 shadow-md"
                      : "border-dashed border-primary/40 bg-background hover:bg-primary/5"
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-foreground">{w.recommendTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{w.recommendDesc}</p>
                  </div>
                  {programChoice === "recommend" && effectiveProgram && (
                    <span className="text-[10px] font-bold bg-primary text-white px-2 py-1 rounded-full whitespace-nowrap">
                      {effectiveProgram.shortTitle}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div data-testid="wizard-step-4">
              <h3 className="text-xl font-bold mb-1">{w.step4Title}</h3>
              <p className="text-sm text-muted-foreground mb-5">{w.step4Sub}</p>

              {/* Summary chips */}
              <div className="flex flex-wrap gap-2 mb-5 p-3 bg-secondary/40 rounded-xl">
                {audience && (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-background border border-border px-2.5 py-1 rounded-full">
                    <span className="text-muted-foreground">{w.summaryFor}:</span>
                    <span className="font-bold">
                      {w[`aud${audience.charAt(0).toUpperCase() + audience.slice(1)}` as keyof typeof w] as string}
                    </span>
                  </span>
                )}
                {goal && (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-background border border-border px-2.5 py-1 rounded-full">
                    <span className="text-muted-foreground">{w.summaryGoal}:</span>
                    <span className="font-bold">{goalLabel(goal)}</span>
                  </span>
                )}
                {effectiveProgram && (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-primary/10 border border-primary/30 text-primary px-2.5 py-1 rounded-full">
                    <span>{w.summaryProgram}:</span>
                    <span className="font-bold">{effectiveProgram.shortTitle}</span>
                    {programChoice === "recommend" && (
                      <Sparkles className="w-3 h-3" />
                    )}
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {isInstitution && (
                  <div className="space-y-2">
                    <Label htmlFor="wiz-org">{t.enroll.orgNameLabel}</Label>
                    <Input
                      id="wiz-org"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="h-11 rounded-xl bg-background"
                      placeholder={t.enroll.orgNamePlaceholder}
                      data-testid="wizard-input-org"
                    />
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wiz-name">{isInstitution ? t.enroll.contactPersonLabel : t.enroll.nameLabel}</Label>
                    <Input
                      id="wiz-name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 rounded-xl bg-background"
                      placeholder={isInstitution ? t.enroll.contactPersonPlaceholder : t.enroll.namePlaceholder}
                      data-testid="wizard-input-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wiz-phone">{t.enroll.phoneLabel}</Label>
                    <Input
                      id="wiz-phone"
                      required
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11 rounded-xl bg-background"
                      placeholder="+962 7X XXX XXXX"
                      data-testid="wizard-input-phone"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wiz-email">{t.enroll.emailLabel}</Label>
                  <Input
                    id="wiz-email"
                    type="email"
                    required
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl bg-background"
                    placeholder="email@example.com"
                    data-testid="wizard-input-email"
                  />
                </div>
                {isInstitution && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wiz-students">{t.enroll.studentCountLabel}</Label>
                      <Input
                        id="wiz-students"
                        type="number"
                        value={studentCount}
                        onChange={(e) => setStudentCount(e.target.value)}
                        className="h-11 rounded-xl bg-background"
                        placeholder="50"
                        data-testid="wizard-input-students"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wiz-teachers">{t.enroll.teacherCountLabel}</Label>
                      <Input
                        id="wiz-teachers"
                        type="number"
                        value={teacherCount}
                        onChange={(e) => setTeacherCount(e.target.value)}
                        className="h-11 rounded-xl bg-background"
                        placeholder="5"
                        data-testid="wizard-input-teachers"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="wiz-msg">{w.msgLabel}</Label>
                  <Textarea
                    id="wiz-msg"
                    value={extraMessage}
                    onChange={(e) => setExtraMessage(e.target.value)}
                    className="min-h-[80px] rounded-xl bg-background resize-none"
                    placeholder={w.msgPlaceholder}
                    data-testid="wizard-input-message"
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={submitting}
            className="rounded-full px-5 sm:px-5 h-12"
            data-testid="wizard-btn-back"
          >
            <BackIcon className="w-4 h-4 me-1" />
            {w.back}
          </Button>
        ) : <span />}

        {step < 4 ? (
          <Button
            type="button"
            onClick={goNext}
            className="rounded-full px-7 h-12 bg-primary hover:bg-primary/90 text-white font-bold"
            data-testid="wizard-btn-next"
          >
            {w.next}
            <ForwardIcon className="w-4 h-4 ms-1" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full px-7 h-12 bg-primary hover:bg-primary/90 text-white font-bold"
            data-testid="wizard-btn-submit"
          >
            {submitting ? w.submitting : w.submit}
          </Button>
        )}
      </div>
    </div>
  );
}
