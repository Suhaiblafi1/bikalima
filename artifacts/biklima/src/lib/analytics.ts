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
  | "click_external_registration"
  | "reserve_seat_click"
  | "question_before_booking_click"
  | "tab_change"
  | "page_view"
  | "checkout_started"
  | "discount_applied"
  | "payment_redirect"
  | "in_person_registration";

const CONSENT_KEY = "bikalima_analytics_consent";
const ANON_KEY = "bikalima_analytics_id";

export type AnalyticsConsent = "granted" | "denied" | null;

export function getAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(CONSENT_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

export function setAnalyticsConsent(value: Exclude<AnalyticsConsent, null>): void {
  window.localStorage.setItem(CONSENT_KEY, value);
  window.dispatchEvent(new CustomEvent("bikalima:analytics-consent", { detail: value }));
}

function anonymousId(): string {
  let value = window.localStorage.getItem(ANON_KEY);
  if (!value) {
    value = typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
          const random = Math.floor(Math.random() * 16);
          return (char === "x" ? random : (random & 0x3) | 0x8).toString(16);
        });
    window.localStorage.setItem(ANON_KEY, value);
  }
  return value;
}

function safeProperties(params: AnyDict): Record<string, string | number | boolean | null> {
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(params).slice(0, 20)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(key)) continue;
    if (typeof value === "string") result[key] = value.slice(0, 160);
    else if (typeof value === "number" || typeof value === "boolean" || value === null) result[key] = value;
  }
  return result;
}

export function track(event: BikalimaEvent, params: AnyDict = {}): void {
  if (typeof window === "undefined") return;
  if (getAnalyticsConsent() !== "granted") return;
  const cleanParams = safeProperties(params);
  const payload = { event, ...cleanParams, ts: Date.now() };

  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "").replace(/\/[^/]+$/, "");
  void fetch(`${base}/api/analytics/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({ anonymousId: anonymousId(), eventName: event, path: window.location.pathname, properties: cleanParams }),
  }).catch(() => undefined);

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  } catch {
    /* ignore */
  }

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", event, cleanParams);
    }
  } catch {
    /* ignore */
  }

  try {
    if (typeof window.fbq === "function") {
      window.fbq("trackCustom", event, cleanParams);
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

export const trackReserveSeatClick = (programId: string, source: string, extra: AnyDict = {}) =>
  track("reserve_seat_click", { programId, source, ...extra });

export const trackQuestionBeforeBookingClick = (programId: string, source: string, extra: AnyDict = {}) =>
  track("question_before_booking_click", { programId, source, ...extra });

export const trackTabChange = (programId: string, tab: string, extra: AnyDict = {}) =>
  track("tab_change", { programId, tab, ...extra });
