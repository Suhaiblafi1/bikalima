import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Lightbulb, Mic2, Heart, Users, Star,
  Feather, Sparkles, Globe, ShoppingCart, FileText,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { T, type Lang } from "../translations";
import { useLang } from "../hooks/useLang";
import { programs, getLocalizedProgram, WORKBOOK_PRICES, testimonials as testimonialsData } from "../programsData";
import { useCurrency } from "@/lib/site-config";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumb } from "@/components/breadcrumb";
import { WorkbookOrderModal } from "@/components/workbook-order-modal";
import { usePageMeta } from "@/hooks/use-page-meta";
import { wisdomFor } from "@/wisdomContent";


/**
 * The shared wisdom content stores its icon as a name, not as JSX, so the
 * module can be read by tooling as plain data. This maps it back to a
 * component, falling back rather than rendering the raw name as text.
 */
function WisdomIcon({ name }: { name?: string }) {
  const map: Record<string, typeof Sparkles> = {
    Lightbulb, Mic2, Heart, Users, Star, Feather, Sparkles, Globe,
  };
  const Icon = (name && map[name]) || Sparkles;
  return <Icon className="w-5 h-5" aria-hidden />;
}

export default function WorkbooksPage() {
  usePageMeta({ title: "الكرّاسات", description: "كرّاسات بكلمة التدريبية في فن الخطابة والإلقاء — اطلبها مطبوعة أو رقمية.", canonicalPath: "/workbooks" });
  const { lang, dir } = useLang();
  const t = T[lang];
  const { format: formatPrice } = useCurrency();

  const [wisdomIndex, setWisdomIndex] = useState(0);
  const [selectedWorkbook, setSelectedWorkbook] = useState<ReturnType<typeof getLocalizedProgram> | null>(null);

  const articles = wisdomFor(lang);

  useEffect(() => {
    const iv = setInterval(() => setWisdomIndex(i => (i + 1) % articles.length), 7000);
    return () => clearInterval(iv);
  }, [articles.length]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden" dir={dir}>
      <SiteHeader />
      <div aria-hidden className="h-16 md:h-20 shrink-0" />
      <Breadcrumb items={[{ label: lang === "ar" ? "الكراسات" : "Workbooks" }]} />
      {/* The skip link targets this; the page had no main landmark at all. */}
      <main id="main-content" tabIndex={-1}>

      {/* ── WORKBOOKS STORE (products first on mobile) ── */}
      <section className="py-10 md:py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-8 md:mb-14">
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 md:mb-6">{t.workbooks.heading}</h1>
            <p className="text-base md:text-xl text-muted-foreground">{t.workbooks.sub}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {programs.map((prog, i) => {
              const lp = getLocalizedProgram(prog, lang);
              const price = WORKBOOK_PRICES[prog.id as keyof typeof WORKBOOK_PRICES];
              const hasWorkbook = !!prog.workbook;
              if (!hasWorkbook) return null;
              return (
                <motion.div
                  key={prog.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={`bg-card border rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-border`}
                >
                  <div className={`relative aspect-[16/7] overflow-hidden`}>
                    <img src={lp.image} alt={lp.workbook.title} className="w-full h-full object-cover" loading="lazy" />
                    <div className={`absolute inset-0 bg-gradient-to-br ${lp.accentColor} opacity-60 mix-blend-multiply`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 start-4 end-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold mb-2">
                        <FileText className="w-3 h-3" />{lp.role}
                      </div>
                      <h3 className="font-serif text-xl font-bold text-white">{lp.workbook.title}</h3>
                    </div>
                  </div>
                  <div className="p-5 md:p-6">
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{lp.workbook.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {lp.modules.slice(0, 4).map((mod, mi) => (
                        <span key={mi} className="text-xs px-2.5 py-1 rounded-full bg-secondary/60 text-muted-foreground border border-border">
                          {mod}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
                      <div>
                        <div className="text-xs text-muted-foreground">{t.workbooks.priceLabel}</div>
                        <div className="text-2xl font-bold text-primary">{formatPrice(price ?? 0)}</div>
                      </div>
                      <Button
                        onClick={() => setSelectedWorkbook(lp)}
                        className="rounded-full px-4 sm:px-6 h-12 gap-2 shrink-0"
                      >
                        <ShoppingCart className="w-4 h-4" />{t.workbooks.orderBtn}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WISDOM CAROUSEL (educational context, after products) ── */}
      <section className="py-12 md:py-16 bg-secondary/10 border-y border-border overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 mb-8 md:mb-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-4 md:mb-6 text-sm">
              <BookOpen className="w-4 h-4" />{t.wisdom.badge}
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-3 md:mb-6">{t.wisdom.heading}</h2>
            <p className="text-base md:text-xl text-muted-foreground">{t.wisdom.sub}</p>
          </div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={wisdomIndex}
              initial={{ opacity: 0, x: dir === "rtl" ? -40 : 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir === "rtl" ? 40 : -40 }}
              transition={{ duration: 0.5 }}
              className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 md:p-12 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 start-0 w-64 h-64 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-5 md:mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <WisdomIcon name={articles[wisdomIndex]?.icon} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground font-medium truncate">{articles[wisdomIndex]?.source}</div>
                    <div className="text-sm font-bold text-primary truncate">{articles[wisdomIndex]?.category}</div>
                  </div>
                </div>
                <blockquote className="font-serif text-lg md:text-2xl font-bold text-foreground mb-5 md:mb-6 leading-relaxed border-s-4 border-primary ps-4 md:ps-5">
                  {articles[wisdomIndex]?.quote}
                </blockquote>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{articles[wisdomIndex]?.body}</p>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={() => setWisdomIndex(i => (i - 1 + articles.length) % articles.length)} className="w-11 h-11 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors" aria-label={lang === "ar" ? "السابق" : "Previous"}>
              {dir === "rtl" ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <div className="flex gap-1.5">
              {articles.map((_, i) => (
                <button key={i} onClick={() => setWisdomIndex(i)} className={`rounded-full transition-all duration-300 ${i === wisdomIndex ? "w-5 h-2 bg-primary" : "w-2 h-2 bg-border hover:bg-primary/40"}`} aria-label={`${i + 1}`} />
              ))}
            </div>
            <button onClick={() => setWisdomIndex(i => (i + 1) % articles.length)} className="w-11 h-11 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors" aria-label={lang === "ar" ? "التالي" : "Next"}>
              {dir === "rtl" ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-14 bg-secondary/20 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3"
            >
              {lang === "ar" ? "آراء عملائنا" : "Client Reviews"}
            </motion.h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {lang === "ar" ? "تجارب حقيقية من متدربين ومتدربات في بكلمة" : "Real experiences from Bikalima trainees"}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {testimonialsData[lang === "en" ? "en" : "ar"].map((rev, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-background rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-md transition-all duration-300"
              >
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground text-sm leading-relaxed mb-5 font-medium">"{rev.quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {rev.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground">{rev.name}</div>
                    <div className="text-xs text-muted-foreground">{rev.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      </main>

      <SiteFooter />

      {/* ── WORKBOOK ORDER MODAL ── */}
      <AnimatePresence>
        {selectedWorkbook && (
          <WorkbookOrderModal workbook={selectedWorkbook} onClose={() => setSelectedWorkbook(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
