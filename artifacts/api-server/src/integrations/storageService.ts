import {
  type IntegrationService,
  type IntegrationStatus,
  type NotConfiguredResult,
  checkEnvVars,
  notConfigured,
} from "./types.js";

const REQUIRED_ENV = ["STORAGE_ACCESS_KEY"];

type StorageProviderName = "s3" | "r2" | "gdrive" | "unknown";

type UploadUrlResult =
  | { ok: true; uploadUrl: string; publicUrl: string; key: string }
  | NotConfiguredResult
  | { ok: false; reason: "error"; message: string };

function detectProvider(): StorageProviderName {
  const v = (process.env.STORAGE_PROVIDER ?? "").toLowerCase();
  if (v === "s3" || v === "r2" || v === "gdrive") return v;
  return "unknown";
}

export const storageService: IntegrationService & {
  providerName(): StorageProviderName;
  createUploadUrl(input: {
    fileName: string;
    contentType: string;
    folder?: string;
  }): Promise<UploadUrlResult>;
} = {
  provider: "storage",

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
      provider: "storage",
      name: `External Storage${providerName !== "unknown" ? ` (${providerName})` : ""}`,
      description: "Store trainee speech audio/video and large workbook deliverables outside the app.",
      enabled,
      state: enabled ? "active" : "inactive",
      requiredEnvVars: REQUIRED_ENV,
      missingEnvVars: missing,
    };
  },

  async createUploadUrl(_input) {
    const { enabled, missing } = checkEnvVars(REQUIRED_ENV);
    if (!enabled) return notConfigured("storage", missing);
    // TODO: branch on detectProvider() and return a signed PUT URL.
    return { ok: false, reason: "error", message: "storage_upload_url_not_implemented" };
  },
};
