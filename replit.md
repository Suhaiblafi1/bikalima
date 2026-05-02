# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/biklima` (`@workspace/biklima`)

Arabic RTL landing page + LMS for "بكلمة" (Biklima), a public speaking training program. React + Vite + Tailwind CSS.

- **Pages**: 
  - `src/pages/home.tsx` — full single-page landing with hero, trainer bio, author message, **program quiz** ("which Bikalima program is right for you?" — 6 weighted questions, recommends one of the 4 programs with two CTAs: "start this program" → `/courses/<slug>` and "book a consultation" → Zoom scheduler), program structure, wisdom carousel, workbooks store, testimonials, **photo gallery (masonry + lightbox)**, **video library (YouTube embed modal)**, FAQ, enrollment form
  - `src/components/program-quiz.tsx` — bilingual (ar/en) animated 6-question quiz; weighted scoring with tie-breaker order children > tot > teachers > core; intro / question steps / result card states with framer-motion transitions; back navigation + retake; section anchor `#program-quiz`
  - `src/pages/dashboard.tsx` — student dashboard with account info, courses, orders, schedule tabs
  - `src/pages/admin/` — admin panel split into 8 routed sub-pages with shared sidebar layout (`_layout.tsx`) and shared helpers (`_shared.tsx`): `/admin/{overview,users,courses,enrollments,workbook-orders,assignments,reviews,settings}`. `/admin` redirects to `/admin/overview`. Sidebar nav items are hidden per role via `PAGE_VISIBILITY` (admin sees all; trainer sees overview/courses/assignments/reviews; sales sees overview/enrollments/workbook-orders). NEW pages: **reviews** (moderate student course reviews) and **settings** (site_settings singleton: name/contact/social/privacy/terms).
  - `src/pages/courses.tsx` — **LMS course catalog** (/courses) showing all 4 programs as cards with images, stats, prices
  - `src/pages/course-detail.tsx` — **LMS Udemy-style course detail page** (/courses/:slug) with hero, what you'll learn, content accordion, requirements, description, instructor bio, FAQ, sticky purchase card
- **Data**: `src/translations.ts` (2-language: ar/en — French permanently removed), `src/programsData.ts` (programs, prices, testimonials), `src/galleryData.ts` (gallery photos + video library)
- **Design**: Teal primary (#25786A), warm ivory background, Tajawal + Noto Naskh Arabic fonts, Almarai Bold for logo
- **LMS Routes**: `/courses` (catalog), `/courses/:slug` (detail). Slug mapping: core→influential-speaker, tot→certified-trainer, teachers→educators-program, children→young-speaker
- **Features**:
  - Photo gallery (masonry grid, 16 photos, country badge per photo, lightbox with prev/next + keyboard nav, 7 countries: QA/AE/SD/JO/RU/GB/SA)
  - Video library (6 curated YouTube speeches with "ما ستتعلمه" learning descriptions, modal embed with autoplay, speaker badge for Suhaib vs. world speech)
  - Gallery and video nav links ("الأفواج"/"Cohorts" and "فيديوهات"/"Videos") in AR/EN
  - 2-language support (Arabic/English only — French permanently removed) with RTL auto-switch
  - Auto currency detection (JOD, SAR, AED, etc.)
  - 4 programs in branching structure (core + 3 tracks)
  - Enrollment form with Individual/Institution toggle, 3 training modes, YouTube link, discount code (interest/category field removed)
  - Form submits to `/api/enroll` endpoint
  - Wisdom dot-navigation carousel (replaced marquee), nav label "مقتطفات" (Excerpts)
  - Workbook store with localized prices (RECORDED_PRICES in JOD: core=70, tot=110, teachers=90, children=50)
  - Workbook modal: click on workbook card opens dedicated modal with PDF sample download button, purchase form (quantity, format PDF/printed, delivery address for printed), submits to `/api/workbook-order`
  - Workbook titles: "حقيبة المدرب المعتمد" and "حقيبة المعلمين وأولياء الأمور" for ToT/teachers tracks
  - Email/password auth: register and login with email + password, scrypt password hashing, session cookies (no external OAuth required)
  - Student dashboard at `/dashboard` — login/register form when unauthenticated; when logged in: account info, enrolled courses with lesson viewer (YouTube/Vimeo embed, progress tracking, mark complete), order history from DB, enrollment requests status
  - Admin panel at `/admin/*` — 8 routed sub-pages with shared left-sidebar nav (Overview / Users / Courses / Enrollments / Workbook Orders / Assignments / Reviews / Settings). Per-role visibility via `PAGE_VISIBILITY`. Includes course CRUD with sections + lesson management (with embedded resources), instructors CRUD, trainer-to-course assignment, manual student enrollment, enrollment request approval/rejection, course payment (lms-orders) approval, workbook order status, student progress tracking, review moderation, and site-wide settings form. Protected by `AdminRoute` + admin email whitelist (info@bikalima.com)
- **Images**: `@assets` alias → `attached_assets/` in vite.config.ts
  - Hero: `speeches_1774983233277.jpeg`
  - TEDx: `42267697_...jpg`
  - Workbook covers: various attached images mapped per program

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health`; `src/routes/enroll.ts` exposes `POST /enroll` (stores in DB + emails, stamps `leadSource:"website"` + `syncStatus:"pending"`), `GET /my/enrollment-requests`; `src/routes/workbook-order.ts` exposes `POST /workbook-order` (stores in DB + emails, also stamps lead source + sync status), `GET /my/orders`; `src/routes/auth.ts` exposes login/callback/logout/user auth routes; `src/routes/admin.ts` exposes admin CRUD; `src/routes/admin-integrations.ts` exposes `GET /admin/integrations/status` (admin-only) returning the registry of external integration providers and which env vars they're missing
- Auth: Email/password registration and login, scrypt password hashing, sessions stored in PostgreSQL (7-day TTL), cookie-based (no external OAuth required)
- Email: nodemailer sends enrollment & workbook order emails to `info@bikalima.com` (admin) and buyer; FROM address uses `SMTP_FROM` env var (set to `بكلمة <alkhawaldahsuhaib@gmail.com>`); needs SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT, SMTP_FROM env vars; [SMTP] prefixed logs surface any auth/delivery errors
- Integrations layer: `src/integrations/` contains stub modules for Odoo CRM (`ODOO_BASE_URL`, `ODOO_API_KEY`), OpenAI (`OPENAI_API_KEY`), Gemini (`GEMINI_API_KEY`), WhatsApp Business (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`), Payments (`PAYMENT_PROVIDER_KEY` + optional `PAYMENT_PROVIDER=stripe|tap|paytabs`), and Storage (`STORAGE_ACCESS_KEY` + optional `STORAGE_PROVIDER=s3|r2|gdrive`). Each service exports `isEnabled()` + `getStatus()` and stub action methods that return `{ok:false, reason:"not_configured"}` when their env vars are missing — nothing crashes if no keys are set. `index.ts` exposes `getAllIntegrationStatuses()` which the admin endpoint serializes.
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/auth.ts` — users and sessions tables. `users.role` is one of `admin|trainer|student|sales` (default `student`) and drives the 4-role RBAC layer. The `course_trainers` join table (in `lms.ts`) wires individual trainer users to specific courses.
- `src/schema/lms.ts` — courses, lessons, enrollments, lesson_progress, enrollment_requests, workbook_orders, speech_evaluations, **course_trainers** (links a trainer-role user to a course), **site_settings** (singleton id="default" for global site config: names, contact, social links, privacy/terms text) tables. `enrollment_requests`, `workbook_orders`, and `speech_evaluations` carry integration columns (`externalCrmId`, `aiAnalysisStatus`, `aiAnalysisResult`, `assignedTrainerId` → `instructors.id`, `leadSource`, `syncStatus`, `lastSyncedAt`) so future Odoo/AI/payment sync can run without further schema work.
- `src/schema/integrations.ts` — `integration_sync_events` table that logs every sync attempt (provider, entity_type, entity_id, action, status, externalId, errorMessage, payload, response, timestamps).
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
