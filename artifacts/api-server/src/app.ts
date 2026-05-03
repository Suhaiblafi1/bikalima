import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";
import { seedPlatformDefaults } from "./lib/platform";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

// We sit behind Replit's proxy + (optionally) a CDN, so trust the
// inner-most proxy for `req.ip` / `req.ips`. Do NOT use `true` (any-hop
// trust enables IP spoofing via X-Forwarded-For).
app.set("trust proxy", 1);

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
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

// Seed badge definitions, feature flags, and impact-stat placeholders on
// boot. Runs once per process and is idempotent (ON CONFLICT DO NOTHING).
seedPlatformDefaults().catch((err) => logger.warn({ err }, "platform seed failed at boot"));

if (process.env.NODE_ENV === "production") {
  const publicDir = path.join(__dirname, "public");
  app.use(express.static(publicDir));
  app.get("/*splat", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

export default app;
