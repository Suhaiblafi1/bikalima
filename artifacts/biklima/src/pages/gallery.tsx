import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronLeft, ChevronRight, ZoomIn,
} from "lucide-react";
import { T } from "../translations";
import { useLang } from "../hooks/useLang";
import { galleryPhotos, speechPhotos } from "../galleryData";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumb } from "@/components/breadcrumb";
import { VideoLibrarySection } from "@/components/video-library-section";
import { usePageMeta } from "@/hooks/use-page-meta";

export default function GalleryPage() {
  usePageMeta({ title: "معرضنا", description: "صور من ورش وبرامج بكلمة التدريبية في الأردن والعالم العربي.", canonicalPath: "/gallery" });
  const { lang, dir } = useLang();
  const t = T[lang];

  const [galleryTab, setGalleryTab] = useState<"cohorts" | "speeches">("cohorts");
  const [lightboxSource, setLightboxSource] = useState<"cohorts" | "speeches">("cohorts");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [photoLimit, setPhotoLimit] = useState(8);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
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

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden" dir={dir}>
      <SiteHeader />
      <div aria-hidden className="h-16 md:h-20 shrink-0" />
      <Breadcrumb items={[{ label: lang === "ar" ? "المعرض" : "Gallery" }]} />

      {/* ── PAGE HERO ── */}
      <div className="py-16 bg-gradient-to-b from-primary/5 to-background text-center border-b border-border">
        <div className="container mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {lang === "ar" ? "مسيرة بكلمة منذ ٢٠١٩" : "Bikalima's Journey since 2019"}
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
                    onClick={() => { setGalleryTab(tab); setPhotoLimit(8); }}
                    className={["min-h-11 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer", isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {galleryTab === "cohorts" && (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
              {galleryPhotos.slice(0, photoLimit).map((photo, i) => (
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
                  {photo.flag && (
                    <div className="absolute bottom-3 start-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white text-xs font-medium">
                        <span>{photo.flag}</span>
                        <span>{photo.country[lang as keyof typeof photo.country]}</span>
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {galleryTab === "speeches" && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
              {speechPhotos.slice(0, photoLimit).map((photo, i) => (
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
                  {photo.flag && (
                    <div className="absolute bottom-3 start-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white text-xs font-medium">
                        <span>{photo.flag}</span>
                        <span>{photo.country[lang as keyof typeof photo.country]}</span>
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
          {photoLimit < (galleryTab === "cohorts" ? galleryPhotos.length : speechPhotos.length) && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setPhotoLimit((limit) => limit + 8)}
                className="min-h-11 rounded-full border border-primary/25 bg-card px-6 py-2 text-sm font-bold text-primary hover:bg-primary/5"
              >
                {lang === "ar" ? "عرض صور أكثر" : "Show more photos"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* The same curated data powers the dedicated /library page. */}
      <VideoLibrarySection initialLimit={3} className="py-12 md:py-16 bg-background" />

      <SiteFooter />

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={lang === "ar" ? "عارض الصور" : "Photo viewer"}
          >
            <button aria-label={lang === "ar" ? "إغلاق" : "Close"} onClick={() => setLightboxOpen(false)} className="absolute top-5 end-5 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10">
              <X className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i - 1 + activePhotos.length) % activePhotos.length); }}
              aria-label={lang === "ar" ? "الصورة السابقة" : "Previous photo"}
              className="absolute start-4 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
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
              aria-label={lang === "ar" ? "الصورة التالية" : "Next photo"}
              className="absolute end-4 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
            >
              {dir === "rtl" ? <ChevronLeft className="w-6 h-6 text-white" /> : <ChevronRight className="w-6 h-6 text-white" />}
            </button>
            <div className="absolute bottom-5 text-white/50 text-sm">{lightboxIndex + 1} / {activePhotos.length}</div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
