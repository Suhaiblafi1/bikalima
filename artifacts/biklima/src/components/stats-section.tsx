import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Users, Globe, BookOpen, GraduationCap } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { T } from "@/translations";

const TARGETS = {
  trainees: 850,
  countries: 7,
  programs: 4,
  trainers: 32,
} as const;

function useCountUp(target: number, run: boolean, durationMs = 1600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, run, durationMs]);
  return value;
}

function formatNumber(n: number, lang: "ar" | "en"): string {
  return new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US").format(n);
}

export function StatsSection() {
  const { lang } = useLang();
  const t = T[lang].stats;
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const trainees = useCountUp(TARGETS.trainees, inView);
  const countries = useCountUp(TARGETS.countries, inView);
  const programs = useCountUp(TARGETS.programs, inView);
  const trainers = useCountUp(TARGETS.trainers, inView);

  const items = [
    { icon: <Users className="w-7 h-7" />, value: trainees, suffix: "+", label: t.trainees },
    { icon: <Globe className="w-7 h-7" />, value: countries, suffix: "", label: t.countries },
    { icon: <BookOpen className="w-7 h-7" />, value: programs, suffix: "", label: t.programs },
    { icon: <GraduationCap className="w-7 h-7" />, value: trainers, suffix: "+", label: t.trainers },
  ];

  return (
    <section
      ref={ref}
      id="stats"
      className="py-20 bg-gradient-to-b from-primary to-primary/90 text-primary-foreground relative overflow-hidden"
      data-testid="section-stats"
    >
      <div aria-hidden className="absolute inset-0 opacity-10">
        <div className="absolute top-10 -start-10 w-64 h-64 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-0 -end-10 w-72 h-72 rounded-full bg-accent blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 max-w-2xl mx-auto"
        >
          <p className="uppercase tracking-[0.25em] text-xs sm:text-sm text-white/70 font-bold mb-3">
            {t.eyebrow}
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-bold leading-tight">
            {t.heading}
          </h2>
          <p className="text-white/80 mt-3 text-base md:text-lg leading-relaxed">{t.sub}</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
              className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-3xl p-5 sm:p-6 text-center"
              data-testid={`stat-card-${i}`}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 text-white mb-4">
                {item.icon}
              </div>
              <div
                className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-none mb-2 tabular-nums"
                data-testid={`stat-value-${i}`}
              >
                {formatNumber(item.value, lang)}
                <span className="text-accent">{item.suffix}</span>
              </div>
              <p className="text-xs sm:text-sm text-white/85 leading-snug font-medium">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
