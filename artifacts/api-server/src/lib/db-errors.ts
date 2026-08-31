/**
 * Postgres error helpers.
 *
 * Drizzle wraps every driver error in a _DrizzleQueryError and hangs the
 * original pg error off `cause`, so the driver's `code` is NOT on the error
 * the route catches. Reading `err.code` directly therefore never matches and
 * a conflict falls through to the generic 500 branch — silently, since the
 * request still ends in an error either way. Walk the cause chain instead.
 */
function pgErrorCode(err: unknown): string | undefined {
  for (let e: unknown = err, depth = 0; e && depth < 5; depth++) {
    const code = (e as { code?: unknown }).code;
    if (typeof code === "string") return code;
    e = (e as { cause?: unknown }).cause;
  }
  return undefined;
}

/** 23505 — a unique constraint (or unique index) was violated. */
export function isUniqueViolation(err: unknown): boolean {
  return pgErrorCode(err) === "23505";
}
