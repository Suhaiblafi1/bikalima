import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

/**
 * The whole site is set in one face, and it is the face that was asked for.
 *
 * Avenir Arabic is a licensed Monotype family that is not in this repository,
 * so it is named first in the stack and delivered by a stylesheet generated
 * from whatever font files are present. That arrangement has two ways to fail
 * quietly: the name could stop being first (a component hardcoding its own
 * family, an edit to index.css), or the generated stylesheet could stop being
 * reachable — and because vercel.json rewrites unknown paths to /index.html, a
 * missing stylesheet comes back as an HTML document with a 200, which no
 * browser reports as an error. Neither shows up as a broken page: text simply
 * renders in the fallback and nobody notices for months.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(HERE, "../..");
const FAMILY = "Avenir Arabic";

test("both font variables lead with Avenir Arabic", () => {
  const css = readFileSync(path.join(WEB, "src/index.css"), "utf8");

  for (const token of ["--app-font-sans", "--app-font-serif"]) {
    const line = css.split("\n").find((l) => l.trim().startsWith(`${token}:`));
    expect(line, `${token} is declared`).toBeTruthy();
    // First in the list is the only position that renders; anything after it
    // is a fallback for as long as the licensed files are absent.
    expect(line!, `${token} asks for ${FAMILY} first`).toMatch(
      new RegExp(`${token}:\\s*'${FAMILY}'`),
    );
  }
});

test("the generated stylesheet exists and is linked", () => {
  const html = readFileSync(path.join(WEB, "index.html"), "utf8");
  expect(html).toContain("fonts/avenir-arabic.css");

  // Present even with no font files: an absent file would be answered by the
  // SPA rewrite with markup, which is worse than an empty stylesheet.
  const generated = readFileSync(path.join(WEB, "public/fonts/avenir-arabic.css"), "utf8");
  expect(generated).toContain("Avenir Arabic");
});

test("no component sets its own Arabic family ahead of Avenir Arabic", () => {
  // Everything on the site inherits from the two variables. Grepping lines was
  // not enough to check that: a declaration can span lines (the certificate's
  // does, as a ternary) and a comment mentioning font-family is not a
  // declaration at all. So read the files, drop the comments, and look at each
  // declaration together with the value that follows it.
  const files = execFileSync(
    "find",
    [path.join(WEB, "src"), "-type", "f", "(", "-name", "*.ts", "-o", "-name", "*.tsx", "-o", "-name", "*.css", ")"],
    { encoding: "utf8" },
  )
    .split("\n")
    .filter(Boolean);

  const offenders: string[] = [];

  for (const file of files) {
    const source = readFileSync(file, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^[ \t]*\/\/.*$/gm, "");

    for (const match of source.matchAll(/font-?[fF]amily\s*[:=]/g)) {
      // Enough of a window to clear a multi-line ternary and reach the value.
      const value = source.slice(match.index!, match.index! + 220);
      const ok =
        value.includes("var(--") ||
        value.includes(`'${FAMILY}'`) ||
        // The watermark SVG, which cannot load a webfont at all — documented
        // where it lives. Pinned to its exact form so a new generic family
        // elsewhere is still caught.
        value.startsWith("font-family='sans-serif'") ||
        // The Latin side of the certificate: Avenir Arabic sets Arabic, and an
        // English certificate is deliberately a serif.
        value.includes("'Georgia', 'Times New Roman', serif");
      if (!ok) {
        offenders.push(`${path.relative(WEB, file)}: ${value.split("\n")[0].trim()}`);
      }
    }
  }

  expect(offenders, `these set a family without Avenir Arabic first:\n${offenders.join("\n")}`)
    .toEqual([]);
});

test("the browser resolves Avenir Arabic first for body and headings", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");

  const resolved = await page.evaluate(() => {
    const first = (el: Element | null) =>
      el ? getComputedStyle(el).fontFamily.split(",")[0].replace(/["']/g, "").trim() : null;
    return {
      body: first(document.body),
      heading: first(document.querySelector("h1, h2")),
    };
  });

  expect(resolved.body).toBe("Avenir Arabic");
  expect(resolved.heading).toBe("Avenir Arabic");
});

test("the generator reads whatever the foundry named the files", () => {
  // The delivery path nobody can test by hand until the licensed files arrive:
  // this runs the real generator against a directory of realistically-named
  // empty files and checks what it writes.
  const dir = mkdtempSync(path.join(tmpdir(), "avenir-"));
  try {
    const fonts = path.join(dir, "public", "fonts");
    execFileSync("mkdir", ["-p", fonts]);
    for (const name of [
      "AvenirArabic-Book.woff2",
      "AvenirArabic-Medium.woff2",
      "Avenir Arabic Heavy.woff2",
      "avenir-arabic-700.woff2",
      "unrelated-font.woff2",
    ]) {
      writeFileSync(path.join(fonts, name), "");
    }
    execFileSync("cp", [path.join(WEB, "fonts-avenir.mjs"), path.join(dir, "fonts-avenir.mjs")]);
    execFileSync("node", [path.join(dir, "fonts-avenir.mjs")], { encoding: "utf8" });

    const css = readFileSync(path.join(fonts, "avenir-arabic.css"), "utf8");

    // Book/Medium/Heavy are weight names, not numbers, and one file is already
    // numbered — all four have to land on the right weight.
    for (const weight of [400, 500, 700, 800]) {
      expect(css, `weight ${weight} was declared`).toContain(`font-weight: ${weight};`);
    }
    // A space in a filename has to be quoted and encoded or the rule is
    // silently dropped by the CSS parser.
    expect(css).toContain('url("/fonts/Avenir%20Arabic%20Heavy.woff2")');
    // A font that is not Avenir must not be claimed as one.
    expect(css).not.toContain("unrelated-font");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
