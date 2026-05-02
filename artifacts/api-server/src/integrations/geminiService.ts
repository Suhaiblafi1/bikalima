import {
  type IntegrationService,
  type IntegrationStatus,
  type NotConfiguredResult,
  checkEnvVars,
  notConfigured,
} from "./types.js";

const REQUIRED_ENV = ["GEMINI_API_KEY"];

type VideoAnalysisResult =
  | {
      ok: true;
      summary: string;
      bodyLanguageNotes?: string;
      voiceNotes?: string;
      raw?: unknown;
    }
  | NotConfiguredResult
  | { ok: false; reason: "error"; message: string };

export const geminiService: IntegrationService & {
  analyzeVideo(input: { url: string; languageHint?: string }): Promise<VideoAnalysisResult>;
} = {
  provider: "gemini",

  isEnabled() {
    return checkEnvVars(REQUIRED_ENV).enabled;
  },

  getStatus(): IntegrationStatus {
    const { enabled, missing } = checkEnvVars(REQUIRED_ENV);
    return {
      provider: "gemini",
      name: "Google Gemini",
      description: "Analyze trainee speech videos for body language, presence and delivery notes.",
      enabled,
      state: enabled ? "active" : "inactive",
      requiredEnvVars: REQUIRED_ENV,
      missingEnvVars: missing,
    };
  },

  async analyzeVideo(_input) {
    const { enabled, missing } = checkEnvVars(REQUIRED_ENV);
    if (!enabled) return notConfigured("gemini", missing);
    // TODO: implement Gemini multimodal video analysis using GEMINI_API_KEY.
    return { ok: false, reason: "error", message: "gemini_analyze_not_implemented" };
  },
};
