import type { Express } from "express";

// `build.mjs` creates this self-contained bundle before Vercel packages the
// function. Keeping the server entrypoint inside the API root avoids pnpm
// workspace symlinks being dropped from the Lambda file trace.
// @ts-expect-error The generated bundle is intentionally absent in a clean checkout.
import bundledApp from "../dist/app-runtime.mjs";

export default bundledApp as Express;
