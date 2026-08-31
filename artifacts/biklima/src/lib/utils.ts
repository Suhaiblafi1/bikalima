import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Scrolls to a page section without forcing the browser to animate through a
 * long, media-heavy home page. Nearby moves stay smooth; long jumps are
 * immediate and respect the user's reduced-motion preference.
 */
/**
 * Scroll to a section that may not exist yet, and stay there once it does.
 *
 * Arriving at /#structure from another page raced the layout twice: the
 * section mounts lazily, so a single attempt 60ms after mount often found
 * nothing and gave up silently; and when it did find it, the hero images above
 * were still loading, so the target moved down after the scroll and the
 * visitor ended up near the top of the page. Both read as "the البرامج link
 * does nothing".
 *
 * So it waits for the element to exist, then re-checks its position for a
 * moment afterwards and corrects if the layout moved under it.
 */
export function scrollToPageSectionWhenReady(id: string, offset = 80): void {
  const deadline = Date.now() + 4000
  const attempt = () => {
    const element = document.getElementById(id)
    if (!element) {
      if (Date.now() < deadline) requestAnimationFrame(attempt)
      return
    }
    scrollToPageSection(id, offset)

    // Images above the target finish loading after the first scroll and push
    // it down. Re-aim a few times while that settles, then stop.
    let corrections = 0
    const settle = window.setInterval(() => {
      corrections += 1
      const top = element.getBoundingClientRect().top
      if (Math.abs(top - offset) > 24) scrollToPageSection(id, offset)
      if (corrections >= 6) window.clearInterval(settle)
    }, 250)
  }
  attempt()
}

export function scrollToPageSection(id: string, offset = 80): boolean {
  const element = document.getElementById(id)
  if (!element) return false

  const top = Math.max(0, element.getBoundingClientRect().top + window.scrollY - offset)
  const distance = Math.abs(top - window.scrollY)
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  const isLongJump = distance > Math.max(window.innerHeight * 1.25, 900)

  window.scrollTo({
    top,
    left: 0,
    behavior: prefersReducedMotion || isLongJump ? "auto" : "smooth",
  })
  return true
}
