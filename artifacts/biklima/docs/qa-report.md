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

- **End-to-end happy-path Playwright suite** (anon → enroll → pay →
  lesson → speech → evaluation → badge → certificate → graduates).
  The local `runTest` harness reliably hits its 10-iteration cap on
  this repo across multiple prior tasks, so a real test scaffold
  needs its own task with infra setup.
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

## اعتمدت

Audit complete. The four RTL violations above were the only
correctness issues found; all are fixed. The site is ship-ready
from a buttons/links/RTL standpoint, modulo the follow-up items
listed above which are tracked as their own tasks.
