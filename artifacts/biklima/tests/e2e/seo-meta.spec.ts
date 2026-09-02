import { readFile, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "../fixtures/auth";

type SeoRoute = {
  path: string;
  title?: string;
  description: string;
  ogImageAsset?: string;
};
type SeoConfig = {
  titleSuffix: string;
  defaultTitle: string;
  defaultOgImage: string;
  routes: SeoRoute[];
};

// Read rather than import: a JSON import needs an import attribute under
// Node's ESM loader, and the table is build input, not application code.
// The specs run as ES modules, so __dirname does not exist here.
const HERE = path.dirname(fileURLToPath(import.meta.url));

const seoRoutes = JSON.parse(
  readFileSync(path.resolve(HERE, "../../seo-routes.json"), "utf8"),
) as SeoConfig;

const readText = (p: string): Promise<string | null> =>
  new Promise((resolve) =>
    readFile(p, "utf8", (err, data) => resolve(err ? null : data)),
  );

/**
 * The tags a link-preview bot reads, and the tags a browser ends up with,
 * describe the same page — so they have to agree.
 *
 * usePageMeta writes them from a useEffect, which no preview bot ever runs, so
 * the build bakes a static copy per route (prerender-meta.mjs). That leaves two
 * sources for one set of strings, and the failure mode is quiet: a page retitled
 * in its component would keep serving the old title to every WhatsApp share,
 * with nothing red anywhere.
 *
 * So the first test reads what the build actually wrote, and the second reads
 * what a browser actually ends up with, and both are compared against the same
 * table. Change a page's meta without the table and the second fails; change
 * the table without rebuilding and the first does.
 */

const WEB_DIST = path.resolve(HERE, "../../dist/public");

function expectedTitle(route: SeoRoute): string {
  return route.title ? `${route.title}${seoRoutes.titleSuffix}` : seoRoutes.defaultTitle;
}

function extract(html: string, pattern: RegExp): string | null {
  const m = html.match(pattern);
  return m ? m[1] : null;
}

test("every prerendered route carries its own meta in the raw HTML", async () => {
  // Read the build output rather than fetch it: the dev server the rest of the
  // suite runs against serves the app shell for every path and would show none
  // of this. If the build has not been run, that is a failure and not a skip —
  // a guard that quietly does not run is worse than no guard.
  const shellPath = path.join(WEB_DIST, "index.html");
  const shell = await readText(shellPath);
  expect(
    shell,
    `no build output at ${shellPath} — run \`pnpm --filter @workspace/biklima build\` first; ` +
      `without it this test cannot check what preview bots would be served`,
  ).not.toBeNull();

  for (const route of seoRoutes.routes) {
    const file =
      route.path === "/"
        ? path.join(WEB_DIST, "index.html")
        : path.join(WEB_DIST, route.path.replace(/^\//, ""), "index.html");
    const html = await readText(file);
    expect(html, `${route.path} has no prerendered HTML at ${file}`).not.toBeNull();

    const title = expectedTitle(route);
    const canonical = `https://bikalima.com${route.path}`;

    expect(extract(html!, /<title>([^<]*)<\/title>/), `${route.path} <title>`).toBe(title);
    expect(
      extract(html!, /property="og:title" content="([^"]*)"/),
      `${route.path} og:title`,
    ).toBe(title);
    expect(
      extract(html!, /name="description" content="([^"]*)"/),
      `${route.path} description`,
    ).toBe(route.description);
    expect(
      extract(html!, /property="og:description" content="([^"]*)"/),
      `${route.path} og:description`,
    ).toBe(route.description);
    expect(
      extract(html!, /property="og:url" content="([^"]*)"/),
      `${route.path} og:url`,
    ).toBe(canonical);
    expect(
      extract(html!, /rel="canonical" href="([^"]*)"/),
      `${route.path} canonical`,
    ).toBe(canonical);

    // A programme link should preview under its own photograph, not the
    // site-wide card. Anything else means the asset lookup missed.
    const ogImage = extract(html!, /property="og:image" content="([^"]*)"/);
    if (route.ogImageAsset) {
      expect(ogImage, `${route.path} og:image should be its own photograph`).toContain(
        route.ogImageAsset,
      );
    } else {
      expect(ogImage, `${route.path} og:image`).toBe(seoRoutes.defaultOgImage);
    }
  }
});

/**
 * One test per route rather than one loop over all of them. Eighteen
 * navigations against the dev server, which compiles each route on first hit,
 * overran even a three-minute budget as a single test — and a single failure
 * told you nothing about which page was wrong. Split, each gets its own budget
 * and names itself.
 */
for (const route of seoRoutes.routes) {
  test(`the title a browser ends up with on ${route.path} matches the one baked for bots`, async ({
    anon,
  }) => {
    const expected = expectedTitle(route);
    const page = await anon.newPage();
    await page.goto(route.path, { waitUntil: "domcontentloaded" });
    // usePageMeta runs in an effect, so the title arrives a tick after load.
    await expect(
      page,
      `${route.path} sets a different title at runtime than the build bakes for ` +
        `preview bots — update seo-routes.json to match the page, or the page to ` +
        `match the table`,
    ).toHaveTitle(expected, { timeout: 10_000 });
    await page.close();
  });
}
