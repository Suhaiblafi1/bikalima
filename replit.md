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

Arabic RTL landing page for "بكلمة" (Biklima), a public speaking training program. React + Vite + Tailwind CSS.

- **Pages**: `src/pages/home.tsx` — full single-page landing with hero, trainer bio, author message, program structure, wisdom carousel, workbooks store, testimonials, FAQ, enrollment form; `src/pages/dashboard.tsx` — student dashboard with account info, courses, orders, schedule tabs
- **Data**: `src/translations.ts` (3-language: ar/en/fr), `src/programsData.ts` (programs, prices, testimonials)
- **Design**: Teal primary (#25786A), warm ivory background, Tajawal + Noto Naskh Arabic fonts, Almarai Bold for logo
- **Features**:
  - 3-language support (Arabic/English/French) with RTL auto-switch
  - Auto currency detection (JOD, SAR, AED, etc.)
  - 4 programs in branching structure (core + 3 tracks)
  - Enrollment form with Individual/Institution toggle, 3 training modes, YouTube link, discount code (interest/category field removed)
  - Form submits to `/api/enroll` endpoint
  - Wisdom dot-navigation carousel (replaced marquee), nav label "مقتطفات" (Excerpts)
  - Workbook store with localized prices (RECORDED_PRICES in JOD: core=70, tot=110, teachers=90, children=50)
  - Workbook modal: click on workbook card opens dedicated modal with PDF sample download button, purchase form (quantity, format PDF/printed, delivery address for printed), submits to `/api/workbook-order`
  - Workbook titles: "حقيبة المدرب المعتمد" and "حقيبة المعلمين وأولياء الأمور" for ToT/teachers tracks
  - Email/password auth: register and login with email + password, scrypt password hashing, session cookies (no external OAuth required)
  - Student dashboard at `/dashboard` — login/register form when unauthenticated, account info, registered courses, order history, session schedule when logged in
  - Admin panel at `/admin` — stats (total users, today signups, week signups), user management table with search, sort, edit, delete; protected by admin email whitelist (suhaib@ilgholding.com)
- **Images**: `@assets` alias → `attached_assets/` in vite.config.ts
  - Hero: `speeches_1774983233277.jpeg`
  - TEDx: `42267697_...jpg`
  - Workbook covers: various attached images mapped per program

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health`; `src/routes/enroll.ts` exposes `POST /enroll`; `src/routes/workbook-order.ts` exposes `POST /workbook-order`; `src/routes/auth.ts` exposes login/callback/logout/user auth routes; `src/routes/admin.ts` exposes admin CRUD (GET/PATCH/DELETE /admin/users, GET /admin/stats, GET /admin/check)
- Auth: Email/password registration and login, scrypt password hashing, sessions stored in PostgreSQL (7-day TTL), cookie-based (no external OAuth required)
- Email: nodemailer sends enrollment & workbook order emails to `suhaib@ilgholding.com` (needs SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT env vars)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
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
