import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { imagetools } from "vite-imagetools";

// Replit always sets PORT; outside Replit (plain local runs / preview
// tooling) the port comes from the CLI (`--port`) or vite's default.
const rawPort = process.env.PORT;

let port: number | undefined;
if (rawPort) {
  const parsed = Number(rawPort);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }
  port = parsed;
}

// Replit always sets BASE_PATH; default to "/" for plain local runs
// (REPL_ID is undefined outside Replit, so behavior there is unchanged).
const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    // Programme photography is stored once at 1600px and resized here. The
    // cards it fills are ~330px wide on a phone, so shipping the original
    // meant sending four or five times the pixels a reader could ever see —
    // about 1.1MB for four images. Widths and format come from the import
    // query; see components/responsive-image.tsx for the shape used.
    imagetools(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Production hardening: never ship source maps to the browser, and
    // strip console/debugger statements from the bundle.
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("@radix-ui") || id.includes("lucide-react")) return "ui-vendor";
          if (id.includes("@tanstack") || id.includes("wouter")) return "app-vendor";
          if (id.includes("react") || id.includes("scheduler")) return "react-vendor";
          return undefined;
        },
      },
    },
  },
  esbuild: {
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },
  server: {
    ...(port ? { port } : {}),
    host: "0.0.0.0",
    allowedHosts: true,
    // Local development only: forward /api to a locally running API server.
    // Defaults to http://localhost:3000 outside Replit (REPL_ID is always
    // set on Replit, so behavior there is unchanged). Override with
    // LOCAL_API_URL if needed.
    ...(() => {
      const localApiUrl =
        process.env.LOCAL_API_URL ??
        (process.env.REPL_ID === undefined && process.env.NODE_ENV !== "production"
          ? "http://localhost:3000"
          : undefined);
      return localApiUrl
        ? { proxy: { "/api": { target: localApiUrl, changeOrigin: true } } }
        : {};
    })(),
    fs: {
      strict: true,
      deny: ["**/.*"],
      allow: [
        path.resolve(import.meta.dirname),
        path.resolve(import.meta.dirname, "../../lib"),
        path.resolve(import.meta.dirname, "../../attached_assets"),
      ],
    },
  },
  preview: {
    ...(port ? { port } : {}),
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
