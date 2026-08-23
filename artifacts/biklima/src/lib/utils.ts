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
