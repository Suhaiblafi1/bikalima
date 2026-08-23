import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, PlayCircle, X } from "lucide-react";
import { videoLibrary, type VideoCategory } from "@/galleryData";
import { useLang } from "@/hooks/useLang";
import { T } from "@/translations";

type VideoLibrarySectionProps = {
  headingLevel?: "h1" | "h2";
  showIntroBadge?: boolean;
  className?: string;
  initialLimit?: number;
};

export function VideoLibrarySection({
  headingLevel = "h2",
  showIntroBadge = true,
  className = "py-16 bg-background",
  initialLimit = 6,
}: VideoLibrarySectionProps) {
  const { lang } = useLang();
  const t = T[lang];
  const [activeCategory, setActiveCategory] = useState<VideoCategory | "all">("all");
  const [videoModalId, setVideoModalId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(initialLimit);
  const Heading = headingLevel;

  useEffect(() => {
    if (!videoModalId) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVideoModalId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [videoModalId]);

  const tabs: [VideoCategory | "all", string][] = [
    ["all", t.videos.tabs.all],
    ["opening", t.videos.tabs.opening],
    ["closing", t.videos.tabs.closing],
    ["storytelling", t.videos.tabs.storytelling],
    ["humor", t.videos.tabs.humor],
    ["voice", t.videos.tabs.voice],
    ["body", t.videos.tabs.body],
  ];

  const categoryVideos = videoLibrary.filter(
    (video) => activeCategory === "all" || video.category === activeCategory,
  );
  const visibleVideos = categoryVideos.slice(0, visibleCount);

  const selectCategory = (category: VideoCategory | "all") => {
    setActiveCategory(category);
    setVisibleCount(initialLimit);
  };

  return (
    <section className={className} aria-labelledby="video-library-heading">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {showIntroBadge && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium mb-5 border border-accent/20">
                <PlayCircle className="w-4 h-4 text-accent" aria-hidden />
                {lang === "ar" ? "مكتبة عامة للتعلّم بالمشاهدة" : "A public watch-and-learn library"}
              </div>
            )}
            <Heading id="video-library-heading" className="font-serif text-3xl md:text-4xl font-bold mb-4">
              {t.videos.heading}
            </Heading>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {lang === "ar"
                ? "شاهد نماذج مختارة، ثم اقرأ المهارة التي يوضحها كل خطاب وكيف يمكنك تطبيقها في حديثك القادم."
                : "Watch selected examples, then learn the technique each speech demonstrates and how to apply it in your next talk."}
            </p>
          </motion.div>
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none snap-x snap-mandatory"
          role="tablist"
          aria-label={lang === "ar" ? "تصنيفات المكتبة" : "Library categories"}
        >
          {tabs.map(([key, label]) => {
            const count = key === "all"
              ? videoLibrary.length
              : videoLibrary.filter((video) => video.category === key).length;
            const active = activeCategory === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectCategory(key)}
                className={`snap-start shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/60"
                }`}
              >
                {label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-muted"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" role="tabpanel">
          {visibleVideos.map((video, index) => {
            const title = video.title[lang];
            const speaker = video.speaker[lang];
            const skill = video.skill[lang];
            const learn = video.learn[lang];
            const thumbnailUrl = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
            const isSuhaib = video.type === "suhaib";

            return (
              <motion.article
                key={`${video.youtubeId}-${video.category}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 3) * 0.08, duration: 0.45 }}
                className={`bg-card border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group ${
                  isSuhaib
                    ? "border-primary/40 ring-1 ring-primary/20 hover:ring-primary/40"
                    : "border-border hover:border-primary/20"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setVideoModalId(video.youtubeId)}
                  className="relative aspect-video overflow-hidden w-full block"
                  aria-label={`${lang === "ar" ? "تشغيل" : "Play"}: ${title}`}
                >
                  <img
                    src={thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-center justify-center">
                    <span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <PlayCircle className="w-8 h-8 text-primary fill-primary" aria-hidden />
                    </span>
                  </span>
                  {isSuhaib && (
                    <span className="absolute top-3 start-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-md">
                      ✦ {t.videos.suhaibBadge}
                    </span>
                  )}
                </button>

                <div className="p-5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-foreground text-xs font-semibold mb-3 border border-accent/20">
                    <Lightbulb className="w-3 h-3 shrink-0 text-accent" aria-hidden />
                    {skill}
                  </div>
                  <h3 className="font-serif text-base font-bold leading-snug mb-1">{title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{speaker}</p>
                  <div className="bg-secondary/40 rounded-xl p-3 border border-border/60">
                    <p className="text-xs font-bold text-foreground/70 mb-1">{t.videos.skillLabel}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{learn}</p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
        {visibleCount < categoryVideos.length && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + initialLimit)}
              className="min-h-11 rounded-full border border-primary/25 bg-card px-6 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
            >
              {lang === "ar" ? `عرض المزيد (${categoryVideos.length - visibleCount})` : `Show more (${categoryVideos.length - visibleCount})`}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {videoModalId && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={lang === "ar" ? "مشغل الفيديو" : "Video player"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setVideoModalId(null)}
          >
            <button
              type="button"
              aria-label={lang === "ar" ? "إغلاق الفيديو" : "Close video"}
              onClick={() => setVideoModalId(null)}
              className="absolute top-5 end-5 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" aria-hidden />
            </button>
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-4xl aspect-video"
              onClick={(event) => event.stopPropagation()}
            >
              <iframe
                title={lang === "ar" ? "فيديو تعليمي من بكلمة" : "Educational video from Bikalima"}
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
    </section>
  );
}
