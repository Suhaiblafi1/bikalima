import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";
import {
  securityHeaders,
  strictCors,
  globalRateLimit,
  csrfProtection,
} from "./middlewares/security";
import { seedPlatformDefaults } from "./lib/platform";

const app: Express = express();

// We sit behind Replit's proxy + (optionally) a CDN, so trust the
// inner-most proxy for `req.ip` / `req.ips`. Do NOT use `true` (any-hop
// trust enables IP spoofing via X-Forwarded-For).
app.set("trust proxy", 1);
// Strip the default `X-Powered-By: Express` header.
app.disable("x-powered-by");

app.use(securityHeaders);
app.use(strictCors);
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(globalRateLimit);
app.use(authMiddleware);
app.use(csrfProtection);

app.use("/api", router);

// Seed badge definitions, feature flags, and impact-stat placeholders on
// boot. Runs once per process and is idempotent (ON CONFLICT DO NOTHING).
seedPlatformDefaults().catch((err) => logger.warn({ err }, "platform seed failed at boot"));

// Centralised JSON error handler. Production responses NEVER leak stack
// traces; everything is logged server-side via req.log instead.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const e = err as { status?: number; statusCode?: number; message?: string };
  const status = e?.status ?? e?.statusCode ?? 500;
  if (req.log) {
    req.log.error({ err }, "unhandled error");
  } else {
    logger.error({ err }, "unhandled error");
  }
  if (res.headersSent) return;
  const isProd = process.env.NODE_ENV === "production";
  res.status(status).json({
    error: status >= 500 || isProd ? "Internal server error" : (e?.message ?? "Error"),
  });
});

export default app;
