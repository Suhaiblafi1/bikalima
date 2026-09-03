/**
 * Decide whether a Vercel project needs to build this commit.
 *
 * Two projects deploy from this one repository — bikalima-web and
 * bikalima-api-server — so every push to main starts two builds. On the Hobby
 * plan only one can run at a time, and the api-server has been the one that
 * loses: its production build for 4f6d96f was cancelled in the same
 * millisecond it was created, and 9821674 never got a production build at all.
 * The result was a server running two commits behind its own repository, with
 * nothing red anywhere to say so.
 *
 * The fix is to stop starting builds that have nothing to build. A commit that
 * only touches the web app has no business rebuilding the API server, and the
 * reverse holds too. With each project skipping what does not concern it, the
 * two rarely compete for the single slot.
 *
 * Vercel's contract for an Ignored Build Step:
 *   exit 0 → skip the build
 *   exit 1 → go ahead and build
 * Anything unexpected therefore has to exit 1. A skipped deploy is invisible;
 * an unnecessary one merely costs a minute. When this script cannot tell what
 * changed — a first deploy, a shallow clone, a missing previous SHA — it
 * builds.
 *
 * This was suspected of freezing deployments and briefly switched off. It was
 * not the cause. Clearing the field changed nothing — the freeze continued —
 * and Vercel's own published limits explain it exactly: on this plan the
 * account gets 100 deployments created per day and 1 concurrent build. Both
 * caps had been reached, which is why deployments stopped being created at
 * all and why the losing build of a simultaneous pair was cancelled in the
 * same millisecond it appeared, with no error recorded.
 *
 * So this script addresses the real problem twice over: it prevents a project
 * from starting a build it does not need, which both removes the race and
 * roughly halves the daily count. It is enabled again on both projects.
 *
 * Usage, set per project as the Ignored Build Step:
 *   node scripts/vercel-ignore.mjs api
 *   node scripts/vercel-ignore.mjs web
 */
import { execFileSync } from "node:child_process";

const TARGET = process.argv[2];

/**
 * Paths each project is built from. Everything under lib/ is shared — the
 * pricing table alone is imported by both — so a change there rebuilds both,
 * which is correct: that is the code where a stale copy costs real money.
 */
const SHARED = [
  "lib/",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "tsconfig.base.json",
  "tsconfig.json",
  "vercel.json",
  // This file is deliberately absent from the list. It decides whether a build
  // runs; it is not built into either app, and Vercel reads it fresh from the
  // repository on the next build regardless. Listing it meant that editing
  // even a comment here rebuilt both projects — spending four deployments of
  // the daily hundred to change a sentence this script exists to conserve.
];

const OWNED = {
  api: ["artifacts/api-server/"],
  web: ["artifacts/biklima/"],
};

function build(reason) {
  console.log(`build: ${reason}`);
  process.exit(1);
}

function skip(reason) {
  console.log(`skip: ${reason}`);
  process.exit(0);
}

if (!Object.hasOwn(OWNED, TARGET)) {
  build(`no target given (expected one of ${Object.keys(OWNED).join(", ")}) — building rather than guessing`);
}

const current = process.env.VERCEL_GIT_COMMIT_SHA;
const previous = process.env.VERCEL_GIT_PREVIOUS_SHA;

// No previous SHA means this is not an ordinary push: a project's first
// deploy, or — the one that matters — somebody pressing Redeploy. A redeploy
// is a person saying "put this live", and inferring from the commit's own
// diff would answer them by silently doing nothing. Build.
if (!previous || !current) {
  build("no previous commit to compare against (first deploy, or a manual redeploy)");
}

let changed;
try {
  changed = execFileSync("git", ["diff", "--name-only", `${previous}..${current}`], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
} catch (err) {
  build(`could not read the diff (${err.message.split("\n")[0]})`);
}

if (changed.length === 0) build("no file list — building rather than guessing");

const relevant = [...OWNED[TARGET], ...SHARED];
const hits = changed.filter((file) => relevant.some((p) => (p.endsWith("/") ? file.startsWith(p) : file === p)));

if (hits.length > 0) {
  build(`${hits.length} of ${changed.length} changed file(s) belong to "${TARGET}", e.g. ${hits[0]}`);
}
skip(`none of the ${changed.length} changed file(s) belong to "${TARGET}"`);
