/**
 * Object storage for files the platform must own: trainee speech recordings,
 * large workbook deliverables, and generated video clips whose provider link
 * expires within hours.
 *
 * S3 and Cloudflare R2 are both spoken to as S3 — R2's API is
 * S3-compatible, so one presigning path (`lib/aws-signature.ts`) covers
 * both, and no SDK is needed. Google Drive is a different protocol
 * altogether and is deliberately not supported here; the service says so
 * rather than pretending.
 *
 * Configure with:
 *
 *   STORAGE_PROVIDER         s3 | r2
 *   STORAGE_ACCESS_KEY       access key id
 *   STORAGE_SECRET_KEY       secret access key
 *   STORAGE_BUCKET           bucket name
 *   STORAGE_REGION           optional — defaults to us-east-1 (s3) / auto (r2)
 *   STORAGE_ENDPOINT         required for r2, optional for s3
 *                            (e.g. https://<account>.r2.cloudflarestorage.com)
 *   STORAGE_PUBLIC_BASE_URL  public read base (CDN / public bucket domain).
 *                            Required for r2, whose API endpoint is private.
 *
 * The public base URL is a promise the deployment makes, not something we
 * can verify: whatever it points at has to actually serve those objects
 * publicly, whether that is a bucket policy, a CDN, or an R2 public domain.
 */
import { presignUrl } from "../lib/aws-signature.js";
import { logger } from "../lib/logger.js";
import {
  type IntegrationService,
  type IntegrationStatus,
  type NotConfiguredResult,
  notConfigured,
} from "./types.js";

const REQUIRED_ENV = [
  "STORAGE_PROVIDER",
  "STORAGE_ACCESS_KEY",
  "STORAGE_SECRET_KEY",
  "STORAGE_BUCKET",
];

/** Long enough for a slow upload of a 2K clip, short enough to be a one-shot grant. */
const UPLOAD_URL_TTL_SECONDS = 900;
const UPLOAD_TIMEOUT_MS = 120_000;

type StorageProviderName = "s3" | "r2" | "gdrive" | "unknown";

type StorageConfig = {
  provider: "s3" | "r2";
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
  host: string;
  /** R2 and custom endpoints address the bucket in the path, S3 in the host. */
  pathStyle: boolean;
  publicBaseUrl: string;
  protocol: "https:" | "http:";
};

type UploadUrlResult =
  | { ok: true; uploadUrl: string; publicUrl: string; key: string }
  | NotConfiguredResult
  | { ok: false; reason: "error"; message: string };

type UploadResult =
  | { ok: true; publicUrl: string; key: string }
  | NotConfiguredResult
  | { ok: false; reason: "error"; message: string };

function value(name: string): string | null {
  const raw = process.env[name];
  return raw && raw.trim() !== "" ? raw.trim() : null;
}

function detectProvider(): StorageProviderName {
  const raw = (process.env.STORAGE_PROVIDER ?? "").toLowerCase().trim();
  if (raw === "s3" || raw === "r2" || raw === "gdrive") return raw;
  return "unknown";
}

/**
 * Resolve the configuration, naming every variable that is missing rather
 * than the first one — an operator setting this up wants the whole list.
 */
function readConfig(): { ok: true; config: StorageConfig } | { ok: false; missing: string[] } {
  const missing = REQUIRED_ENV.filter((name) => value(name) === null);
  const provider = detectProvider();

  // A provider we cannot speak to is a configuration problem, not a runtime
  // one, so it reads as "the variable is not set to something usable".
  if (provider === "gdrive" || provider === "unknown") {
    if (!missing.includes("STORAGE_PROVIDER")) missing.push("STORAGE_PROVIDER");
  }

  const endpoint = value("STORAGE_ENDPOINT");
  const publicBase = value("STORAGE_PUBLIC_BASE_URL");
  if (provider === "r2") {
    // R2's API host is not a read host, and it has no derivable public form.
    if (!endpoint) missing.push("STORAGE_ENDPOINT");
    if (!publicBase) missing.push("STORAGE_PUBLIC_BASE_URL");
  }
  if (missing.length > 0) return { ok: false, missing };

  const bucket = value("STORAGE_BUCKET")!;
  const region = value("STORAGE_REGION") ?? (provider === "r2" ? "auto" : "us-east-1");

  let host: string;
  let pathStyle: boolean;
  let protocol: "https:" | "http:" = "https:";
  if (endpoint) {
    let parsed: URL;
    try {
      parsed = new URL(endpoint);
    } catch {
      return { ok: false, missing: ["STORAGE_ENDPOINT"] };
    }
    host = parsed.host;
    protocol = parsed.protocol === "http:" ? "http:" : "https:";
    pathStyle = true;
  } else {
    host = `${bucket}.s3.${region}.amazonaws.com`;
    pathStyle = false;
  }

  const publicBaseUrl = (
    publicBase ?? (pathStyle ? `${protocol}//${host}/${bucket}` : `${protocol}//${host}`)
  ).replace(/\/+$/, "");

  return {
    ok: true,
    config: {
      provider: provider as "s3" | "r2",
      accessKeyId: value("STORAGE_ACCESS_KEY")!,
      secretAccessKey: value("STORAGE_SECRET_KEY")!,
      bucket,
      region,
      host,
      pathStyle,
      publicBaseUrl,
      protocol,
    },
  };
}

/**
 * Object keys are ours to choose, so they are restricted to characters that
 * never need escaping anywhere — in a signature, a CDN path, or an admin
 * pasting the link into a message.
 */
function safeKeySegment(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    // "my clip (final).mp4" should not become "my-clip-final-.mp4".
    .replace(/-+\./g, ".")
    .replace(/^[-.]+|[-.]+$/g, "");
  return cleaned === "" ? "file" : cleaned.slice(0, 120);
}

function buildKey(fileName: string, folder?: string): string {
  const parts = (folder ?? "")
    .split("/")
    .map((part) => safeKeySegment(part))
    .filter((part) => part !== "" && part !== "file");
  parts.push(`${Date.now()}-${safeKeySegment(fileName)}`);
  return parts.join("/");
}

function objectPath(config: StorageConfig, key: string): string {
  return config.pathStyle ? `/${config.bucket}/${key}` : `/${key}`;
}

function sign(config: StorageConfig, key: string, method: "PUT" | "GET"): string {
  return presignUrl({
    method,
    host: config.host,
    path: objectPath(config, key),
    region: config.region,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    expiresInSeconds: UPLOAD_URL_TTL_SECONDS,
    protocol: config.protocol,
  });
}

export const storageService: IntegrationService & {
  providerName(): StorageProviderName;
  createUploadUrl(input: {
    fileName: string;
    contentType: string;
    folder?: string;
  }): Promise<UploadUrlResult>;
  uploadObject(input: {
    fileName: string;
    contentType: string;
    body: Buffer;
    folder?: string;
  }): Promise<UploadResult>;
  publicUrlFor(key: string): string | null;
} = {
  provider: "storage",

  isEnabled() {
    return readConfig().ok;
  },

  providerName() {
    return detectProvider();
  },

  getStatus(): IntegrationStatus {
    const result = readConfig();
    const providerName = detectProvider();
    return {
      provider: "storage",
      name: `External Storage${providerName !== "unknown" ? ` (${providerName})` : ""}`,
      description:
        "Store trainee speech audio/video, generated clips and large workbook deliverables outside the app.",
      enabled: result.ok,
      state: result.ok ? "active" : "inactive",
      requiredEnvVars: REQUIRED_ENV,
      missingEnvVars: result.ok ? [] : result.missing,
    };
  },

  publicUrlFor(key) {
    const result = readConfig();
    if (!result.ok) return null;
    return `${result.config.publicBaseUrl}/${key}`;
  },

  /**
   * A one-shot PUT grant, for a browser or another process to upload
   * directly. `Content-Type` is intentionally left out of the signature so
   * the uploader may set it freely; the store keeps whatever it receives.
   */
  async createUploadUrl(input) {
    const result = readConfig();
    if (!result.ok) return notConfigured("storage", result.missing);
    if (detectProvider() === "gdrive") {
      return { ok: false, reason: "error", message: "storage_provider_unsupported" };
    }
    const key = buildKey(input.fileName, input.folder);
    return {
      ok: true,
      key,
      uploadUrl: sign(result.config, key, "PUT"),
      publicUrl: `${result.config.publicBaseUrl}/${key}`,
    };
  },

  /**
   * Upload from the server. Takes the bytes rather than a stream because S3
   * requires a known `Content-Length` on a PUT — chunked bodies are refused
   * — so the caller is the right place to enforce a size ceiling before any
   * of this is reached.
   */
  async uploadObject(input) {
    const created = await this.createUploadUrl({
      fileName: input.fileName,
      contentType: input.contentType,
      folder: input.folder,
    });
    if (!created.ok) return created;

    try {
      const response = await fetch(created.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": input.contentType,
          "Content-Length": String(input.body.byteLength),
        },
        body: new Uint8Array(input.body),
        signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
      });
      if (!response.ok) {
        // S3 answers with an XML error body; the first 300 characters carry
        // the code and message an operator needs (AccessDenied, NoSuchBucket).
        const detail = (await response.text().catch(() => "")).slice(0, 300);
        logger.error(
          { status: response.status, key: created.key, detail },
          "[storage] upload rejected",
        );
        return { ok: false, reason: "error", message: `upload_failed_${response.status}` };
      }
      return { ok: true, publicUrl: created.publicUrl, key: created.key };
    } catch (err) {
      logger.error({ err, key: created.key }, "[storage] upload threw");
      return { ok: false, reason: "error", message: "storage_unreachable" };
    }
  },
};
