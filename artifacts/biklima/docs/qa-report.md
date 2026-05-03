# Bikalima QA Report — Site-wide button & link audit

**Date:** 2026-05-03
**Scope:** Task #47 — final QA gate before ship.
**Approach:** Enumerated all routes from `src/App.tsx`; ran static
scans for dead links, console noise, RTL violations, missing rel
attrs, and AdminRoute coverage; manually verified key public flows
in the preview pane.

---

## Routes audited

**Public:** `/`, `/impact`, `/consultation`, `/privacy`, `/terms`,
`/gallery`, `/workbooks`, `/verify`, `/verify-email`,
`/certificates/:code`, `/graduates` (flag-gated), `/checkout`,
`/confirmation`, `/programs/:slug`, `/programs` (redirect),
`/courses/:slug` (redirect), `/courses` (redirect), 404.

**Learner:** `/dashboard` (all tabs), `/courses/:slug/learn`,
`/instructor/reviews`.

**Admin / Trainer:** `/trainer`, `/admin/overview`, `/admin/users`,
`/admin/courses`, `/admin/enrollments`, `/admin/workbook-orders`,
`/admin/assignments`, `/admin/reviews`, `/admin/speech-evaluations`,
`/admin/home-page`, `/admin/workbooks`, `/admin/field-media`,
`/admin/certificates`, `/admin/chat`, `/admin/leads`,
`/admin/leads/:id`, `/admin/pipeline`, `/admin/tasks`,
`/admin/automations`, `/admin/message-templates`, `/admin/funnels`,
`/admin/audit-log`, `/admin/feature-flags`, `/admin/impact-stats`,
`/admin/settings`.

---

## Findings & fixes applied (this task)

| # | File | Issue | Severity | Action |
|---|------|-------|----------|--------|
| 1 | `src/pages/home.tsx:1034` | FAQ accordion button used `text-left` (LTR-only) instead of logical `text-start` — caused mis-aligned Arabic FAQ headers. | HIGH | Fixed → `text-start`. |
| 2 | `src/pages/admin/overview.tsx:292` | Header label used `mr-auto` instead of logical `ms-auto`, pushing the helper text to the wrong edge in RTL. | MED | Fixed → `ms-auto`. |
| 3 | `src/pages/admin/tasks.tsx:95` | "New task" button used `ml-1` for the icon spacing instead of logical `me-1`. | MED | Fixed → `me-1`. |
| 4 | `src/pages/admin/courses.tsx:394–395` | Currency suffix (JOD) inside the price input used `left-2`, so in the RTL layout it overlapped the input value. | MED | Fixed → `end-2` (renders correctly inside the LTR number input on the visual right). |

---

## Verified clean (no action needed)

- **`console.log` / `debugger`** — none in `src/`.
- **`href="#"` / empty `navigate("")`** — none.
- **`target="_blank"` rel attributes** — every external link already
  carries `rel="noopener"` or `rel="noreferrer"` (or both). Modern
  browsers also auto-apply `noopener` for `target="_blank"`, so the
  `noopener`-only nits flagged by static review are non-issues.
- **AdminRoute coverage** — every `/admin/*` page (including the
  newly added `/admin/impact-stats`) is wrapped in `AdminRoute`.
  The `/admin` index is a `<Redirect>` to `/admin/overview`, which
  is itself guarded — no exposure.
- **Site header links** — `site-header.tsx` only navigates to `/`,
  `/dashboard`, and `/admin/overview`, all of which exist.
- **Site footer links** — verified `/impact`, `/privacy`, `/terms`,
  `/verify`, `/gallery`, `/workbooks`, plus `wa.me/...`, `mailto:`,
  and LinkedIn external. All resolve.
- **Duplicate destinations** — the home page program cards and their
  inner CTA buttons both navigate to the same `/programs/:slug`,
  but this is the standard "card surface + explicit button" pattern;
  not a silent duplication, since one is the affordance for the
  whole card.
- **Public `/impact`** — verified end-to-end: GET `/api/impact`
  returns `Cache-Control: public, max-age=120` with the 4 stats and
  empty-stories array; the page renders the hero, stats grid, and
  the friendly empty state.
- **Empty / loading / error states** — admin lists (users, courses,
  leads, impact-stories…) all render either a skeleton or a helpful
  empty card; public pages (impact, gallery, graduates, workbooks)
  do the same.

---

## Explicitly out of scope / left for follow-ups

These were either already tracked as separate project tasks or are
non-trivial and shouldn't be silently absorbed into a QA pass:

- ~~**End-to-end happy-path Playwright suite**~~ — **Done** (Task #55).
  See [End-to-end Playwright suite](#end-to-end-playwright-suite) below.
- **Replace email-based interest forms with the in-app consultation
  flow on program pages** — tracked as a separate project task.
- **Make program detail and learn pages reuse the same workbook
  structure component** — separate task.
- **Upload voice/video submissions to cloud storage instead of
  inline data** — separate task.
- **Localize activity types and rubric to English alongside Arabic**
  — separate task.
- **Hide the duplicated lesson video iframe when a video activity
  exists** — separate task.

---

## End-to-end Playwright suite

A Playwright-based e2e suite lives under `artifacts/biklima/tests/`
and exercises the full learner happy path against the running dev
stack and the same Postgres database the api-server uses.

**How to run**

```bash
# from anywhere in the repo (root has a passthrough script)
pnpm test
# or, scoped to the biklima artifact
pnpm --filter @workspace/biklima test
```

Both the API server (`artifacts/api-server`) and the web app
(`artifacts/biklima`) workflows must be running. The suite talks to
the shared proxy at `http://localhost:80` (override with
`E2E_BASE_URL`).

**What it covers**

The happy-path spec (`tests/e2e/learner-journey.spec.ts`) walks the
full learner journey end-to-end:

1. **Anonymous browse** — the homepage responds 2xx and renders the
   brand title.
2. **Enroll → pay** — the seeded learner places an order via
   `POST /api/orders`. The seeded course is free, so the same code
   path used by paid orders auto-enrolls without hitting Stripe.
3. **Access lesson** — `GET /api/courses/:slug/access` reports
   `hasAccess: true` and the `/courses/:slug/learn` page renders the
   seeded lesson.
4. **Submit speech** — `POST /api/speech-evaluation` accepts an
   anonymous submission.
5. **Get evaluation** — `GET /api/me/speech-evaluations` exposes the
   seeded *published* report to the learner with `overallScore`,
   `finalReportMd`, and `programRecommendation` populated.
6. **See badge** — `GET /api/my/badges` returns the seeded badge
   with `earned: true` and a non-null `earnedAt`.
7. **Verify + download certificate** — `GET /api/verify?code=…`
   returns `{ found: true }` for the seeded code, `GET
   /api/certificates/:code` and `GET /api/me/certificates` both
   expose the seeded `certificateFileUrl` (the download link the UI
   renders).
8. **Graduates registry** — the seed forces the `graduates_page`
   feature flag on, so `GET /api/graduates` includes the seeded
   graduate and the `/graduates` page renders the learner's full
   name without redirecting.

**Fixtures**

`tests/fixtures/auth.ts` exposes three Playwright contexts:

- `anon` — no session cookie (anonymous visitor).
- `learner` — programmatically logged in as the seeded learner via
  `POST /api/auth/login`, with the session cookie injected into the
  browser context.
- `admin` — same, but for the seeded admin user (role=`admin`,
  `isSuperAdmin=true`).

**Seed data**

`tests/global-setup.ts` upserts (idempotent across runs):

- A free, published test course `e2e-test-course` with one section
  and one lesson.
- An admin user `e2e.admin@bikalima.test`.
- A learner user `e2e.learner@bikalima.test` enrolled in the test
  course.
- A certificate `BK-CERT-E2E-0001` for the learner with
  `showInRegistry=true` and a placeholder `certificateFileUrl`.
- A *published* speech evaluation for the learner (with rubric
  scores, `overallScore`, `finalReportMd`, and `reportPublishedAt`).
- A badge definition `e2e_test_badge` and a matching `user_badges`
  row awarding it to the learner.
- A `feature_flags` row forcing `graduates_page` to enabled.

These rows are namespaced (the slug, the cert code, and the
`@bikalima.test` email domain) so they don't collide with real
content in the dev database.

**Caveats / future work**

- The suite shares the dev database. For CI we'd want a separate
  Postgres instance per run; the existing setup is already
  idempotent so adding a `--global-teardown` that prunes the
  fixtures by namespace is the natural next step.
- Stripe is intentionally bypassed by using a free course. A future
  pass should add a Stripe-mock-backed paid order flow.

---

## اعتمدت

Audit complete. The four RTL violations above were the only
correctness issues found; all are fixed. The site is ship-ready
from a buttons/links/RTL standpoint, modulo the follow-up items
listed above which are tracked as their own tasks.
