import { motion } from "framer-motion";
import { XCircle, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { T } from "@/translations";

export function BeforeAfterSection() {
  const { lang } = useLang();
  const t = T[lang].beforeAfter;
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section className="py-24 bg-secondary/20 border-t border-border" data-testid="section-before-after">
      <div className="container mx-auto px-6">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <p className="uppercase tracking-[0.25em] text-xs sm:text-sm text-primary font-bold mb-3">
            {t.eyebrow}
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4">{t.heading}</h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">{t.sub}</p>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_auto_1fr] gap-5 items-stretch">
          {/* BEFORE */}
          <motion.div
            initial={{ opacity: 0, x: lang === "ar" ? 20 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-card border border-border rounded-3xl p-6 md:p-8 relative overflow-hidden"
            data-testid="before-card"
          >
            <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive font-bold text-xs px-3 py-1 rounded-full mb-5">
              <XCircle className="w-4 h-4" />
              {t.beforeLabel}
            </div>
            <h3 className="font-serif text-xl md:text-2xl font-bold mb-5 text-foreground">
              {t.beforeHeading}
            </h3>
            <ul className="space-y-3">
              {t.beforeItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                  <XCircle className="w-4 h-4 text-destructive/70 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* ARROW */}
          <div className="hidden md:flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, type: "spring" }}
              className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
            >
              <Arrow className="w-6 h-6" strokeWidth={2.5} />
            </motion.div>
            <p className="text-xs font-bold text-primary mt-3 uppercase tracking-widest">
              {t.transformLabel}
            </p>
          </div>
          <div className="flex md:hidden items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
              <Arrow className="w-5 h-5 rotate-90" strokeWidth={2.5} />
            </div>
          </div>

          {/* AFTER */}
          <motion.div
            initial={{ opacity: 0, x: lang === "ar" ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="bg-gradient-to-br from-primary/10 via-card to-card border-2 border-primary/30 rounded-3xl p-6 md:p-8 relative overflow-hidden"
            data-testid="after-card"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-bold text-xs px-3 py-1 rounded-full mb-5">
              <CheckCircle2 className="w-4 h-4" />
              {t.afterLabel}
            </div>
            <h3 className="font-serif text-xl md:text-2xl font-bold mb-5 text-primary">
              {t.afterHeading}
            </h3>
            <ul className="space-y-3">
              {t.afterItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
