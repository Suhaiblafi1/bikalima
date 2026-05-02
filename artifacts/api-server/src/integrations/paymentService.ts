import {
  type IntegrationService,
  type IntegrationStatus,
  type NotConfiguredResult,
  checkEnvVars,
  notConfigured,
} from "./types.js";

const REQUIRED_ENV = ["PAYMENT_PROVIDER_KEY"];

type PaymentProviderName = "stripe" | "tap" | "paytabs" | "unknown";

type CheckoutSessionResult =
  | { ok: true; url: string; sessionId: string }
  | NotConfiguredResult
  | { ok: false; reason: "error"; message: string };

function detectProvider(): PaymentProviderName {
  const v = (process.env.PAYMENT_PROVIDER ?? "").toLowerCase();
  if (v === "stripe" || v === "tap" || v === "paytabs") return v;
  return "unknown";
}

export const paymentService: IntegrationService & {
  providerName(): PaymentProviderName;
  createCheckoutSession(input: {
    amount: number;
    currency: string;
    description: string;
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<CheckoutSessionResult>;
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

  async createCheckoutSession(_input) {
    const { enabled, missing } = checkEnvVars(REQUIRED_ENV);
    if (!enabled) return notConfigured("payment", missing);
    // TODO: branch on detectProvider() and call Stripe / Tap / PayTabs SDK.
    return { ok: false, reason: "error", message: "payment_checkout_not_implemented" };
  },
};
