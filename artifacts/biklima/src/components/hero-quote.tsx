import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * The rotating quote over the hero image.
 *
 * This used to be a `heroQuoteIdx` state at the top of Home, and Home is over
 * fifteen hundred lines of JSX. Every tick of the five-second timer therefore
 * re-rendered the entire page — header, trust strip, programme cards,
 * testimonials, the FAQ, all of it — for the sake of two lines of text inside
 * one overlay. It measured at three full page re-renders every sixteen
 * seconds, for as long as the tab stayed open, whether or not the hero was
 * still on screen.
 *
 * The index lives here now. `HeroQuoteTicker` owns the timer and publishes the
 * index through context; Home's own markup is passed through as `children`, so
 * a tick leaves that element tree untouched and React re-renders only the two
 * `HeroQuote` consumers. One timer, not one per overlay, so the mobile and
 * desktop variants can never drift apart.
 *
 * The timer also stops when it has nothing to animate for: a hidden tab, or a
 * hero the reader has scrolled past. Both are the common case on a page this
 * long — most of a visit is spent below the fold.
 */

export type HeroQuoteItem = { text: string; author: string };

const HeroQuoteIndexContext = createContext(0);

const ROTATE_MS = 5000;

export function HeroQuoteTicker({
  total,
  resetKey,
  observedRef,
  children,
}: {
  /** How many quotes there are to cycle through. */
  total: number;
  /** Changing this restarts the cycle from the first quote — e.g. on language change. */
  resetKey: string;
  /** The hero element. The timer runs only while some part of it is on screen. */
  observedRef: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [resetKey]);

  // Kept in a ref so the effect below does not have to re-subscribe — and
  // therefore re-observe — every time the index moves.
  const totalRef = useRef(total);
  totalRef.current = total;

  useEffect(() => {
    if (total <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer = 0;
    let onScreen = true;

    const stop = () => {
      if (timer !== 0) {
        window.clearInterval(timer);
        timer = 0;
      }
    };
    const sync = () => {
      const shouldRun = onScreen && document.visibilityState === "visible";
      if (!shouldRun) {
        stop();
        return;
      }
      if (timer === 0) {
        timer = window.setInterval(
          () => setIdx((i) => (i + 1) % totalRef.current),
          ROTATE_MS,
        );
      }
    };

    document.addEventListener("visibilitychange", sync);

    // Without an element to watch, fall back to running whenever the tab is
    // visible — the same behaviour as before, never worse.
    const hero = observedRef.current;
    const observer =
      hero && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              const entry = entries[entries.length - 1];
              if (!entry) return;
              onScreen = entry.isIntersecting;
              sync();
            },
            { threshold: 0 },
          )
        : null;
    if (observer && hero) observer.observe(hero);

    sync();

    return () => {
      stop();
      document.removeEventListener("visibilitychange", sync);
      observer?.disconnect();
    };
  }, [total, observedRef]);

  return (
    <HeroQuoteIndexContext.Provider value={idx}>
      {children}
    </HeroQuoteIndexContext.Provider>
  );
}

/**
 * One overlay's worth of quote. `mobile` is the strip pinned under the image
 * on small screens; `desktop` is the card floated over it from `lg` up. Only
 * one of the two is visible at any width — they are separate markup rather
 * than one responsive block because that is how the hero was already written.
 */
export function HeroQuote({
  quotes,
  variant,
}: {
  quotes: readonly HeroQuoteItem[];
  variant: "mobile" | "desktop";
}) {
  const idx = useContext(HeroQuoteIndexContext);
  const quote = quotes[idx];
  if (!quote) return null;

  if (variant === "mobile") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`hero-mobile-${idx}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="line-clamp-2 font-serif text-xs leading-relaxed text-foreground/80">
            “{quote.text}”
          </p>
          <p className="mt-1 text-[11px] font-bold text-primary">— {quote.author}</p>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex gap-3">
          <div className="text-primary/20 text-4xl font-serif self-start">✦</div>
          <div className="flex-1">
            <p className="text-foreground/90 text-sm font-medium leading-relaxed italic">
              "{quote.text}"
            </p>
            <p className="text-primary font-bold mt-3 text-xs tracking-wide">
              — {quote.author}
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
