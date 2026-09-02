/**
 * A photograph served at roughly the size it is drawn.
 *
 * The programme photographs are stored once at 1600px wide and were sent to
 * every reader at that size — four of them came to about 1.1MB — to fill cards
 * no wider than about 330px on a phone. They are lazy, so they never held up
 * the first paint, but they are the first thing the browser fetches once the
 * reader reaches the programmes, which is exactly where the page was reported
 * as stuttering.
 *
 * `vite-imagetools` resizes them at build time. Each photograph is imported
 * once, with a query naming the widths and the format, which yields a srcset
 * string; the widths are then offered to the browser through `<picture>` so it
 * can pick by its own viewport and pixel density.
 *
 * WebP goes in a `<source>` rather than straight on the `<img>`, because
 * `srcset` carries no format negotiation: a browser that cannot decode WebP
 * would still choose a WebP candidate from an `img srcset` and show nothing.
 * `<source type="image/webp">` is the part browsers know how to decline, and
 * the JPEG srcset behind it is what they fall back to.
 */

export type ImageSources = {
  /** WebP candidates, as a `srcset` string (widths in `w` descriptors). */
  webp: string;
  /** JPEG candidates for anything that cannot take WebP. */
  jpeg: string;
  /** Single URL for the `src` attribute — the last-resort fallback. */
  fallback: string;
};

export function ResponsiveImage({
  sources,
  alt,
  className,
  sizes,
  loading = "lazy",
  fetchPriority,
}: {
  sources: ImageSources;
  alt: string;
  className?: string;
  /**
   * How wide the image is drawn, so the browser can choose before layout.
   * Getting this wrong costs bytes, not correctness.
   */
  sizes: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
}) {
  return (
    // `contents` keeps the picture out of layout entirely, so the img stays the
    // element the parent's flex/grid rules apply to — the same box the plain
    // <img> occupied before. Without it, picture's default `inline` adds a box
    // that shifts object-cover and absolute positioning in the callers.
    <picture className="contents">
      <source type="image/webp" srcSet={sources.webp} sizes={sizes} />
      <img
        src={sources.fallback}
        srcSet={sources.jpeg}
        sizes={sizes}
        alt={alt}
        className={className}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
      />
    </picture>
  );
}
