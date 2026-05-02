# Overview

This is a pnpm workspace monorepo using TypeScript, designed to build and manage a comprehensive online learning platform. The project aims to provide a robust API server, a dynamic landing page, and an admin panel for managing educational content and users.

The core vision is to create a leading platform for public speaking training, offering engaging courses, personalized evaluations, and a seamless learning experience for students. It targets individuals, educators, and institutions seeking to enhance their public speaking skills, with a focus on both Arabic and English-speaking markets. The platform will support various learning paths, from foundational skills to advanced trainer certification, and integrate with CRM and payment systems to streamline operations.

# User Preferences

I prefer concise and clear explanations. Focus on delivering solutions iteratively, providing updates after each significant step. Before making any major architectural changes or introducing new third-party dependencies, please ask for my approval. Ensure all code is well-documented and follows modern TypeScript best practices. I want the agent to use conventional commit messages.

# System Architecture

The project is structured as a pnpm monorepo with separate packages for deployable applications and shared libraries.

**Core Technologies:**
- **Monorepo Tool:** pnpm workspaces
- **Node.js:** v24
- **TypeScript:** v5.9
- **API Framework:** Express 5
- **Database:** PostgreSQL with Drizzle ORM
- **Validation:** Zod (v4) with `drizzle-zod`
- **API Codegen:** Orval (from OpenAPI spec)
- **Build Tool:** esbuild (CJS bundle)
- **Frontend:** React, Vite, Tailwind CSS

**Monorepo Structure:**
- `artifacts/`: Contains deployable applications like `api-server` and `biklima` (frontend).
- `lib/`: Houses shared libraries such as `api-spec` (OpenAPI), `api-client-react` (generated React Query hooks), `api-zod` (generated Zod schemas), and `db` (Drizzle ORM setup).
- `scripts/`: Utility scripts.

**TypeScript & Composite Projects:**
- All packages use TypeScript with `composite: true`, extending `tsconfig.base.json`.
- Root `tsconfig.json` manages project references for correct dependency resolution and build order.
- Typechecking uses `tsc --build --emitDeclarationOnly` to generate `.d.ts` files, with actual JS bundling handled by esbuild.

**Frontend (`artifacts/biklima`):**
- **Purpose:** Arabic RTL landing page and LMS for "بكلمة" (Biklima) public speaking program.
- **Design:** Teal primary (#25786A), warm ivory background, Tajawal + Noto Naskh Arabic fonts, Almarai Bold for logo.
- **Key Features:**
    - **Dynamic Landing Page:** Includes hero, trainer bio, program quiz, program structure, wisdom carousel, workbooks store, testimonials, photo gallery (masonry + lightbox), video library (YouTube embed), FAQ, and a 4-step enrollment wizard (audience → goal → program/recommend → contact) with personalized success page.
    - **Enrollment Wizard (`enrollment-wizard.tsx`):** Replaces the old single-page form. Step 1 captures audience (individual / teacher / parent / institution), step 2 the goal (speak / train / teach / child / other), step 3 lets the visitor pick a program or use auto-recommendation (`recommendProgram(audience, goal)`), step 4 collects contact info (with extra org fields for institutions). Submits to existing `POST /api/enroll`; backend persists with `status: "new"` (badge "جديد") and stores `audience`, `goal`, `recommended` flags under `formData`. Admin enrollments table surfaces audience + goal columns. Wizard navigation buttons (back/next/submit) use `h-12` (48px) touch targets that meet Material Design / Apple HIG mobile guidelines.
    - **Mobile UX:** Header has only the logo and a hamburger that opens a full-screen drawer containing every nav route (programs, workbooks, gallery, videos, events) plus auth, language, and currency controls. The Workbooks page leads with the product grid first; the wisdom carousel sits below as supporting context. Course detail pages show a single primary CTA — the in-hero "Register & Pay Now — JOD" pill (always above the fold on phones, includes the price inline). The previously-rendered duplicate mobile CTA below the breadcrumb was removed; only a "Continue Learning" shortcut renders there for users who already own the course. **Sticky mobile CTA bar** (`mobile-sticky-cta.tsx`, mounted in `App.tsx`) appears on phones (`md:hidden`) after scrolling 380px and offers WhatsApp / Register / Book consultation; the standalone floating WhatsApp FAB is hidden on mobile (`hidden md:flex`) to avoid overlap. Section vertical padding on home is reduced on phones (`py-12 md:py-20` etc.).
    - **Conversion & Trust:** Hero primary CTA reads "سجّل اهتمامك الآن" / "Register your interest" (replacing "ابدأ الآن"). A slim **trust strip** sits directly under the hero (`section-trust-strip`) with 4 chips: 800+ trainees, 7 countries, 4.9 rating, 6+ years. A **programs comparison table** (`section-programs-compare`, id `compare`) renders after the structure section with 4 rows (audience / duration / price / outcome / prerequisite); the "core" program is highlighted with a gold "الأنسب" best-pick badge. Mobile collapses the table into stacked cards.
    - **SEO & Performance:** `index.html` includes `<link rel="canonical">`, `theme-color`, `robots`, plus existing OG tags. Hero TEDx image marked `fetchPriority="high"` + `loading="eager"`; bio collage, program-card images, and the program detail modal img all use `loading="lazy"` + `decoding="async"`.
    - **Form polish:** All enrollment-wizard inputs (and speech-evaluation-form inputs) carry `aria-label`, `aria-required`, `autoComplete`, `inputMode`, and `type`. Wizard step 4 shows a privacy note with a Shield icon plus a link to `/privacy` next to the submit button.
    - **Aesthetic accents (gold):** `index.css` adds `.heading-accent-underline` (gold accent bar under h2s) and `.ring-gold` (best-pick highlight) — used sparingly on the comparison table heading + best-pick row only, preserving the teal/ivory identity.
    - **Analytics scaffolding:** `src/lib/analytics.ts` exports a `track(event, payload)` helper plus 5 named events: `click_whatsapp`, `submit_interest_form`, `click_zoom_booking`, `click_program_details`, `click_external_registration`. Wired into floating-whatsapp, mobile-sticky-cta WhatsApp, site-header CTA, enrollment-wizard submit success, external-link-dialog confirm, and program-card view-details buttons. Forwards to `window.dataLayer` (GTM), `window.gtag` (GA4), and `window.fbq` (Meta Pixel) when present — all no-op safe.
    - **External-Link Hygiene:** All external links open in a new tab with `rel="noopener noreferrer"` to prevent tabnabbing. Outbound links to the third-party registration partner (`sensoriallife.com` for paid event seats) are wrapped in `ExternalLinkDialog` (`src/components/external-link-dialog.tsx`) — a bilingual AR/EN AlertDialog that names the partner domain and asks the visitor to confirm before leaving the site ("سيتم نقلك إلى شريك التسجيل والدفع." / "You will be redirected to our registration & payment partner."). Privacy and Terms pages are real wouter routes (`/privacy`, `/terms`) — never `href="#"` placeholders. WhatsApp uses `wa.me` deep-links and `mailto:` opens the visitor's mail client (no `target="_blank"` on mailto, which is a known browser anti-pattern).
    - **Program Quiz:** Bilingual (AR/EN), 6-question quiz with weighted scoring to recommend programs.
    - **Speech Evaluation Form:** Lead-gen form for "تقييم خطابك خلال 60 ثانية" (text/video URL submission) with WhatsApp integration.
    - **Trust Sections:** Animated stats, testimonials, before/after comparisons, and student journey stepper.
    - **LMS:** Course catalog (`/courses`), Udemy-style course detail pages (`/courses/:slug`), student dashboard (`/dashboard`) with account info, enrolled courses, orders, and schedule.
    - **Multi-language Support:** Arabic/English only, with RTL auto-switching.
    - **Authentication:** Email/password registration and login with scrypt hashing and session cookies.
    - **Admin Panel:** Comprehensive `/admin/*` control center with 13 sub-pages: Overview, Home Page Manager, Courses, Workbooks (CMS), Field Media + Analysis, Enrollments, Workbook Orders, Speech Evaluations, Users, Assignments, Reviews, **Certificates & Accreditations**, Settings. Role-based access via `PAGE_VISIBILITY` map in `_shared.tsx` (admin/trainer/sales/student). Includes CRUD for courses, lessons, instructors, enrollment management, workbook order status, student progress tracking, review moderation, and site-wide settings.
    - **Certificate Registry ("سجل بكلمة للاعتماد والشهادات"):**
        - **Public pages:** `/verify` (search by code or name), `/certificates/:code` (shareable verification page with QR code via `api.qrserver.com`, certificate metadata, downloadable file), `/graduates` (public registry filterable by type/program/country/year/status — only entries with `showInRegistry=true`). Verify links surfaced in site header nav and footer's links column. PII (email/phone/notes) is stripped from all public responses via `toPublic()`.
        - **Admin (`/admin/certificates`):** Full CRUD with auto-generated codes (`BK-CERT-YYYY-NNNN`), inline status changes, copy verify-link, CSV export with UTF-8 BOM, search/filter by status & type. Form covers name, email, phone, country, cert type (trainee/trainer/teacher/child-facilitator/ambassador/partner-institution), linked program, issue/expiry dates, status (active/expired/under-review/suspended/revoked), assessor, internal notes, certificate file URL, graduate image URL, and "show in public registry" toggle. All writes are logged to `admin_activities`.
        - **RBAC:** Admin = create/edit/status; Trainer/Sales = read-only list scoped to `assessorUserId` (their own students); Student = `/dashboard` "شهاداتي" tab fetches `/me/certificates` matching `userId` OR `email`. Delete is restricted to **Super Admin** (new `users.is_super_admin` boolean column) — UI hides the trash icon for non-super-admins, and the API returns 403 with an Arabic message otherwise.
        - **Schema:** New `certificates` table with unique `code` index, status/userId indexes, FKs to `users` (assessor, owner, creator).
    - **Admin Control Center (CMS):** Three new admin sections back the public site with database-driven content:
        - **Home Page Manager (`/admin/home-page`):** Per-section JSON content editor (AR + EN) with visibility toggle, draft/published status, and reorder controls (chevron up/down + numeric index). Canonical sections: hero, about-trainer, why-bikalima, programs, events, gallery-preview, field-videos, testimonials, faq, enrollment-form, footer. Empty rows fall back to static translation copy at runtime — admins can override one section at a time without breaking the rest.
        - **Workbooks CMS (`/admin/workbooks`):** Full CRUD over `workbooks` table (slug, AR/EN title + description, JOD price, cover image, sample PDF, topic lists, format digital/printed/both, linked program/course, status draft/published/hidden, order index).
        - **Field Media + Media Analysis (`/admin/field-media`):** "من الميدان" library for trainer reference clips. Each row stores media metadata (type youtube/upload/image/instagram/tiktok, URL, thumbnail, speaker, category, target skill, placement tags) AND embedded training analysis (skill, what-to-observe, why-it-matters, what-students-learn, common-mistakes, exercise, difficulty, linked topic). The two-tab form ("المادة والعرض" / "التحليل التدريبي") includes a "إنشاء تحليل أولي" button that fills a template the trainer can refine.
    - **Activity Audit Log:** Every CMS write (create/update/delete on home sections, workbooks, field media, analysis) is logged to `admin_activities` with actor email and human-readable description. Surfaced on the Overview dashboard as "أحدث النشاطات".
    - **Top Programs Widget:** Overview dashboard aggregates `enrollment_requests` by `program_id` and renders the top 6 with horizontal bar chart sorted by request count.
    - **Site Settings — Logo:** `site_settings.logo_url` exposed in the admin Settings page under "الهوية واللغة" for site-wide logo override.

**Backend (`artifacts/api-server`):**
- **Purpose:** Express 5 API server handling business logic and data persistence.
- **Routes:** Organized in `src/routes/` for health checks, enrollment, workbook orders, authentication, and admin functionalities.
- **Authentication:** Email/password-based with scrypt hashing and PostgreSQL-backed session cookies (7-day TTL).
- **Email:** Uses Nodemailer for transactional emails (enrollment, workbook orders) to admin and buyers.
- **Integrations Layer:** Modular design in `src/integrations/` for Odoo CRM, OpenAI, Gemini, WhatsApp Business, Payments (Stripe/Tap/PayTabs), and Storage (S3/R2/GDrive). Integrations are enabled conditionally based on environment variables, providing graceful degradation if not configured.

**Database (`lib/db`):**
- **ORM:** Drizzle ORM with PostgreSQL.
- **Schema:** Defined in `src/schema/` with models for authentication (users, sessions), LMS (courses, lessons, enrollments, requests, orders, evaluations, trainers, site settings), CMS (home_page_sections, workbooks, field_media with embedded media analysis, admin_activities audit log), and integrations (sync events).
- **Role-Based Access Control (RBAC):** `users.role` (admin|trainer|student|sales) drives RBAC.
- **Integration Columns:** `enrollment_requests`, `workbook_orders`, and `speech_evaluations` tables include fields for CRM, AI analysis, trainer assignment, lead source, and sync status to facilitate future integrations.

**API Specification & Codegen (`lib/api-spec`, `lib/api-zod`, `lib/api-client-react`):**
- **OpenAPI Spec:** `openapi.yaml` defines the API.
- **Orval Codegen:** Generates:
    - **`lib/api-zod`:** Zod schemas for request/response validation.
    - **`lib/api-client-react`:** React Query hooks and a fetch client for frontend API interaction.

# External Dependencies

- **Database:** PostgreSQL
- **Email Service:** SMTP provider (via Nodemailer)
- **Payment Gateways:** Stripe, Tap, PayTabs (optional, configured via `PAYMENT_PROVIDER_KEY`)
- **CRM:** Odoo (optional, configured via `ODOO_BASE_URL`, `ODOO_API_KEY`)
- **AI Services:** OpenAI, Google Gemini (optional, configured via `OPENAI_API_KEY`, `GEMINI_API_KEY`)
- **Messaging:** WhatsApp Business API (optional, configured via `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`)
- **Cloud Storage:** S3, Cloudflare R2, Google Drive (optional, configured via `STORAGE_ACCESS_KEY`)
- **Video Embedding:** YouTube, Vimeo (for LMS lesson content)
- **Frontend Libraries:** React, Vite, Tailwind CSS, Framer Motion (for animations), React Query.