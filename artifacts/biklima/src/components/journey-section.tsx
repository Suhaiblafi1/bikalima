import { motion } from "framer-motion";
import { ClipboardList, Compass, PlayCircle, Mic, Award, BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { T } from "@/translations";

const ICONS = [
  ClipboardList,
  Compass,
  PlayCircle,
  Mic,
  Award,
  BadgeCheck,
];

export function JourneySection() {
  const { lang } = useLang();
  const t = T[lang].journey;
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;
  const steps = t.steps;

  return (
    <section id="journey" className="py-24 bg-background relative overflow-hidden" data-testid="section-journey">
      <div className="container mx-auto px-6">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <p className="uppercase tracking-[0.25em] text-xs sm:text-sm text-primary font-bold mb-3">
            {t.eyebrow}
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4">{t.heading}</h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">{t.sub}</p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Mobile: vertical stepper */}
          <ol className="md:hidden space-y-4">
            {steps.map((step, i) => {
              const Icon = ICONS[i] ?? ClipboardList;
              return (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: lang === "ar" ? 12 : -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3"
                  data-testid={`journey-step-${i}`}
                >
                  <div className="shrink-0 relative">
                    <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif font-bold text-base text-foreground leading-tight mb-1">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </motion.li>
              );
            })}
          </ol>

          {/* Desktop: horizontal flow */}
          <div className="hidden md:block relative">
            <div aria-hidden className="absolute top-8 start-[6%] end-[6%] h-1 bg-gradient-to-r from-primary/30 via-primary/30 to-primary/30 rounded-full" />
            <div className="grid grid-cols-6 gap-3 relative">
              {steps.map((step, i) => {
                const Icon = ICONS[i] ?? ClipboardList;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className="flex flex-col items-center text-center"
                    data-testid={`journey-step-${i}`}
                  >
                    <div className="relative mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg ring-4 ring-background">
                        <Icon className="w-7 h-7" />
                      </div>
                      <span className="absolute -top-1.5 -end-1.5 w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center shadow">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-sm lg:text-base text-foreground leading-tight mb-1.5 px-1">{step.title}</h3>
                    <p className="text-[11px] lg:text-xs text-muted-foreground leading-relaxed px-1">{step.desc}</p>
                  </motion.div>
                );
              })}
            </div>
            {/* Connecting chevrons */}
            <div aria-hidden className="absolute top-6 start-0 end-0 flex justify-between px-[10%] pointer-events-none">
              {Array.from({ length: 5 }).map((_, i) => (
                <Chevron key={i} className="w-5 h-5 text-primary/40" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
