import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

/**
 * Why a rate limit that works locally never fires in production.
 *
 * The counters live in a Map inside the process, keyed by `req.ip`. Both of
 * those assumptions can fail on a serverless deployment and the symptom is
 * identical from outside — a limit that simply never triggers — so this
 * reports the two facts needed to tell them apart:
 *
 *   instance + uptimeMs — a fresh id on every call means each request ran in
 *     its own process, and an in-process counter can never accumulate.
 *   ip + forwardedFor   — if the resolved ip moves between calls from one
 *     caller, the key is unstable and no store would help until it is fixed.
 *     `trust proxy` is 1, and the web project rewrites /api/* to this host,
 *     which puts an extra hop in front of all real browser traffic.
 *
 * It returns nothing a caller does not already know about itself: its own
 * address, how many hops it arrived through, and an opaque id for the process
 * that answered. No configuration, no secrets, no counts.
 */
const INSTANCE_ID = randomUUID().slice(0, 8);
const STARTED_AT = Date.now();

router.get("/_diag/net", (req: Request, res) => {
  const forwarded = req.headers["x-forwarded-for"];
  const chain = Array.isArray(forwarded)
    ? forwarded
    : typeof forwarded === "string"
      ? forwarded.split(",").map((s) => s.trim())
      : [];
  res.set("Cache-Control", "no-store");
  res.json({
    instance: INSTANCE_ID,
    uptimeMs: Date.now() - STARTED_AT,
    ip: req.ip ?? null,
    // The chain, not just its length: which entry `trust proxy` lands on is
    // exactly the question.
    forwardedFor: chain,
    trustProxy: req.app.get("trust proxy"),
  });
});

export default router;
