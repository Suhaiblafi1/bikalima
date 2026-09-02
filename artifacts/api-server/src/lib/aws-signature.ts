/**
 * AWS Signature Version 4 presigning for S3-compatible object storage.
 *
 * Hand-rolled for the same reason the security headers are: the only thing
 * we need from an SDK is a signed URL, and `@aws-sdk/client-s3` costs
 * megabytes and a dependency review for it. Presigned URLs also mean the
 * upload itself is a plain `fetch` PUT, so nothing here has to understand
 * S3's API beyond its authentication.
 *
 * Query-string signing with an unsigned payload is deliberate: it lets the
 * caller stream or hand over a body without hashing it first, and it is the
 * same scheme browsers use for direct uploads. Cloudflare R2 accepts it
 * unchanged, which is why one implementation covers both providers.
 */
import crypto from "node:crypto";

const ALGORITHM = "AWS4-HMAC-SHA256";
const UNSIGNED_PAYLOAD = "UNSIGNED-PAYLOAD";

export type PresignInput = {
  method: "GET" | "PUT" | "HEAD" | "DELETE";
  /** Host only, no scheme: `bucket.s3.us-east-1.amazonaws.com`. */
  host: string;
  /** Decoded object path with a leading slash: `/folder/my file.mp4`. */
  path: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  expiresInSeconds: number;
  service?: string;
  protocol?: "https:" | "http:";
  /** Injectable for tests; defaults to now. */
  now?: Date;
};

/**
 * RFC 3986 encoding. `encodeURIComponent` leaves `!'()*` alone, and S3's
 * canonical request expects them percent-encoded — a key containing one
 * otherwise fails the signature with no useful error.
 */
function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/** Each segment is encoded, the separators are not. */
function encodePath(path: string): string {
  return path.split("/").map(encodeRfc3986).join("/");
}

function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function hmac(key: crypto.BinaryLike, value: string): Buffer {
  return crypto.createHmac("sha256", key).update(value, "utf8").digest();
}

function timestamps(now: Date): { amzDate: string; dateStamp: string } {
  const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
}

/**
 * Returns a URL that authorises exactly one request of `method` against
 * `path`, valid for `expiresInSeconds`. Headers other than `host` are left
 * unsigned, so the caller may send `Content-Type` freely — S3 still stores
 * whatever it receives.
 */
export function presignUrl(input: PresignInput): string {
  const service = input.service ?? "s3";
  const protocol = input.protocol ?? "https:";
  const { amzDate, dateStamp } = timestamps(input.now ?? new Date());
  const scope = `${dateStamp}/${input.region}/${service}/aws4_request`;

  const query: [string, string][] = [
    ["X-Amz-Algorithm", ALGORITHM],
    ["X-Amz-Credential", `${input.accessKeyId}/${scope}`],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(input.expiresInSeconds)],
    ["X-Amz-SignedHeaders", "host"],
  ];
  const canonicalQuery = query
    .map(([key, value]) => [encodeRfc3986(key), encodeRfc3986(value)] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const canonicalRequest = [
    input.method,
    encodePath(input.path),
    canonicalQuery,
    `host:${input.host}\n`,
    "host",
    UNSIGNED_PAYLOAD,
  ].join("\n");

  const stringToSign = [ALGORITHM, amzDate, scope, sha256Hex(canonicalRequest)].join("\n");

  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${input.secretAccessKey}`, dateStamp), input.region), service),
    "aws4_request",
  );
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");

  return `${protocol}//${input.host}${encodePath(input.path)}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}
