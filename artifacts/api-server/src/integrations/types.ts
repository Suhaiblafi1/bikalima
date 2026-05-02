export type IntegrationProvider =
  | "odoo"
  | "openai"
  | "gemini"
  | "whatsapp"
  | "payment"
  | "storage";

export interface IntegrationStatus {
  provider: IntegrationProvider;
  name: string;
  description: string;
  enabled: boolean;
  state: "active" | "inactive";
  requiredEnvVars: string[];
  missingEnvVars: string[];
}

export interface IntegrationService {
  provider: IntegrationProvider;
  isEnabled(): boolean;
  getStatus(): IntegrationStatus;
}

export type NotConfiguredResult = {
  ok: false;
  reason: "not_configured";
  provider: IntegrationProvider;
  missingEnvVars: string[];
};

export function notConfigured(
  provider: IntegrationProvider,
  missingEnvVars: string[],
): NotConfiguredResult {
  return { ok: false, reason: "not_configured", provider, missingEnvVars };
}

export function checkEnvVars(names: string[]): {
  enabled: boolean;
  missing: string[];
} {
  const missing = names.filter((n) => {
    const v = process.env[n];
    return !v || v.trim() === "";
  });
  return { enabled: missing.length === 0, missing };
}
