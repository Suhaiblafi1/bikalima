import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/useLang";
import { T } from "@/translations";

type Props = {
  variant?: "soft" | "primary";
  testIdSuffix?: string;
};

function scrollToEnroll() {
  const el = document.getElementById("enroll");
  if (el) {
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
  } else {
    window.location.hash = "enroll";
  }
}

export function JourneyCta({ variant = "soft", testIdSuffix = "" }: Props) {
  const { lang } = useLang();
  const t = T[lang].journeyCta;
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  const wrapper =
    variant === "primary"
      ? "bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground border-transparent"
      : "bg-card border-primary/15";

  return (
    <section className="py-10 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className={`max-w-5xl mx-auto rounded-3xl border ${wrapper} shadow-md px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 sm:gap-6`}
        >
          <div className="flex items-center gap-3 text-center sm:text-start">
            <div className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center ${variant === "primary" ? "bg-white/15 text-white" : "bg-primary/10 text-primary"}`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-serif font-bold text-lg sm:text-xl leading-tight ${variant === "primary" ? "text-white" : "text-foreground"}`}>
                {t.heading}
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${variant === "primary" ? "text-white/80" : "text-muted-foreground"}`}>
                {t.sub}
              </p>
            </div>
          </div>
          <Button
            size="lg"
            onClick={scrollToEnroll}
            className={
              variant === "primary"
                ? "rounded-full bg-white text-primary hover:bg-white/90 px-7 shrink-0"
                : "rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-7 shrink-0"
            }
            data-testid={`button-journey-cta${testIdSuffix ? `-${testIdSuffix}` : ""}`}
          >
            {t.button}
            <Arrow className="w-4 h-4 ms-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
