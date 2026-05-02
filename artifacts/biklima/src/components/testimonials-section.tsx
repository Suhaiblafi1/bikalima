import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { T } from "@/translations";
import { testimonials as testimonialsData } from "@/programsData";

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] || "") + (parts[parts.length - 1][0] || "");
}

const AVATAR_BG = [
  "bg-primary/15 text-primary",
  "bg-accent/25 text-accent-foreground",
  "bg-secondary text-secondary-foreground",
  "bg-foreground/10 text-foreground",
];

export function TestimonialsSection() {
  const { lang } = useLang();
  const t = T[lang];
  const heading = t.testimonialsSection;
  const items = testimonialsData[lang] ?? testimonialsData.ar;

  return (
    <section id="testimonials" className="py-24 bg-background border-y border-border" data-testid="section-testimonials">
      <div className="container mx-auto px-6">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <p className="uppercase tracking-[0.25em] text-xs sm:text-sm text-primary font-bold mb-3">
            {heading.eyebrow}
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4">{heading.heading}</h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">{heading.sub}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-5 max-w-6xl mx-auto">
          {items.map((tm, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: (i % 4) * 0.08, duration: 0.45 }}
              className="relative bg-card border border-border rounded-3xl p-6 md:p-7 shadow-sm hover:shadow-lg transition-shadow flex flex-col"
              data-testid={`testimonial-card-${i}`}
            >
              <Quote
                aria-hidden
                className="absolute top-5 end-5 w-9 h-9 text-primary/15"
                strokeWidth={1.5}
              />
              <div className="flex items-center gap-1 mb-3 text-accent">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <blockquote className="text-foreground leading-relaxed text-sm md:text-base mb-6 flex-1">
                <span className="font-serif text-2xl text-primary me-1 align-top">”</span>
                {tm.quote}
              </blockquote>
              <figcaption className="flex items-center gap-3 pt-4 border-t border-border/60">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${AVATAR_BG[i % AVATAR_BG.length]}`}
                  aria-hidden
                >
                  {initialsFor(tm.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground text-sm truncate">{tm.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{tm.role}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
