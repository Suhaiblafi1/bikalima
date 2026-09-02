import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, PlayCircle, X } from "lucide-react";
import { videoLibrary, type VideoCategory } from "@/galleryData";
import { useFieldMedia, type FieldMediaItem } from "@/hooks/use-field-media";
import { useLang } from "@/hooks/useLang";
import { T } from "@/translations";

type VideoLibrarySectionProps = {
  headingLevel?: "h1" | "h2";
  showIntroBadge?: boolean;
  className?: string;
  initialLimit?: number;
};

/**
 * One card in the library, whatever it came from.
 *
 * The section used to be YouTube all the way down — the video id was the
 * key, the thumbnail source, the modal state and the iframe src at once.
 * Published «من الميدان» items can be an uploaded MP4 in our own storage
 * (that is where a generated clip lands), so playback and identity are now
 * separate fields and the modal picks a player per item.
 */
type LibraryItem = {
  key: string;
  kind: "youtube" | "file";
  /** YouTube id, or the media URL for a file. */
  playbackRef: string;
  thumbnailUrl: string | null;
  title: string;
  speaker: string | null;
  skill: string | null;
  learn: string | null;
  category: VideoCategory | null;
  highlighted: boolean;
};

/**
 * The CMS category vocabulary is the admin panel's, not this section's:
 * «القصة» is stored as `story` while the tabs call it `storytelling`, and
 * `presence` has no tab at all. Anything unmapped keeps a null category,
 * which shows it under «الكل» only — visible, never mis-filed.
 */
const CMS_CATEGORY_TO_TAB: Record<string, VideoCategory> = {
  opening: "opening",
  closing: "closing",
  story: "storytelling",
  storytelling: "storytelling",
  humor: "humor",
  voice: "voice",
  body: "body",
};

/** Media kinds this section can actually play. */
const PLAYABLE_CMS_TYPES = new Set(["youtube", "upload"]);

function youtubeIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1) || null;
    if (parsed.hostname.endsWith("youtube.com")) {
      const fromQuery = parsed.searchParams.get("v");
      if (fromQuery) return fromQuery;
      // /embed/<id> and /shorts/<id>
      const segments = parsed.pathname.split("/").filter(Boolean);
      if (segments.length >= 2 && (segments[0] === "embed" || segments[0] === "shorts")) {
        return segments[1];
      }
    }
    return null;
  } catch {
    return null;
  }
}

function toLibraryItem(item: FieldMediaItem, lang: "ar" | "en" | "fr"): LibraryItem | null {
  if (!PLAYABLE_CMS_TYPES.has(item.mediaType)) return null;

  const title = (lang === "ar" ? item.titleAr : item.titleEn || item.titleAr).trim();
  if (title === "") return null;
  const learn = lang === "ar" ? item.descriptionAr : item.descriptionEn || item.descriptionAr;

  if (item.mediaType === "youtube") {
    const youtubeId = youtubeIdFromUrl(item.mediaUrl);
    // A "youtube" row whose URL we cannot read would render a broken player,
    // so it is dropped rather than shown.
    if (!youtubeId) return null;
    return {
      key: `cms-${item.id}`,
      kind: "youtube",
      playbackRef: youtubeId,
      thumbnailUrl: item.thumbnailUrl ?? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      title,
      speaker: item.speakerName,
      skill: item.targetSkill,
      learn,
      category: item.category ? CMS_CATEGORY_TO_TAB[item.category] ?? null : null,
      highlighted: false,
    };
  }

  return {
    key: `cms-${item.id}`,
    kind: "file",
    playbackRef: item.mediaUrl,
    thumbnailUrl: item.thumbnailUrl,
    title,
    speaker: item.speakerName,
    skill: item.targetSkill,
    learn,
    category: item.category ? CMS_CATEGORY_TO_TAB[item.category] ?? null : null,
    highlighted: false,
  };
}

export function VideoLibrarySection({
  headingLevel = "h2",
  showIntroBadge = true,
  className = "py-16 bg-background",
  initialLimit = 6,
}: VideoLibrarySectionProps) {
  const { lang } = useLang();
  const t = T[lang];
  const [activeCategory, setActiveCategory] = useState<VideoCategory | "all">("all");
  const [openItemKey, setOpenItemKey] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(initialLimit);
  const Heading = headingLevel;

  const published = useFieldMedia("library");

  const items = useMemo<LibraryItem[]>(() => {
    // Published rows lead: `orderIndex` is the only ordering lever an admin
    // has, and it would mean nothing behind a curated list nobody can
    // reorder from the panel.
    const fromCms = published
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((item) => toLibraryItem(item, lang))
      .filter((item): item is LibraryItem => item !== null);

    const fromStatic = videoLibrary.map<LibraryItem>((video) => ({
      key: `static-${video.youtubeId}-${video.category}`,
      kind: "youtube",
      playbackRef: video.youtubeId,
      thumbnailUrl: `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`,
      title: video.title[lang],
      speaker: video.speaker[lang],
      skill: video.skill[lang],
      learn: video.learn[lang],
      category: video.category,
      highlighted: video.type === "suhaib",
    }));

    return [...fromCms, ...fromStatic];
  }, [published, lang]);

  useEffect(() => {
    if (!openItemKey) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenItemKey(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openItemKey]);

  const tabs: [VideoCategory | "all", string][] = [
    ["all", t.videos.tabs.all],
    ["opening", t.videos.tabs.opening],
    ["closing", t.videos.tabs.closing],
    ["storytelling", t.videos.tabs.storytelling],
    ["humor", t.videos.tabs.humor],
    ["voice", t.videos.tabs.voice],
    ["body", t.videos.tabs.body],
  ];

  const categoryItems = items.filter(
    (item) => activeCategory === "all" || item.category === activeCategory,
  );
  const visibleItems = categoryItems.slice(0, visibleCount);
  const openItem = items.find((item) => item.key === openItemKey) ?? null;

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
              ? items.length
              : items.filter((item) => item.category === key).length;
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
          {visibleItems.map((item, index) => (
            <motion.article
              key={item.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (index % 3) * 0.08, duration: 0.45 }}
              className={`bg-card border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group ${
                item.highlighted
                  ? "border-primary/40 ring-1 ring-primary/20 hover:ring-primary/40"
                  : "border-border hover:border-primary/20"
              }`}
              data-testid={`library-item-${item.key}`}
            >
              <button
                type="button"
                onClick={() => setOpenItemKey(item.key)}
                className="relative aspect-video overflow-hidden w-full block"
                aria-label={`${lang === "ar" ? "تشغيل" : "Play"}: ${item.title}`}
              >
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  // An uploaded clip has no poster unless someone made one.
                  // A gradient tile costs nothing; pulling video bytes into a
                  // listing page to synthesise a frame would.
                  <span className="block w-full h-full bg-gradient-to-br from-primary/25 via-primary/10 to-accent/20" />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-center justify-center">
                  <span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <PlayCircle className="w-8 h-8 text-primary fill-primary" aria-hidden />
                  </span>
                </span>
                {item.highlighted && (
                  <span className="absolute top-3 start-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-md">
                    ✦ {t.videos.suhaibBadge}
                  </span>
                )}
              </button>

              <div className="p-5">
                {item.skill && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-foreground text-xs font-semibold mb-3 border border-accent/20">
                    <Lightbulb className="w-3 h-3 shrink-0 text-accent" aria-hidden />
                    {item.skill}
                  </div>
                )}
                <h3 className="font-serif text-base font-bold leading-snug mb-1">{item.title}</h3>
                {item.speaker && <p className="text-muted-foreground text-sm mb-4">{item.speaker}</p>}
                {item.learn && (
                  <div className="bg-secondary/40 rounded-xl p-3 border border-border/60">
                    <p className="text-xs font-bold text-foreground/70 mb-1">{t.videos.skillLabel}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.learn}</p>
                  </div>
                )}
              </div>
            </motion.article>
          ))}
        </div>
        {visibleCount < categoryItems.length && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + initialLimit)}
              className="min-h-11 rounded-full border border-primary/25 bg-card px-6 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
            >
              {lang === "ar" ? `عرض المزيد (${categoryItems.length - visibleCount})` : `Show more (${categoryItems.length - visibleCount})`}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {openItem && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={lang === "ar" ? "مشغل الفيديو" : "Video player"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setOpenItemKey(null)}
          >
            <button
              type="button"
              aria-label={lang === "ar" ? "إغلاق الفيديو" : "Close video"}
              onClick={() => setOpenItemKey(null)}
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
              {openItem.kind === "youtube" ? (
                <iframe
                  title={lang === "ar" ? "فيديو تعليمي من بكلمة" : "Educational video from Bikalima"}
                  key={openItem.key}
                  src={`https://www.youtube.com/embed/${openItem.playbackRef}?autoplay=1`}
                  className="w-full h-full rounded-2xl"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <video
                  key={openItem.key}
                  src={openItem.playbackRef}
                  className="w-full h-full rounded-2xl bg-black"
                  controls
                  autoPlay
                  playsInline
                  data-testid="library-file-player"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
