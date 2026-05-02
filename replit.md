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
    - **Dynamic Landing Page:** Includes hero, trainer bio, program quiz, program structure, wisdom carousel, workbooks store, testimonials, photo gallery (masonry + lightbox), video library (YouTube embed), FAQ, and enrollment form.
    - **Program Quiz:** Bilingual (AR/EN), 6-question quiz with weighted scoring to recommend programs.
    - **Speech Evaluation Form:** Lead-gen form for "تقييم خطابك خلال 60 ثانية" (text/video URL submission) with WhatsApp integration.
    - **Trust Sections:** Animated stats, testimonials, before/after comparisons, and student journey stepper.
    - **LMS:** Course catalog (`/courses`), Udemy-style course detail pages (`/courses/:slug`), student dashboard (`/dashboard`) with account info, enrolled courses, orders, and schedule.
    - **Multi-language Support:** Arabic/English only, with RTL auto-switching.
    - **Authentication:** Email/password registration and login with scrypt hashing and session cookies.
    - **Admin Panel:** Comprehensive `/admin/*` section with 8 sub-pages (Overview, Users, Courses, Enrollments, Workbook Orders, Assignments, Reviews, Settings) and role-based access control (Admin, Trainer, Sales). Includes CRUD for courses, lessons, instructors, enrollment management, workbook order status, student progress tracking, review moderation, and site-wide settings.

**Backend (`artifacts/api-server`):**
- **Purpose:** Express 5 API server handling business logic and data persistence.
- **Routes:** Organized in `src/routes/` for health checks, enrollment, workbook orders, authentication, and admin functionalities.
- **Authentication:** Email/password-based with scrypt hashing and PostgreSQL-backed session cookies (7-day TTL).
- **Email:** Uses Nodemailer for transactional emails (enrollment, workbook orders) to admin and buyers.
- **Integrations Layer:** Modular design in `src/integrations/` for Odoo CRM, OpenAI, Gemini, WhatsApp Business, Payments (Stripe/Tap/PayTabs), and Storage (S3/R2/GDrive). Integrations are enabled conditionally based on environment variables, providing graceful degradation if not configured.

**Database (`lib/db`):**
- **ORM:** Drizzle ORM with PostgreSQL.
- **Schema:** Defined in `src/schema/` with models for authentication (users, sessions), LMS (courses, lessons, enrollments, requests, orders, evaluations, trainers, site settings), and integrations (sync events).
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