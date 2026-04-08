import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronLeft, ChevronRight, ZoomIn, PlayCircle, Lightbulb,
  ArrowLeft, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { T, type Lang } from "../translations";
import { useLang } from "../hooks/useLang";
import { galleryPhotos, speechPhotos, videoLibrary, type VideoCategory } from "../galleryData";

export default function GalleryPage() {
  const { lang, switchLang, dir } = useLang();
  const t = T[lang];

  const [galleryTab, setGalleryTab] = useState<"cohorts" | "speeches">("cohorts");
  const [lightboxSource, setLightboxSource] = useState<"cohorts" | "speeches">("cohorts");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [videoTab, setVideoTab] = useState<VideoCategory | "all">("all");
  const [videoModalId, setVideoModalId] = useState<string | null>(null);

  const langButtons: { key: Lang; label: string }[] = [
    { key: "ar", label: "ع" },
    { key: "en", label: "EN" },
    { key: "fr", label: "FR" },
  ];

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [dir, lang]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setLightboxOpen(false); setVideoModalId(null); }
      if (lightboxOpen) {
        const activePhotos = lightboxSource === "speeches" ? speechPhotos : galleryPhotos;
        if (e.key === "ArrowLeft") setLightboxIndex((i) => (i + 1) % activePhotos.length);
        if (e.key === "ArrowRight") setLightboxIndex((i) => (i - 1 + activePhotos.length) % activePhotos.length);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, lightboxSource]);

  const activePhotos = lightboxSource === "speeches" ? speechPhotos : galleryPhotos;
  const base = import.meta.env.BASE_URL || "/";

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden" dir={dir}>
      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border py-4 shadow-sm">
        <div className="container mx-auto px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a href={base} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary/50 transition-colors">
              {dir === "rtl" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            </a>
            <a href={base} className="logo-biklima text-4xl text-primary tracking-tight leading-none">بكلمة</a>
          </div>
          <div className="flex items-center gap-1 border border-border rounded-full overflow-hidden">
            {langButtons.map(({ key, label }) => (
              <button key={key} onClick={() => switchLang(key)} className={`px-3 py-1.5 text-xs font-bold transition-colors ${lang === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{label}</button>
            ))}
          </div>
        </div>
      </header>

      {/* ── PAGE HERO ── */}
      <div className="py-16 bg-gradient-to-b from-primary/5 to-background text-center border-b border-border">
        <div className="container mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {lang === "ar" ? "مسيرة بكلمة منذ ٢٠١٩" : lang === "fr" ? "Le parcours de Bikalima depuis 2019" : "Bikalima's Journey since 2019"}
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">{t.gallery.heading}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t.gallery.sub}</p>
        </div>
      </div>

      {/* ── GALLERY SECTION ── */}
      <section className="py-16 bg-secondary/10">
        <div className="container mx-auto px-6">
          {/* Tabs */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex p-1 rounded-full bg-muted border border-border gap-1">
              {(["cohorts", "speeches"] as const).map((tab) => {
                const label = tab === "cohorts" ? t.gallery.tabCohorts : t.gallery.tabSpeeches;
                const isActive = galleryTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setGalleryTab(tab)}
                    className={["px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer", isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {galleryTab === "cohorts" && (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
              {galleryPhotos.map((photo, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 4) * 0.06, duration: 0.4 }}
                  className="break-inside-avoid mb-3 md:mb-4 relative group cursor-pointer overflow-hidden rounded-xl"
                  onClick={() => { setLightboxSource("cohorts"); setLightboxIndex(i); setLightboxOpen(true); }}
                >
                  <img src={photo.src} alt={photo.country.en} className="w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                      <ZoomIn className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 start-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white text-xs font-medium">
                      <span>{photo.flag}</span>
                      <span>{photo.country[lang as keyof typeof photo.country]}</span>
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {galleryTab === "speeches" && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
              {speechPhotos.map((photo, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 4) * 0.06, duration: 0.4 }}
                  className="break-inside-avoid mb-3 md:mb-4 relative group cursor-pointer overflow-hidden rounded-xl"
                  onClick={() => { setLightboxSource("speeches"); setLightboxIndex(i); setLightboxOpen(true); }}
                >
                  <img src={photo.src} alt={photo.country.en} className="w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                      <ZoomIn className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 start-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white text-xs font-medium">
                      <span>{photo.flag}</span>
                      <span>{photo.country[lang as keyof typeof photo.country]}</span>
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── VIDEOS SECTION ── */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-5">
                <PlayCircle className="w-4 h-4" />
                {lang === "ar" ? "مكتبة تعليمية شاملة" : lang === "fr" ? "Bibliothèque pédagogique complète" : "Comprehensive Learning Library"}
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">{t.videos.heading}</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t.videos.sub}</p>
            </motion.div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none snap-x snap-mandatory">
            {(
              [
                ["all", t.videos.tabs.all],
                ["opening", t.videos.tabs.opening],
                ["closing", t.videos.tabs.closing],
                ["storytelling", t.videos.tabs.storytelling],
                ["humor", t.videos.tabs.humor],
                ["voice", t.videos.tabs.voice],
                ["body", t.videos.tabs.body],
              ] as [string, string][]
            ).map(([key, label]) => {
              const count = key === "all" ? videoLibrary.length : videoLibrary.filter(v => v.category === key).length;
              const active = videoTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setVideoTab(key as VideoCategory | "all")}
                  className={`snap-start shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${active ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/60"}`}
                >
                  {label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-muted"}`}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoLibrary
              .filter(v => videoTab === "all" || v.category === videoTab)
              .map((video, i) => {
                const title = video.title[lang as keyof typeof video.title];
                const speaker = video.speaker[lang as keyof typeof video.speaker];
                const skill = video.skill[lang as keyof typeof video.skill];
                const learn = video.learn[lang as keyof typeof video.learn];
                const thumbUrl = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
                const isSuhaib = video.type === "suhaib";
                return (
                  <motion.div
                    key={`${video.youtubeId}-${video.category}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (i % 3) * 0.08, duration: 0.45 }}
                    className={`bg-card border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group ${isSuhaib ? "border-primary/40 ring-1 ring-primary/20 hover:ring-primary/40" : "border-border hover:border-primary/20"}`}
                    onClick={() => setVideoModalId(video.youtubeId)}
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img src={thumbUrl} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <PlayCircle className="w-8 h-8 text-primary fill-primary" />
                        </div>
                      </div>
                      {isSuhaib && (
                        <div className="absolute top-3 start-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-md">
                            ✦ {t.videos.suhaibBadge}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3 border border-accent/20">
                        <Lightbulb className="w-3 h-3 shrink-0" />
                        {skill}
                      </div>
                      <h3 className="font-serif text-base font-bold leading-snug mb-1">{title}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{speaker}</p>
                      <div className="bg-secondary/40 rounded-xl p-3 border border-border/60">
                        <p className="text-xs font-bold text-foreground/70 mb-1">{t.videos.skillLabel}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{learn}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-foreground text-background py-10 text-center">
        <div className="container mx-auto px-6">
          <div className="logo-biklima text-4xl text-primary mb-2">بكلمة</div>
          <p className="text-background/50 text-sm">{t.footer.copyright}</p>
          <a href={base} className="inline-flex items-center gap-2 mt-4 text-sm text-background/60 hover:text-background transition-colors">
            {dir === "rtl" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {lang === "ar" ? "العودة للرئيسية" : lang === "fr" ? "Retour à l'accueil" : "Back to Home"}
          </a>
        </div>
      </footer>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button onClick={() => setLightboxOpen(false)} className="absolute top-5 end-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10">
              <X className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i - 1 + activePhotos.length) % activePhotos.length); }}
              className="absolute start-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
            >
              {dir === "rtl" ? <ChevronRight className="w-6 h-6 text-white" /> : <ChevronLeft className="w-6 h-6 text-white" />}
            </button>
            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              src={activePhotos[lightboxIndex]?.src}
              alt=""
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i + 1) % activePhotos.length); }}
              className="absolute end-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
            >
              {dir === "rtl" ? <ChevronLeft className="w-6 h-6 text-white" /> : <ChevronRight className="w-6 h-6 text-white" />}
            </button>
            <div className="absolute bottom-5 text-white/50 text-sm">{lightboxIndex + 1} / {activePhotos.length}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VIDEO MODAL ── */}
      <AnimatePresence>
        {videoModalId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setVideoModalId(null)}
          >
            <button onClick={() => setVideoModalId(null)} className="absolute top-5 end-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <X className="w-6 h-6 text-white" />
            </button>
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-4xl aspect-video"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                key={videoModalId}
                src={`https://www.youtube.com/embed/${videoModalId}?autoplay=1`}
                className="w-full h-full rounded-2xl"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
