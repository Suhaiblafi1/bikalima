import Stripe from "stripe";
import {
  type IntegrationService,
  type IntegrationStatus,
  type NotConfiguredResult,
  checkEnvVars,
  notConfigured,
} from "./types.js";

const REQUIRED_ENV = ["STRIPE_SECRET_KEY"];

type PaymentProviderName = "stripe" | "unknown";

type CheckoutSessionInput = {
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

type CheckoutSessionResult =
  | { ok: true; url: string; sessionId: string }
  | NotConfiguredResult
  | { ok: false; reason: "error"; message: string };

type SessionStatusResult =
  | {
      ok: true;
      paid: boolean;
      sessionId: string;
      paymentIntentId: string | null;
      amountTotal: number | null;
      currency: string | null;
      customerEmail: string | null;
      metadata: Record<string, string>;
    }
  | NotConfiguredResult
  | { ok: false; reason: "error"; message: string };

let cachedClient: Stripe | null = null;
function getClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cachedClient) {
    cachedClient = new Stripe(key);
  }
  return cachedClient;
}

function detectProvider(): PaymentProviderName {
  if (process.env.STRIPE_SECRET_KEY) return "stripe";
  return "unknown";
}

// Stripe expects amounts in the smallest currency unit. JOD is a 3-decimal
// currency (smallest unit = 1 fils = 0.001 JOD), USD/EUR are 2-decimal,
// JPY/KWD/etc. are zero-decimal. We default to 2 decimals and override the
// known 3-decimal currencies used in the region.
const THREE_DECIMAL_CURRENCIES = new Set(["bhd", "iqd", "jod", "kwd", "omr", "tnd"]);
const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg",
  "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
]);

export function toMinorUnits(amount: number, currency: string): number {
  const c = currency.toLowerCase();
  if (ZERO_DECIMAL_CURRENCIES.has(c)) return Math.round(amount);
  if (THREE_DECIMAL_CURRENCIES.has(c)) return Math.round(amount * 1000);
  return Math.round(amount * 100);
}

export const paymentService: IntegrationService & {
  providerName(): PaymentProviderName;
  createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult>;
  getSessionStatus(sessionId: string): Promise<SessionStatusResult>;
} = {
  provider: "payment",

  isEnabled() {
    return checkEnvVars(REQUIRED_ENV).enabled;
  },

  providerName() {
    return detectProvider();
  },

  getStatus(): IntegrationStatus {
    const { enabled, missing } = checkEnvVars(REQUIRED_ENV);
    const providerName = detectProvider();
    return {
      provider: "payment",
      name: `Payment Gateway${providerName !== "unknown" ? ` (${providerName})` : ""}`,
      description: "Accept online payments for workbooks and program enrollments.",
      enabled,
      state: enabled ? "active" : "inactive",
      requiredEnvVars: REQUIRED_ENV,
      missingEnvVars: missing,
    };
  },

  async createCheckoutSession(input) {
    const { enabled, missing } = checkEnvVars(REQUIRED_ENV);
    if (!enabled) return notConfigured("payment", missing);
    const stripe = getClient();
    if (!stripe) return notConfigured("payment", missing);
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: input.currency.toLowerCase(),
              unit_amount: toMinorUnits(input.amount, input.currency),
              product_data: {
                name: input.description,
              },
            },
          },
        ],
        customer_email: input.customerEmail,
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        metadata: input.metadata ?? {},
      });
      if (!session.url) {
        return { ok: false, reason: "error", message: "stripe_no_session_url" };
      }
      return { ok: true, url: session.url, sessionId: session.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : "stripe_unknown_error";
      return { ok: false, reason: "error", message };
    }
  },

  async getSessionStatus(sessionId) {
    const { enabled, missing } = checkEnvVars(REQUIRED_ENV);
    if (!enabled) return notConfigured("payment", missing);
    const stripe = getClient();
    if (!stripe) return notConfigured("payment", missing);
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const paid = session.payment_status === "paid";
      const piId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;
      const metadata: Record<string, string> = {};
      for (const [k, v] of Object.entries(session.metadata ?? {})) {
        if (typeof v === "string") metadata[k] = v;
      }
      return {
        ok: true,
        paid,
        sessionId: session.id,
        paymentIntentId: piId,
        amountTotal: session.amount_total ?? null,
        currency: session.currency ?? null,
        customerEmail: session.customer_email ?? session.customer_details?.email ?? null,
        metadata,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "stripe_unknown_error";
      return { ok: false, reason: "error", message };
    }
  },
};
