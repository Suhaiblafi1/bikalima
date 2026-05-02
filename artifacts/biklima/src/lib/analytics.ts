type AnyDict = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: Array<AnyDict>;
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export type BikalimaEvent =
  | "click_whatsapp"
  | "submit_interest_form"
  | "click_zoom_booking"
  | "click_program_details"
  | "click_external_registration";

export function track(event: BikalimaEvent, params: AnyDict = {}): void {
  if (typeof window === "undefined") return;
  const payload = { event, ...params, ts: Date.now() };

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  } catch {
    /* ignore */
  }

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", event, params);
    }
  } catch {
    /* ignore */
  }

  try {
    if (typeof window.fbq === "function") {
      window.fbq("trackCustom", event, params);
    }
  } catch {
    /* ignore */
  }

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, params);
  }
}

export const trackWhatsappClick = (source: string, extra: AnyDict = {}) =>
  track("click_whatsapp", { source, ...extra });

export const trackInterestFormSubmit = (extra: AnyDict = {}) =>
  track("submit_interest_form", extra);

export const trackZoomBookingClick = (source: string, extra: AnyDict = {}) =>
  track("click_zoom_booking", { source, ...extra });

export const trackProgramDetailsClick = (programId: string, source: string, extra: AnyDict = {}) =>
  track("click_program_details", { programId, source, ...extra });

export const trackExternalRegistrationClick = (href: string, partner: string, extra: AnyDict = {}) =>
  track("click_external_registration", { href, partner, ...extra });
