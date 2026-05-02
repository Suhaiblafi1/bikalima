# Overview

This pnpm monorepo project is an online learning platform for public speaking training, targeting both Arabic and English-speaking markets. It aims to provide engaging courses, personalized evaluations, and a seamless learning experience. The platform includes an API server, a dynamic landing page, and an admin panel, supporting various learning paths from foundational skills to advanced trainer certification. It integrates with CRM and payment systems to streamline operations and enhance the learning journey.

# User Preferences

I prefer concise and clear explanations. Focus on delivering solutions iteratively, providing updates after each significant step. Before making any major architectural changes or introducing new third-party dependencies, please ask for my approval. Ensure all code is well-documented and follows modern TypeScript best practices. I want the agent to use conventional commit messages.

# System Architecture

The project is a pnpm monorepo utilizing TypeScript (v5.9) and Node.js (v24). It's structured into `artifacts/` for deployable applications (API server, frontend) and `lib/` for shared libraries (API spec, generated clients, database setup).

**Core Technologies:**
- **API Framework:** Express 5
- **Database:** PostgreSQL with Drizzle ORM
- **Validation:** Zod (v4)
- **API Codegen:** Orval (from OpenAPI)
- **Frontend:** React, Vite, Tailwind CSS

**Frontend (`artifacts/biklima`):**
- **Purpose:** Arabic RTL landing page and LMS for the "Biklima" public speaking program.
- **UI/UX:** Teal primary color, warm ivory background, specific Arabic fonts.
- **Key Features:** Dynamic landing page (hero, trainer bio, program quiz, testimonials, gallery, video library, FAQ), a 4-step enrollment wizard, mobile-first design with sticky CTA bar, conversion-focused elements (trust strip, program comparison table), SEO optimization, detailed form inputs with accessibility attributes, and analytics scaffolding.
- **LMS:** Course catalog, Udemy-style course detail pages, student dashboard.
- **Multi-language Support:** Arabic/English with RTL auto-switching.
- **Authentication:** Email/password with scrypt hashing and session cookies.
- **Admin Panel:** Comprehensive `/admin/*` control center with role-based access for managing content (courses, workbooks, home page sections, field media), enrollments, users, certificates, and site settings. Includes a Certificate Registry for public verification.

**Backend (`artifacts/api-server`):**
- **Purpose:** Express 5 API server for business logic and data persistence.
- **Architecture:** Modular routes and integrations layer for external services.
- **Authentication:** Handles user authentication and session management.
- **Email:** Uses Nodemailer for transactional emails.

**Database (`lib/db`):**
- **ORM:** Drizzle ORM for PostgreSQL.
- **Schema:** Includes models for authentication, LMS content, CMS content, and integration-related data.
- **RBAC:** `users.role` (admin|trainer|student|sales) defines access control.

**API Specification & Codegen:**
- **OpenAPI:** `openapi.yaml` defines the API structure.
- **Orval:** Generates Zod schemas (`lib/api-zod`) for validation and React Query hooks/fetch client (`lib/api-client-react`) for frontend API interaction.

# External Dependencies

- **Database:** PostgreSQL
- **Email Service:** SMTP provider (via Nodemailer)
- **Payment Gateways:** Stripe, Tap, PayTabs
- **CRM:** Odoo
- **AI Services:** OpenAI, Google Gemini
- **Messaging:** WhatsApp Business API
- **Cloud Storage:** S3, Cloudflare R2, Google Drive
- **Video Embedding:** YouTube, Vimeo