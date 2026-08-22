import { useEffect, useState } from "react";
import { Check, Compass, Presentation, Sparkles, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";

type Lang = "ar" | "en";

const goals = [
  { key: "confidence", ar: "أتحدث بثقة أمام الجمهور", en: "Speak confidently in public", icon: Sparkles },
  { key: "presentations", ar: "أقدّم عروضاً أوضح وأكثر تأثيراً", en: "Deliver clearer presentations", icon: Presentation },
  { key: "leadership", ar: "أقود الاجتماعات والنقاشات", en: "Lead meetings and discussions", icon: UsersRound },
] as const;

export function StudentOnboarding({ lang, userId }: { lang: Lang; userId: string | null }) {
  const isAr = lang === "ar";
  const storageKey = `bikalima:onboarding:${userId ?? "guest"}`;
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(true);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    try {
      const value = localStorage.getItem(storageKey);
      setSelected(value ?? "");
      setSaved(Boolean(value));
    } catch {
      setSaved(false);
    }
    setReady(true);
  }, [storageKey]);

  if (!ready || saved) return null;

  const finish = () => {
    if (!selected) return;
    try { localStorage.setItem(storageKey, selected); } catch {}
    setSaved(true);
  };

  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-amber-50 p-5 shadow-sm sm:p-6" aria-labelledby="student-onboarding-heading">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Compass className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-primary">{isAr ? "خطوة أولى قصيرة" : "A quick first step"}</p>
          <h2 id="student-onboarding-heading" className="mt-1 text-xl font-bold">{isAr ? "ما هدفك الأهم من التعلّم؟" : "What is your main learning goal?"}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{isAr ? "لن نوصي لك ببرنامج جديد؛ نستخدم إجابتك فقط لتذكيرك بما تريد تحقيقه." : "We won't recommend another program; this simply keeps your goal visible."}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label={isAr ? "اختر هدف التعلم" : "Choose a learning goal"}>
        {goals.map((goal) => {
          const Icon = goal.icon;
          const active = selected === goal.key;
          return (
            <button
              key={goal.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelected(goal.key)}
              className={`relative flex min-h-24 items-start gap-3 rounded-2xl border p-4 text-start transition-all ${active ? "border-primary bg-primary/10 text-foreground shadow-sm" : "border-border bg-card/80 hover:border-primary/40 hover:bg-card"}`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-sm font-bold leading-relaxed">{isAr ? goal.ar : goal.en}</span>
              {active && <Check className="absolute end-3 top-3 h-4 w-4 text-primary" />}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="button" onClick={finish} disabled={!selected} className="rounded-full px-6">
          {isAr ? "احفظ هدفي وابدأ" : "Save my goal and start"}
        </Button>
      </div>
    </section>
  );
}
