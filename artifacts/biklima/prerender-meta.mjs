import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Write one static HTML file per route, with that page's own title, description
 * and Open Graph tags already in the markup.
 *
 * usePageMeta sets those tags from inside a useEffect, which means they exist
 * only after the browser has run JavaScript. Link-preview bots — WhatsApp,
 * Facebook, Twitter, LinkedIn — do not run JavaScript at all; they read the
 * raw HTML and stop. So every programme link shared in a WhatsApp message
 * showed the home page's title and image, no matter how carefully each page
 * described itself.
 *
 * This is not server-side rendering and not user-agent sniffing. Sniffing for
 * bot names is brittle (the list is never complete) and serves crawlers
 * different markup from people, which is the definition of cloaking. Instead
 * every visitor — person or bot — gets the same file, with the same tags, and
 * the app boots on top of it as before.
 *
 * Vercel checks the filesystem before applying the SPA rewrite, so
 * `dist/public/gallery/index.html` answers `/gallery` and only unknown paths
 * fall through to the app shell.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, "dist/public");

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Replace a tag's content if the tag exists, and append it to <head> if not.
 * The shell already carries most of these, so this is nearly always a replace;
 * appending covers a tag index.html stops shipping one day.
 */
function setTag(html, { attr, name, content }) {
  const value = esc(content);
  const pattern = new RegExp(
    `(<meta\\s+[^>]*${attr}=["']${name}["'][^>]*content=["'])[^"']*(["'][^>]*>)`,
    "i",
  );
  if (pattern.test(html)) return html.replace(pattern, `$1${value}$2`);
  const reversed = new RegExp(
    `(<meta\\s+[^>]*content=["'])[^"']*(["'][^>]*${attr}=["']${name}["'][^>]*>)`,
    "i",
  );
  if (reversed.test(html)) return html.replace(reversed, `$1${value}$2`);
  return html.replace(
    /<\/head>/i,
    `  <meta ${attr}="${name}" content="${value}" />\n  </head>`,
  );
}

function setCanonical(html, href) {
  const value = esc(href);
  if (/<link\s+[^>]*rel=["']canonical["'][^>]*>/i.test(html)) {
    return html.replace(
      /(<link\s+[^>]*rel=["']canonical["'][^>]*href=["'])[^"']*(["'][^>]*>)/i,
      `$1${value}$2`,
    );
  }
  return html.replace(
    /<\/head>/i,
    `  <link rel="canonical" href="${value}" />\n  </head>`,
  );
}

/**
 * The build hashes asset filenames, so the programme photograph a route should
 * preview under is only knowable after the fact. Match the emitted original —
 * the resized variants added for the cards carry a `.jpeg` extension, the
 * source keeps `.jpg`, which is what distinguishes them.
 */
async function findOgAsset(base) {
  const assets = path.join(dist, "assets");
  let names;
  try {
    names = await readdir(assets);
  } catch {
    return null;
  }
  const hit = names.find((n) => n.startsWith(`${base}-`) && n.endsWith(".jpg"));
  return hit ? `https://bikalima.com/assets/${hit}` : null;
}

async function main() {
  const config = JSON.parse(
    await readFile(path.join(here, "seo-routes.json"), "utf8"),
  );
  const shell = await readFile(path.join(dist, "index.html"), "utf8");

  let written = 0;
  const missingAssets = [];

  for (const route of config.routes) {
    const title = route.title
      ? `${route.title}${config.titleSuffix}`
      : config.defaultTitle;
    const description = route.description;
    const canonical = `https://bikalima.com${route.path === "/" ? "/" : route.path}`;

    let ogImage = config.defaultOgImage;
    if (route.ogImageAsset) {
      const found = await findOgAsset(route.ogImageAsset);
      if (found) ogImage = found;
      else missingAssets.push(`${route.path} → ${route.ogImageAsset}`);
    }

    let html = shell.replace(
      /<title>[^<]*<\/title>/i,
      `<title>${esc(title)}</title>`,
    );
    html = setTag(html, { attr: "name", name: "description", content: description });
    html = setTag(html, { attr: "property", name: "og:title", content: title });
    html = setTag(html, { attr: "property", name: "og:description", content: description });
    html = setTag(html, { attr: "property", name: "og:url", content: canonical });
    html = setTag(html, { attr: "property", name: "og:image", content: ogImage });
    html = setTag(html, { attr: "property", name: "og:image:alt", content: title });
    html = setTag(html, { attr: "name", name: "twitter:card", content: "summary_large_image" });
    html = setTag(html, { attr: "name", name: "twitter:title", content: title });
    html = setTag(html, { attr: "name", name: "twitter:description", content: description });
    html = setTag(html, { attr: "name", name: "twitter:image", content: ogImage });
    html = setCanonical(html, canonical);

    // "/" is the shell itself; everything else becomes <route>/index.html.
    const target =
      route.path === "/"
        ? path.join(dist, "index.html")
        : path.join(dist, route.path.replace(/^\//, ""), "index.html");
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html, "utf8");
    written += 1;
  }

  if (missingAssets.length > 0) {
    // A preview falling back to the site-wide image is a downgrade, not a
    // broken build — but it should be visible rather than silent.
    console.warn(
      `[prerender] og:image asset not found, used the default for:\n  ${missingAssets.join("\n  ")}`,
    );
  }
  console.log(`[prerender] wrote ${written} route(s) with their own meta tags`);
}

await main();
