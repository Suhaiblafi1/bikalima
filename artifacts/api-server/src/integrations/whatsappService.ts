import {
  type IntegrationService,
  type IntegrationStatus,
  type NotConfiguredResult,
  checkEnvVars,
  notConfigured,
} from "./types.js";

const REQUIRED_ENV = ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"];

type SendResult =
  | { ok: true; messageId: string }
  | NotConfiguredResult
  | { ok: false; reason: "error"; message: string };

export const whatsappService: IntegrationService & {
  sendTemplate(input: {
    toPhone: string;
    templateName: string;
    languageCode?: string;
    variables?: string[];
  }): Promise<SendResult>;
  sendText(input: { toPhone: string; body: string }): Promise<SendResult>;
} = {
  provider: "whatsapp",

  isEnabled() {
    return checkEnvVars(REQUIRED_ENV).enabled;
  },

  getStatus(): IntegrationStatus {
    const { enabled, missing } = checkEnvVars(REQUIRED_ENV);
    return {
      provider: "whatsapp",
      name: "WhatsApp Business",
      description: "Send evaluation results, follow-ups and reminders via WhatsApp templates.",
      enabled,
      state: enabled ? "active" : "inactive",
      requiredEnvVars: REQUIRED_ENV,
      missingEnvVars: missing,
    };
  },

  async sendTemplate(_input) {
    const { enabled, missing } = checkEnvVars(REQUIRED_ENV);
    if (!enabled) return notConfigured("whatsapp", missing);
    // TODO: call WhatsApp Cloud API graph.facebook.com/.../messages with WHATSAPP_TOKEN.
    return { ok: false, reason: "error", message: "whatsapp_send_template_not_implemented" };
  },

  async sendText(_input) {
    const { enabled, missing } = checkEnvVars(REQUIRED_ENV);
    if (!enabled) return notConfigured("whatsapp", missing);
    return { ok: false, reason: "error", message: "whatsapp_send_text_not_implemented" };
  },
};
