/**
 * MiniMax H3 short-video generation (text / keyframes / references → MP4
 * with native stereo audio, 4–15s, up to 2K).
 *
 * Wire format is OpenAI-style: a `content` array whose items are `text`,
 * `image_url`, `video_url` or `audio_url`, each media item nesting its own
 * `{ url }` object. Generation is asynchronous — the create call answers
 * with a task id, and the result URL only appears on the query endpoint
 * once the task reaches `succeeded`.
 *
 * Configure with:
 *
 *   MINIMAX_API_KEY     required — API key from platform.minimax.io
 *   MINIMAX_API_BASE    optional — defaults to https://api.minimax.io;
 *                       set to https://api.minimaxi.com for the CN platform
 *   MINIMAX_VIDEO_MODEL optional — defaults to MiniMax-H3
 *
 * Nothing here is called unless the `video_generation` feature flag is on
 * AND the key is present: the calls are billed per output second, so both
 * gates stay shut until somebody deliberately opens them.
 */
import { logger } from "../lib/logger.js";
import {
  type IntegrationService,
  type IntegrationStatus,
  type NotConfiguredResult,
  checkEnvVars,
  notConfigured,
} from "./types.js";

const REQUIRED_ENV = ["MINIMAX_API_KEY"];
const DEFAULT_API_BASE = "https://api.minimax.io";
const DEFAULT_MODEL = "MiniMax-H3";

/** Generous, because the create call itself is a queue insert, not the render. */
const REQUEST_TIMEOUT_MS = 20_000;

export const VIDEO_RESOLUTIONS = ["480P", "768P", "2K"] as const;
export const VIDEO_RATIOS = ["adaptive", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"] as const;
export const MIN_DURATION_SECONDS = 4;
export const MAX_DURATION_SECONDS = 15;
/** The provider's own cap on the prompt it will read. */
export const MAX_PROMPT_LENGTH = 7000;

export type VideoResolution = (typeof VIDEO_RESOLUTIONS)[number];
export type VideoRatio = (typeof VIDEO_RATIOS)[number];

export type VideoConditionType = "image_url" | "video_url" | "audio_url";
export type VideoConditionRole =
  | "first_frame"
  | "last_frame"
  | "reference_image"
  | "reference_video"
  | "reference_audio";

export type VideoCondition = {
  type: VideoConditionType;
  url: string;
  role?: VideoConditionRole;
};

/** The five states the provider reports, used verbatim as our own. */
export type VideoTaskStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export type CreateVideoInput = {
  prompt: string;
  duration: number;
  ratio: VideoRatio;
  resolution: VideoResolution;
  conditions?: VideoCondition[];
};

type UpstreamFailure = {
  ok: false;
  reason: "error";
  /** HTTP status when the provider answered, absent on a transport failure. */
  status?: number;
  code?: string;
  message: string;
};

export type CreateVideoResult =
  | { ok: true; taskId: string; model: string }
  | NotConfiguredResult
  | UpstreamFailure;

export type QueryVideoResult =
  | {
      ok: true;
      status: VideoTaskStatus;
      videoUrl: string | null;
      usage: Record<string, unknown> | null;
      errorMessage: string | null;
    }
  | NotConfiguredResult
  | UpstreamFailure;

function apiBase(): string {
  const raw = process.env.MINIMAX_API_BASE?.trim();
  if (!raw) return DEFAULT_API_BASE;
  return raw.replace(/\/+$/, "");
}

function modelName(): string {
  return process.env.MINIMAX_VIDEO_MODEL?.trim() || DEFAULT_MODEL;
}

/**
 * Map whatever the provider called the state onto our five. The v2 docs use
 * the lowercase set below, but MiniMax's earlier video endpoints answered
 * `Queueing` / `Preparing` / `Processing` / `Success` / `Fail`, and a key
 * pointed at an older deployment should not read as a hard failure. Anything
 * genuinely unrecognised is treated as still running — the reconciler will
 * ask again, which is the recoverable reading.
 */
function normalizeStatus(raw: unknown): VideoTaskStatus {
  const value = String(raw ?? "").trim().toLowerCase();
  switch (value) {
    case "queued":
    case "queueing":
    case "preparing":
      return "queued";
    case "running":
    case "processing":
      return "running";
    case "succeeded":
    case "success":
      return "succeeded";
    case "failed":
    case "fail":
      return "failed";
    case "cancelled":
    case "canceled":
      return "cancelled";
    default:
      logger.warn({ status: raw }, "[video-gen] unrecognised task status; treating as running");
      return "running";
  }
}

/**
 * The provider reports both transport-level errors (HTTP status) and
 * business-level ones (402 insufficient balance, 422 sensitive content). Both
 * arrive here as an `error` result carrying the status, so the caller can
 * decide what to tell the admin without re-parsing JSON.
 */
async function request(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown },
): Promise<{ ok: true; data: Record<string, unknown> } | UpstreamFailure> {
  const key = process.env.MINIMAX_API_KEY?.trim();
  if (!key) return { ok: false, reason: "error", message: "missing_api_key" };

  let response: Response;
  try {
    response = await fetch(`${apiBase()}${path}`, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${key}`,
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    // A timeout or DNS failure says nothing about the task, so never let it
    // read as a rejected request.
    logger.error({ err, path }, "[video-gen] request failed before a reply");
    return { ok: false, reason: "error", message: "upstream_unreachable" };
  }

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const error = (data.error ?? data.base_resp) as
      | { code?: unknown; message?: unknown; status_code?: unknown; status_msg?: unknown }
      | undefined;
    const message =
      (typeof error?.message === "string" && error.message)
      || (typeof error?.status_msg === "string" && error.status_msg)
      || `HTTP ${response.status}`;
    const code =
      error?.code !== undefined ? String(error.code)
      : error?.status_code !== undefined ? String(error.status_code)
      : undefined;
    logger.error({ path, status: response.status, code, message }, "[video-gen] provider rejected");
    return { ok: false, reason: "error", status: response.status, code, message };
  }
  return { ok: true, data };
}

/** Build the provider's `content` array: the prompt, then each media input. */
function buildContent(input: CreateVideoInput): Array<Record<string, unknown>> {
  const content: Array<Record<string, unknown>> = [{ type: "text", text: input.prompt }];
  for (const condition of input.conditions ?? []) {
    content.push({
      type: condition.type,
      [condition.type]: { url: condition.url },
      ...(condition.role ? { role: condition.role } : {}),
    });
  }
  return content;
}

export const videoGenService: IntegrationService & {
  modelName(): string;
  createJob(input: CreateVideoInput): Promise<CreateVideoResult>;
  queryTask(taskId: string): Promise<QueryVideoResult>;
} = {
  provider: "videoGen",

  isEnabled() {
    return checkEnvVars(REQUIRED_ENV).enabled;
  },

  modelName,

  getStatus(): IntegrationStatus {
    const { enabled, missing } = checkEnvVars(REQUIRED_ENV);
    return {
      provider: "videoGen",
      name: `Video generation (${modelName()})`,
      description:
        "Generate 4–15s promo and library clips with native Arabic audio from a prompt, keyframes or reference media.",
      enabled,
      state: enabled ? "active" : "inactive",
      requiredEnvVars: REQUIRED_ENV,
      missingEnvVars: missing,
    };
  },

  async createJob(input) {
    const { enabled, missing } = checkEnvVars(REQUIRED_ENV);
    if (!enabled) return notConfigured("videoGen", missing);

    const result = await request("/v2/video_generation", {
      method: "POST",
      body: {
        model: modelName(),
        content: buildContent(input),
        resolution: input.resolution,
        duration: input.duration,
        ratio: input.ratio,
      },
    });
    if (!result.ok) return result;

    const taskId = result.data.task_id;
    if (typeof taskId !== "string" || taskId.trim() === "") {
      // A 200 with no task id means the job was never queued; recording a row
      // with a null task id would leave the reconciler nothing to poll.
      logger.error({ data: result.data }, "[video-gen] accepted reply carried no task_id");
      return { ok: false, reason: "error", message: "missing_task_id" };
    }
    return { ok: true, taskId: taskId.trim(), model: modelName() };
  },

  async queryTask(taskId) {
    const { enabled, missing } = checkEnvVars(REQUIRED_ENV);
    if (!enabled) return notConfigured("videoGen", missing);

    const result = await request(
      `/v2/query/video_generation/${encodeURIComponent(taskId)}`,
      { method: "GET" },
    );
    if (!result.ok) return result;

    const task = (result.data.task ?? {}) as {
      status?: unknown;
      content?: { url?: unknown } | null;
      usage?: unknown;
      error?: { code?: unknown; message?: unknown } | null;
    };
    const status = normalizeStatus(task.status);
    const url = task.content?.url;
    const errorMessage =
      typeof task.error?.message === "string" && task.error.message.trim() !== ""
        ? task.error.message
        : null;

    return {
      ok: true,
      status,
      videoUrl: typeof url === "string" && url !== "" ? url : null,
      usage:
        task.usage && typeof task.usage === "object"
          ? (task.usage as Record<string, unknown>)
          : null,
      errorMessage,
    };
  },
};
