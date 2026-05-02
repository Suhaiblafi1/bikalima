import {
  type IntegrationService,
  type IntegrationStatus,
  type NotConfiguredResult,
  checkEnvVars,
  notConfigured,
} from "./types.js";

const REQUIRED_ENV = ["OPENAI_API_KEY"];

type TranscribeResult =
  | { ok: true; text: string; languageCode?: string }
  | NotConfiguredResult
  | { ok: false; reason: "error"; message: string };

type AnalyzeResult =
  | { ok: true; summary: string; score?: number; raw?: unknown }
  | NotConfiguredResult
  | { ok: false; reason: "error"; message: string };

export const openaiService: IntegrationService & {
  transcribeAudio(input: { url: string; languageHint?: string }): Promise<TranscribeResult>;
  analyzeSpeech(input: { transcript: string; goalsHint?: string }): Promise<AnalyzeResult>;
} = {
  provider: "openai",

  isEnabled() {
    return checkEnvVars(REQUIRED_ENV).enabled;
  },

  getStatus(): IntegrationStatus {
    const { enabled, missing } = checkEnvVars(REQUIRED_ENV);
    return {
      provider: "openai",
      name: "OpenAI",
      description: "Transcribe speech audio and produce a first-pass written evaluation.",
      enabled,
      state: enabled ? "active" : "inactive",
      requiredEnvVars: REQUIRED_ENV,
      missingEnvVars: missing,
    };
  },

  async transcribeAudio(_input) {
    const { enabled, missing } = checkEnvVars(REQUIRED_ENV);
    if (!enabled) return notConfigured("openai", missing);
    // TODO: implement OpenAI Whisper transcription using OPENAI_API_KEY.
    return { ok: false, reason: "error", message: "openai_transcribe_not_implemented" };
  },

  async analyzeSpeech(_input) {
    const { enabled, missing } = checkEnvVars(REQUIRED_ENV);
    if (!enabled) return notConfigured("openai", missing);
    // TODO: implement chat completion call with structured speech-evaluation prompt.
    return { ok: false, reason: "error", message: "openai_analyze_not_implemented" };
  },
};
